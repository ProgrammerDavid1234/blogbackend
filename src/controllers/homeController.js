const Post = require('../models/Post');
const Event = require('../models/Event');
const Category = require('../models/Category');
const asyncHandler = require('../middleware/async');

// @desc    Get home page data (Trending, Featured, Latest, Announcements)
// @route   GET /api/v1/home
// @access  Public
exports.getHomeData = asyncHandler(async (req, res, next) => {
    // 1. Get Trending Posts (Most viewed, e.g., top 5)
    const trendingPosts = await Post.find({ status: 'published' })
        .sort({ viewCount: -1 })
        .limit(5)
        .populate('author', 'name profileImage')
        .populate('category', 'name slug');

    // 2. Get Featured Posts
    const featuredPosts = await Post.find({ status: 'published', featured: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('author', 'name profileImage')
        .populate('category', 'name slug');

    // 3. Get Latest Posts
    const latestPosts = await Post.find({ status: 'published' })
        .sort({ createdAt: -1 })
        .limit(6)
        .populate('author', 'name profileImage')
        .populate('category', 'name slug');

    // 4. Get Announcements
    // First find the 'Announcements' category
    const announcementCategory = await Category.findOne({
        $or: [{ name: 'Announcements' }, { slug: 'announcements' }]
    });

    let announcements = [];
    if (announcementCategory) {
        announcements = await Post.find({
            status: 'published',
            category: announcementCategory._id
        })
            .sort({ createdAt: -1 })
            .limit(3)
            .populate('author', 'name profileImage');
    }

    // 5. Get Upcoming Events
    const upcomingEvents = await Event.find({
        status: 'published',
        startDate: { $gte: new Date() }
    })
        .sort({ startDate: 1 })
        .limit(3);

    res.status(200).json({
        success: true,
        data: {
            trending: trendingPosts,
            featured: featuredPosts,
            latest: latestPosts,
            announcements: announcements,
            upcomingEvents: upcomingEvents
        }
    });
});
