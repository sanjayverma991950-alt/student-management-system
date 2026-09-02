const express = require('express');
const router = express.Router();
const { analyzePerformance, chatStudyBuddy } = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/analyze/:studentId', protect, authorize('admin', 'teacher'), analyzePerformance);
router.post('/chat', protect, chatStudyBuddy);

module.exports = router;
