const sequelize = require('./config/database');
const logger = require('./utils/logger');

// Import all models
const User = require('./models/User');
const Match = require('./models/Match');
const Message = require('./models/Message');
const CoCreationCoin = require('./models/CoCreationCoin');
const Transaction = require('./models/Transaction');
const Subscription = require('./models/Subscription');
const Referral = require('./models/Referral');
const Event = require('./models/Event');
const FunActivity = require('./models/FunActivity');
const Analytics = require('./models/Analytics');
const { seedActivities } = require('./models/FunActivity');

// Define associations
User.hasMany(Match, { as: 'initiatedMatches', foreignKey: 'userId1' });
User.hasMany(Match, { as: 'receivedMatches', foreignKey: 'userId2' });
User.hasMany(Message, { as: 'sentMessages', foreignKey: 'senderId' });
User.hasMany(Message, { as: 'receivedMessages', foreignKey: 'receiverId' });
User.hasOne(CoCreationCoin, { foreignKey: 'userId' });
User.hasMany(Transaction, { foreignKey: 'userId' });
User.hasOne(Subscription, { foreignKey: 'userId' });
User.hasMany(Referral, { as: 'referralsMade', foreignKey: 'referrerId' });
User.hasMany(Referral, { as: 'referralsReceived', foreignKey: 'referredUserId' });
User.belongsToMany(Event, { through: 'EventAttendees', as: 'eventsAttending' });

Match.belongsTo(User, { as: 'user1', foreignKey: 'userId1' });
Match.belongsTo(User, { as: 'user2', foreignKey: 'userId2' });
Match.hasMany(Message, { foreignKey: 'matchId' });

Message.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });
Message.belongsTo(User, { as: 'receiver', foreignKey: 'receiverId' });
Message.belongsTo(Match, { foreignKey: 'matchId' });

CoCreationCoin.belongsTo(User, { foreignKey: 'userId' });

Transaction.belongsTo(User, { foreignKey: 'userId' });

Subscription.belongsTo(User, { foreignKey: 'userId' });

Referral.belongsTo(User, { as: 'referrer', foreignKey: 'referrerId' });
Referral.belongsTo(User, { as: 'referredUser', foreignKey: 'referredUserId' });

Event.belongsTo(User, { as: 'host', foreignKey: 'hostId' });
Event.belongsToMany(User, { through: 'EventAttendees', as: 'participants' });

async function syncDatabase() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established');

    // Sync all models
    await sequelize.sync({ force: false });
    logger.info('Database synced successfully');

    // Seed initial fun activities
    await seedActivities();
    logger.info('Fun activities seeded');

    console.log('✅ Database setup complete!');
    process.exit(0);
  } catch (error) {
    logger.error('Database sync error:', error);
    console.error('❌ Database sync failed:', error);
    process.exit(1);
  }
}

syncDatabase();