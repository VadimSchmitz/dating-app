const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  hostId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('foam_party', 'game_night', 'adventure', 'creative', 'social', 'outdoor'),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  location: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {}
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  maxAttendees: {
    type: DataTypes.INTEGER,
    defaultValue: 20
  },
  currentAttendees: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  attendees: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  photos: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  vibeCheck: {
    type: DataTypes.JSON,
    defaultValue: {
      energy: 'high', // low, medium, high
      mood: 'playful', // chill, playful, adventurous, romantic
      dress: 'casual' // casual, themed, formal
    }
  },
  isPremium: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  status: {
    type: DataTypes.ENUM('upcoming', 'ongoing', 'completed', 'cancelled'),
    defaultValue: 'upcoming'
  }
}, {
  timestamps: true
});

// Associations
Event.associate = (models) => {
  Event.belongsTo(models.User, {
    foreignKey: 'hostId',
    as: 'host'
  });
};

module.exports = Event;