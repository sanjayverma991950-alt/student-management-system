const express = require('express');
const router = express.Router();
const {
  getAllCourses,
  getSystemCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollStudent,
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getAllCourses)
  .post(protect, authorize('admin', 'teacher'), createCourse);

router.route('/all')
  .get(protect, getSystemCourses);

router.route('/:id')
  .get(protect, getCourseById)
  .put(protect, authorize('admin', 'teacher'), updateCourse)
  .delete(protect, authorize('admin', 'teacher'), deleteCourse);

router.route('/:id/enroll')
  .post(protect, enrollStudent);

module.exports = router;
