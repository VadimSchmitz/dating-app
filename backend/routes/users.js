const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { upload, handleUploadError, cleanupOldPhotos } = require('../middleware/upload');
const logger = require('../utils/logger');

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, age, bio, interests, preferences, location } = req.body;
    
    const user = await User.findByPk(req.user.id);
    
    if (name) user.name = name;
    if (age) user.age = age;
    if (bio) user.bio = bio;
    if (interests) user.interests = interests;
    if (preferences) user.preferences = preferences;
    if (location) user.location = location;
    
    await user.save();
    
    res.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        age: user.age,
        bio: user.bio,
        interests: user.interests,
        preferences: user.preferences,
        location: user.location,
        coCreationScore: user.coCreationScore
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload profile photo
router.post('/profile/photo', 
  authMiddleware, 
  upload.single('photo'), 
  handleUploadError,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      const user = await User.findByPk(req.user.id);
      const photoUrl = `/uploads/profiles/${req.file.filename}`;
      
      // Add new photo to user's photos array
      const photos = user.photos || [];
      photos.push(photoUrl);
      
      // Keep only the last 6 photos
      if (photos.length > 6) {
        const removedPhotos = photos.splice(0, photos.length - 6);
        // Clean up old photos from disk
        await cleanupOldPhotos(user.id, photos);
      }
      
      user.photos = photos;
      await user.save();
      
      logger.info('Profile photo uploaded', { userId: user.id, photoUrl });
      
      res.json({
        success: true,
        photoUrl,
        photos: user.photos
      });
    } catch (error) {
      logger.error('Photo upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload photo'
      });
    }
  }
);

// Delete profile photo
router.delete('/profile/photo/:index', authMiddleware, async (req, res) => {
  try {
    const photoIndex = parseInt(req.params.index);
    const user = await User.findByPk(req.user.id);
    
    if (!user.photos || photoIndex < 0 || photoIndex >= user.photos.length) {
      return res.status(404).json({
        success: false,
        error: 'Photo not found'
      });
    }
    
    const photos = [...user.photos];
    const removedPhoto = photos.splice(photoIndex, 1);
    
    user.photos = photos;
    await user.save();
    
    // Clean up the removed photo from disk
    await cleanupOldPhotos(user.id, photos);
    
    logger.info('Profile photo deleted', { userId: user.id, photoIndex });
    
    res.json({
      success: true,
      photos: user.photos
    });
  } catch (error) {
    logger.error('Photo deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete photo'
    });
  }
});

// Reorder profile photos
router.put('/profile/photos/reorder', authMiddleware, async (req, res) => {
  try {
    const { photos } = req.body;
    const user = await User.findByPk(req.user.id);
    
    // Validate that the photos array contains the same photos
    if (!photos || photos.length !== user.photos?.length) {
      return res.status(400).json({
        success: false,
        error: 'Invalid photos array'
      });
    }
    
    user.photos = photos;
    await user.save();
    
    res.json({
      success: true,
      photos: user.photos
    });
  } catch (error) {
    logger.error('Photo reorder error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reorder photos'
    });
  }
});

module.exports = router;