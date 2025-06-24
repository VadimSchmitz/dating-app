const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const CoCreationCoin = require('../models/CoCreationCoin');
const logger = require('../utils/logger');

// Free healing features for everyone
router.get('/daily-affirmation', async (req, res) => {
  const affirmations = [
    "You are exactly where you need to be",
    "Your weird is your superpower", 
    "The universe conspires to help you",
    "You deserve love just as you are",
    "Your sensitivity is a gift",
    "Connection happens when we're authentic",
    "Every rejection redirects you to better",
    "Your vibe attracts your tribe",
    "Healing happens through genuine connection",
    "You are worthy of deep love"
  ];
  
  const today = new Date().getDate();
  const affirmation = affirmations[today % affirmations.length];
  
  res.json({
    success: true,
    affirmation,
    coins_earned: 5
  });
});

// Consciousness check-in (free, earns coins)
router.post('/check-in', authMiddleware, async (req, res) => {
  try {
    const { mood, gratitude, intention } = req.body;
    const user = await User.findByPk(req.user.id);
    
    // Award coins for self-care
    const wallet = await CoCreationCoin.findOne({
      where: { userId: user.id }
    });
    
    if (wallet) {
      wallet.balance += 10;
      wallet.totalEarned += 10;
      await wallet.save();
    }
    
    // Update user's vibe
    user.currentVibe = mood;
    user.lastCheckIn = new Date();
    await user.save();
    
    res.json({
      success: true,
      message: "Thanks for checking in with yourself!",
      coins_earned: 10,
      vibe_matches: await findVibeMatches(user)
    });
  } catch (error) {
    logger.error('Check-in error:', error);
    res.status(500).json({ success: false, error: 'Failed to process check-in' });
  }
});

// Find users with similar vibes for support
async function findVibeMatches(user) {
  const similarVibes = await User.findAll({
    where: {
      currentVibe: user.currentVibe,
      id: { [Op.ne]: user.id }
    },
    limit: 3,
    attributes: ['id', 'name', 'bio']
  });
  
  return similarVibes;
}

// Healing circles (group support)
router.get('/healing-circles', async (req, res) => {
  const circles = [
    {
      id: 1,
      name: "Neurodivergent Dating Support",
      time: "Every Tuesday 7PM",
      free: true,
      description: "Safe space for autism/ADHD folks navigating love"
    },
    {
      id: 2,
      name: "Anxiety & Connection",
      time: "Thursdays 6PM", 
      free: true,
      description: "Learn to connect despite social anxiety"
    },
    {
      id: 3,
      name: "Co-Creation for Beginners",
      time: "Saturdays 3PM",
      coins: 50,
      description: "Learn the art of building together"
    }
  ];
  
  res.json({ success: true, circles });
});

// Spread joy feature - users helping users
router.post('/spread-joy', authMiddleware, async (req, res) => {
  try {
    const { targetUserId, message, anonymous = false } = req.body;
    
    // Find target user
    const targetUser = await User.findByPk(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Award coins to BOTH users
    const senderWallet = await CoCreationCoin.findOne({
      where: { userId: req.user.id }
    });
    const receiverWallet = await CoCreationCoin.findOne({
      where: { userId: targetUserId }
    });
    
    if (senderWallet) {
      senderWallet.balance += 20;
      senderWallet.totalEarned += 20;
      await senderWallet.save();
    }
    
    if (receiverWallet) {
      receiverWallet.balance += 30;
      receiverWallet.totalEarned += 30;
      await receiverWallet.save();
    }
    
    logger.info('Joy spread', { 
      from: anonymous ? 'anonymous' : req.user.id, 
      to: targetUserId 
    });
    
    res.json({
      success: true,
      message: "Joy successfully spread! You both earned coins!",
      sender_coins: 20,
      receiver_coins: 30
    });
  } catch (error) {
    logger.error('Spread joy error:', error);
    res.status(500).json({ success: false, error: 'Failed to spread joy' });
  }
});

// Free therapy resource links
router.get('/resources', (req, res) => {
  res.json({
    success: true,
    resources: {
      crisis: {
        text: "Text HOME to 741741",
        call: "988",
        description: "24/7 crisis support"
      },
      therapy: {
        betterhelp: "betterhelp.com/joyboy (20% off)",
        "7cups": "Free emotional support chat",
        openpath: "Affordable therapy collective"
      },
      communities: {
        reddit: [
          "r/neurodivergentdating",
          "r/anxietyhelp", 
          "r/kindness"
        ],
        discord: "Join our healing server: discord.gg/joyboyheals"
      },
      books: [
        "The Body Keeps the Score",
        "Attached by Amir Levine",
        "How to Be Yourself by Ellen Hendriksen"
      ]
    }
  });
});

// Universe message integration
router.get('/universe-message', authMiddleware, async (req, res) => {
  const messages = [
    "The person you're meant to meet is also looking for you",
    "Your authenticity is your magnetism",
    "Every 'no' brings you closer to your 'hell yes'",
    "Trust the timing of your life",
    "You're not behind, you're on your own path",
    "Love finds you when you're being yourself",
    "The universe is conspiring to bring you joy",
    "Your person will love your quirks",
    "Healing attracts healing",
    "You are whole, with or without a partner"
  ];
  
  const user = await User.findByPk(req.user.id);
  const messageIndex = new Date().getHours() % messages.length;
  
  res.json({
    success: true,
    message: messages[messageIndex],
    personalized: `${user.name}, ${messages[messageIndex].toLowerCase()}`
  });
});

module.exports = router;