const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const ErrorResponse = require('../utils/errorResponse');

// Build base query for events with filters
const buildEventQuery = (queryParams = {}) => {
  const query = { status: 'published' };

  if (queryParams.category) query.category = queryParams.category;
  if (queryParams.organizer) query.organizer = queryParams.organizer;

  if (queryParams.startDate || queryParams.endDate) {
    query.startDate = {};
    if (queryParams.startDate) query.startDate.$gte = new Date(queryParams.startDate);
    if (queryParams.endDate) query.startDate.$lte = new Date(queryParams.endDate);
  }

  if (queryParams.q) {
    query.$text = { $search: queryParams.q };
  }

  return query;
};

// @desc    Get events (default upcoming)
// @route   GET /api/v1/events
// @access  Public
exports.getEvents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = buildEventQuery(req.query);

    // upcoming or past filter
    const now = new Date();
    if (req.query.when === 'past') {
      query.endDate = { ...(query.endDate || {}), $lt: now };
    } else {
      query.startDate = { ...(query.startDate || {}), $gte: now };
    }

    const sort = { startDate: 1 };

    const [events, total] = await Promise.all([
      Event.find(query)
        .skip(skip)
        .limit(limit)
        .sort(sort),
      Event.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: events.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: events,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get upcoming events
// @route   GET /api/v1/events/upcoming
// @access  Public
exports.getUpcomingEvents = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 5;
    const events = await Event.getUpcomingEvents(limit);
    res.status(200).json({ success: true, data: events });
  } catch (err) {
    next(err);
  }
};

// @desc    Get past events
// @route   GET /api/v1/events/past
// @access  Public
exports.getPastEvents = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const events = await Event.getPastEvents(limit);
    res.status(200).json({ success: true, data: events });
  } catch (err) {
    next(err);
  }
};

// @desc    Get event details by id or slug
// @route   GET /api/v1/events/:idOrSlug
// @access  Public
exports.getEvent = async (req, res, next) => {
  try {
    const param = req.params.idOrSlug;
    const isObjectId = param.match(/^[0-9a-fA-F]{24}$/);

    const query = isObjectId ? { _id: param } : { slug: param };

    const event = await Event.findOne(query).populate('organizer', 'name profileImage');

    if (!event || event.status !== 'published') {
      return next(new ErrorResponse('Event not found', 404));
    }

    res.status(200).json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
};

// @desc    Get calendar feed (simple JSON)
// @route   GET /api/v1/events/calendar
// @access  Public
exports.getCalendarFeed = async (req, res, next) => {
  try {
    const events = await Event.find({ status: 'published' }).sort({ startDate: 1 });

    const items = events.map((e) => ({
      id: e._id,
      title: e.title,
      start: e.startDate,
      end: e.endDate,
      allDay: false,
      location: e.location?.venue,
      category: e.category,
      slug: e.slug,
    }));

    res.status(200).json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
};

// @desc    Create event
// @route   POST /api/v1/events
// @access  Private/Admin
exports.createEvent = async (req, res, next) => {
  try {
    const data = {
      ...req.body,
      organizer: req.body.organizer || req.user._id,
      createdBy: req.user._id,
    };

    const event = await Event.create(data);

    res.status(201).json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
};

// @desc    Update event
// @route   PUT /api/v1/events/:id
// @access  Private/Admin
exports.updateEvent = async (req, res, next) => {
  try {
    const data = {
      ...req.body,
      updatedBy: req.user._id,
    };

    const event = await Event.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });

    if (!event) return next(new ErrorResponse('Event not found', 404));

    res.status(200).json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete event
// @route   DELETE /api/v1/events/:id
// @access  Private/Admin
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return next(new ErrorResponse('Event not found', 404));

    await event.remove();

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

// @desc    Register current user for event
// @route   POST /api/v1/events/:id/register
// @access  Private
exports.registerForEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event || event.status !== 'published') {
      return next(new ErrorResponse('Event not found', 404));
    }

    if (!event.isRegistrationOpen()) {
      return next(new ErrorResponse('Registration is closed for this event', 400));
    }

    const existing = await EventRegistration.findOne({
      event: event._id,
      user: req.user._id,
      status: { $ne: 'cancelled' },
    });

    if (existing) {
      return next(new ErrorResponse('You are already registered for this event', 400));
    }

    const registration = await EventRegistration.create({
      event: event._id,
      user: req.user._id,
      status: 'confirmed',
    });

    // Socket.io notification hook
    const io = req.app.get('io');
    if (io) {
      io.emit('event:registered', {
        eventId: event._id,
        userId: req.user._id,
      });
    }

    res.status(201).json({ success: true, data: registration });
  } catch (err) {
    next(err);
  }
};

// @desc    Unregister current user from event
// @route   POST /api/v1/events/:id/unregister
// @access  Private
exports.unregisterFromEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event || event.status !== 'published') {
      return next(new ErrorResponse('Event not found', 404));
    }

    const registration = await EventRegistration.findOne({
      event: event._id,
      user: req.user._id,
      status: { $ne: 'cancelled' },
    });

    if (!registration) {
      return next(new ErrorResponse('You are not registered for this event', 400));
    }

    registration.status = 'cancelled';
    await registration.save();

    res.status(200).json({ success: true, data: registration });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current user's registration for event
// @route   GET /api/v1/events/:id/registrations/me
// @access  Private
exports.getMyRegistration = async (req, res, next) => {
  try {
    const registration = await EventRegistration.findOne({
      event: req.params.id,
      user: req.user._id,
      status: { $ne: 'cancelled' },
    });

    res.status(200).json({ success: true, data: registration });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all registrations for an event (admin)
// @route   GET /api/v1/events/:id/registrations
// @access  Private/Admin
exports.getEventRegistrations = async (req, res, next) => {
  try {
    const registrations = await EventRegistration.find({ event: req.params.id })
      .populate('user', 'name email');

    res.status(200).json({ success: true, data: registrations });
  } catch (err) {
    next(err);
  }
};

// @desc    Get event analytics (RSVP stats)
// @route   GET /api/v1/events/:id/stats
// @access  Private/Admin
exports.getEventStats = async (req, res, next) => {
  try {
    const stats = await EventRegistration.getRegistrationStats(req.params.id);
    res.status(200).json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};
