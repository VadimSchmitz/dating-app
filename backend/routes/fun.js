const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const authMiddleware = require('../middleware/auth');
const FunActivity = require('../models/FunActivity');
const User = require('../models/User');
const Match = require('../models/Match');
const CoCreationCoin = require('../models/CoCreationCoin');
const logger = require('../utils/logger');

router.use(authMiddleware);

// Get fun activities for a match
router.get('/activities/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id;
    const { category, difficulty } = req.query;
    
    // Verify match exists
    const match = await Match.findByPk(matchId);
    if (!match || (match.user1Id !== userId && match.user2Id !== userId)) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }
    
    const whereClause = { isActive: true };
    if (category) whereClause.category = category;
    if (difficulty) whereClause.difficulty = difficulty;
    
    const activities = await FunActivity.findAll({
      where: whereClause,
      order: sequelize.random(),
      limit: 5
    });
    
    res.json({
      success: true,
      activities
    });
  } catch (error) {
    logger.error('Get fun activities error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve activities' 
    });
  }
});

// Get random activity
router.get('/random-activity', async (req, res) => {
  try {
    const { category, difficulty } = req.query;
    
    const whereClause = { isActive: true };
    if (category) whereClause.category = category;
    if (difficulty) whereClause.difficulty = difficulty;
    
    const activity = await FunActivity.findOne({
      where: whereClause,
      order: sequelize.random()
    });
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'No activities found'
      });
    }
    
    res.json({
      success: true,
      activity
    });
  } catch (error) {
    logger.error('Get random activity error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve activity' 
    });
  }
});

// Complete an activity and earn rewards
router.post('/activities/:activityId/complete', async (req, res) => {
  const transaction = await FunActivity.sequelize.transaction();
  
  try {
    const { activityId } = req.params;
    const { matchId, evidence } = req.body; // evidence could be photo URL, text response, etc.
    const userId = req.user.id;
    
    const activity = await FunActivity.findByPk(activityId);
    if (!activity) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
    }
    
    // Award coins if applicable
    if (activity.rewards.coins > 0) {
      let wallet = await CoCreationCoin.findOne({
        where: { userId },
        transaction
      });
      
      if (!wallet) {
        wallet = await CoCreationCoin.create({
          userId,
          balance: 0
        }, { transaction });
      }
      
      wallet.balance += activity.rewards.coins;
      wallet.totalEarned += activity.rewards.coins;
      await wallet.save({ transaction });
    }
    
    // Update user's fun score
    const user = await User.findByPk(userId, { transaction });
    if (!user.funScore) user.funScore = 0;
    user.funScore += 10;
    
    // Track completed activities
    if (!user.completedActivities) user.completedActivities = [];
    user.completedActivities.push({
      activityId,
      completedAt: new Date(),
      matchId,
      evidence
    });
    
    await user.save({ transaction });
    await transaction.commit();
    
    logger.info('Activity completed', { 
      userId, 
      activityId,
      rewards: activity.rewards 
    });
    
    res.json({
      success: true,
      message: 'Activity completed!',
      rewards: activity.rewards,
      newFunScore: user.funScore
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('Complete activity error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to complete activity' 
    });
  }
});

// Get user's fun stats
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    
    const completedCount = user.completedActivities?.length || 0;
    const funScore = user.funScore || 0;
    
    // Calculate badges earned
    const badges = [];
    if (completedCount >= 5) badges.push('Fun Starter');
    if (completedCount >= 20) badges.push('Party Animal');
    if (completedCount >= 50) badges.push('Fun Master');
    if (funScore >= 100) badges.push('Joy Spreader');
    
    res.json({
      success: true,
      stats: {
        funScore,
        completedActivities: completedCount,
        badges,
        level: Math.floor(funScore / 100) + 1
      }
    });
  } catch (error) {
    logger.error('Get fun stats error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve stats' 
    });
  }
});

// Get fun leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const topUsers = await User.findAll({
      attributes: ['id', 'name', 'photos', 'funScore'],
      where: {
        funScore: { [Op.gt]: 0 }
      },
      order: [['funScore', 'DESC']],
      limit: 10
    });
    
    res.json({
      success: true,
      leaderboard: topUsers.map((user, index) => ({
        rank: index + 1,
        user: {
          id: user.id,
          name: user.name,
          photo: user.photos?.[0],
          funScore: user.funScore || 0
        }
      }))
    });
  } catch (error) {
    logger.error('Get leaderboard error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve leaderboard' 
    });
  }
});

// Suggest fun date ideas based on matches
router.get('/date-ideas/:matchId', async (req, res) => {
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
    const [user, otherUser] = await Promise.all([
      User.findByPk(userId),
      User.findByPk(otherUserId)
    ]);
    
    // Generate personalized date ideas based on shared interests
    const sharedInterests = user.interests.filter(i => 
      otherUser.interests.includes(i)
    );
    
    const dateIdeas = [
      {
        title: "Virtual Foam Party Night",
        description: "Set up bubble machines at home and have a video dance party!",
        vibe: "playful",
        effort: "medium",
        tags: ["fun", "active", "creative"]
      },
      {
        title: "Co-Creation Game Marathon",
        description: "Play collaborative games and build something together!",
        vibe: "competitive",
        effort: "low",
        tags: ["games", "bonding", "indoor"]
      },
      {
        title: "Adventure Scavenger Hunt",
        description: "Create clues for each other and explore your cities!",
        vibe: "adventurous",
        effort: "high",
        tags: ["outdoor", "creative", "active"]
      },
      {
        title: "Cooking Challenge Date",
        description: "Pick a recipe and cook together over video!",
        vibe: "cozy",
        effort: "medium",
        tags: ["food", "creative", "intimate"]
      },
      {
        title: "Art & Wine Night",
        description: "Paint, draw, or craft while sipping your favorite drinks!",
        vibe: "relaxed",
        effort: "low",
        tags: ["creative", "chill", "artistic"]
      }
    ];
    
    // Filter based on shared interests
    const personalizedIdeas = dateIdeas.filter(idea =>
      idea.tags.some(tag => 
        sharedInterests.some(interest => 
          interest.toLowerCase().includes(tag)
        )
      )
    );
    
    res.json({
      success: true,
      dateIdeas: personalizedIdeas.length > 0 ? personalizedIdeas : dateIdeas,
      sharedInterests
    });
  } catch (error) {
    logger.error('Get date ideas error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve date ideas' 
    });
  }
});

module.exports = router;