import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Courses from './pages/Courses';
import Attendance from './pages/Attendance';
import Grades from './pages/Grades';
import AIDashboard from './pages/AIDashboard';
import ChatBot from './pages/ChatBot';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public login route */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/students"
            element={
              <PrivateRoute allowedRoles={['admin', 'teacher']}>
                <Layout>
                  <Students />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/courses"
            element={
              <PrivateRoute>
                <Layout>
                  <Courses />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/attendance"
            element={
              <PrivateRoute>
                <Layout>
                  <Attendance />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/grades"
            element={
              <PrivateRoute>
                <Layout>
                  <Grades />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/ai-insights"
            element={
              <PrivateRoute allowedRoles={['admin', 'teacher']}>
                <Layout>
                  <AIDashboard />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/study-buddy"
            element={
              <PrivateRoute allowedRoles={['student']}>
                <Layout>
                  <ChatBot />
                </Layout>
              </PrivateRoute>
            }
          />

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
