const sequelize = require('../config/database');
const logger = require('../utils/logger');
require('../models/associations');

async function initializeDatabase() {
  try {
    // Test connection
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
    
    // Sync all models
    await sequelize.sync({ alter: true });
    logger.info('All models were synchronized successfully.');
    
    // Create indexes
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON "Users" (email);
      CREATE INDEX IF NOT EXISTS idx_users_status ON "Users" (status);
      CREATE INDEX IF NOT EXISTS idx_users_location ON "Users" USING GIN (location);
      CREATE INDEX IF NOT EXISTS idx_matches_users ON "Matches" (user1Id, user2Id);
      CREATE INDEX IF NOT EXISTS idx_matches_status ON "Matches" (isMatch, unmatchedAt);
      CREATE INDEX IF NOT EXISTS idx_messages_match ON "Messages" (matchId);
      CREATE INDEX IF NOT EXISTS idx_messages_read ON "Messages" (receiverId, readAt);
      CREATE INDEX IF NOT EXISTS idx_transactions_user ON "Transactions" (userId);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON "Subscriptions" (userId, status);
    `);
    logger.info('Database indexes created successfully.');
    
    process.exit(0);
  } catch (error) {
    logger.error('Unable to initialize database:', error);
    process.exit(1);
  }
}

initializeDatabase();