const Attendance = require('../models/Attendance');
const Course = require('../models/Course');

// @desc    Get attendance for a course
// @route   GET /api/attendance/course/:courseId
// @access  Private
const getCourseAttendance = async (req, res) => {
  const { courseId } = req.params;

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    let query = { course: courseId };
    
    // Students can only see their own records
    if (req.user.role === 'student') {
      query.student = req.user._id;
    }

    const attendanceRecords = await Attendance.find(query)
      .populate('student', 'name email')
      .sort({ date: -1 });

    res.status(200).json({ success: true, data: attendanceRecords });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Bulk mark attendance for a course on a date
// @route   POST /api/attendance/course/:courseId
// @access  Private (Admin, Teacher)
const markAttendance = async (req, res) => {
  const { courseId } = req.params;
  const { date, records } = req.body; // records: [{ studentId, status: 'Present' | 'Absent' | 'Late' }]

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (!date || !records || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Please provide a date and records array' });
    }

    // Convert date string to standard start-of-day date to avoid timezone offset mismatches
    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    const savedRecords = [];

    for (let record of records) {
      const { studentId, status } = record;

      // Upsert record: update if existing student+course+date combination, else create new
      const attendance = await Attendance.findOneAndUpdate(
        { student: studentId, course: courseId, date: attendanceDate },
        { status },
        { new: true, upsert: true }
      );
      savedRecords.push(attendance);
    }

    res.status(200).json({
      success: true,
      message: 'Attendance saved successfully',
      data: savedRecords,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student attendance summary across all enrolled courses
// @route   GET /api/attendance/student/:studentId
// @access  Private
const getStudentAttendanceSummary = async (req, res) => {
  const { studentId } = req.params;

  try {
    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const records = await Attendance.find({ student: studentId }).populate('course', 'name code');

    // Group by course to calculate percentage
    const summary = {};
    records.forEach((record) => {
      const courseId = record.course._id.toString();
      if (!summary[courseId]) {
        summary[courseId] = {
          courseName: record.course.name,
          courseCode: record.course.code,
          present: 0,
          absent: 0,
          late: 0,
          total: 0,
        };
      }

      summary[courseId].total += 1;
      if (record.status === 'Present') summary[courseId].present += 1;
      else if (record.status === 'Absent') summary[courseId].absent += 1;
      else if (record.status === 'Late') summary[courseId].late += 1;
    });

    // Calculate rates
    const data = Object.keys(summary).map((key) => {
      const item = summary[key];
      // Late counts as 0.5 present in standard attendance systems or full present. Let's count Late as present but log it.
      const attended = item.present + item.late;
      const rate = item.total > 0 ? Math.round((attended / item.total) * 100) : 100;
      return {
        courseId: key,
        ...item,
        attendanceRate: rate,
      };
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCourseAttendance,
  markAttendance,
  getStudentAttendanceSummary,
};
