const express = require('express');
const { getGallery, uploadGalleryItem, deleteGalleryItem } = require('../controllers/galleryController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload'); // Assuming this exists or I need to create it

const router = express.Router();

router.get('/', getGallery);

// Admin routes
router.post('/', protect, authorize('admin'), upload.single('image'), uploadGalleryItem);
router.delete('/:id', protect, authorize('admin'), deleteGalleryItem);

module.exports = router;
