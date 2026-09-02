const express = require('express');
const router = express.Router();
const {
  getCourseAttendance,
  markAttendance,
  getStudentAttendanceSummary,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/course/:courseId')
  .get(protect, getCourseAttendance)
  .post(protect, authorize('admin', 'teacher'), markAttendance);

router.route('/student/:studentId')
  .get(protect, getStudentAttendanceSummary);

module.exports = router;
