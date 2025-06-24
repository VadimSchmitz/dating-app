import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Premium.css';

interface PricingPlan {
  name: string;
  price: number;
  period: string;
  features: string[];
  priceId: string;
  popular?: boolean;
}

const Premium: React.FC = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string>('basic');
  const [processingPayment, setProcessingPayment] = useState(false);

  const plans: PricingPlan[] = [
    {
      name: 'Basic',
      price: 0,
      period: 'forever',
      priceId: 'basic',
      features: [
        '10 daily likes',
        'Basic matching algorithm',
        'Standard messaging',
        'Basic profile visibility'
      ]
    },
    {
      name: 'Premium',
      price: 9.99,
      period: 'month',
      priceId: 'price_premium_monthly',
      popular: true,
      features: [
        'Unlimited likes',
        '5 daily super likes',
        'See who liked you',
        'Advanced filters',
        'Read receipts',
        'Priority support',
        'Rewind last swipe'
      ]
    },
    {
      name: 'Elite',
      price: 19.99,
      period: 'month',
      priceId: 'price_elite_monthly',
      features: [
        'Everything in Premium',
        'Unlimited super likes',
        'Profile boost (2x/month)',
        'Exclusive events access',
        'Verified badge',
        'Advanced analytics',
        'VIP support'
      ]
    }
  ];

  useEffect(() => {
    fetchCurrentPlan();
  }, []);

  const fetchCurrentPlan = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/payments/subscription');
      setCurrentPlan(response.data.plan || 'basic');
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const handleSubscribe = async (priceId: string, planName: string) => {
    if (priceId === 'basic') {
      alert('You are already on the Basic plan!');
      return;
    }

    setProcessingPayment(true);
    try {
      const response = await axios.post('http://localhost:5000/api/payments/create-checkout-session', {
        priceId,
        planName
      });

      // Redirect to Stripe Checkout
      if (response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert('Failed to process payment. Please try again.');
      }
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (window.confirm('Are you sure you want to cancel your subscription?')) {
      setLoading(true);
      try {
        await axios.post('http://localhost:5000/api/payments/cancel-subscription');
        alert('Your subscription has been cancelled. You will retain access until the end of your billing period.');
        setCurrentPlan('basic');
      } catch (error) {
        console.error('Cancel subscription error:', error);
        alert('Failed to cancel subscription. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="premium-container">
      <div className="premium-header">
        <h1>Upgrade Your Experience</h1>
        <div className="nav-buttons">
          <button onClick={() => window.location.href = '/matches'}>Back to Matches</button>
          <button onClick={() => window.location.href = '/profile'}>Profile</button>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="premium-content">
        <p className="premium-intro">
          Unlock premium features to enhance your co-creation journey and connect with more like-minded individuals.
        </p>

        {currentPlan !== 'basic' && (
          <div className="current-plan-banner">
            <p>You're currently on the <strong>{currentPlan}</strong> plan!</p>
            <button onClick={handleCancelSubscription} disabled={loading}>
              Cancel Subscription
            </button>
          </div>
        )}

        <div className="pricing-plans">
          {plans.map((plan) => (
            <div 
              key={plan.priceId} 
              className={`pricing-card ${plan.popular ? 'popular' : ''} ${currentPlan === plan.priceId ? 'current' : ''}`}
            >
              {plan.popular && <div className="popular-badge">Most Popular</div>}
              <h3>{plan.name}</h3>
              <div className="price">
                <span className="currency">$</span>
                <span className="amount">{plan.price}</span>
                <span className="period">/{plan.period}</span>
              </div>
              
              <ul className="features">
                {plan.features.map((feature, idx) => (
                  <li key={idx}>
                    <span className="checkmark">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button
                className="subscribe-button"
                onClick={() => handleSubscribe(plan.priceId, plan.name)}
                disabled={processingPayment || currentPlan === plan.priceId}
              >
                {processingPayment ? 'Processing...' : 
                 currentPlan === plan.priceId ? 'Current Plan' :
                 plan.price === 0 ? 'Current Plan' : 'Upgrade Now'}
              </button>
            </div>
          ))}
        </div>

        <div className="payment-info">
          <p>🔒 Secure payment powered by Stripe</p>
          <p>Cancel anytime • No hidden fees • Instant activation</p>
        </div>
      </div>
    </div>
  );
};

export default Premium;