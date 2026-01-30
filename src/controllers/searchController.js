const Post = require('../models/Post');
const Event = require('../models/Event');
const Category = require('../models/Category');
const asyncHandler = require('../middleware/async');

// @desc    Global search
// @route   GET /api/v1/search
// @access  Public
exports.globalSearch = asyncHandler(async (req, res, next) => {
    const query = req.query.q;

    if (!query) {
        return res.status(200).json({ success: true, data: [] });
    }

    // Search Posts
    const posts = await Post.find(
        { $text: { $search: query }, status: 'published' },
        { score: { $meta: 'textScore' } }
    )
        .sort({ score: { $meta: 'textScore' } })
        .limit(5)
        .populate('category', 'name slug');

    // Search Events
    const events = await Event.find(
        { $text: { $search: query }, status: 'published' },
        { score: { $meta: 'textScore' } }
    )
        .sort({ score: { $meta: 'textScore' } })
        .limit(5);

    // Search Categories
    const categories = await Category.find(
        { $text: { $search: query }, isActive: true },
        { score: { $meta: 'textScore' } }
    )
        .sort({ score: { $meta: 'textScore' } })
        .limit(5);

    res.status(200).json({
        success: true,
        data: {
            posts,
            events,
            categories
        }
    });
});
