const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Match = sequelize.define('Match', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user1Id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  user2Id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  user1Status: {
    type: DataTypes.ENUM('pending', 'liked', 'passed', 'superliked'),
    allowNull: false
  },
  user2Status: {
    type: DataTypes.ENUM('pending', 'liked', 'passed', 'superliked'),
    allowNull: false,
    defaultValue: 'pending'
  },
  isMatch: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  matchedAt: {
    type: DataTypes.DATE
  },
  lastMessageAt: {
    type: DataTypes.DATE
  },
  unmatchedBy: {
    type: DataTypes.UUID,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  unmatchedAt: {
    type: DataTypes.DATE
  },
  compatibilityScore: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  coCreationPotential: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  }
});

// Instance methods
Match.prototype.checkMatch = function() {
  if (this.user1Status === 'liked' && this.user2Status === 'liked' ||
      this.user1Status === 'superliked' && this.user2Status === 'liked' ||
      this.user1Status === 'liked' && this.user2Status === 'superliked' ||
      this.user1Status === 'superliked' && this.user2Status === 'superliked') {
    this.isMatch = true;
    this.matchedAt = new Date();
    return true;
  }
  return false;
};

// Class methods
Match.findBetweenUsers = function(userId1, userId2) {
  return this.findOne({
    where: {
      [sequelize.Op.or]: [
        { user1Id: userId1, user2Id: userId2 },
        { user1Id: userId2, user2Id: userId1 }
      ]
    }
  });
};

Match.getActiveMatches = function(userId) {
  return this.findAll({
    where: {
      [sequelize.Op.or]: [
        { user1Id: userId },
        { user2Id: userId }
      ],
      isMatch: true,
      unmatchedAt: null
    },
    order: [['matchedAt', 'DESC']]
  });
};

module.exports = Match;