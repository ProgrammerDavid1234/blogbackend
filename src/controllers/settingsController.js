const SiteSetting = require('../models/SiteSetting');
const asyncHandler = require('../middleware/async');

// @desc    Get site settings
// @route   GET /api/v1/settings
// @access  Public
exports.getSettings = asyncHandler(async (req, res, next) => {
    let settings = await SiteSetting.findOne();

    // If no settings exist, return defaults (or create one)
    if (!settings) {
        settings = new SiteSetting(); // Returns default values from schema
        // Optionally save it: await settings.save();
    }

    res.status(200).json({
        success: true,
        data: settings
    });
});

// @desc    Update site settings
// @route   PUT /api/v1/settings
// @access  Private/Admin
exports.updateSettings = asyncHandler(async (req, res, next) => {
    let settings = await SiteSetting.findOne();

    if (!settings) {
        // Create new
        settings = await SiteSetting.create({
            ...req.body,
            updatedBy: req.user._id
        });
    } else {
        // Update existing
        settings = await SiteSetting.findByIdAndUpdate(
            settings._id,
            { ...req.body, updatedBy: req.user._id },
            { new: true, runValidators: true }
        );
    }

    res.status(200).json({
        success: true,
        data: settings
    });
});
