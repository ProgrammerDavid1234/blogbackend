const Tag = require('../models/Tag');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all tags
// @route   GET /api/v1/tags
// @access  Public
exports.getTags = async (req, res, next) => {
  try {
    const tags = await Tag.find().sort({ name: 1 });
    res.status(200).json({ success: true, data: tags });
  } catch (err) {
    next(err);
  }
};

// @desc    Create tag
// @route   POST /api/v1/tags
// @access  Private/Admin
exports.createTag = async (req, res, next) => {
  try {
    const existing = await Tag.findOne({ name: req.body.name.trim() });
    if (existing) return next(new ErrorResponse('Tag already exists', 400));

    const tag = await Tag.create({
      ...req.body,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: tag });
  } catch (err) {
    next(err);
  }
};

// @desc    Update tag
// @route   PUT /api/v1/tags/:id
// @access  Private/Admin
exports.updateTag = async (req, res, next) => {
  try {
    const tag = await Tag.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user._id },
      { new: true, runValidators: true }
    );
    if (!tag) return next(new ErrorResponse('Tag not found', 404));
    res.status(200).json({ success: true, data: tag });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete tag
// @route   DELETE /api/v1/tags/:id
// @access  Private/Admin
exports.deleteTag = async (req, res, next) => {
  try {
    const tag = await Tag.findById(req.params.id);
    if (!tag) return next(new ErrorResponse('Tag not found', 404));

    await tag.remove();
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
