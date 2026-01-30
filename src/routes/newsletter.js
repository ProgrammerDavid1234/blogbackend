const express = require('express');
const { subscribe } = require('../controllers/subscriberController');

const router = express.Router();

router.post('/subscribe', subscribe);

module.exports = router;
