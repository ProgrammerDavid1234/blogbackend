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
