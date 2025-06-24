const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dateOfBirth: {
    type: DataTypes.DATE,
    allowNull: false
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: false
  },
  bio: {
    type: DataTypes.TEXT,
    validate: {
      len: [0, 500]
    }
  },
  interests: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  photos: {
    type: DataTypes.JSON,
    defaultValue: [],
    validate: {
      isArrayLength(value) {
        if (value && value.length > 6) {
          throw new Error('Maximum 6 photos allowed');
        }
      }
    }
  },
  preferences: {
    type: DataTypes.JSON,
    defaultValue: {
      ageRange: { min: 18, max: 100 },
      distance: 50,
      genderPreference: ['male', 'female', 'other']
    }
  },
  location: {
    type: DataTypes.JSON,
    defaultValue: {
      lat: null,
      lng: null,
      city: null,
      country: null
    }
  },
  coCreationScore: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  contributionHistory: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended', 'banned', 'locked'),
    defaultValue: 'active'
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verificationToken: {
    type: DataTypes.STRING
  },
  verificationExpires: {
    type: DataTypes.DATE
  },
  resetPasswordToken: {
    type: DataTypes.STRING
  },
  resetPasswordExpires: {
    type: DataTypes.DATE
  },
  refreshToken: {
    type: DataTypes.STRING
  },
  stripeCustomerId: {
    type: DataTypes.STRING
  },
  lastLogin: {
    type: DataTypes.DATE
  },
  lastActive: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  failedLoginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastFailedLogin: {
    type: DataTypes.DATE
  },
  lockedUntil: {
    type: DataTypes.DATE
  },
  dailyLikesUsed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  dailyLikesResetAt: {
    type: DataTypes.DATE
  },
  superLikesUsed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  superLikesResetAt: {
    type: DataTypes.DATE
  },
  profileBoostExpires: {
    type: DataTypes.DATE
  },
  totalLikes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalMatches: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  funScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  completedActivities: {
    type: DataTypes.JSON,
    defaultValue: []
  }
});

// Instance methods
User.prototype.getAge = function() {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

User.prototype.canLike = async function() {
  const subscription = await this.getActiveSubscription();
  const resetTime = new Date();
  resetTime.setHours(0, 0, 0, 0);
  
  // Reset daily counters if needed
  if (!this.dailyLikesResetAt || this.dailyLikesResetAt < resetTime) {
    this.dailyLikesUsed = 0;
    this.dailyLikesResetAt = new Date();
    await this.save();
  }
  
  // Check limits based on subscription
  if (!subscription) {
    return this.dailyLikesUsed < (process.env.FREE_DAILY_LIKES || 5);
  }
  
  if (subscription.plan === 'basic') {
    return this.dailyLikesUsed < 25;
  }
  
  // Premium and Elite have unlimited likes
  return true;
};

User.prototype.canSuperLike = async function() {
  const subscription = await this.getActiveSubscription();
  const resetTime = new Date();
  resetTime.setHours(0, 0, 0, 0);
  
  // Reset daily counters if needed
  if (!this.superLikesResetAt || this.superLikesResetAt < resetTime) {
    this.superLikesUsed = 0;
    this.superLikesResetAt = new Date();
    await this.save();
  }
  
  // Check limits based on subscription
  const limits = {
    free: 0,
    basic: 1,
    premium: 2,
    elite: 5
  };
  
  const plan = subscription ? subscription.plan : 'free';
  return this.superLikesUsed < limits[plan];
};

User.prototype.getActiveSubscription = async function() {
  const Subscription = require('./Subscription');
  return await Subscription.findOne({
    where: {
      userId: this.id,
      status: 'active'
    }
  });
};

// Associations will be defined in a separate file
module.exports = User;