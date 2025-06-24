const sgMail = require('@sendgrid/mail');
const logger = require('../utils/logger');

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const emailTemplates = {
  verification: (name, token) => ({
    subject: 'Verify Your Email - Dating App',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF6B6B;">Welcome to Dating App!</h1>
        <p>Hi ${name},</p>
        <p>Thanks for signing up! Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/verify-email/${token}" 
             style="background-color: #FF6B6B; color: white; padding: 15px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p>Or copy and paste this link: ${process.env.FRONTEND_URL}/verify-email/${token}</p>
        <p>This link will expire in 24 hours.</p>
        <p>Best regards,<br>The Dating App Team</p>
      </div>
    `
  }),

  passwordReset: (name, token) => ({
    subject: 'Password Reset Request - Dating App',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF6B6B;">Password Reset Request</h1>
        <p>Hi ${name},</p>
        <p>We received a request to reset your password. Click the button below to reset it:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/reset-password/${token}" 
             style="background-color: #FF6B6B; color: white; padding: 15px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link: ${process.env.FRONTEND_URL}/reset-password/${token}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The Dating App Team</p>
      </div>
    `
  }),

  welcome: (name) => ({
    subject: 'Welcome to Dating App!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF6B6B;">Welcome to Dating App!</h1>
        <p>Hi ${name},</p>
        <p>Your email has been verified and your account is now active!</p>
        <h2>Here's what you can do next:</h2>
        <ul>
          <li>Complete your profile to get better matches</li>
          <li>Upload photos to make your profile stand out</li>
          <li>Start swiping and finding your perfect match!</li>
        </ul>
        <p>As a welcome gift, we've added 50 CoCreation Coins to your account!</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/profile" 
             style="background-color: #FF6B6B; color: white; padding: 15px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Complete Your Profile
          </a>
        </div>
        <p>Happy dating!<br>The Dating App Team</p>
      </div>
    `
  }),

  newMatch: (userName, matchName) => ({
    subject: 'You have a new match! 🎉',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF6B6B;">It's a Match!</h1>
        <p>Hi ${userName},</p>
        <p>Great news! You and ${matchName} have matched!</p>
        <p>Don't keep them waiting - send the first message and start your conversation.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/matches" 
             style="background-color: #FF6B6B; color: white; padding: 15px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Send a Message
          </a>
        </div>
        <p>Happy chatting!<br>The Dating App Team</p>
      </div>
    `
  }),

  subscriptionConfirmation: (name, plan) => ({
    subject: 'Subscription Confirmed - Dating App Premium',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF6B6B;">Welcome to ${plan} Plan!</h1>
        <p>Hi ${name},</p>
        <p>Your subscription to the ${plan} plan has been confirmed!</p>
        <h2>Your premium benefits include:</h2>
        <ul>
          ${plan === 'elite' ? `
            <li>Unlimited likes</li>
            <li>See who likes you</li>
            <li>5 Super Likes per day</li>
            <li>Priority visibility</li>
            <li>Advanced filters</li>
            <li>Read receipts</li>
            <li>Monthly profile boost</li>
          ` : plan === 'premium' ? `
            <li>Unlimited likes</li>
            <li>See who likes you</li>
            <li>2 Super Likes per day</li>
            <li>Advanced filters</li>
          ` : `
            <li>25 likes per day</li>
            <li>1 Super Like per day</li>
          `}
        </ul>
        <p>Your subscription will automatically renew monthly unless cancelled.</p>
        <p>Enjoy your premium experience!<br>The Dating App Team</p>
      </div>
    `
  })
};

class EmailService {
  async sendEmail(to, template) {
    try {
      const msg = {
        to,
        from: process.env.EMAIL_FROM,
        subject: template.subject,
        html: template.html
      };

      if (process.env.NODE_ENV === 'development') {
        logger.info('Email would be sent in production:', { to, subject: template.subject });
        return true;
      }

      await sgMail.send(msg);
      logger.info('Email sent successfully', { to, subject: template.subject });
      return true;
    } catch (error) {
      logger.error('Email send failed:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendVerificationEmail(email, name, token) {
    return this.sendEmail(email, emailTemplates.verification(name, token));
  }

  async sendPasswordResetEmail(email, name, token) {
    return this.sendEmail(email, emailTemplates.passwordReset(name, token));
  }

  async sendWelcomeEmail(email, name) {
    return this.sendEmail(email, emailTemplates.welcome(name));
  }

  async sendNewMatchEmail(email, userName, matchName) {
    return this.sendEmail(email, emailTemplates.newMatch(userName, matchName));
  }

  async sendSubscriptionConfirmation(email, name, plan) {
    return this.sendEmail(email, emailTemplates.subscriptionConfirmation(name, plan));
  }

  async sendBulkEmails(recipients, templateFunction) {
    const messages = recipients.map(recipient => ({
      to: recipient.email,
      from: process.env.EMAIL_FROM,
      ...templateFunction(recipient)
    }));

    try {
      if (process.env.NODE_ENV === 'development') {
        logger.info('Bulk emails would be sent in production:', { count: messages.length });
        return true;
      }

      await sgMail.sendMultiple(messages);
      logger.info('Bulk emails sent successfully', { count: messages.length });
      return true;
    } catch (error) {
      logger.error('Bulk email send failed:', error);
      throw new Error('Failed to send bulk emails');
    }
  }
}

module.exports = new EmailService();