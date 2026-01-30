
// @desc    Get featured posts
// @route   GET /api/v1/posts/featured
// @access  Public
exports.getFeaturedPosts = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 5;
        const posts = await Post.find({ status: 'published', featured: true })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('author', 'name profileImage')
            .populate('category', 'name slug');

        res.status(200).json({ success: true, data: posts });
    } catch (err) {
        next(err);
    }
};


// @desc    Increment post view count
// @route   POST /api/v1/posts/:id/view
// @access  Public
exports.incrementPostView = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return next(new ErrorResponse('Post not found', 404));
        }

        await post.incrementViewCount();

        res.status(200).json({ success: true, count: post.viewCount });
    } catch (err) {
        next(err);
    }
};
