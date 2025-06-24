const express = require('express');
const router = express.Router();
const VirtualPet = require('../models/VirtualPet');
const Match = require('../models/Match');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

// Get pet for a match
router.get('/match/:matchId', authenticate, async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id;
    
    // Verify user is part of this match
    const match = await Match.findOne({
      where: {
        id: matchId,
        [Match.sequelize.Op.or]: [
          { userId1: userId },
          { userId2: userId }
        ]
      }
    });
    
    if (!match) {
      return res.status(403).json({
        success: false,
        error: 'Not your match!'
      });
    }
    
    // Get or create pet
    let pet = await VirtualPet.findOne({ where: { matchId } });
    
    if (!pet) {
      // Create a new pet with random personality
      const personalities = ['playful', 'sleepy', 'hungry', 'cuddly', 'mischievous', 'zen'];
      const colors = ['orange', 'black', 'white', 'calico', 'grey', 'cream'];
      const patterns = ['tabby', 'solid', 'tuxedo', 'spotted', 'striped'];
      
      pet = await VirtualPet.create({
        matchId,
        personality: personalities[Math.floor(Math.random() * personalities.length)],
        appearance: {
          color: colors[Math.floor(Math.random() * colors.length)],
          pattern: patterns[Math.floor(Math.random() * patterns.length)],
          accessories: [],
          specialFeatures: []
        }
      });
      
      logger.info('New pet created!', { matchId, petId: pet.id });
    }
    
    res.json({
      success: true,
      pet
    });
  } catch (error) {
    logger.error('Get pet error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pet'
    });
  }
});

// Feed pet
router.post('/:petId/feed', authenticate, async (req, res) => {
  try {
    const { petId } = req.params;
    const { food = 'kibble' } = req.body;
    
    const pet = await VirtualPet.findByPk(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        error: 'Pet not found'
      });
    }
    
    // Verify user has access
    const match = await Match.findOne({
      where: {
        id: pet.matchId,
        [Match.sequelize.Op.or]: [
          { userId1: req.user.id },
          { userId2: req.user.id }
        ]
      }
    });
    
    if (!match) {
      return res.status(403).json({
        success: false,
        error: 'Not your pet!'
      });
    }
    
    const result = await pet.feed(food);
    
    res.json({
      success: true,
      ...result,
      pet
    });
  } catch (error) {
    logger.error('Feed pet error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to feed pet'
    });
  }
});

// Play with pet
router.post('/:petId/play', authenticate, async (req, res) => {
  try {
    const { petId } = req.params;
    const { toy = 'ball' } = req.body;
    
    const pet = await VirtualPet.findByPk(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        error: 'Pet not found'
      });
    }
    
    // Verify user has access
    const match = await Match.findOne({
      where: {
        id: pet.matchId,
        [Match.sequelize.Op.or]: [
          { userId1: req.user.id },
          { userId2: req.user.id }
        ]
      }
    });
    
    if (!match) {
      return res.status(403).json({
        success: false,
        error: 'Not your pet!'
      });
    }
    
    if (pet.energy < 20) {
      return res.json({
        success: false,
        message: '*yawn* Too tired to play... need nap',
        pet
      });
    }
    
    const result = await pet.play(toy);
    
    res.json({
      success: true,
      ...result,
      pet
    });
  } catch (error) {
    logger.error('Play with pet error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to play with pet'
    });
  }
});

// Pet the pet :3
router.post('/:petId/pet', authenticate, async (req, res) => {
  try {
    const { petId } = req.params;
    
    const pet = await VirtualPet.findByPk(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        error: 'Pet not found'
      });
    }
    
    // Verify user has access
    const match = await Match.findOne({
      where: {
        id: pet.matchId,
        [Match.sequelize.Op.or]: [
          { userId1: req.user.id },
          { userId2: req.user.id }
        ]
      }
    });
    
    if (!match) {
      return res.status(403).json({
        success: false,
        error: 'Not your pet!'
      });
    }
    
    const result = await pet.pet();
    
    res.json({
      success: true,
      ...result,
      pet
    });
  } catch (error) {
    logger.error('Pet pet error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to pet pet'
    });
  }
});

// Rename pet
router.put('/:petId/rename', authenticate, async (req, res) => {
  try {
    const { petId } = req.params;
    const { name } = req.body;
    
    if (!name || name.length < 1 || name.length > 20) {
      return res.status(400).json({
        success: false,
        error: 'Name must be 1-20 characters'
      });
    }
    
    const pet = await VirtualPet.findByPk(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        error: 'Pet not found'
      });
    }
    
    // Verify user has access
    const match = await Match.findOne({
      where: {
        id: pet.matchId,
        [Match.sequelize.Op.or]: [
          { userId1: req.user.id },
          { userId2: req.user.id }
        ]
      }
    });
    
    if (!match) {
      return res.status(403).json({
        success: false,
        error: 'Not your pet!'
      });
    }
    
    pet.name = name;
    await pet.save();
    
    res.json({
      success: true,
      message: `Pet renamed to ${name}!`,
      pet
    });
  } catch (error) {
    logger.error('Rename pet error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to rename pet'
    });
  }
});

// Sleep/Wake pet
router.post('/:petId/sleep', authenticate, async (req, res) => {
  try {
    const { petId } = req.params;
    
    const pet = await VirtualPet.findByPk(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        error: 'Pet not found'
      });
    }
    
    // Verify user has access
    const match = await Match.findOne({
      where: {
        id: pet.matchId,
        [Match.sequelize.Op.or]: [
          { userId1: req.user.id },
          { userId2: req.user.id }
        ]
      }
    });
    
    if (!match) {
      return res.status(403).json({
        success: false,
        error: 'Not your pet!'
      });
    }
    
    const result = pet.isAsleep ? await pet.wake() : await pet.sleep();
    
    res.json({
      success: true,
      ...result,
      pet
    });
  } catch (error) {
    logger.error('Sleep/wake pet error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change pet sleep state'
    });
  }
});

// Buy accessory for pet
router.post('/:petId/accessory', authenticate, async (req, res) => {
  try {
    const { petId } = req.params;
    const { accessory } = req.body;
    
    const pet = await VirtualPet.findByPk(petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        error: 'Pet not found'
      });
    }
    
    // Verify user has access
    const match = await Match.findOne({
      where: {
        id: pet.matchId,
        [Match.sequelize.Op.or]: [
          { userId1: req.user.id },
          { userId2: req.user.id }
        ]
      }
    });
    
    if (!match) {
      return res.status(403).json({
        success: false,
        error: 'Not your pet!'
      });
    }
    
    // Add accessory
    const appearance = pet.appearance;
    appearance.accessories = appearance.accessories || [];
    
    if (!appearance.accessories.includes(accessory)) {
      appearance.accessories.push(accessory);
      pet.appearance = appearance;
      pet.happiness = Math.min(100, pet.happiness + 20);
      await pet.save();
    }
    
    res.json({
      success: true,
      message: `Your kitty is now wearing a ${accessory}!`,
      pet
    });
  } catch (error) {
    logger.error('Buy accessory error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to buy accessory'
    });
  }
});

module.exports = router;