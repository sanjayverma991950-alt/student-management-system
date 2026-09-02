import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    setLocalError(null);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setLocalError(err.message || 'Invalid email or password');
    }
  };

  // Quick login helper
  const handleQuickLogin = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    // Submit login in next tick
    setTimeout(() => {
      setLocalError(null);
      login(demoEmail, demoPass)
        .then(() => navigate('/dashboard'))
        .catch((err) => setLocalError(err.message || 'Demo account not initialized. Click "Seed Database" below.'));
    }, 100);
  };

  // Database seeder triggers
  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setLocalError(null);
    setSeedSuccess(false);
    try {
      await axios.post('/api/auth/register', {
        name: 'Demo Admin',
        email: 'admin@school.com',
        password: 'admin123',
        role: 'admin',
      });
    } catch (err) {
      // Ignore if user already exists
    }

    try {
      await axios.post('/api/auth/register', {
        name: 'Demo Teacher',
        email: 'teacher@school.com',
        password: 'teacher123',
        role: 'teacher',
      });
    } catch (err) {
      // Ignore if user already exists
    }

    try {
      await axios.post('/api/auth/register', {
        name: 'Demo Student',
        email: 'student@school.com',
        password: 'student123',
        role: 'student',
        rollNumber: 'ROLL-101',
        phone: '1234567890',
        address: '123 Main St, Tech City',
      });
      
      // Let's call the custom backend mock database seeding helper route if we want.
      // We will write a `/api/auth/seed` route on the backend shortly to populate courses, attendance and grades!
      await axios.post('/api/auth/seed-dummy-data');
    } catch (err) {
      // Ignore if user already exists
    }

    // Now seed additional dummy data
    try {
      await axios.post('/api/auth/seed-dummy-data');
      setSeedSuccess(true);
    } catch (err) {
      console.error('Seeding dummy error:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-primary-600">
          <GraduationCap className="h-14 w-14" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-gray-900">
          EduSystem AI Portal
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          MERN Student Management System with Gemini AI
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleLogin}>
            {localError && (
              <div className="rounded-md bg-red-50 p-4 border border-red-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{localError}</h3>
                  </div>
                </div>
              </div>
            )}

            {seedSuccess && (
              <div className="rounded-md bg-green-50 p-4 border border-green-200">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Database successfully seeded with demo accounts! You can now use the quick login buttons.
                    </h3>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                  placeholder="name@school.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:bg-primary-400"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>

          {/* Quick Demo Access Selectors */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center mb-4">
              Quick Demo Access
            </h3>
            
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@school.com', 'admin123')}
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50/50 transition-all group"
              >
                <span className="text-xs font-bold text-gray-800">Admin</span>
                <span className="text-[10px] text-gray-500">Full Access</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('teacher@school.com', 'teacher123')}
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50/50 transition-all group"
              >
                <span className="text-xs font-bold text-gray-800">Teacher</span>
                <span className="text-[10px] text-gray-500">Grading & AI</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('student@school.com', 'student123')}
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50/50 transition-all group"
              >
                <span className="text-xs font-bold text-gray-800">Student</span>
                <span className="text-[10px] text-gray-500">Study Buddy</span>
              </button>
            </div>

            <div className="mt-4 flex flex-col items-center">
              <button
                type="button"
                onClick={handleSeedDatabase}
                disabled={isSeeding}
                className="text-xs text-primary-600 hover:text-primary-800 font-semibold underline flex items-center gap-1 focus:outline-none"
              >
                {isSeeding ? 'Seeding Database...' : 'Initialize Demo Database / Seed Data'}
                <ArrowRight className="h-3 w-3" />
              </button>
              <p className="text-[10px] text-gray-400 mt-1">
                Creates demo profiles, mock grades, and courses automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
