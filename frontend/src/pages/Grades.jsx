import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Plus, Trash2, CheckCircle, AlertCircle, X } from 'lucide-react';

const Grades = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  
  // Data lists
  const [grades, setGrades] = useState([]);
  const [courseStudents, setCourseStudents] = useState([]);
  
  // States
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [msg, setMsg] = useState(null);

  // Form fields
  const [formData, setFormData] = useState({
    studentId: '',
    title: '',
    marksObtained: '',
    maxMarks: '',
    remarks: '',
  });

  const fetchInitialData = async () => {
    try {
      const res = await axios.get('/api/courses');
      const coursesData = res.data.data;
      setCourses(coursesData);

      if (coursesData.length > 0) {
        setSelectedCourseId(coursesData[0]._id);
      }
    } catch (err) {
      console.error('Failed to load initial courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const loadGradesData = async () => {
    if (!selectedCourseId) return;
    try {
      // Load grades for course
      const res = await axios.get(`/api/grades/course/${selectedCourseId}`);
      setGrades(res.data.data);

      if (user.role !== 'student') {
        // Load course details to get enrolled students list
        const courseRes = await axios.get(`/api/courses/${selectedCourseId}`);
        const studentsList = courseRes.data.data.students || [];
        setCourseStudents(studentsList);
        
        if (studentsList.length > 0) {
          setFormData(prev => ({ ...prev, studentId: studentsList[0]._id }));
        }
      }
    } catch (err) {
      console.error('Failed to load grades database:', err);
    }
  };

  useEffect(() => {
    loadGradesData();
  }, [selectedCourseId]);

  const handleOpenAddModal = () => {
    setFormData({
      studentId: courseStudents.length > 0 ? courseStudents[0]._id : '',
      title: '',
      marksObtained: '',
      maxMarks: '100',
      remarks: '',
    });
    setMsg(null);
    setShowModal(true);
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      const payload = {
        ...formData,
        courseId: selectedCourseId,
        marksObtained: Number(formData.marksObtained),
        maxMarks: Number(formData.maxMarks),
      };

      await axios.post('/api/grades', payload);
      setMsg({ type: 'success', text: 'Grade saved successfully' });
      loadGradesData();
      setTimeout(() => setShowModal(false), 1500);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save grade' });
    }
  };

  const handleDeleteGrade = async (gradeId) => {
    if (!window.confirm('Remove this grade record?')) return;
    try {
      await axios.delete(`/api/grades/${gradeId}`);
      setGrades(grades.filter(g => g._id !== gradeId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete grade');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  // Calculate course stats for students
  const studentAverageScore = grades.length > 0
    ? Math.round(grades.reduce((sum, g) => sum + (g.marksObtained / g.maxMarks) * 100, 0) / grades.length)
    : 'N/A';

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

        {user.role === 'student' && (
          <div className="text-right">
            <span className="text-xs text-gray-400 block font-semibold uppercase">Course Grade Average</span>
            <span className="text-2xl font-extrabold text-primary-600">
              {studentAverageScore !== 'N/A' ? `${studentAverageScore}%` : 'No grades'}
            </span>
          </div>
        )}
      </div>

      {/* Main List Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary-500" />
            Academic Grade Log
          </h4>
          
          {user.role !== 'student' && selectedCourseId && (
            <button
              onClick={handleOpenAddModal}
              disabled={courseStudents.length === 0}
              className="inline-flex items-center gap-1.5 rounded bg-primary-600 hover:bg-primary-700 text-white px-4 py-1.5 text-xs font-bold transition-colors shadow disabled:bg-gray-400"
            >
              <Plus className="h-4 w-4" />
              Add Grade
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50 text-gray-500 uppercase tracking-wider text-[10px] font-bold">
                {user.role !== 'student' && <th className="px-6 py-3">Student</th>}
                <th className="px-6 py-3">Assessment Title</th>
                <th className="px-6 py-3">Marks Obtained</th>
                <th className="px-6 py-3">Score %</th>
                <th className="px-6 py-3">Remarks / Feedback</th>
                {user.role !== 'student' && <th className="px-6 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {grades.length > 0 ? (
                grades.map(grade => {
                  const percentage = Math.round((grade.marksObtained / grade.maxMarks) * 100);
                  return (
                    <tr key={grade._id} className="hover:bg-gray-50/20">
                      {user.role !== 'student' && (
                        <td className="px-6 py-4 font-medium text-gray-900">{grade.student?.name}</td>
                      )}
                      <td className="px-6 py-4 font-semibold text-gray-800">{grade.title}</td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">{grade.marksObtained} / {grade.maxMarks}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          percentage >= 85 ? 'bg-green-50 text-green-700' :
                          percentage >= 60 ? 'bg-blue-50 text-blue-700' :
                          'bg-red-50 text-red-700'
                        }`}>
                          {percentage}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">{grade.remarks || 'No remarks provided.'}</td>
                      {user.role !== 'student' && (
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteGrade(grade._id)}
                            className="text-rose-500 hover:text-rose-700 p-1"
                            title="Remove Grade"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={user.role !== 'student' ? '6' : '5'} className="text-center py-8 text-gray-400">
                    No grades logged for this course.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Grade Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="font-bold text-gray-900 text-lg">Input Grade / Marks</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSaveGrade} className="p-6 space-y-4">
              {msg && (
                <div className={`p-3 rounded text-xs border flex items-center gap-2 ${
                  msg.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  {msg.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  <span>{msg.text}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase">Select Student</label>
                <select
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-primary-500 bg-white"
                >
                  {courseStudents.map(student => (
                    <option key={student._id} value={student._id}>
                      {student.name} ({student.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase">Assessment Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Midterm Exam, Assignment 1"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase">Marks Obtained</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="85"
                    value={formData.marksObtained}
                    onChange={(e) => setFormData({ ...formData, marksObtained: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-primary-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase">Maximum Marks</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="100"
                    value={formData.maxMarks}
                    onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-primary-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase">Feedback / Remarks</label>
                <textarea
                  placeholder="e.g. Strong effort, review lecture 4 concepts..."
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-primary-500 h-16 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded text-sm border border-gray-300 hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded text-sm bg-primary-600 hover:bg-primary-700 text-white font-semibold"
                >
                  Save Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Grades;
