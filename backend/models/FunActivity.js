const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FunActivity = sequelize.define('FunActivity', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('icebreaker', 'game', 'challenge', 'question', 'dare', 'creative'),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  difficulty: {
    type: DataTypes.ENUM('easy', 'medium', 'spicy'),
    defaultValue: 'easy'
  },
  timeEstimate: {
    type: DataTypes.INTEGER, // in minutes
    defaultValue: 5
  },
  requiredPeople: {
    type: DataTypes.INTEGER,
    defaultValue: 2
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  prompts: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  rewards: {
    type: DataTypes.JSON,
    defaultValue: {
      coins: 0,
      badges: []
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true
});

// Seed some fun activities
FunActivity.seedActivities = async () => {
  const activities = [
    {
      title: "Two Truths and a Lie - Dating Edition",
      category: "icebreaker",
      description: "Share two truths and one lie about your dating life. Your match has to guess which is the lie!",
      difficulty: "easy",
      timeEstimate: 10,
      tags: ["conversation", "fun", "getting-to-know"],
      prompts: [
        "My worst date involved...",
        "My ideal date would be...",
        "The weirdest place I've been on a date..."
      ]
    },
    {
      title: "Emoji Story Challenge",
      category: "game",
      description: "Tell a story about your day using only emojis. Your match has to interpret it!",
      difficulty: "medium",
      timeEstimate: 15,
      tags: ["creative", "funny", "interactive"]
    },
    {
      title: "Dance-Off Challenge",
      category: "challenge",
      description: "Record a 15-second dance video to your favorite song. Bonus points for creativity!",
      difficulty: "spicy",
      timeEstimate: 20,
      tags: ["active", "video", "bold"],
      rewards: { coins: 50, badges: ["Dance Champion"] }
    },
    {
      title: "Would You Rather - Spicy Edition",
      category: "question",
      description: "Answer spicy 'Would You Rather' questions and see if your match agrees!",
      difficulty: "spicy",
      timeEstimate: 15,
      prompts: [
        "Would you rather have a romantic dinner or go on an adventure?",
        "Would you rather receive flowers or a handwritten note?",
        "Would you rather plan every date or be surprised?"
      ]
    },
    {
      title: "Compliment Relay",
      category: "game",
      description: "Take turns giving genuine compliments. Each one must be more creative than the last!",
      difficulty: "easy",
      timeEstimate: 10,
      tags: ["positive", "connection", "sweet"]
    },
    {
      title: "Virtual Foam Party",
      category: "challenge",
      description: "Create the most creative 'foam party' setup at home using household items. Share photos!",
      difficulty: "medium",
      timeEstimate: 30,
      tags: ["creative", "photo", "party"],
      rewards: { coins: 100, badges: ["Party Animal"] }
    }
  ];

  for (const activity of activities) {
    await FunActivity.findOrCreate({
      where: { title: activity.title },
      defaults: activity
    });
  }
};

module.exports = FunActivity;