const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Referral = sequelize.define('Referral', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  referrerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  referredUserId: {
    type: DataTypes.UUID,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  referralCode: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'expired', 'claimed'),
    defaultValue: 'pending'
  },
  rewardType: {
    type: DataTypes.ENUM('coins', 'subscription', 'discount'),
    defaultValue: 'coins'
  },
  rewardAmount: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  referredEmail: {
    type: DataTypes.STRING
  },
  claimedAt: {
    type: DataTypes.DATE
  },
  expiresAt: {
    type: DataTypes.DATE
  }
});

// Referral rewards configuration
Referral.REWARDS = {
  referrer: {
    firstReferral: { coins: 200, subscriptionDays: 7 },
    subsequentReferral: { coins: 100, subscriptionDays: 3 },
    milestone5: { coins: 500, subscriptionDays: 30 },
    milestone10: { coins: 1000, subscriptionDays: 60 }
  },
  referred: {
    signupBonus: { coins: 100 },
    firstPurchase: { discount: 20 }, // 20% off
    trialDays: 7
  }
};

module.exports = Referral;