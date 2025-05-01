import React, { useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#00875A', // Mailsbe green
    },
    secondary: {
      main: '#3366FF',
    },
    background: {
      default: '#F8F9FA',
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  }
});

// Look for auth hash in URL before rendering
if (window.location.hash && window.location.hash.includes('access_token')) {
  console.log('Access token detected in URL at App initialization');
  
  // If we're not on the dashboard route, force redirect to preserve the hash for auth
  if (!window.location.pathname.includes('/dashboard')) {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const state = hashParams.get('state');
    
    // Construct redirect with hash preserved
    const redirectUrl = `/dashboard${window.location.hash}`;
    console.log('Redirecting to dashboard with auth token');
    window.location.href = redirectUrl;
  }
}

function App() {
  // Disable browser console logs in production (optional)
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      console.log = () => {};
      console.error = () => {};
      console.warn = () => {};
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster 
        position="top-center" 
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#00875A',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#E53E3E',
              secondary: '#fff',
            },
          },
        }}
      />
      <Router>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LoginPage />} />
            
            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
