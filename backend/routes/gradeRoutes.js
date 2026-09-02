const express = require('express');
const router = express.Router();
const {
  getCourseGrades,
  getStudentGradesSummary,
  addOrUpdateGrade,
  deleteGrade,
} = require('../controllers/gradeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, authorize('admin', 'teacher'), addOrUpdateGrade);

router.route('/course/:courseId')
  .get(protect, getCourseGrades);

router.route('/student/:studentId')
  .get(protect, getStudentGradesSummary);

router.route('/:id')
  .delete(protect, authorize('admin', 'teacher'), deleteGrade);

module.exports = router;
