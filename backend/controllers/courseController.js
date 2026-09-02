const Course = require('../models/Course');
const User = require('../models/User');

// @desc    Get all courses (filtered by user role)
// @route   GET /api/courses
// @access  Private
const getAllCourses = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'teacher') {
      query = { teacher: req.user._id };
    } else if (req.user.role === 'student') {
      query = { students: req.user._id };
    }

    const courses = await Course.find(query)
      .populate('teacher', 'name email')
      .populate('students', 'name email');

    res.status(200).json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all courses in the system (for enrollment options)
// @route   GET /api/courses/all
// @access  Private
const getSystemCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('teacher', 'name email')
      .populate('students', 'name email');
    res.status(200).json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single course details
// @route   GET /api/courses/:id
// @access  Private
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacher', 'name email')
      .populate('students', 'name email');

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    res.status(200).json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new course
// @route   POST /api/courses
// @access  Private (Admin, Teacher)
const createCourse = async (req, res) => {
  const { name, code, description, teacherId } = req.body;

  try {
    const courseExists = await Course.findOne({ code });
    if (courseExists) {
      return res.status(400).json({ success: false, message: 'Course code already exists' });
    }

    // Set teacher: if admin, check teacherId in body, else current teacher user ID
    let teacher = req.user._id;
    if (req.user.role === 'admin' && teacherId) {
      teacher = teacherId;
    }

    const course = await Course.create({
      name,
      code,
      description,
      teacher,
    });

    res.status(201).json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Admin, Teacher)
const updateCourse = async (req, res) => {
  const { name, code, description, teacherId } = req.body;

  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check permissions
    if (req.user.role === 'teacher' && course.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this course' });
    }

    if (name) course.name = name;
    if (code) course.code = code;
    if (description) course.description = description;
    if (req.user.role === 'admin' && teacherId) {
      course.teacher = teacherId;
    }

    await course.save();
    res.status(200).json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Admin, Teacher)
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check permissions
    if (req.user.role === 'teacher' && course.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this course' });
    }

    await Course.findByIdAndDelete(course._id);
    res.status(200).json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Enroll student in course
// @route   POST /api/courses/:id/enroll
// @access  Private
const enrollStudent = async (req, res) => {
  const { studentEmail } = req.body;

  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Find student by email
    let studentId;
    if (studentEmail) {
      const student = await User.findOne({ email: studentEmail, role: 'student' });
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found with this email' });
      }
      studentId = student._id;
    } else {
      // If student is logged in, they can enroll themselves
      if (req.user.role === 'student') {
        studentId = req.user._id;
      } else {
        return res.status(400).json({ success: false, message: 'Please provide a student email' });
      }
    }

    // Check if already enrolled
    if (course.students.includes(studentId)) {
      return res.status(400).json({ success: false, message: 'Student already enrolled in this course' });
    }

    course.students.push(studentId);
    await course.save();

    res.status(200).json({ success: true, data: course, message: 'Student enrolled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllCourses,
  getSystemCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollStudent,
};
