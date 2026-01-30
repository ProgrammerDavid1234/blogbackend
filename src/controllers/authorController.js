const User = require('../models/User');
const Post = require('../models/Post');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all authors
// @route   GET /api/v1/authors
// @access  Public
exports.getAuthors = asyncHandler(async (req, res, next) => {
    const users = await User.find({ role: { $in: ['admin', 'publisher'] } })
        .select('name bio profileImage social role')
        .sort({ name: 1 });

    res.status(200).json({
        success: true,
        count: users.length,
        data: users
    });
});

// @desc    Get single author
// @route   GET /api/v1/authors/:id
// @access  Public
exports.getAuthor = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id)
        .select('name bio profileImage social role createdAt');

    if (!user) {
        return next(new ErrorResponse('Author not found', 404));
    }

    // Get posts by author
    const posts = await Post.find({ author: req.params.id, status: 'published' })
        .sort({ publishedAt: -1 })
        .populate('category', 'name slug');

    res.status(200).json({
        success: true,
        data: {
            ...user.toObject(),
            posts
        }
    });
});
