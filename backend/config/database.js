const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');
require('dotenv').config();

// Database configuration
const config = {
  development: {
    dialect: 'sqlite',
    storage: './database/dating_app.sqlite',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false,
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    }
  },
  test: {
    host: 'localhost',
    port: 5432,
    database: 'dating_app_test',
    username: 'postgres',
    password: 'password',
    dialect: 'postgres',
    logging: false
  }
};

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

let sequelize;
if (dbConfig.use_env_variable && process.env[dbConfig.use_env_variable]) {
  sequelize = new Sequelize(process.env[dbConfig.use_env_variable], dbConfig);
} else if (env === 'production' && !process.env.DATABASE_URL) {
  // Fallback to SQLite in production if no DATABASE_URL
  logger.warn('No DATABASE_URL found in production, falling back to SQLite');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database/dating_app.sqlite',
    logging: false
  });
} else if (dbConfig.dialect === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbConfig.storage,
    logging: dbConfig.logging,
    pool: dbConfig.pool
  });
} else {
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    dbConfig
  );
}

// Test connection
sequelize.authenticate()
  .then(() => {
    logger.info('Database connection has been established successfully.');
  })
  .catch(err => {
    logger.error('Unable to connect to the database:', err);
  });

module.exports = sequelize;