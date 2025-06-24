const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  matchId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Matches',
      key: 'id'
    }
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  receiverId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [1, 1000]
    }
  },
  attachments: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  readAt: {
    type: DataTypes.DATE
  },
  deliveredAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  editedAt: {
    type: DataTypes.DATE
  },
  deletedAt: {
    type: DataTypes.DATE
  },
  isOpener: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
});

// Soft delete
Message.prototype.softDelete = function() {
  this.deletedAt = new Date();
  this.content = '[Message deleted]';
  return this.save();
};

// Class methods
Message.getConversation = function(matchId, limit = 50, offset = 0) {
  return this.findAll({
    where: {
      matchId,
      deletedAt: null
    },
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

Message.getUnreadCount = function(userId) {
  return this.count({
    where: {
      receiverId: userId,
      readAt: null,
      deletedAt: null
    }
  });
};

Message.markAsRead = function(matchId, userId) {
  return this.update(
    { readAt: new Date() },
    {
      where: {
        matchId,
        receiverId: userId,
        readAt: null
      }
    }
  );
};

module.exports = Message;