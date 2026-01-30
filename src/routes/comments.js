const express = require('express');
const { check } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const {
  getComments,
  getComment,
  addComment,
  updateComment,
  deleteComment,
  getCommentsByPost,
  getCommentsByUser
} = require('../controllers/commentController');

const router = express.Router({ mergeParams: true });


// Public routes
router.get('/', getComments);
router.get('/:id', getComment);
router.get('/post/:postId', getCommentsByPost);
router.get('/user/:userId', getCommentsByUser);

// Protected routes (require authentication)
router.use(protect);

// Add comment validation
const commentValidation = [
  check('content', 'Please add a comment').not().isEmpty(),
  check('post', 'Post ID is required').not().isEmpty()
];

router.post('/', commentValidation, addComment);
router.put('/:id', updateComment);
router.delete('/:id', deleteComment);

// Admin only routes
router.use(authorize('admin'));
router.delete('/admin/:id', deleteComment);

module.exports = router;