import { useEffect, useState } from 'react';
import axios from '../config/axios';
import { useSearchParams } from 'react-router-dom';
import { BrainCircuit, Play, FileDown, CheckCircle, Sparkles } from 'lucide-react';

// Simple markdown-to-html renderer helper to avoid extra dependencies
const renderMarkdown = (text) => {
  if (!text) return '';
  
  // Safe HTML escapes
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold headings: ### Heading or #### Heading
  html = html.replace(/^### (.*?)$/gm, '<h3 class="text-lg font-bold text-slate-800 mt-4 mb-2">$1</h3>');
  html = html.replace(/^#### (.*?)$/gm, '<h4 class="text-base font-bold text-slate-800 mt-3 mb-1.5">$1</h4>');

  // Blockquotes: > quote
  html = html.replace(/^&gt; (.*?)$/gm, '<blockquote class="border-l-4 border-primary-500 bg-primary-50/50 px-4 py-2 my-3 rounded-r text-sm text-primary-800 italic">$1</blockquote>');

  // Bold text: **bold**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>');

  // Bullet points: - list item
  html = html.replace(/^- (.*?)$/gm, '<li class="ml-5 list-disc mb-1 text-gray-700">$1</li>');
  html = html.replace(/^\* (.*?)$/gm, '<li class="ml-5 list-disc mb-1 text-gray-700 italic">$1</li>');

  // Ordered list points: 1. list item
  html = html.replace(/^\d+\.\s+(.*?)$/gm, '<li class="ml-5 list-decimal mb-1 text-gray-700">$1</li>');

  // Line breaks
  html = html.replace(/\n/g, '<br/>');

  // Clean empty bullet groupings
  return html;
};

const AIDashboard = () => {
  const [searchParams] = useSearchParams();
  const preselectedStudentId = searchParams.get('student');

  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [report, setReport] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);

  useEffect(() => {
    const fetchStudentsList = async () => {
      try {
        const res = await axios.get('/api/students');
        const studentsList = res.data.data;
        setStudents(studentsList);
        
        if (studentsList.length > 0) {
          // If student ID is in query params, preselect it, else select first
          setSelectedStudentId(preselectedStudentId || studentsList[0]._id);
        }
      } catch (err) {
        console.error('Failed to load students list:', err);
      } finally {
        setListLoading(false);
      }
    };

    fetchStudentsList();
  }, [preselectedStudentId]);

  const handleGenerateReport = async () => {
    if (!selectedStudentId) return;
    setLoading(true);
    setReport('');
    try {
      const res = await axios.post(`/api/ai/analyze/${selectedStudentId}`);
      setReport(res.data.data);
    } catch (err) {
      setReport(`### Error generating report\n\nCould not fetch analysis data: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Auto trigger if preselected via URL query param
  useEffect(() => {
    if (preselectedStudentId && students.length > 0) {
      setSelectedStudentId(preselectedStudentId);
      handleGenerateReport();
    }
  }, [preselectedStudentId, students]);

  if (listLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  const selectedStudent = students.find(s => s._id === selectedStudentId);

  return (
    <div className="space-y-6">
      {/* Control panel select */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Select Student for AI Analysis</label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            disabled={loading}
            className="block w-64 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-primary-500 bg-white"
          >
            {students.map(s => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.profile?.rollNumber || 'No Roll'})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleGenerateReport}
          disabled={loading || !selectedStudentId}
          className="inline-flex items-center gap-2 rounded bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 text-xs font-bold transition-colors shadow disabled:bg-gray-400"
        >
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          ) : (
            <Play className="h-4 w-4" />
          )}
          {loading ? 'Running AI Engine...' : 'Generate Academic Report'}
        </button>
      </div>

      {/* Analytics result */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[400px] flex flex-col">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center font-bold text-gray-800 text-sm">
          <span className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-primary-500" />
            AI Analytical Report {selectedStudent ? `for ${selectedStudent.name}` : ''}
          </span>
          <span className="text-[10px] text-gray-400 font-mono">powered by Gemini AI</span>
        </div>

        <div className="flex-1 p-6">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center py-20 text-gray-400 space-y-4">
              <Sparkles className="h-10 w-10 text-primary-500 animate-pulse" />
              <p className="text-sm font-semibold animate-pulse">Gemini model is scanning grades and attendance logs...</p>
              <p className="text-xs text-gray-400">This could take a few seconds.</p>
            </div>
          ) : report ? (
            <div className="prose max-w-none space-y-4">
              <div 
                dangerouslySetInnerHTML={{ __html: renderMarkdown(report) }} 
                className="text-sm leading-relaxed text-gray-800"
              />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-20 text-gray-400 text-center space-y-2">
              <BrainCircuit className="h-12 w-12 text-gray-300" />
              <h4 className="font-bold text-gray-500">Academic Analyst Idle</h4>
              <p className="text-xs text-gray-400 max-w-xs">
                Select a student in the menu and click "Generate Academic Report" to run the LLM compiler.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIDashboard;
