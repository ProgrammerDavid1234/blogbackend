
// @desc    Upload gallery item
// @route   POST /api/v1/gallery
// @access  Private/Admin
exports.uploadGalleryItem = asyncHandler(async (req, res, next) => {
    // Assuming file upload middleware (like multer) puts file in req.file 
    // and we have a utility to handle upload to cloud/local storage returning a URL
    // For now, we expect 'imageUrl' in body or handle simplified logic if file is present

    // Note: The actual file upload logic using multer should be in the route
    // and here we just save the metadata.

    if (!req.body.imageUrl && !req.file) {
        return next(new ErrorResponse('Please add an image', 400));
    }

    // If a file was uploaded by middleware, user req.file.path or similar
    if (req.file) {
        req.body.imageUrl = `/uploads/${req.file.filename}`;
    }

    const galleryItem = await GalleryItem.create({
        ...req.body,
        uploadedBy: req.user._id
    });

    res.status(201).json({
        success: true,
        data: galleryItem
    });
});

// @desc    Delete gallery item
// @route   DELETE /api/v1/gallery/:id
// @access  Private/Admin
exports.deleteGalleryItem = asyncHandler(async (req, res, next) => {
    const galleryItem = await GalleryItem.findById(req.params.id);

    if (!galleryItem) {
        return next(new ErrorResponse('Gallery item not found', 404));
    }

    await galleryItem.remove();

    res.status(200).json({
        success: true,
        data: {}
    });
});
