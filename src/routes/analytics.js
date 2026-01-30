const express = require('express');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Basic analytics route - can be expanded as needed
router.get('/', (req, res) => {
  res.status(200).json({ success: true, data: 'Analytics route working' });
});

module.exports = router;
