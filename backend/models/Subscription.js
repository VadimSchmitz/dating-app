const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  plan: {
    type: DataTypes.ENUM('free', 'basic', 'premium', 'elite'),
    defaultValue: 'free',
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'cancelled', 'expired', 'trial'),
    defaultValue: 'active',
    allowNull: false
  },
  stripeCustomerId: {
    type: DataTypes.STRING,
    unique: true
  },
  stripeSubscriptionId: {
    type: DataTypes.STRING,
    unique: true
  },
  currentPeriodStart: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  currentPeriodEnd: {
    type: DataTypes.DATE
  },
  trialEnd: {
    type: DataTypes.DATE
  },
  features: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
});

// Define pricing tiers
Subscription.PLANS = {
  free: {
    name: 'Free',
    price: 0,
    features: {
      matchesPerDay: 5,
      messageLimit: 10,
      profileViews: false,
      advancedFilters: false,
      priorityMatching: false,
      coCreationBoosts: 0,
      verifiedBadge: false
    }
  },
  basic: {
    name: 'Basic',
    price: 9.99,
    stripePriceId: 'price_basic_monthly',
    features: {
      matchesPerDay: 20,
      messageLimit: 50,
      profileViews: true,
      advancedFilters: false,
      priorityMatching: false,
      coCreationBoosts: 2,
      verifiedBadge: false
    }
  },
  premium: {
    name: 'Premium',
    price: 19.99,
    stripePriceId: 'price_premium_monthly',
    features: {
      matchesPerDay: -1, // unlimited
      messageLimit: -1, // unlimited
      profileViews: true,
      advancedFilters: true,
      priorityMatching: true,
      coCreationBoosts: 5,
      verifiedBadge: true,
      superLikes: 5
    }
  },
  elite: {
    name: 'Elite Co-Creator',
    price: 39.99,
    stripePriceId: 'price_elite_monthly',
    features: {
      matchesPerDay: -1,
      messageLimit: -1,
      profileViews: true,
      advancedFilters: true,
      priorityMatching: true,
      coCreationBoosts: 10,
      verifiedBadge: true,
      superLikes: -1, // unlimited
      exclusiveEvents: true,
      personalMatchmaker: true,
      aiCoachingCredits: 20
    }
  }
};

module.exports = Subscription;