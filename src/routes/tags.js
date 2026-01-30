const express = require('express');
const {
    getTags,
    getTag,
    getPostsByTag,
    createTag,
    updateTag,
    deleteTag
} = require('../controllers/tagController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', getTags);
router.get('/:slug', getTag);
router.get('/:slug/posts', getPostsByTag);

router.get('/:slug/posts', getPostsByTag);

// Admin routes
router.post('/', protect, authorize('admin'), createTag);
router.put('/:id', protect, authorize('admin'), updateTag);
router.delete('/:id', protect, authorize('admin'), deleteTag);

module.exports = router;
