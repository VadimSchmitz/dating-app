const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const authMiddleware = require('../middleware/auth');
const Event = require('../models/Event');
const User = require('../models/User');
const logger = require('../utils/logger');

router.use(authMiddleware);

// Get all events
router.get('/', async (req, res) => {
  try {
    const { type, date, location } = req.query;
    const userId = req.user.id;
    
    const whereClause = {
      status: { [Op.in]: ['upcoming', 'ongoing'] }
    };
    
    if (type) whereClause.type = type;
    if (date) {
      const queryDate = new Date(date);
      whereClause.date = {
        [Op.gte]: queryDate,
        [Op.lt]: new Date(queryDate.getTime() + 24 * 60 * 60 * 1000)
      };
    }
    
    const events = await Event.findAll({
      where: whereClause,
      order: [['date', 'ASC']],
      include: [{
        model: User,
        as: 'host',
        attributes: ['id', 'name', 'photos']
      }]
    });
    
    // Add attendance status
    const eventsWithStatus = events.map(event => {
      const eventData = event.toJSON();
      eventData.isAttending = event.attendees.includes(userId);
      eventData.isHost = event.hostId === userId;
      return eventData;
    });
    
    res.json({
      success: true,
      events: eventsWithStatus
    });
  } catch (error) {
    logger.error('Get events error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve events' 
    });
  }
});

// Create new event
router.post('/', async (req, res) => {
  try {
    const {
      title,
      type,
      description,
      location,
      date,
      maxAttendees,
      tags,
      vibeCheck
    } = req.body;
    
    const user = await User.findByPk(req.user.id);
    
    // Check if user can create premium events
    const isPremium = ['premium', 'elite'].includes(user.subscriptionType);
    
    const event = await Event.create({
      hostId: req.user.id,
      title,
      type,
      description,
      location,
      date: new Date(date),
      maxAttendees: maxAttendees || 20,
      tags: tags || [],
      vibeCheck: vibeCheck || {},
      isPremium: isPremium && req.body.isPremium,
      attendees: [req.user.id],
      currentAttendees: 1
    });
    
    logger.info('Event created', { 
      eventId: event.id, 
      hostId: req.user.id,
      type 
    });
    
    res.json({
      success: true,
      event
    });
  } catch (error) {
    logger.error('Create event error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create event' 
    });
  }
});

// Join event
router.post('/:eventId/join', async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;
    
    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }
    
    if (event.currentAttendees >= event.maxAttendees) {
      return res.status(400).json({
        success: false,
        error: 'Event is full'
      });
    }
    
    if (event.attendees.includes(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Already attending this event'
      });
    }
    
    event.attendees = [...event.attendees, userId];
    event.currentAttendees += 1;
    await event.save();
    
    res.json({
      success: true,
      message: 'Successfully joined event'
    });
  } catch (error) {
    logger.error('Join event error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to join event' 
    });
  }
});

// Leave event
router.post('/:eventId/leave', async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;
    
    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }
    
    if (event.hostId === userId) {
      return res.status(400).json({
        success: false,
        error: 'Host cannot leave their own event'
      });
    }
    
    if (!event.attendees.includes(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Not attending this event'
      });
    }
    
    event.attendees = event.attendees.filter(id => id !== userId);
    event.currentAttendees -= 1;
    await event.save();
    
    res.json({
      success: true,
      message: 'Successfully left event'
    });
  } catch (error) {
    logger.error('Leave event error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to leave event' 
    });
  }
});

// Get event details with attendees
router.get('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;
    
    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }
    
    // Get attendee details
    const attendees = await User.findAll({
      where: { id: { [Op.in]: event.attendees } },
      attributes: ['id', 'name', 'photos', 'bio', 'interests']
    });
    
    const eventData = event.toJSON();
    eventData.attendeeDetails = attendees;
    eventData.isAttending = event.attendees.includes(userId);
    eventData.isHost = event.hostId === userId;
    
    res.json({
      success: true,
      event: eventData
    });
  } catch (error) {
    logger.error('Get event details error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve event details' 
    });
  }
});

// Get foam party events specifically
router.get('/foam-parties', async (req, res) => {
  try {
    const events = await Event.findAll({
      where: {
        type: 'foam_party',
        status: { [Op.in]: ['upcoming', 'ongoing'] }
      },
      order: [['date', 'ASC']],
      limit: 10
    });
    
    res.json({
      success: true,
      foamParties: events
    });
  } catch (error) {
    logger.error('Get foam parties error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve foam parties' 
    });
  }
});

module.exports = router;