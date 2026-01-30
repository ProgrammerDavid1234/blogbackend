
// @desc    Create tag
// @route   POST /api/v1/tags
// @access  Private/Admin
exports.createTag = asyncHandler(async (req, res, next) => {
    const tag = await Tag.create({
        ...req.body,
        createdBy: req.user._id
    });

    res.status(201).json({
        success: true,
        data: tag
    });
});

// @desc    Update tag
// @route   PUT /api/v1/tags/:id
// @access  Private/Admin
exports.updateTag = asyncHandler(async (req, res, next) => {
    let tag = await Tag.findById(req.params.id);

    if (!tag) {
        return next(new ErrorResponse('Tag not found', 404));
    }

    tag = await Tag.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: tag
    });
});

// @desc    Delete tag
// @route   DELETE /api/v1/tags/:id
// @access  Private/Admin
exports.deleteTag = asyncHandler(async (req, res, next) => {
    const tag = await Tag.findById(req.params.id);

    if (!tag) {
        return next(new ErrorResponse('Tag not found', 404));
    }

    await tag.remove();

    res.status(200).json({
        success: true,
        data: {}
    });
});
