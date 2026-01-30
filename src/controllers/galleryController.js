const GalleryItem = require('../models/GalleryItem');
const asyncHandler = require('../middleware/async');

// @desc    Get gallery items
// @route   GET /api/v1/gallery
// @access  Public
exports.getGallery = asyncHandler(async (req, res, next) => {
    const gallery = await GalleryItem.find()
        .sort({ createdAt: -1 })
        .populate('event', 'title slug'); // Optional population if related to event

    res.status(200).json({
        success: true,
        count: gallery.length,
        data: gallery
    });
});
