const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VirtualPet = sequelize.define('VirtualPet', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  matchId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Matches',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    defaultValue: 'Kitty'
  },
  personality: {
    type: DataTypes.ENUM('playful', 'sleepy', 'hungry', 'cuddly', 'mischievous', 'zen'),
    defaultValue: 'playful'
  },
  mood: {
    type: DataTypes.ENUM('happy', 'content', 'hungry', 'sleepy', 'playful', 'lonely', 'excited'),
    defaultValue: 'happy'
  },
  hunger: {
    type: DataTypes.INTEGER,
    defaultValue: 50,
    validate: {
      min: 0,
      max: 100
    }
  },
  happiness: {
    type: DataTypes.INTEGER,
    defaultValue: 80,
    validate: {
      min: 0,
      max: 100
    }
  },
  energy: {
    type: DataTypes.INTEGER,
    defaultValue: 70,
    validate: {
      min: 0,
      max: 100
    }
  },
  affection: {
    type: DataTypes.INTEGER,
    defaultValue: 50,
    validate: {
      min: 0,
      max: 100
    }
  },
  level: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  experience: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  appearance: {
    type: DataTypes.JSON,
    defaultValue: {
      color: 'orange',
      pattern: 'tabby',
      accessories: [],
      specialFeatures: []
    }
  },
  stats: {
    type: DataTypes.JSON,
    defaultValue: {
      timesPlayed: 0,
      timesFed: 0,
      timesPetted: 0,
      favoriteFood: null,
      favoriteToy: null
    }
  },
  lastFed: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  lastPlayed: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  lastPetted: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  achievements: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  isAsleep: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  hooks: {
    beforeUpdate: (pet) => {
      // Update mood based on stats
      if (pet.hunger < 20) {
        pet.mood = 'hungry';
      } else if (pet.energy < 20) {
        pet.mood = 'sleepy';
      } else if (pet.happiness > 80) {
        pet.mood = 'excited';
      } else if (pet.affection < 30) {
        pet.mood = 'lonely';
      } else if (pet.energy > 80) {
        pet.mood = 'playful';
      } else {
        pet.mood = 'content';
      }
      
      // Level up check
      const expNeeded = pet.level * 100;
      if (pet.experience >= expNeeded) {
        pet.level += 1;
        pet.experience -= expNeeded;
        // Unlock new features or accessories at certain levels
      }
    }
  }
});

// Class methods
VirtualPet.prototype.feed = async function(foodType = 'kibble') {
  this.hunger = Math.min(100, this.hunger + 30);
  this.happiness = Math.min(100, this.happiness + 10);
  this.experience += 5;
  this.lastFed = new Date();
  
  const stats = this.stats;
  stats.timesFed = (stats.timesFed || 0) + 1;
  this.stats = stats;
  
  await this.save();
  return {
    action: 'fed',
    mood: this.mood,
    message: this.getRandomResponse('feed')
  };
};

VirtualPet.prototype.play = async function(toy = 'ball') {
  this.energy = Math.max(0, this.energy - 20);
  this.happiness = Math.min(100, this.happiness + 25);
  this.affection = Math.min(100, this.affection + 15);
  this.experience += 10;
  this.lastPlayed = new Date();
  
  const stats = this.stats;
  stats.timesPlayed = (stats.timesPlayed || 0) + 1;
  this.stats = stats;
  
  await this.save();
  return {
    action: 'played',
    mood: this.mood,
    message: this.getRandomResponse('play')
  };
};

VirtualPet.prototype.pet = async function() {
  this.affection = Math.min(100, this.affection + 20);
  this.happiness = Math.min(100, this.happiness + 15);
  this.experience += 3;
  this.lastPetted = new Date();
  
  const stats = this.stats;
  stats.timesPetted = (stats.timesPetted || 0) + 1;
  this.stats = stats;
  
  await this.save();
  return {
    action: 'petted',
    mood: this.mood,
    message: this.getRandomResponse('pet')
  };
};

VirtualPet.prototype.sleep = async function() {
  this.isAsleep = true;
  this.energy = 100;
  this.mood = 'sleepy';
  await this.save();
  return {
    action: 'sleeping',
    mood: this.mood,
    message: '*yawn* zzz...'
  };
};

VirtualPet.prototype.wake = async function() {
  this.isAsleep = false;
  this.mood = 'happy';
  await this.save();
  return {
    action: 'awake',
    mood: this.mood,
    message: '*stretch* meow!'
  };
};

VirtualPet.prototype.getRandomResponse = function(action) {
  const responses = {
    feed: [
      '*nom nom nom* :3',
      'Yummy! Thank mew!',
      '*happy purring*',
      'More treats please? :3',
      '*licks whiskers*'
    ],
    play: [
      '*pounce pounce*',
      'Wheee! So fun!',
      '*chases toy excitedly*',
      'Again again! :3',
      '*zoom zoom zoom*'
    ],
    pet: [
      '*purrrrrrrr*',
      '*nuzzles hand*',
      'I wuv you! :3',
      '*happy kitty noises*',
      '*slow blink of love*'
    ]
  };
  
  const actionResponses = responses[action] || ['*meow*'];
  return actionResponses[Math.floor(Math.random() * actionResponses.length)];
};

// Decay stats over time
VirtualPet.decayStats = async function() {
  const pets = await VirtualPet.findAll({
    where: {
      isAsleep: false
    }
  });
  
  for (const pet of pets) {
    const now = new Date();
    const hoursSinceLastFed = (now - pet.lastFed) / (1000 * 60 * 60);
    const hoursSinceLastPlayed = (now - pet.lastPlayed) / (1000 * 60 * 60);
    
    // Decay hunger faster
    pet.hunger = Math.max(0, pet.hunger - (hoursSinceLastFed * 5));
    
    // Decay energy and happiness slower
    pet.energy = Math.max(0, pet.energy - (hoursSinceLastPlayed * 2));
    pet.happiness = Math.max(0, pet.happiness - (hoursSinceLastPlayed * 3));
    
    // Affection decays very slowly
    pet.affection = Math.max(0, pet.affection - 1);
    
    await pet.save();
  }
};

module.exports = VirtualPet;