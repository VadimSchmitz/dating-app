const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CoCreationCoin = sequelize.define('CoCreationCoin', {
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
  balance: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  totalEarned: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalSpent: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

// Coin packages for purchase
CoCreationCoin.PACKAGES = {
  starter: {
    coins: 100,
    price: 4.99,
    bonus: 0
  },
  popular: {
    coins: 500,
    price: 19.99,
    bonus: 50 // 10% bonus
  },
  value: {
    coins: 1200,
    price: 39.99,
    bonus: 200 // ~17% bonus
  },
  premium: {
    coins: 3000,
    price: 79.99,
    bonus: 700 // ~23% bonus
  }
};

// Coin costs for features
CoCreationCoin.COSTS = {
  boost: 50,
  superLike: 20,
  rewind: 30,
  spotlight: 100,
  priorityMessage: 40,
  profileUnlock: 25,
  eventTicket: 200
};

module.exports = CoCreationCoin;