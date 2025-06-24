const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database');

const Analytics = sequelize.define('Analytics', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  eventType: {
    type: DataTypes.ENUM(
      'page_view',
      'signup',
      'login',
      'profile_complete',
      'match_view',
      'match_like',
      'message_sent',
      'subscription_start',
      'subscription_cancel',
      'coin_purchase',
      'referral_sent',
      'referral_completed'
    ),
    allowNull: false
  },
  eventData: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  source: {
    type: DataTypes.STRING
  },
  medium: {
    type: DataTypes.STRING
  },
  campaign: {
    type: DataTypes.STRING
  },
  referrer: {
    type: DataTypes.STRING
  },
  userAgent: {
    type: DataTypes.TEXT
  },
  ipAddress: {
    type: DataTypes.STRING
  },
  sessionId: {
    type: DataTypes.STRING
  }
});

// Marketing metrics aggregation
Analytics.getMarketingMetrics = async function(startDate, endDate) {
  const metrics = await this.findAll({
    where: {
      createdAt: {
        [Op.between]: [startDate, endDate]
      }
    },
    attributes: [
      'eventType',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('userId'))), 'uniqueUsers']
    ],
    group: ['eventType']
  });

  return metrics;
};

// Conversion funnel analysis
Analytics.getFunnelMetrics = async function(startDate, endDate) {
  const funnel = {
    visits: await this.count({
      where: {
        eventType: 'page_view',
        eventData: { page: 'landing' },
        createdAt: { [Op.between]: [startDate, endDate] }
      }
    }),
    signups: await this.count({
      where: {
        eventType: 'signup',
        createdAt: { [Op.between]: [startDate, endDate] }
      }
    }),
    profileCompleted: await this.count({
      where: {
        eventType: 'profile_complete',
        createdAt: { [Op.between]: [startDate, endDate] }
      }
    }),
    firstMatch: await this.count({
      where: {
        eventType: 'match_like',
        createdAt: { [Op.between]: [startDate, endDate] }
      },
      distinct: true,
      col: 'userId'
    }),
    subscriptions: await this.count({
      where: {
        eventType: 'subscription_start',
        createdAt: { [Op.between]: [startDate, endDate] }
      }
    })
  };

  // Calculate conversion rates
  funnel.signupRate = (funnel.signups / funnel.visits * 100).toFixed(2);
  funnel.profileRate = (funnel.profileCompleted / funnel.signups * 100).toFixed(2);
  funnel.matchRate = (funnel.firstMatch / funnel.profileCompleted * 100).toFixed(2);
  funnel.subscriptionRate = (funnel.subscriptions / funnel.signups * 100).toFixed(2);

  return funnel;
};

module.exports = Analytics;