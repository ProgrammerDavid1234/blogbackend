const Comment = require('../models/Comment');
const Post = require('../models/Post');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all comments
// @route   GET /api/v1/comments
// @access  Public
exports.getComments = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single comment
// @route   GET /api/v1/comments/:id
// @access  Public
exports.getComment = asyncHandler(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id)
    .populate({
      path: 'post',
      select: 'title slug'
    })
    .populate({
      path: 'user',
      select: 'name avatar'
    });

  if (!comment) {
    return next(
      new ErrorResponse(`No comment found with the id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: comment
  });
});

// @desc    Get comments by post
// @route   GET /api/v1/comments/post/:postId
// @access  Public
exports.getCommentsByPost = asyncHandler(async (req, res, next) => {
  const comments = await Comment.find({ post: req.params.postId })
    .populate({
      path: 'user',
      select: 'name avatar'
    })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: comments.length,
    data: comments
  });
});

// @desc    Get comments by user
// @route   GET /api/v1/comments/user/:userId
// @access  Public
exports.getCommentsByUser = asyncHandler(async (req, res, next) => {
  const comments = await Comment.find({ user: req.params.userId })
    .populate({
      path: 'post',
      select: 'title slug'
    })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: comments.length,
    data: comments
  });
});

// @desc    Add comment
// @route   POST /api/v1/comments
// @access  Private
exports.addComment = asyncHandler(async (req, res, next) => {
  // Add user to req.body if user is logged in
  if (req.user) {
    req.body.user = req.user.id;
  }

  const post = await Post.findById(req.body.post);

  if (!post) {
    return next(
      new ErrorResponse(`No post with the id of ${req.body.post}`, 404)
    );
  }

  const comment = await Comment.create(req.body);

  // Populate user and post
  await comment.populate({
    path: 'user',
    select: 'name avatar'
  });
  await comment.populate({
    path: 'post',
    select: 'title slug'
  });

  res.status(201).json({
    success: true,
    data: comment
  });
});

// @desc    Update comment
// @route   PUT /api/v1/comments/:id
// @access  Private
exports.updateComment = asyncHandler(async (req, res, next) => {
  let comment = await Comment.findById(req.params.id);

  if (!comment) {
    return next(
      new ErrorResponse(`No comment with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is comment owner or admin
  if (comment.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this comment`,
        401
      )
    );
  }

  // Update fields
  const { content, isApproved } = req.body;

  if (content) comment.content = content;
  if (typeof isApproved !== 'undefined' && req.user.role === 'admin') {
    comment.isApproved = isApproved;
  }

  await comment.save();

  res.status(200).json({
    success: true,
    data: comment
  });
});

// @desc    Delete comment
// @route   DELETE /api/v1/comments/:id
// @access  Private
exports.deleteComment = asyncHandler(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return next(
      new ErrorResponse(`No comment with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is comment owner or admin
  if (comment.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this comment`,
        401
      )
    );
  }

  await comment.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});
