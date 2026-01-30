const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getCategories,
  getCategoryTree,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { getPostsByCategorySlug } = require('../controllers/postController');

const router = express.Router();

// Public
router.get('/', getCategories);
router.get('/tree', getCategoryTree);
router.get('/:slug/posts', getPostsByCategorySlug);

// Admin
router.post('/', protect, authorize('admin'), createCategory);
router.put('/:id', protect, authorize('admin'), updateCategory);
router.delete('/:id', protect, authorize('admin'), deleteCategory);

module.exports = router;

