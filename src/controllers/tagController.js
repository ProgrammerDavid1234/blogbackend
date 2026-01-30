const Tag = require('../models/Tag');
const Post = require('../models/Post');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all tags
// @route   GET /api/v1/tags
// @access  Public
exports.getTags = asyncHandler(async (req, res, next) => {
  const tags = await Tag.find().sort({ name: 1 });

  res.status(200).json({
    success: true,
    count: tags.length,
    data: tags
  });
});

// @desc    Get single tag
// @route   GET /api/v1/tags/:slug
// @access  Public
exports.getTag = asyncHandler(async (req, res, next) => {
  const tag = await Tag.findOne({ slug: req.params.slug });

  if (!tag) {
    return next(new ErrorResponse('Tag not found', 404));
  }

  res.status(200).json({
    success: true,
    data: tag
  });
});

// @desc    Get posts by tag
// @route   GET /api/v1/tags/:slug/posts
// @access  Public
exports.getPostsByTag = asyncHandler(async (req, res, next) => {
  const tag = await Tag.findOne({ slug: req.params.slug });

  if (!tag) {
    return next(new ErrorResponse('Tag not found', 404));
  }

  // Find posts that have this tag name in their tags array
  // Assuming Post model stores tag names as strings in 'tags' array
  const posts = await Post.find({
    tags: tag.name,
    status: 'published'
  })
    .sort({ publishedAt: -1 })
    .populate('author', 'name profileImage')
    .populate('category', 'name slug');

  res.status(200).json({
    success: true,
    count: posts.length,
    data: posts
  });
});

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
