const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { matchValidation } = require('../middleware/validation');
const { limiters, checkAccountStatus } = require('../middleware/security');
const logger = require('../utils/logger');
const Match = require('../models/Match');
const Message = require('../models/Message');
const User = require('../models/User');
const emailService = require('../services/emailService');
const smartMatcher = require('../algorithms/smartCoCreationMatcher');

// Apply auth to all message routes
router.use(authMiddleware);
router.use(checkAccountStatus);

// Get conversations list
router.get('/conversations', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all active matches
    const matches = await Match.getActiveMatches(userId);
    
    // Get last message for each match
    const conversations = await Promise.all(matches.map(async (match) => {
      const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
      const otherUser = await User.findByPk(otherUserId, {
        attributes: ['id', 'name', 'photos']
      });
      
      const lastMessage = await Message.findOne({
        where: { 
          matchId: match.id,
          deletedAt: null
        },
        order: [['createdAt', 'DESC']]
      });
      
      const unreadCount = await Message.count({
        where: {
          matchId: match.id,
          receiverId: userId,
          readAt: null,
          deletedAt: null
        }
      });
      
      return {
        matchId: match.id,
        user: otherUser,
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          senderId: lastMessage.senderId,
          createdAt: lastMessage.createdAt,
          isRead: lastMessage.readAt !== null
        } : null,
        unreadCount,
        matchedAt: match.matchedAt
      };
    }));
    
    // Sort by last message time
    conversations.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt || a.matchedAt;
      const bTime = b.lastMessage?.createdAt || b.matchedAt;
      return new Date(bTime) - new Date(aTime);
    });
    
    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    logger.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve conversations'
    });
  }
});

// Get messages for a match
router.get('/conversation/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;
    
    // Verify user is part of this match
    const match = await Match.findByPk(matchId);
    if (!match || (match.user1Id !== userId && match.user2Id !== userId)) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }
    
    // Get messages
    const messages = await Message.getConversation(matchId, parseInt(limit), offset);
    
    // Mark messages as read
    await Message.markAsRead(matchId, userId);
    
    res.json({
      success: true,
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: messages.length === parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve messages'
    });
  }
});

// Send a message
router.post('/send/:matchId', 
  limiters.messaging, 
  matchValidation.sendMessage, 
  async (req, res) => {
    try {
      const { matchId } = req.params;
      const { message } = req.body;
      const senderId = req.user.id;
      
      // Verify match exists and user is part of it
      const match = await Match.findByPk(matchId);
      if (!match || !match.isMatch) {
        return res.status(404).json({
          success: false,
          error: 'Match not found'
        });
      }
      
      if (match.user1Id !== senderId && match.user2Id !== senderId) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to send message'
        });
      }
      
      const receiverId = match.user1Id === senderId ? match.user2Id : match.user1Id;
      
      // Check if this is the first message
      const messageCount = await Message.count({ where: { matchId } });
      const isOpener = messageCount === 0;
      
      // Create message
      const newMessage = await Message.create({
        matchId,
        senderId,
        receiverId,
        content: message,
        isOpener
      });
      
      // Update match last message time
      match.lastMessageAt = new Date();
      await match.save();
      
      // Trigger chat analysis after 50 messages (premium feature)
      if (messageCount === 50) {
        const sender = await User.findByPk(senderId);
        if (sender.subscriptionType === 'premium' || sender.subscriptionType === 'elite') {
          smartMatcher.analysisQueue.add({
            matchId,
            analysisType: 'chat'
          });
        }
      }
      
      // Send push notification (implement with your preferred service)
      // await notificationService.sendNewMessageNotification(receiverId, senderId, message);
      
      logger.info('Message sent', { 
        messageId: newMessage.id, 
        matchId, 
        senderId 
      });
      
      res.status(201).json({
        success: true,
        message: {
          id: newMessage.id,
          content: newMessage.content,
          senderId: newMessage.senderId,
          createdAt: newMessage.createdAt,
          isOpener: newMessage.isOpener
        }
      });
    } catch (error) {
      logger.error('Send message error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send message'
      });
    }
  }
);

// Mark messages as read
router.put('/read/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id;
    
    const updated = await Message.markAsRead(matchId, userId);
    
    res.json({
      success: true,
      messagesRead: updated[0]
    });
  } catch (error) {
    logger.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark messages as read'
    });
  }
});

// Delete a message (soft delete)
router.delete('/message/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    
    const message = await Message.findByPk(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }
    
    // Only sender can delete their own message
    if (message.senderId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this message'
      });
    }
    
    // Can only delete messages within 5 minutes
    const timeDiff = new Date() - new Date(message.createdAt);
    if (timeDiff > 5 * 60 * 1000) {
      return res.status(400).json({
        success: false,
        error: 'Can only delete messages within 5 minutes'
      });
    }
    
    await message.softDelete();
    
    res.json({
      success: true,
      message: 'Message deleted'
    });
  } catch (error) {
    logger.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete message'
    });
  }
});

// Get unread message count
router.get('/unread-count', async (req, res) => {
  try {
    const count = await Message.getUnreadCount(req.user.id);
    
    res.json({
      success: true,
      unreadCount: count
    });
  } catch (error) {
    logger.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get unread count'
    });
  }
});

// Report a message
router.post('/report/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { reason, description } = req.body;
    const reporterId = req.user.id;
    
    const message = await Message.findByPk(messageId, {
      include: [{
        model: Match,
        as: 'match'
      }]
    });
    
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }
    
    // Store report in metadata
    message.metadata = {
      ...message.metadata,
      reported: true,
      reportReason: reason,
      reportDescription: description,
      reportedBy: reporterId,
      reportedAt: new Date()
    };
    await message.save();
    
    logger.warn('Message reported', { 
      messageId, 
      reporterId, 
      reason 
    });
    
    res.json({
      success: true,
      message: 'Report submitted successfully'
    });
  } catch (error) {
    logger.error('Report message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit report'
    });
  }
});

module.exports = router;