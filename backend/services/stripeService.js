const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('../utils/logger');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Subscription = require('../models/Subscription');
const CoCreationCoin = require('../models/CoCreationCoin');

class StripeService {
  constructor() {
    this.subscriptionPlans = {
      basic: {
        priceId: process.env.STRIPE_BASIC_PRICE_ID || 'price_basic',
        amount: 999, // $9.99
        features: {
          dailyLikes: 25,
          superLikesPerDay: 1,
          canSeeWhoLikedYou: false
        }
      },
      premium: {
        priceId: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium',
        amount: 1999, // $19.99
        features: {
          dailyLikes: -1, // unlimited
          superLikesPerDay: 2,
          canSeeWhoLikedYou: true,
          advancedFilters: true
        }
      },
      elite: {
        priceId: process.env.STRIPE_ELITE_PRICE_ID || 'price_elite',
        amount: 3999, // $39.99
        features: {
          dailyLikes: -1, // unlimited
          superLikesPerDay: 5,
          canSeeWhoLikedYou: true,
          advancedFilters: true,
          priorityVisibility: true,
          readReceipts: true,
          monthlyBoost: true
        }
      }
    };
  }

  // Create Stripe customer for user
  async createCustomer(user) {
    try {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user.id
        }
      });

      user.stripeCustomerId = customer.id;
      await user.save();

      logger.info('Stripe customer created', { userId: user.id, customerId: customer.id });
      return customer;
    } catch (error) {
      logger.error('Failed to create Stripe customer:', error);
      throw error;
    }
  }

  // Get or create Stripe customer
  async getOrCreateCustomer(user) {
    if (user.stripeCustomerId) {
      try {
        const customer = await stripe.customers.retrieve(user.stripeCustomerId);
        return customer;
      } catch (error) {
        logger.warn('Failed to retrieve customer, creating new one', { error });
      }
    }
    return this.createCustomer(user);
  }

  // Create payment intent for coin purchase
  async createCoinPurchaseIntent(user, packageId) {
    try {
      const coinPackage = CoCreationCoin.PACKAGES[packageId];
      if (!coinPackage) {
        throw new Error('Invalid coin package');
      }

      const customer = await this.getOrCreateCustomer(user);
      const amount = Math.round(coinPackage.price * 100); // Convert to cents

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        customer: customer.id,
        description: `${coinPackage.coins + coinPackage.bonus} CoCreation Coins`,
        metadata: {
          userId: user.id,
          type: 'coins',
          packageId,
          coins: coinPackage.coins + coinPackage.bonus
        }
      });

      // Create pending transaction
      await Transaction.create({
        userId: user.id,
        type: 'coins',
        amount: coinPackage.price,
        status: 'pending',
        stripePaymentIntentId: paymentIntent.id,
        description: `${coinPackage.coins + coinPackage.bonus} CoCreation Coins`,
        metadata: {
          packageId,
          coins: coinPackage.coins + coinPackage.bonus
        }
      });

      logger.info('Coin purchase intent created', { 
        userId: user.id, 
        paymentIntentId: paymentIntent.id,
        packageId 
      });

      return {
        clientSecret: paymentIntent.client_secret,
        amount: coinPackage.price,
        coins: coinPackage.coins + coinPackage.bonus
      };
    } catch (error) {
      logger.error('Failed to create coin purchase intent:', error);
      throw error;
    }
  }

  // Create subscription
  async createSubscription(user, plan, paymentMethodId) {
    try {
      const planConfig = this.subscriptionPlans[plan];
      if (!planConfig) {
        throw new Error('Invalid subscription plan');
      }

      const customer = await this.getOrCreateCustomer(user);

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id
      });

      // Set as default payment method
      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: planConfig.priceId }],
        metadata: {
          userId: user.id,
          plan
        }
      });

      // Create local subscription record
      await Subscription.create({
        userId: user.id,
        plan,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customer.id,
        status: 'active',
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      });

      // Create transaction record
      await Transaction.create({
        userId: user.id,
        type: 'subscription',
        amount: planConfig.amount / 100,
        status: 'completed',
        stripePaymentIntentId: subscription.latest_invoice,
        description: `${plan} subscription`,
        metadata: { plan }
      });

      logger.info('Subscription created', { 
        userId: user.id, 
        subscriptionId: subscription.id,
        plan 
      });

      return subscription;
    } catch (error) {
      logger.error('Failed to create subscription:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(userId) {
    try {
      const subscription = await Subscription.findOne({
        where: {
          userId,
          status: 'active'
        }
      });

      if (!subscription) {
        throw new Error('No active subscription found');
      }

      // Cancel at period end
      const stripeSubscription = await stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        { cancel_at_period_end: true }
      );

      subscription.status = 'canceling';
      subscription.cancelAt = new Date(stripeSubscription.cancel_at * 1000);
      await subscription.save();

      logger.info('Subscription cancelled', { userId, subscriptionId: subscription.id });
      return subscription;
    } catch (error) {
      logger.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  // Handle webhook events
  async handleWebhook(event) {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;
        
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object);
          break;
        
        case 'subscription.updated':
        case 'subscription.deleted':
          await this.handleSubscriptionUpdate(event.data.object);
          break;
        
        case 'invoice.payment_succeeded':
          await this.handleInvoicePayment(event.data.object);
          break;
        
        default:
          logger.info('Unhandled webhook event', { type: event.type });
      }
    } catch (error) {
      logger.error('Webhook handling error:', error);
      throw error;
    }
  }

  // Handle successful payment
  async handlePaymentSuccess(paymentIntent) {
    const transaction = await Transaction.findOne({
      where: { stripePaymentIntentId: paymentIntent.id }
    });

    if (!transaction) {
      logger.warn('Transaction not found for payment intent', { paymentIntentId: paymentIntent.id });
      return;
    }

    transaction.status = 'completed';
    await transaction.save();

    // If it's a coin purchase, add coins to user's wallet
    if (transaction.type === 'coins' && transaction.metadata.coins) {
      const wallet = await CoCreationCoin.findOne({
        where: { userId: transaction.userId }
      });

      if (wallet) {
        wallet.balance += transaction.metadata.coins;
        wallet.totalEarned += transaction.metadata.coins;
        await wallet.save();
        
        logger.info('Coins added to wallet', { 
          userId: transaction.userId, 
          coins: transaction.metadata.coins 
        });
      }
    }
  }

  // Handle failed payment
  async handlePaymentFailure(paymentIntent) {
    const transaction = await Transaction.findOne({
      where: { stripePaymentIntentId: paymentIntent.id }
    });

    if (transaction) {
      transaction.status = 'failed';
      await transaction.save();
      
      logger.info('Payment failed', { 
        transactionId: transaction.id,
        userId: transaction.userId 
      });
    }
  }

  // Handle subscription updates
  async handleSubscriptionUpdate(stripeSubscription) {
    const subscription = await Subscription.findOne({
      where: { stripeSubscriptionId: stripeSubscription.id }
    });

    if (!subscription) {
      logger.warn('Subscription not found', { subscriptionId: stripeSubscription.id });
      return;
    }

    // Update subscription status
    if (stripeSubscription.status === 'canceled') {
      subscription.status = 'canceled';
    } else if (stripeSubscription.status === 'active') {
      subscription.status = 'active';
      subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
      subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
    }

    await subscription.save();
    
    logger.info('Subscription updated', { 
      subscriptionId: subscription.id,
      status: subscription.status 
    });
  }

  // Handle invoice payment
  async handleInvoicePayment(invoice) {
    if (invoice.subscription) {
      // Create transaction record for subscription renewal
      await Transaction.create({
        userId: invoice.metadata.userId,
        type: 'subscription',
        amount: invoice.amount_paid / 100,
        status: 'completed',
        stripePaymentIntentId: invoice.id,
        description: 'Subscription renewal',
        metadata: {
          subscriptionId: invoice.subscription
        }
      });
    }
  }

  // Create checkout session for web payments
  async createCheckoutSession(user, type, plan = null) {
    try {
      const customer = await this.getOrCreateCustomer(user);
      
      let lineItems;
      let metadata = { userId: user.id, type };

      if (type === 'subscription' && plan) {
        const planConfig = this.subscriptionPlans[plan];
        lineItems = [{
          price: planConfig.priceId,
          quantity: 1
        }];
        metadata.plan = plan;
      } else {
        throw new Error('Invalid checkout type');
      }

      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: type === 'subscription' ? 'subscription' : 'payment',
        success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
        metadata
      });

      logger.info('Checkout session created', { 
        userId: user.id,
        sessionId: session.id,
        type 
      });

      return session;
    } catch (error) {
      logger.error('Failed to create checkout session:', error);
      throw error;
    }
  }
}

module.exports = new StripeService();