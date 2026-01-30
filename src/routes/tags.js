const express = require('express');
const { getTags, getTag, getPostsByTag } = require('../controllers/tagController');

const router = express.Router();

router.get('/', getTags);
router.get('/:slug', getTag);
router.get('/:slug/posts', getPostsByTag);

module.exports = router;
