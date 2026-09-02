import { useEffect, useState } from 'react';
import axios from '../config/axios';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Plus, UserPlus, FileText, X, AlertCircle } from 'lucide-react';

const Courses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [allSystemCourses, setAllSystemCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Form states
  const [newCourse, setNewCourse] = useState({ name: '', code: '', description: '' });
  const [studentEmail, setStudentEmail] = useState('');
  const [enrollMsg, setEnrollMsg] = useState(null);
  const [teachersList, setTeachersList] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  const fetchCoursesData = async () => {
    try {
      const res = await axios.get('/api/courses');
      setCourses(res.data.data);

      if (user.role === 'student') {
        // Fetch all courses in system so student can self-enroll
        const allRes = await axios.get('/api/courses/all');
        setAllSystemCourses(allRes.data.data);
      }

      if (user.role === 'admin') {
        // Fetch users with role teacher
        const usersRes = await axios.get('/api/students'); // Note: `/api/students` returns students, we can implement an all users route, or just self-populate. Let's make it simple: teacher defaults to logged-in user, or we query.
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoursesData();
  }, [user]);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newCourse,
        teacherId: user.role === 'admin' ? selectedTeacherId : undefined
      };
      await axios.post('/api/courses', payload);
      setShowAddModal(false);
      setNewCourse({ name: '', code: '', description: '' });
      fetchCoursesData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create course');
    }
  };

  const handleOpenEnrollModal = (course) => {
    setSelectedCourse(course);
    setStudentEmail('');
    setEnrollMsg(null);
    setShowEnrollModal(true);
  };

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    setEnrollMsg(null);
    try {
      const res = await axios.post(`/api/courses/${selectedCourse._id}/enroll`, { studentEmail });
      setEnrollMsg({ type: 'success', text: res.data.message });
      fetchCoursesData();
      setTimeout(() => setShowEnrollModal(false), 1500);
    } catch (err) {
      setEnrollMsg({ type: 'error', text: err.response?.data?.message || 'Enrollment failed' });
    }
  };

  const handleSelfEnroll = async (courseId) => {
    try {
      await axios.post(`/api/courses/${courseId}/enroll`);
      alert('Enrolled successfully!');
      fetchCoursesData();
    } catch (err) {
      alert(err.response?.data?.message || 'Self-enrollment failed');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  // Find system courses student is NOT currently enrolled in
  const availableSystemCourses = allSystemCourses.filter(
    sc => !courses.some(c => c._id === sc._id)
  );

  return (
    <div className="space-y-8">
      {/* Title / Action bar */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">
          {user.role === 'student' ? 'My Enrolled Courses' : 'Registered Courses'}
        </h3>
        
        {user.role !== 'student' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 text-sm font-semibold transition-colors shadow"
          >
            <Plus className="h-4 w-4" />
            Create Course
          </button>
        )}
      </div>

      {/* Courses List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.length > 0 ? (
          courses.map((course) => (
            <div key={course._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold bg-primary-50 text-primary-700 px-2.5 py-1 rounded border border-primary-100 uppercase">
                    {course.code}
                  </span>
                  <BookOpen className="h-5 w-5 text-gray-400" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 line-clamp-1">{course.name}</h4>
                <p className="text-sm text-gray-500 line-clamp-2 h-10">{course.description || 'No description provided.'}</p>
                
                <div className="border-t border-gray-100 pt-3 text-xs text-gray-500 space-y-1">
                  <p><strong>Instructor:</strong> {course.teacher?.name} ({course.teacher?.email})</p>
                  <p><strong>Enrolled Students:</strong> {course.students?.length || 0}</p>
                </div>
              </div>

              {user.role !== 'student' && (
                <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
                  <button
                    onClick={() => handleOpenEnrollModal(course)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-800 bg-white border border-primary-200 px-3 py-1.5 rounded transition-colors shadow-sm"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Enroll Student
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white rounded-xl p-8 border border-gray-200 text-center text-gray-400">
            You are not linked to any active courses.
          </div>
        )}
      </div>

      {/* Student Self-Enroll Section */}
      {user.role === 'student' && availableSystemCourses.length > 0 && (
        <div className="space-y-4 border-t border-gray-200 pt-8">
          <h3 className="text-lg font-bold text-gray-800">Register in System Courses</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableSystemCourses.map((course) => (
              <div key={course._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold bg-gray-100 text-gray-600 px-2.5 py-1 rounded uppercase">
                      {course.code}
                    </span>
                    <BookOpen className="h-5 w-5 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 line-clamp-1">{course.name}</h4>
                  <p className="text-sm text-gray-500 line-clamp-2 h-10">{course.description}</p>
                  <p className="text-xs text-gray-400">Instructor: {course.teacher?.name}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleSelfEnroll(course._id)}
                    className="w-full text-center py-2 bg-primary-600 hover:bg-primary-700 text-white rounded text-sm font-semibold transition-colors"
                  >
                    Enroll Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="font-bold text-gray-900 text-lg">Create New Course</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateCourse} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase">Course Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Algorithms & Data Structures"
                  value={newCourse.name}
                  onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase">Course Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS102"
                  value={newCourse.code}
                  onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-primary-500 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase">Description</label>
                <textarea
                  placeholder="Summarize course content and goals..."
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-primary-500 h-24 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded text-sm border border-gray-300 hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded text-sm bg-primary-600 hover:bg-primary-700 text-white font-semibold animate-pulse-once"
                >
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enroll Student Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="font-bold text-gray-900 text-lg">Enroll in {selectedCourse?.code}</h3>
              <button onClick={() => setShowEnrollModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleEnrollStudent} className="p-6 space-y-4">
              {enrollMsg && (
                <div className={`p-3 rounded text-xs border flex items-center gap-2 ${
                  enrollMsg.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <AlertCircle className="h-4 w-4" />
                  <span>{enrollMsg.text}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase">Student Email</label>
                <input
                  type="email"
                  required
                  placeholder="student@school.com"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-primary-500"
                />
                <p className="text-[10px] text-gray-400 mt-1">Student must already have a registered account in the system.</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="px-4 py-2 rounded text-sm border border-gray-300 hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded text-sm bg-primary-600 hover:bg-primary-700 text-white font-semibold"
                >
                  Confirm Enrollment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;
