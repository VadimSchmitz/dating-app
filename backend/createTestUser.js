const bcrypt = require('bcrypt');
const sequelize = require('./config/database');
const User = require('./models/User');
const CoCreationCoin = require('./models/CoCreationCoin');

async function createTestUsers() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');
    
    // Create main test user
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    const testUser = await User.create({
      email: 'test@test.com',
      password: hashedPassword,
      name: 'Kitty Lover',
      dateOfBirth: '1995-01-01',
      gender: 'other',
      bio: 'I love bubbles, kitties, and finding connections! :3',
      interests: ['coding', 'bubbles', 'kitties', 'foam parties', 'fun'],
      verified: true,
      status: 'active',
      subscriptionType: 'premium',
      location: {
        city: 'Bubble City',
        country: 'Wonderland'
      },
      preferences: {
        ageRange: { min: 18, max: 99 },
        maxDistance: 1000,
        genderPreference: ['male', 'female', 'other']
      },
      photos: [],
      funScore: 100
    });
    
    // Create coin wallet
    await CoCreationCoin.create({
      userId: testUser.id,
      balance: 1000,
      totalEarned: 1000
    });
    
    console.log('✅ Test user created!');
    console.log('📧 Email: test@test.com');
    console.log('🔑 Password: test123');
    
    // Create some other users to match with
    const otherUsers = [
      {
        name: 'Bubble Buddy',
        bio: 'Professional bubble blower and party enthusiast! 🫧',
        interests: ['bubbles', 'parties', 'dancing']
      },
      {
        name: 'Rainbow Sparkle',
        bio: 'Living life in full color! 🌈✨',
        interests: ['art', 'music', 'rainbows']
      },
      {
        name: 'Nya Chan',
        bio: 'Kitty enthusiast and professional cuddler ^._.^',
        interests: ['cats', 'anime', 'cozy nights']
      }
    ];
    
    for (const userData of otherUsers) {
      const user = await User.create({
        email: `${userData.name.toLowerCase().replace(' ', '')}@test.com`,
        password: hashedPassword,
        name: userData.name,
        dateOfBirth: '1995-01-01',
        gender: 'other',
        bio: userData.bio,
        interests: userData.interests,
        verified: true,
        status: 'active',
        location: {
          city: 'Bubble City',
          country: 'Wonderland'
        },
        preferences: {
          ageRange: { min: 18, max: 99 },
          maxDistance: 1000,
          genderPreference: ['male', 'female', 'other']
        }
      });
      
      await CoCreationCoin.create({
        userId: user.id,
        balance: 100,
        totalEarned: 100
      });
    }
    
    console.log('✅ Created 3 other users to match with!');
    console.log('\n🎉 You can now login and start matching!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestUsers();