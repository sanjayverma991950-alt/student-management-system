const express = require('express');
const router = express.Router();
const {
  getAllStudents,
  getStudentById,
  updateStudentProfile,
  deleteStudent,
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, authorize('admin', 'teacher'), getAllStudents);

router.route('/:id')
  .get(protect, getStudentById)
  .put(protect, updateStudentProfile)
  .delete(protect, authorize('admin'), deleteStudent);

module.exports = router;
