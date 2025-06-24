const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const coCreationMatcher = require('../algorithms/coCreationMatcher');
const smartMatcher = require('../algorithms/smartCoCreationMatcher');
const authMiddleware = require('../middleware/auth');
const { matchValidation } = require('../middleware/validation');
const { checkAccountStatus, requireSubscription } = require('../middleware/security');
const logger = require('../utils/logger');
const User = require('../models/User');
const Match = require('../models/Match');
const CoCreationCoin = require('../models/CoCreationCoin');
const emailService = require('../services/emailService');

// Apply auth to all match routes
router.use(authMiddleware);
router.use(checkAccountStatus);

// Get potential matches
router.get('/potential', async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    const { limit = 10, offset = 0 } = req.query;
    
    // Get users already swiped on
    const existingMatches = await Match.findAll({
      where: {
        [Op.or]: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      },
      attributes: ['user1Id', 'user2Id']
    });
    
    const swipedUserIds = new Set();
    existingMatches.forEach(match => {
      swipedUserIds.add(match.user1Id === userId ? match.user2Id : match.user1Id);
    });
    
    // Build query for potential matches
    const whereClause = {
      id: { [Op.notIn]: [...swipedUserIds, userId] },
      status: 'active',
      verified: true
    };
    
    // Apply preferences
    if (user.preferences.genderPreference?.length > 0) {
      whereClause.gender = { [Op.in]: user.preferences.genderPreference };
    }
    
    // Get potential matches
    const potentialUsers = await User.findAll({
      where: whereClause,
      attributes: { exclude: ['password', 'refreshToken', 'resetPasswordToken'] },
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    // Determine user tier for smart matching
    const userTier = user.subscriptionType || 'basic';
    
    // Use smart matcher for enhanced matching
    const matches = await smartMatcher.findSmartMatches(
      user.toJSON(), 
      potentialUsers.map(u => u.toJSON()),
      { 
        limit: parseInt(limit), 
        userTier 
      }
    );
    
    // Filter by age preferences
    const filteredMatches = matches.filter(match => {
      const age = match.user.getAge ? match.user.getAge() : 
                  new Date().getFullYear() - new Date(match.user.dateOfBirth).getFullYear();
      return age >= user.preferences.ageRange.min && 
             age <= user.preferences.ageRange.max;
    });
    
    // Apply boost logic
    const boostedMatches = filteredMatches.map(match => {
      if (match.user.profileBoostExpires && new Date(match.user.profileBoostExpires) > new Date()) {
        match.isBoosted = true;
        match.matchData.score *= 1.2; // 20% boost
      }
      return match;
    });
    
    // Sort by score and boost status
    boostedMatches.sort((a, b) => {
      if (a.isBoosted && !b.isBoosted) return -1;
      if (!a.isBoosted && b.isBoosted) return 1;
      return b.matchData.score - a.matchData.score;
    });
    
    res.json({
      success: true,
      matches: boostedMatches.map(m => ({
        user: {
          id: m.user.id,
          name: m.user.name,
          age: m.user.getAge ? m.user.getAge() : 
               new Date().getFullYear() - new Date(m.user.dateOfBirth).getFullYear(),
          bio: m.user.bio,
          interests: m.user.interests,
          photos: m.user.photos,
          location: m.user.location?.city
        },
        matchScore: Math.round(m.matchData.score * 100),
        coCreationPotential: Math.round(m.matchData.coCreationPotential * 100),
        breakdown: m.matchData.breakdown,
        isBoosted: m.isBoosted || false
      }))
    });
  } catch (error) {
    logger.error('Get potential matches error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve matches' 
    });
  }
});

// Swipe on a user
router.post('/swipe/:userId', matchValidation.swipe, async (req, res) => {
  const transaction = await Match.sequelize.transaction();
  
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.userId;
    const { action } = req.body; // 'like', 'pass', 'superlike'
    
    // Check if users can perform action
    const currentUser = await User.findByPk(currentUserId);
    
    if (action === 'like' && !(await currentUser.canLike())) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        error: 'Daily like limit reached',
        canUpgrade: true
      });
    }
    
    if (action === 'superlike') {
      if (!(await currentUser.canSuperLike())) {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          error: 'Daily super like limit reached',
          canUpgrade: true
        });
      }
      
      // Check if user has enough coins for super like
      const wallet = await CoCreationCoin.findOne({
        where: { userId: currentUserId },
        transaction
      });
      
      if (!wallet || wallet.balance < CoCreationCoin.COSTS.superLike) {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          error: 'Insufficient coins for super like',
          required: CoCreationCoin.COSTS.superLike,
          balance: wallet ? wallet.balance : 0
        });
      }
      
      // Deduct coins
      wallet.balance -= CoCreationCoin.COSTS.superLike;
      wallet.totalSpent += CoCreationCoin.COSTS.superLike;
      await wallet.save({ transaction });
    }
    
    // Check if match already exists
    let match = await Match.findBetweenUsers(currentUserId, targetUserId);
    
    if (match) {
      // Update existing match
      if (match.user1Id === currentUserId) {
        match.user1Status = action;
      } else {
        match.user2Status = action;
      }
    } else {
      // Create new match record
      match = await Match.create({
        user1Id: currentUserId,
        user2Id: targetUserId,
        user1Status: action,
        user2Status: 'pending'
      }, { transaction });
    }
    
    // Check if it's a mutual match
    const wasMatch = match.isMatch;
    const isNowMatch = match.checkMatch();
    
    if (isNowMatch && !wasMatch) {
      await match.save({ transaction });
      
      // Update match counts
      currentUser.totalMatches += 1;
      await currentUser.save({ transaction });
      
      const targetUser = await User.findByPk(targetUserId);
      targetUser.totalMatches += 1;
      await targetUser.save({ transaction });
      
      // Send match notifications
      await emailService.sendNewMatchEmail(currentUser.email, currentUser.name, targetUser.name);
      await emailService.sendNewMatchEmail(targetUser.email, targetUser.name, currentUser.name);
    } else {
      await match.save({ transaction });
    }
    
    // Update daily counters
    if (action === 'like') {
      currentUser.dailyLikesUsed += 1;
    } else if (action === 'superlike') {
      currentUser.superLikesUsed += 1;
    }
    currentUser.totalLikes += 1;
    await currentUser.save({ transaction });
    
    await transaction.commit();
    
    logger.info('Swipe action completed', { 
      userId: currentUserId, 
      targetUserId, 
      action,
      isMatch: isNowMatch 
    });
    
    res.json({
      success: true,
      action,
      isMatch: isNowMatch,
      matchId: isNowMatch ? match.id : null
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('Swipe error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process swipe' 
    });
  }
});

// Get user's matches
router.get('/my-matches', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const matches = await Match.findAll({
      where: {
        [Op.or]: [
          { user1Id: userId },
          { user2Id: userId }
        ],
        isMatch: true,
        unmatchedAt: null
      },
      order: [['matchedAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    const matchData = await Promise.all(matches.map(async (match) => {
      const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
      const otherUser = await User.findByPk(otherUserId, {
        attributes: ['id', 'name', 'bio', 'photos', 'interests', 'lastActive']
      });
      
      return {
        matchId: match.id,
        user: otherUser,
        matchedAt: match.matchedAt,
        lastMessageAt: match.lastMessageAt,
        compatibilityScore: match.compatibilityScore,
        coCreationPotential: match.coCreationPotential
      };
    }));
    
    res.json({
      success: true,
      matches: matchData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: await Match.count({
          where: {
            [Op.or]: [
              { user1Id: userId },
              { user2Id: userId }
            ],
            isMatch: true,
            unmatchedAt: null
          }
        })
      }
    });
  } catch (error) {
    logger.error('Get matches error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve matches' 
    });
  }
});

// Unmatch a user
router.delete('/unmatch/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id;
    
    const match = await Match.findByPk(matchId);
    if (!match || (match.user1Id !== userId && match.user2Id !== userId)) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }
    
    match.unmatchedBy = userId;
    match.unmatchedAt = new Date();
    await match.save();
    
    logger.info('User unmatched', { userId, matchId });
    
    res.json({
      success: true,
      message: 'Successfully unmatched'
    });
  } catch (error) {
    logger.error('Unmatch error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to unmatch' 
    });
  }
});

// Get who liked the user (premium feature)
router.get('/likes', requireSubscription('premium'), async (req, res) => {
  try {
    const userId = req.user.id;
    
    const likes = await Match.findAll({
      where: {
        user2Id: userId,
        user1Status: { [Op.in]: ['liked', 'superliked'] },
        user2Status: 'pending',
        isMatch: false
      },
      order: [['createdAt', 'DESC']]
    });
    
    const likeData = await Promise.all(likes.map(async (like) => {
      const user = await User.findByPk(like.user1Id, {
        attributes: ['id', 'name', 'bio', 'photos', 'interests']
      });
      
      return {
        user,
        likedAt: like.createdAt,
        isSuperLike: like.user1Status === 'superliked'
      };
    }));
    
    res.json({
      success: true,
      likes: likeData,
      count: likeData.length
    });
  } catch (error) {
    logger.error('Get likes error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve likes' 
    });
  }
});

// Rewind last swipe (premium feature)
router.post('/rewind', async (req, res) => {
  const transaction = await Match.sequelize.transaction();
  
  try {
    const userId = req.user.id;
    
    // Check if user has coins for rewind
    const wallet = await CoCreationCoin.findOne({
      where: { userId },
      transaction
    });
    
    if (!wallet || wallet.balance < CoCreationCoin.COSTS.rewind) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        error: 'Insufficient coins for rewind',
        required: CoCreationCoin.COSTS.rewind,
        balance: wallet ? wallet.balance : 0
      });
    }
    
    // Find last swipe
    const lastMatch = await Match.findOne({
      where: {
        [Op.or]: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      },
      order: [['updatedAt', 'DESC']],
      transaction
    });
    
    if (!lastMatch) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'No swipe to rewind'
      });
    }
    
    // Check if swipe is recent (within 5 minutes)
    const timeDiff = new Date() - new Date(lastMatch.updatedAt);
    if (timeDiff > 5 * 60 * 1000) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Can only rewind swipes within 5 minutes'
      });
    }
    
    // Deduct coins
    wallet.balance -= CoCreationCoin.COSTS.rewind;
    wallet.totalSpent += CoCreationCoin.COSTS.rewind;
    await wallet.save({ transaction });
    
    // Delete the match record
    await lastMatch.destroy({ transaction });
    
    await transaction.commit();
    
    logger.info('Swipe rewound', { userId, matchId: lastMatch.id });
    
    res.json({
      success: true,
      message: 'Swipe rewound successfully',
      newBalance: wallet.balance
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('Rewind error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to rewind swipe' 
    });
  }
});

// Get user info for a match
router.get('/:matchId/user', async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id;
    
    const match = await Match.findByPk(matchId);
    if (!match || (match.user1Id !== userId && match.user2Id !== userId)) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }
    
    const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
    const user = await User.findByPk(otherUserId, {
      attributes: ['id', 'name', 'bio', 'lastActive']
    });
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    logger.error('Get match user error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve user info' 
    });
  }
});

// Track contribution for co-creation score
router.post('/contribute', async (req, res) => {
  try {
    const { type, value, description } = req.body;
    const user = await User.findByPk(req.user.id);
    
    const contribution = {
      type,
      value,
      description,
      timestamp: new Date()
    };
    
    user.contributionHistory = [...(user.contributionHistory || []), contribution];
    user.coCreationScore = Math.min(100, user.coCreationScore + value * 0.1);
    
    await user.save();
    
    logger.info('Contribution tracked', { 
      userId: user.id, 
      type, 
      newScore: user.coCreationScore 
    });
    
    res.json({
      success: true,
      newScore: user.coCreationScore,
      contribution
    });
  } catch (error) {
    logger.error('Contribution error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to track contribution' 
    });
  }
});

// Get detailed match insights (premium feature)
router.get('/insights/:userId', requireSubscription('premium'), async (req, res) => {
  try {
    const { userId: targetUserId } = req.params;
    const currentUserId = req.user.id;
    
    // Get detailed match explanation
    const insights = await smartMatcher.getMatchExplanation(currentUserId, targetUserId);
    
    if (!insights.personalityAnalysis && !insights.visualCompatibility) {
      // Queue analysis if not available
      smartMatcher.analysisQueue.add({
        userId: currentUserId,
        candidateId: targetUserId,
        analysisType: 'deep'
      });
      
      return res.json({
        success: true,
        message: 'Analysis in progress. Check back in a few minutes!',
        insights: {
          status: 'processing',
          estimatedTime: '2-3 minutes'
        }
      });
    }
    
    res.json({
      success: true,
      insights
    });
  } catch (error) {
    logger.error('Get insights error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve insights' 
    });
  }
});

// Request compatibility report for a match (premium)
router.post('/compatibility-report/:matchId', requireSubscription('premium'), async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id;
    
    const match = await Match.findByPk(matchId);
    if (!match || (match.user1Id !== userId && match.user2Id !== userId)) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }
    
    // Queue chat analysis
    smartMatcher.analysisQueue.add({
      matchId,
      analysisType: 'chat'
    });
    
    res.json({
      success: true,
      message: 'Compatibility analysis started. Results will be available in your match insights soon!'
    });
  } catch (error) {
    logger.error('Request compatibility report error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to request report' 
    });
  }
});

module.exports = router;