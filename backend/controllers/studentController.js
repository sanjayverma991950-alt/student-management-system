const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');

// @desc    Get all students
// @route   GET /api/students
// @access  Private (Admin, Teacher)
const getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    const profiles = await StudentProfile.find().populate('user', 'name email');

    // Combine users and profiles
    const combined = students.map(student => {
      const profile = profiles.find(p => p.user && p.user._id.toString() === student._id.toString());
      return {
        _id: student._id,
        name: student.name,
        email: student.email,
        role: student.role,
        profile: profile || null
      };
    });

    res.status(200).json({ success: true, data: combined });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single student details
// @route   GET /api/students/:id
// @access  Private
const getStudentById = async (req, res) => {
  try {
    // If student is logged in, they can only view themselves
    if (req.user.role === 'student' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this profile' });
    }

    const student = await User.findById(req.params.id).select('-password');
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const profile = await StudentProfile.findOne({ user: student._id });

    res.status(200).json({
      success: true,
      data: {
        _id: student._id,
        name: student.name,
        email: student.email,
        profile,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update student profile
// @route   PUT /api/students/:id
// @access  Private
const updateStudentProfile = async (req, res) => {
  const { name, email, rollNumber, dateOfBirth, phone, address, guardianName, guardianPhone } = req.body;

  try {
    // Permission check: admin, teacher, or the student themselves
    if (req.user.role === 'student' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this profile' });
    }

    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Update User schema fields
    if (name) student.name = name;
    if (email) student.email = email;
    await student.save();

    // Update or Create StudentProfile
    let profile = await StudentProfile.findOne({ user: student._id });
    if (!profile) {
      profile = new StudentProfile({ user: student._id });
    }

    if (rollNumber) profile.rollNumber = rollNumber;
    if (dateOfBirth) profile.dateOfBirth = dateOfBirth;
    if (phone !== undefined) profile.phone = phone;
    if (address !== undefined) profile.address = address;
    if (guardianName !== undefined) profile.guardianName = guardianName;
    if (guardianPhone !== undefined) profile.guardianPhone = guardianPhone;

    await profile.save();

    res.status(200).json({
      success: true,
      data: {
        _id: student._id,
        name: student.name,
        email: student.email,
        profile,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete student profile and user
// @route   DELETE /api/students/:id
// @access  Private (Admin)
const deleteStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    await StudentProfile.findOneAndDelete({ user: student._id });
    await User.findByIdAndDelete(student._id);

    res.status(200).json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  updateStudentProfile,
  deleteStudent,
};
