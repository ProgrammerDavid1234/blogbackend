const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getPosts,
  getPost,
  getRecentPosts,
  getPopularPosts,
  getRelatedPosts,
  createPost,
  updatePost,
  deletePost,
  getPostsByCategorySlug,
} = require('../controllers/postController');

const router = express.Router();

// Public
router.get('/', getPosts);
router.get('/recent', getRecentPosts);
router.get('/popular', getPopularPosts);
router.get('/:id/related', getRelatedPosts);
router.get('/:idOrSlug', getPost);

// Admin/Publisher
router.post('/', protect, authorize('admin', 'publisher'), createPost);
router.put('/:id', protect, authorize('admin', 'publisher'), updatePost);
router.delete('/:id', protect, authorize('admin', 'publisher'), deletePost);

module.exports = router;
