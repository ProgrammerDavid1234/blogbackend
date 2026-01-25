const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getTags,
  createTag,
  updateTag,
  deleteTag,
} = require('../controllers/tagController');

const router = express.Router();

// Public
router.get('/', getTags);

// Admin only
router.post('/', protect, authorize('admin'), createTag);
router.put('/:id', protect, authorize('admin'), updateTag);
router.delete('/:id', protect, authorize('admin'), deleteTag);

module.exports = router;
