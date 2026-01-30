
// @desc    Toggle post featured status
// @route   PUT /api/v1/posts/:id/feature
// @access  Private/Admin
exports.toggleFeature = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return next(new ErrorResponse('Post not found', 404));

        post.featured = !post.featured;
        await post.save();

        res.status(200).json({ success: true, data: post });
    } catch (err) {
        next(err);
    }
};

// @desc    Toggle post trending status
// @route   PUT /api/v1/posts/:id/trending
// @access  Private/Admin
exports.toggleTrending = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return next(new ErrorResponse('Post not found', 404));

        post.trending = !post.trending;
        await post.save();

        res.status(200).json({ success: true, data: post });
    } catch (err) {
        next(err);
    }
};
