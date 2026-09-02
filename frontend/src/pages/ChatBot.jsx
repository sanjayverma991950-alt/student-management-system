import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { BrainCircuit, Send, Sparkles, BookOpen, AlertCircle, HelpCircle } from 'lucide-react';

const renderMarkdown = (text) => {
  if (!text) return '';
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Headings
  html = html.replace(/^### (.*?)$/gm, '<h4 class="text-sm font-bold text-slate-800 mt-3 mb-1">$1</h4>');
  html = html.replace(/^#### (.*?)$/gm, '<h5 class="text-xs font-bold text-slate-700 mt-2 mb-1">$1</h5>');

  // Spoilers/Details
  html = html.replace(/&lt;details&gt;/g, '<details class="border border-gray-200 bg-gray-50 rounded p-2 my-2 text-xs">');
  html = html.replace(/&lt;\/details&gt;/g, '</details>');
  html = html.replace(/&lt;summary&gt;(.*?)&lt;\/summary&gt;/g, '<summary class="font-semibold cursor-pointer text-primary-700 select-none">$1</summary>');

  // Lists
  html = html.replace(/^- (.*?)$/gm, '<li class="ml-4 list-disc mb-0.5 text-xs text-gray-700">$1</li>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>');

  // Code inline
  html = html.replace(/`(.*?)`/g, '<code class="bg-gray-100 font-mono text-xs px-1 rounded border">$1</code>');

  // Tables
  html = html.replace(/\| (.*?) \|/g, '<span class="block border-b border-gray-100 pb-1 py-1 font-mono text-[10px] text-gray-600">$1</span>');

  // Line breaks
  html = html.replace(/\n/g, '<br/>');

  return html;
};

const ChatBot = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  
  // Chat thread states
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: `Hello! I'm your AI Study Buddy. Select a course above to give me context, then ask me anything, or try one of the prompt templates below!`,
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [contextType, setContextType] = useState('general'); // general | explain | quiz | study-plan

  const chatEndRef = useRef(null);

  useEffect(() => {
    const fetchStudentCourses = async () => {
      try {
        const res = await axios.get('/api/courses');
        const list = res.data.data;
        setCourses(list);
        if (list.length > 0) {
          setSelectedCourseId(list[0]._id);
        }
      } catch (err) {
        console.error('Failed to fetch student courses:', err);
      }
    };
    fetchStudentCourses();
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (e, forcedText = null, forcedContext = null) => {
    e?.preventDefault();
    const query = forcedText || inputVal;
    const mode = forcedContext || contextType;

    if (!query.trim()) return;

    // Append student message
    const newMsgList = [...messages, { sender: 'student', text: query }];
    setMessages(newMsgList);
    setInputVal('');
    setLoading(true);

    try {
      const res = await axios.post('/api/ai/chat', {
        message: query,
        courseId: selectedCourseId || undefined,
        contextType: mode,
      });

      setMessages([...newMsgList, { sender: 'ai', text: res.data.data }]);
    } catch (err) {
      setMessages([
        ...newMsgList,
        {
          sender: 'ai',
          text: `⚠️ Study Buddy Error: ${err.response?.data?.message || err.message}. Make sure the backend server is active.`,
        },
      ]);
    } finally {
      setLoading(false);
      setContextType('general'); // Reset back to default
    }
  };

  const triggerPromptTemplate = (type, promptText) => {
    setContextType(type);
    handleSendMessage(null, promptText, type);
  };

  return (
    <div className="h-[80vh] flex flex-col md:flex-row gap-6">
      {/* Sidebar settings */}
      <div className="w-full md:w-64 bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Course context
          </label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="block w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary-500 bg-white"
          >
            <option value="">No Course Context</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-gray-400 mt-1">
            Selecting a course lets the AI assistant customize details for that topic.
          </p>
        </div>

        {/* Prompt shortcuts */}
        <div className="space-y-2 border-t border-gray-100 pt-4">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Prompt templates
          </label>

          <button
            type="button"
            onClick={() =>
              triggerPromptTemplate(
                'explain',
                'Explain recursion and base cases'
              )
            }
            className="w-full text-left px-3 py-2 rounded border border-gray-200 hover:border-primary-400 hover:bg-primary-50/30 text-xs font-semibold text-gray-700 flex flex-col gap-0.5 transition-all"
          >
            <span className="text-primary-600 font-bold">📚 Explain Concept</span>
            <span className="text-[10px] text-gray-400 font-normal truncate">"Explain recursion and base..."</span>
          </button>

          <button
            type="button"
            onClick={() =>
              triggerPromptTemplate('quiz', 'React components and hooks')
            }
            className="w-full text-left px-3 py-2 rounded border border-gray-200 hover:border-primary-400 hover:bg-primary-50/30 text-xs font-semibold text-gray-700 flex flex-col gap-0.5 transition-all"
          >
            <span className="text-primary-600 font-bold">❓ Quiz Me</span>
            <span className="text-[10px] text-gray-400 font-normal truncate">"Generate MCQs on React..."</span>
          </button>

          <button
            type="button"
            onClick={() =>
              triggerPromptTemplate('study-plan', 'Data structures trees and graphs')
            }
            className="w-full text-left px-3 py-2 rounded border border-gray-200 hover:border-primary-400 hover:bg-primary-50/30 text-xs font-semibold text-gray-700 flex flex-col gap-0.5 transition-all"
          >
            <span className="text-primary-600 font-bold">📅 Create Study Plan</span>
            <span className="text-[10px] text-gray-400 font-normal truncate">"Generate 7-day schedule..."</span>
          </button>
        </div>
      </div>

      {/* Chat Thread */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        {/* Chat Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between font-bold text-gray-800 text-sm">
          <span className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-primary-500 animate-pulse" />
            AI Study Buddy
          </span>
          <span className="text-[10px] text-gray-400 font-mono">Status: Online</span>
        </div>

        {/* Scrollable messages viewport */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
          {messages.map((msg, index) => {
            const isAI = msg.sender === 'ai';
            return (
              <div
                key={index}
                className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-3 shadow-sm border text-xs leading-relaxed ${
                    isAI
                      ? 'bg-white border-gray-200 text-gray-800'
                      : 'bg-primary-600 border-primary-500 text-white rounded-br-none'
                  }`}
                >
                  <p className="font-bold text-[10px] mb-1 opacity-70 uppercase tracking-wide">
                    {isAI ? 'AI Study Buddy' : 'Student (You)'}
                  </p>
                  
                  {isAI ? (
                    <div 
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }} 
                      className="space-y-1.5"
                    />
                  ) : (
                    <p>{msg.text}</p>
                  )}
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm flex items-center gap-2 text-xs text-gray-400 font-semibold">
                <Sparkles className="h-4 w-4 text-primary-500 animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Message Input Box */}
        <form
          onSubmit={handleSendMessage}
          className="p-4 bg-gray-50 border-t border-gray-200 flex gap-3"
        >
          <input
            type="text"
            placeholder={
              contextType === 'general'
                ? 'Ask your question here...'
                : `Enter topic to generate a ${contextType.toUpperCase()}...`
            }
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={loading}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-primary-500 bg-white"
          />
          <button
            type="submit"
            disabled={loading || !inputVal.trim()}
            className="inline-flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white p-2 px-4 rounded-lg font-semibold text-xs transition-colors shadow disabled:bg-gray-400"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBot;
