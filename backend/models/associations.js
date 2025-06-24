const User = require('./User');
const CoCreationCoin = require('./CoCreationCoin');
const Referral = require('./Referral');
const Subscription = require('./Subscription');
const Transaction = require('./Transaction');
const Analytics = require('./Analytics');

// User associations
User.hasOne(CoCreationCoin, { 
  foreignKey: 'userId',
  as: 'wallet'
});

User.hasMany(Referral, { 
  foreignKey: 'referrerId',
  as: 'referralsMade'
});

User.hasOne(Referral, { 
  foreignKey: 'referredUserId',
  as: 'referredBy'
});

User.hasMany(Subscription, { 
  foreignKey: 'userId',
  as: 'subscriptions'
});

User.hasMany(Transaction, { 
  foreignKey: 'userId',
  as: 'transactions'
});

// CoCreationCoin associations
CoCreationCoin.belongsTo(User, { 
  foreignKey: 'userId',
  as: 'user'
});

// Referral associations
Referral.belongsTo(User, { 
  foreignKey: 'referrerId',
  as: 'referrer'
});

Referral.belongsTo(User, { 
  foreignKey: 'referredUserId',
  as: 'referredUser'
});

// Subscription associations
Subscription.belongsTo(User, { 
  foreignKey: 'userId',
  as: 'user'
});

// Transaction associations
Transaction.belongsTo(User, { 
  foreignKey: 'userId',
  as: 'user'
});

// Analytics associations
Analytics.belongsTo(User, { 
  foreignKey: 'userId',
  as: 'user'
});

module.exports = {
  User,
  CoCreationCoin,
  Referral,
  Subscription,
  Transaction,
  Analytics
};