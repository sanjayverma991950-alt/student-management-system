const jwt = require('jsonwebtoken');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public (Can be restricted to Admin only, but we'll leave it public for easy testing or seed)
const registerUser = async (req, res) => {
  const { name, email, password, role, rollNumber, phone, address } = req.body;

  try {
    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
    });

    if (user) {
      // If student, create StudentProfile
      if (user.role === 'student') {
        const rollNo = rollNumber || `ROLL-${Date.now().toString().slice(-6)}`;
        await StudentProfile.create({
          user: user._id,
          rollNumber: rollNo,
          phone: phone || '',
          address: address || '',
        });
      }

      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password' });
    }

    // Check for user email
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      let profile = null;
      if (user.role === 'student') {
        profile = await StudentProfile.findOne({ user: user._id });
      }

      res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profile,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    let profile = null;
    if (user.role === 'student') {
      profile = await StudentProfile.findOne({ user: user._id });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Seed database with courses, attendance, grades for demo accounts
// @route   POST /api/auth/seed-dummy-data
// @access  Public
const seedDummyData = async (req, res) => {
  try {
    let admin = await User.findOne({ email: 'admin@school.com' });
    if (!admin) {
      admin = await User.create({
        name: 'Demo Admin',
        email: 'admin@school.com',
        password: 'admin123',
        role: 'admin',
      });
    }

    let teacher = await User.findOne({ email: 'teacher@school.com' });
    if (!teacher) {
      teacher = await User.create({
        name: 'Demo Teacher',
        email: 'teacher@school.com',
        password: 'teacher123',
        role: 'teacher',
      });
    }

    let student = await User.findOne({ email: 'student@school.com' });
    if (!student) {
      student = await User.create({
        name: 'Demo Student',
        email: 'student@school.com',
        password: 'student123',
        role: 'student',
      });
      await StudentProfile.findOneAndUpdate(
        { user: student._id },
        { user: student._id, rollNumber: 'ROLL-101', phone: '1234567890', address: '123 Main St, Tech City' },
        { upsert: true, new: true }
      );
    }

    // Import models
    const Course = require('../models/Course');
    const Grade = require('../models/Grade');
    const Attendance = require('../models/Attendance');

    // Remove any existing demo courses/grades/attendance to start fresh
    await Course.deleteMany({ code: { $in: ['CS101', 'WD202'] } });
    await Grade.deleteMany({ student: student._id });
    await Attendance.deleteMany({ student: student._id });

    // 1. Create courses
    const csCourse = await Course.create({
      name: 'Introduction to Computer Science',
      code: 'CS101',
      description: 'Foundational programming concepts, data structures, and algorithms.',
      teacher: teacher._id,
      students: [student._id]
    });

    const webCourse = await Course.create({
      name: 'Web Development Basics',
      code: 'WD202',
      description: 'Hands-on training in HTML, CSS, JavaScript, and React framework.',
      teacher: teacher._id,
      students: [student._id]
    });

    // 2. Add Grades
    await Grade.create([
      {
        student: student._id,
        course: csCourse._id,
        title: 'Midterm Exam',
        marksObtained: 85,
        maxMarks: 100,
        remarks: 'Excellent performance. Good logical thinking.'
      },
      {
        student: student._id,
        course: csCourse._id,
        title: 'Recursion Quiz',
        marksObtained: 18,
        maxMarks: 20,
        remarks: 'Great code optimization.'
      },
      {
        student: student._id,
        course: csCourse._id,
        title: 'Final Project',
        marksObtained: 92,
        maxMarks: 100,
        remarks: 'Splendid terminal-based RPG game implementation.'
      },
      {
        student: student._id,
        course: webCourse._id,
        title: 'HTML & CSS Assignment',
        marksObtained: 14,
        maxMarks: 20,
        remarks: 'Review layout box model principles.'
      },
      {
        student: student._id,
        course: webCourse._id,
        title: 'React Portfolio Project',
        marksObtained: 46,
        maxMarks: 50,
        remarks: 'Outstanding UI design and layout structure.'
      }
    ]);

    // 3. Add Attendance
    const today = new Date();
    const d1 = new Date(today); d1.setDate(today.getDate() - 4); d1.setUTCHours(0, 0, 0, 0);
    const d2 = new Date(today); d2.setDate(today.getDate() - 3); d2.setUTCHours(0, 0, 0, 0);
    const d3 = new Date(today); d3.setDate(today.getDate() - 2); d3.setUTCHours(0, 0, 0, 0);
    const d4 = new Date(today); d4.setDate(today.getDate() - 1); d4.setUTCHours(0, 0, 0, 0);
    const d5 = new Date(today); d5.setDate(today.getDate()); d5.setUTCHours(0, 0, 0, 0);

    await Attendance.create([
      { student: student._id, course: csCourse._id, date: d1, status: 'Present' },
      { student: student._id, course: csCourse._id, date: d2, status: 'Present' },
      { student: student._id, course: csCourse._id, date: d3, status: 'Absent' },
      { student: student._id, course: csCourse._id, date: d4, status: 'Late' },
      { student: student._id, course: csCourse._id, date: d5, status: 'Present' },

      { student: student._id, course: webCourse._id, date: d2, status: 'Present' },
      { student: student._id, course: webCourse._id, date: d3, status: 'Present' },
      { student: student._id, course: webCourse._id, date: d4, status: 'Present' },
      { student: student._id, course: webCourse._id, date: d5, status: 'Present' }
    ]);

    res.status(200).json({ success: true, message: 'Dummy courses, grades, and attendance logs seeded successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  seedDummyData,
};
