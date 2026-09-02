import { useEffect, useState } from 'react';
import axios from '../config/axios';
import { useAuth } from '../context/AuthContext';
import { CalendarDays, Save, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';

const Attendance = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  
  // Teacher/Admin states
  const [students, setStudents] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState({}); // { studentId: 'Present' | 'Absent' | 'Late' }
  
  // Student states
  const [studentHistory, setStudentHistory] = useState([]);
  const [studentSummary, setStudentSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await axios.get('/api/courses');
        const courseData = res.data.data;
        setCourses(courseData);

        if (courseData.length > 0) {
          setSelectedCourseId(courseData[0]._id);
        }

        if (user.role === 'student') {
          const sumRes = await axios.get(`/api/attendance/student/${user._id}`);
          setStudentSummary(sumRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load courses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [user]);

  // Load course details (enrolled students for teachers, or history for students)
  useEffect(() => {
    if (!selectedCourseId) return;

    const loadCourseDetails = async () => {
      setMsg(null);
      try {
        if (user.role !== 'student') {
          // Fetch student list for course
          const res = await axios.get(`/api/courses/${selectedCourseId}`);
          const enrolledStudents = res.data.data.students || [];
          setStudents(enrolledStudents);

          // Fetch attendance history for the course on the selected date to prepopulate
          const attRes = await axios.get(`/api/attendance/course/${selectedCourseId}`);
          const fetchedLogs = attRes.data.data || [];
          
          // Filter logs matching the selected date
          const selectedDateStr = new Date(attendanceDate).toDateString();
          const initialRecords = {};
          
          // Set default "Present" for all enrolled, then overwrite if logs exist
          enrolledStudents.forEach(s => {
            initialRecords[s._id] = 'Present';
          });

          fetchedLogs.forEach(log => {
            const logDateStr = new Date(log.date).toDateString();
            if (logDateStr === selectedDateStr && log.student) {
              initialRecords[log.student._id] = log.status;
            }
          });

          setRecords(initialRecords);
        } else {
          // Fetch logged student attendance history for selected course
          const res = await axios.get(`/api/attendance/course/${selectedCourseId}`);
          setStudentHistory(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load course details:', err);
      }
    };

    loadCourseDetails();
  }, [selectedCourseId, attendanceDate, user]);

  const handleStatusChange = (studentId, status) => {
    setRecords({
      ...records,
      [studentId]: status,
    });
  };

  const handleSaveAttendance = async () => {
    setMsg(null);
    try {
      const recordsArray = Object.keys(records).map(sid => ({
        studentId: sid,
        status: records[sid],
      }));

      await axios.post(`/api/attendance/course/${selectedCourseId}`, {
        date: attendanceDate,
        records: recordsArray,
      });

      setMsg({ type: 'success', text: 'Attendance logged successfully!' });
      setTimeout(() => setMsg(null), 3000);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save attendance' });
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  // Calculate current course attendance summary for student
  const currentCourseSummary = studentSummary?.find(item => item.courseId === selectedCourseId);

  return (
    <div className="space-y-6">
      {/* Course dropdown selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Select Course</label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="block w-64 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-primary-500 bg-white"
          >
            {courses.map(c => (
              <option key={c._id} value={c._id}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>
        </div>

        {user.role !== 'student' && (
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Attendance Date</label>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="block border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-primary-500 bg-white font-mono"
            />
          </div>
        )}
      </div>

      {msg && (
        <div className={`p-4 rounded-lg border text-sm flex items-center gap-2 ${
          msg.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {msg.type === 'success' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <AlertCircle className="h-5 w-5 text-red-500" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* TEACHER / ADMIN SCREEN: Grading attendance checklist */}
      {user.role !== 'student' && selectedCourseId && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary-500" />
              Checklist: {students.length} Enrolled Students
            </h4>
            <button
              onClick={handleSaveAttendance}
              className="inline-flex items-center gap-1.5 rounded bg-primary-600 hover:bg-primary-700 text-white px-4 py-1.5 text-xs font-bold transition-colors shadow"
            >
              <Save className="h-4 w-4" />
              Save Attendance
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50 text-gray-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="px-6 py-3">Student Name</th>
                  <th className="px-6 py-3">Email Address</th>
                  <th className="px-6 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {students.length > 0 ? (
                  students.map(student => (
                    <tr key={student._id} className="hover:bg-gray-50/20">
                      <td className="px-6 py-4 font-medium text-gray-900">{student.name}</td>
                      <td className="px-6 py-4 text-gray-500">{student.email}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-6">
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                            <input
                              type="radio"
                              name={`attendance-${student._id}`}
                              checked={records[student._id] === 'Present'}
                              onChange={() => handleStatusChange(student._id, 'Present')}
                              className="text-primary-600 focus:ring-primary-500"
                            />
                            <span className="font-semibold text-emerald-600">Present</span>
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                            <input
                              type="radio"
                              name={`attendance-${student._id}`}
                              checked={records[student._id] === 'Late'}
                              onChange={() => handleStatusChange(student._id, 'Late')}
                              className="text-primary-600 focus:ring-primary-500"
                            />
                            <span className="font-semibold text-amber-600">Late</span>
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                            <input
                              type="radio"
                              name={`attendance-${student._id}`}
                              checked={records[student._id] === 'Absent'}
                              onChange={() => handleStatusChange(student._id, 'Absent')}
                              className="text-primary-600 focus:ring-primary-500"
                            />
                            <span className="font-semibold text-rose-600">Absent</span>
                          </label>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center py-8 text-gray-400">
                      No students are enrolled in this course yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STUDENT SCREEN: Attendance stats & log history */}
      {user.role === 'student' && selectedCourseId && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Rate Summary Cards */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
              <h4 className="font-bold text-gray-800 text-sm">Attendance Summary</h4>
              {currentCourseSummary ? (
                <div className="space-y-4">
                  <div className="flex flex-col items-center">
                    <span className="text-5xl font-extrabold text-primary-600">{currentCourseSummary.attendanceRate}%</span>
                    <span className="text-xs text-gray-400 mt-1">Average Attendance</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-emerald-50 text-emerald-700 p-2 rounded">
                      <span className="block font-bold">{currentCourseSummary.present}</span>
                      <span>Present</span>
                    </div>
                    <div className="bg-amber-50 text-amber-700 p-2 rounded">
                      <span className="block font-bold">{currentCourseSummary.late}</span>
                      <span>Late</span>
                    </div>
                    <div className="bg-rose-50 text-rose-700 p-2 rounded">
                      <span className="block font-bold">{currentCourseSummary.absent}</span>
                      <span>Absent</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400">No attendance stats calculated.</p>
              )}
            </div>

            {currentCourseSummary?.attendanceRate < 75 && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 flex gap-2 text-xs">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                <div>
                  <p className="font-bold">Attendance Warning!</p>
                  <p className="mt-0.5">Your attendance is below the 75% system requirement. Make sure to attend all upcoming sessions to avoid academic penalties.</p>
                </div>
              </div>
            )}
          </div>

          {/* Calendar Log History */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-800 text-sm flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary-500" />
              Detailed Attendance Log
            </div>
            
            <div className="divide-y divide-gray-100 max-h-[350px] overflow-y-auto">
              {studentHistory.length > 0 ? (
                studentHistory.map(log => (
                  <div key={log._id} className="px-6 py-3 flex items-center justify-between text-sm">
                    <span className="font-mono text-gray-600">{new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    <span className={`px-2.5 py-0.5 rounded text-xs font-semibold uppercase ${
                      log.status === 'Present' ? 'bg-green-50 text-green-700 border border-green-150' :
                      log.status === 'Late' ? 'bg-amber-50 text-amber-700 border border-amber-150' :
                      'bg-rose-50 text-rose-700 border border-rose-150'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-400">
                  No attendance records found for this course.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
