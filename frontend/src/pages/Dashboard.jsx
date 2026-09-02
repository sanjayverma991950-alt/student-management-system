import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { BookOpen, Users, CalendarCheck, GraduationCap, ArrowRight, BrainCircuit } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    coursesCount: 0,
    studentsCount: 0,
    averageGrade: 'N/A',
    attendanceRate: 'N/A',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (user.role === 'admin' || user.role === 'teacher') {
          // Fetch student count and course count
          const [studentsRes, coursesRes] = await Promise.all([
            axios.get('/api/students'),
            axios.get('/api/courses'),
          ]);
          
          const students = studentsRes.data.data;
          const courses = coursesRes.data.data;

          setStats({
            coursesCount: courses.length,
            studentsCount: students.length,
            averageGrade: 'N/A',
            attendanceRate: 'N/A',
          });
        } else if (user.role === 'student') {
          // Fetch student attendance and grades summary
          const [coursesRes, gradesRes, attendanceRes] = await Promise.all([
            axios.get('/api/courses'),
            axios.get(`/api/grades/student/${user._id}`),
            axios.get(`/api/attendance/student/${user._id}`),
          ]);

          const coursesCount = coursesRes.data.data.length;
          
          // Calculate average grade
          const grades = gradesRes.data.data;
          const validGrades = grades.filter(g => g.maxMarks > 0);
          const averageGrade = validGrades.length > 0 
            ? Math.round(validGrades.reduce((sum, g) => sum + (g.marksObtained / g.maxMarks) * 100, 0) / validGrades.length)
            : 'N/A';

          // Calculate average attendance
          const attendance = attendanceRes.data.data;
          const averageAttendance = attendance.length > 0
            ? Math.round(attendance.reduce((sum, a) => sum + a.attendanceRate, 0) / attendance.length)
            : 'N/A';

          setStats({
            coursesCount,
            studentsCount: 1,
            averageGrade: averageGrade !== 'N/A' ? `${averageGrade}%` : 'N/A',
            attendanceRate: averageAttendance !== 'N/A' ? `${averageAttendance}%` : 'N/A',
          });
        }
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Greeting Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-primary-600 to-indigo-700 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold md:text-3xl">Welcome back, {user?.name}!</h1>
        <p className="mt-2 text-primary-100 max-w-xl">
          EduSystem AI is a student record portal supercharged with Google Gemini AI. Check stats, manage files, and interact with the AI assistant.
        </p>
        {user?.role === 'student' && (
          <div className="mt-4">
            <Link
              to="/study-buddy"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-50 transition-colors shadow"
            >
              <BrainCircuit className="h-4 w-4" />
              Chat with AI Study Buddy
            </Link>
          </div>
        )}
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Courses card */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Courses</p>
            <h3 className="text-3xl font-extrabold text-gray-800 mt-1">{stats.coursesCount}</h3>
          </div>
          <div className="p-3 bg-sky-50 rounded-lg text-sky-600">
            <BookOpen className="h-7 w-7" />
          </div>
        </div>

        {/* Students card - only shown for admins/teachers, else attendance */}
        {(user?.role === 'admin' || user?.role === 'teacher') ? (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Students</p>
              <h3 className="text-3xl font-extrabold text-gray-800 mt-1">{stats.studentsCount}</h3>
            </div>
            <div className="p-3 bg-teal-50 rounded-lg text-teal-600">
              <Users className="h-7 w-7" />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Attendance Rate</p>
              <h3 className="text-3xl font-extrabold text-gray-800 mt-1">{stats.attendanceRate}</h3>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
              <CalendarCheck className="h-7 w-7" />
            </div>
          </div>
        )}

        {/* Academic Grade Average */}
        {user?.role === 'student' ? (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Grade Average</p>
              <h3 className="text-3xl font-extrabold text-gray-800 mt-1">{stats.averageGrade}</h3>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
              <GraduationCap className="h-7 w-7" />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Role Access</p>
              <h3 className="text-xl font-bold text-gray-800 mt-2 capitalize">{user?.role} Portal</h3>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
              <GraduationCap className="h-7 w-7" />
            </div>
          </div>
        )}

        {/* AI Action Card */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">AI Engines</p>
            <h3 className="text-lg font-bold text-emerald-600 mt-2">Active</h3>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <BrainCircuit className="h-7 w-7" />
          </div>
        </div>
      </div>

      {/* Shortcuts / Quick Actions Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Navigation Panel</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/courses"
            className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100/70 transition-colors"
          >
            <div>
              <h4 className="font-semibold text-gray-800">My Courses</h4>
              <p className="text-xs text-gray-500 mt-0.5">Explore syllabus details & modules</p>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
          </Link>

          <Link
            to="/grades"
            className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100/70 transition-colors"
          >
            <div>
              <h4 className="font-semibold text-gray-800">Grades & Marks</h4>
              <p className="text-xs text-gray-500 mt-0.5">View test and exam report cards</p>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
          </Link>

          <Link
            to={user?.role === 'student' ? '/study-buddy' : '/ai-insights'}
            className="flex items-center justify-between p-4 rounded-lg bg-primary-50/50 border border-primary-100 hover:bg-primary-50 transition-colors"
          >
            <div>
              <h4 className="font-semibold text-primary-800 flex items-center gap-1.5">
                <BrainCircuit className="h-4 w-4 text-primary-600" />
                AI Assistant
              </h4>
              <p className="text-xs text-primary-600 mt-0.5">
                {user?.role === 'student' ? 'Launch study chatbot helper' : 'View student risk statistics'}
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-primary-400" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
