import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LandingPage.css';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleEarlyAccess = (e: React.FormEvent) => {
    e.preventDefault();
    // Store email for marketing
    localStorage.setItem('earlyAccessEmail', email);
    navigate('/register');
  };

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "UX Designer & Entrepreneur",
      text: "Found my co-founder through CoCreate! We launched our startup 6 months later.",
      rating: 5
    },
    {
      name: "Marcus Rodriguez",
      role: "Software Developer",
      text: "The co-creation matching algorithm is genius. Finally, a dating app for builders!",
      rating: 5
    },
    {
      name: "Emily Watson",
      role: "Content Creator",
      text: "Met my partner and we've created 3 successful projects together. Life-changing!",
      rating: 5
    }
  ];

  const features = [
    {
      icon: "🤝",
      title: "Co-Creation Matching",
      description: "Our AI matches you based on collaborative potential, not just looks"
    },
    {
      icon: "🚀",
      title: "Project-Based Dating",
      description: "Bond over shared projects and creative ventures"
    },
    {
      icon: "💡",
      title: "Innovation Together",
      description: "Find partners who share your vision for building something amazing"
    },
    {
      icon: "📈",
      title: "Growth Mindset",
      description: "Connect with ambitious individuals ready to create and grow"
    }
  ];

  const pricingPlans = [
    {
      name: "Basic",
      price: "$9.99",
      features: ["20 Matches/Day", "50 Messages", "Profile Views", "2 Co-Creation Boosts"],
      popular: false
    },
    {
      name: "Premium",
      price: "$19.99",
      features: ["Unlimited Matches", "Unlimited Messages", "Advanced Filters", "5 Co-Creation Boosts", "Verified Badge"],
      popular: true
    },
    {
      name: "Elite",
      price: "$39.99",
      features: ["Everything in Premium", "Personal Matchmaker", "Exclusive Events", "AI Coaching", "Priority Support"],
      popular: false
    }
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <nav className="navbar">
          <div className="logo">CoCreate Dating</div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#pricing">Pricing</a>
            <button onClick={() => navigate('/login')}>Login</button>
          </div>
        </nav>

        <div className="hero-content">
          <h1>Find Your Perfect <span className="gradient-text">Co-Creation Partner</span></h1>
          <p className="hero-subtitle">
            Where ambitious minds meet, collaborate, and fall in love through shared projects
          </p>
          
          <form className="early-access-form" onSubmit={handleEarlyAccess}>
            <input
              type="email"
              placeholder="Enter your email for early access"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit">Get Started Free</button>
          </form>

          <div className="social-proof">
            <div className="stat">
              <strong>50,000+</strong>
              <span>Active Co-Creators</span>
            </div>
            <div className="stat">
              <strong>12,000+</strong>
              <span>Successful Matches</span>
            </div>
            <div className="stat">
              <strong>3,500+</strong>
              <span>Projects Launched</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <h2>Why CoCreate Dating?</h2>
        <div className="features-grid">
          {features.map((feature, idx) => (
            <div key={idx} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Create Your Profile</h3>
            <p>Share your interests, skills, and co-creation goals</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Get Matched</h3>
            <p>Our AI finds compatible co-creators based on collaborative potential</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Start Creating</h3>
            <p>Connect, collaborate, and build amazing things together</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials">
        <h2>Success Stories</h2>
        <div className="testimonials-grid">
          {testimonials.map((testimonial, idx) => (
            <div key={idx} className="testimonial-card">
              <div className="stars">{"⭐".repeat(testimonial.rating)}</div>
              <p>"{testimonial.text}"</p>
              <div className="testimonial-author">
                <strong>{testimonial.name}</strong>
                <span>{testimonial.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="pricing">
        <h2>Choose Your Plan</h2>
        <p className="pricing-subtitle">Start free, upgrade anytime</p>
        <div className="pricing-grid">
          {pricingPlans.map((plan, idx) => (
            <div key={idx} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
              {plan.popular && <div className="popular-badge">Most Popular</div>}
              <h3>{plan.name}</h3>
              <div className="price">{plan.price}<span>/month</span></div>
              <ul>
                {plan.features.map((feature, fidx) => (
                  <li key={fidx}>{feature}</li>
                ))}
              </ul>
              <button onClick={() => navigate('/register')}>
                Start Free Trial
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <h2>Ready to Find Your Co-Creation Partner?</h2>
        <p>Join thousands of creators building meaningful relationships</p>
        <button className="cta-button" onClick={() => navigate('/register')}>
          Start Your Journey Today
        </button>
        <p className="guarantee">30-day money-back guarantee • No credit card required</p>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>CoCreate Dating</h4>
            <p>Where innovation meets romance</p>
          </div>
          <div className="footer-section">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="/blog">Blog</a>
          </div>
          <div className="footer-section">
            <h4>Company</h4>
            <a href="/about">About</a>
            <a href="/careers">Careers</a>
            <a href="/press">Press</a>
          </div>
          <div className="footer-section">
            <h4>Connect</h4>
            <a href="https://twitter.com/cocreatedating">Twitter</a>
            <a href="https://instagram.com/cocreatedating">Instagram</a>
            <a href="https://linkedin.com/company/cocreatedating">LinkedIn</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 CoCreate Dating. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;