const Grade = require('../models/Grade');
const Course = require('../models/Course');

// @desc    Get grades for a specific course
// @route   GET /api/grades/course/:courseId
// @access  Private
const getCourseGrades = async (req, res) => {
  const { courseId } = req.params;

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    let query = { course: courseId };

    // Students can only see their own grades
    if (req.user.role === 'student') {
      query.student = req.user._id;
    }

    const grades = await Grade.find(query)
      .populate('student', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: grades });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get grades summary for a student
// @route   GET /api/grades/student/:studentId
// @access  Private
const getStudentGradesSummary = async (req, res) => {
  const { studentId } = req.params;

  try {
    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const grades = await Grade.find({ student: studentId })
      .populate('course', 'name code')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: grades });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add or update a student's grade
// @route   POST /api/grades
// @access  Private (Admin, Teacher)
const addOrUpdateGrade = async (req, res) => {
  const { studentId, courseId, title, marksObtained, maxMarks, remarks } = req.body;

  try {
    if (!studentId || !courseId || !title || marksObtained === undefined || !maxMarks) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check teacher permission
    if (req.user.role === 'teacher' && course.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to grade for this course' });
    }

    // Upsert grade: search by student, course and title. Update marks if matches, or create.
    const grade = await Grade.findOneAndUpdate(
      { student: studentId, course: courseId, title },
      { marksObtained, maxMarks, remarks },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, data: grade, message: 'Grade saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a grade
// @route   DELETE /api/grades/:id
// @access  Private (Admin, Teacher)
const deleteGrade = async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id).populate('course');
    if (!grade) {
      return res.status(404).json({ success: false, message: 'Grade record not found' });
    }

    // Check teacher permission
    if (req.user.role === 'teacher' && grade.course.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Grade.findByIdAndDelete(grade._id);
    res.status(200).json({ success: true, message: 'Grade deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCourseGrades,
  getStudentGradesSummary,
  addOrUpdateGrade,
  deleteGrade,
};
