const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getEvents,
  getUpcomingEvents,
  getPastEvents,
  getEvent,
  getCalendarFeed,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  unregisterFromEvent,
  getMyRegistration,
  getEventRegistrations,
  getEventStats,
} = require('../controllers/eventController');

const router = express.Router();

// Public
router.get('/', getEvents);
router.get('/upcoming', getUpcomingEvents);
router.get('/past', getPastEvents);
router.get('/calendar', getCalendarFeed);
router.get('/:idOrSlug', getEvent);

// User registration
router.post('/:id/register', protect, registerForEvent);
router.post('/:id/unregister', protect, unregisterFromEvent);
router.get('/:id/registrations/me', protect, getMyRegistration);

// Admin
router.post('/', protect, authorize('admin'), createEvent);
router.put('/:id', protect, authorize('admin'), updateEvent);
router.delete('/:id', protect, authorize('admin'), deleteEvent);
router.get('/:id/registrations', protect, authorize('admin'), getEventRegistrations);
router.get('/:id/stats', protect, authorize('admin'), getEventStats);

module.exports = router;
