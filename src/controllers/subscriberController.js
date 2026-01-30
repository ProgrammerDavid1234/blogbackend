const Subscriber = require('../models/Subscriber');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Subscribe to newsletter
// @route   POST /api/v1/newsletter/subscribe
// @access  Public
exports.subscribe = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return next(new ErrorResponse('Please provide an email', 400));
    }

    // Check if already subscribed
    let subscriber = await Subscriber.findOne({ email });

    if (subscriber) {
        // If status is not 'subscribed', update it
        if (subscriber.status !== 'subscribed') {
            subscriber.status = 'subscribed';
            subscriber.subscribedAt = Date.now();
            await subscriber.save();
        }
        return res.status(200).json({ success: true, message: 'Already subscribed' });
    }

    // Crate new subscriber
    subscriber = await Subscriber.create({
        email,
        status: 'subscribed',
        source: 'website'
    });

    res.status(201).json({
        success: true,
        data: subscriber
    });
});
