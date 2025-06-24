const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const authMiddleware = require('../middleware/auth');
const { paymentValidation } = require('../middleware/validation');
const { limiters, checkAccountStatus } = require('../middleware/security');
const stripeService = require('../services/stripeService');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');
const User = require('../models/User');
const CoCreationCoin = require('../models/CoCreationCoin');
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');

// Apply auth to all payment routes
router.use(authMiddleware);
router.use(checkAccountStatus);

// Get coin packages
router.get('/coin-packages', (req, res) => {
  res.json({
    success: true,
    packages: CoCreationCoin.PACKAGES
  });
});

// Purchase coins
router.post('/purchase-coins', 
  limiters.payment, 
  paymentValidation.purchaseCoins, 
  async (req, res) => {
    try {
      const { packageId, paymentMethodId } = req.body;
      const user = await User.findByPk(req.user.id);
      
      const result = await stripeService.createCoinPurchaseIntent(user, packageId);
      
      // If payment method provided, attempt immediate payment
      if (paymentMethodId) {
        const paymentIntent = await stripe.paymentIntents.confirm(result.clientSecret, {
          payment_method: paymentMethodId
        });
        
        if (paymentIntent.status === 'succeeded') {
          // Payment successful, coins will be added via webhook
          return res.json({
            success: true,
            status: 'succeeded',
            coins: result.coins
          });
        }
      }
      
      res.json({
        success: true,
        clientSecret: result.clientSecret,
        amount: result.amount,
        coins: result.coins
      });
    } catch (error) {
      logger.error('Coin purchase error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process coin purchase'
      });
    }
  }
);

// Get subscription plans
router.get('/subscription-plans', (req, res) => {
  const plans = {
    basic: {
      name: 'Basic',
      price: 9.99,
      features: [
        '25 likes per day',
        '1 Super Like per day',
        'Basic matching'
      ]
    },
    premium: {
      name: 'Premium',
      price: 19.99,
      features: [
        'Unlimited likes',
        'See who likes you',
        '2 Super Likes per day',
        'Advanced filters',
        'Priority support'
      ]
    },
    elite: {
      name: 'Elite',
      price: 39.99,
      features: [
        'All Premium features',
        '5 Super Likes per day',
        'Priority visibility',
        'Read receipts',
        'Monthly profile boost',
        'Exclusive events access'
      ]
    }
  };
  
  res.json({
    success: true,
    plans
  });
});

// Create subscription
router.post('/create-subscription', 
  limiters.payment, 
  paymentValidation.createSubscription, 
  async (req, res) => {
    try {
      const { plan, paymentMethodId } = req.body;
      const user = await User.findByPk(req.user.id);
      
      // Check for existing active subscription
      const existingSubscription = await Subscription.findOne({
        where: {
          userId: user.id,
          status: 'active'
        }
      });
      
      if (existingSubscription) {
        return res.status(400).json({
          success: false,
          error: 'You already have an active subscription'
        });
      }
      
      const subscription = await stripeService.createSubscription(user, plan, paymentMethodId);
      
      // Send confirmation email
      await emailService.sendSubscriptionConfirmation(user.email, user.name, plan);
      
      res.json({
        success: true,
        subscription: {
          id: subscription.id,
          plan,
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000)
        }
      });
    } catch (error) {
      logger.error('Subscription creation error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create subscription'
      });
    }
  }
);

// Get current subscription
router.get('/subscription', async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: {
        userId: req.user.id,
        status: ['active', 'canceling']
      }
    });
    
    if (!subscription) {
      return res.json({
        success: true,
        subscription: null
      });
    }
    
    res.json({
      success: true,
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAt: subscription.cancelAt
      }
    });
  } catch (error) {
    logger.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve subscription'
    });
  }
});

// Cancel subscription
router.post('/cancel-subscription', limiters.payment, async (req, res) => {
  try {
    const subscription = await stripeService.cancelSubscription(req.user.id);
    
    res.json({
      success: true,
      message: 'Subscription will be cancelled at period end',
      cancelAt: subscription.cancelAt
    });
  } catch (error) {
    logger.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel subscription'
    });
  }
});

// Get transaction history
router.get('/transactions', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const { count, rows: transactions } = await Transaction.findAndCountAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
      attributes: ['id', 'type', 'amount', 'status', 'description', 'createdAt']
    });
    
    res.json({
      success: true,
      transactions,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve transactions'
    });
  }
});

// Get coin balance
router.get('/coin-balance', async (req, res) => {
  try {
    const wallet = await CoCreationCoin.findOne({
      where: { userId: req.user.id }
    });
    
    res.json({
      success: true,
      balance: wallet ? wallet.balance : 0,
      totalEarned: wallet ? wallet.totalEarned : 0,
      totalSpent: wallet ? wallet.totalSpent : 0
    });
  } catch (error) {
    logger.error('Get coin balance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve coin balance'
    });
  }
});

// Spend coins
router.post('/spend-coins', authMiddleware, async (req, res) => {
  const transaction = await CoCreationCoin.sequelize.transaction();
  
  try {
    const { feature, targetUserId } = req.body;
    const cost = CoCreationCoin.COSTS[feature];
    
    if (!cost) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Invalid feature'
      });
    }
    
    const wallet = await CoCreationCoin.findOne({
      where: { userId: req.user.id },
      transaction
    });
    
    if (!wallet || wallet.balance < cost) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Insufficient coins',
        required: cost,
        balance: wallet ? wallet.balance : 0
      });
    }
    
    // Deduct coins
    wallet.balance -= cost;
    wallet.totalSpent += cost;
    await wallet.save({ transaction });
    
    // Record transaction
    await Transaction.create({
      userId: req.user.id,
      type: feature,
      amount: -cost,
      status: 'completed',
      description: `Used ${feature}`,
      metadata: { feature, targetUserId }
    }, { transaction });
    
    await transaction.commit();
    
    logger.info('Coins spent', { 
      userId: req.user.id, 
      feature, 
      cost 
    });
    
    res.json({
      success: true,
      newBalance: wallet.balance,
      cost
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('Spend coins error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process coin spending'
    });
  }
});

// Stripe webhook
router.post('/stripe-webhook', 
  express.raw({ type: 'application/json' }), 
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      
      await stripeService.handleWebhook(event);
      
      res.json({ received: true });
    } catch (error) {
      logger.error('Webhook error:', error);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  }
);

module.exports = router;