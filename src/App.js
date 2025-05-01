import React, { useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import { processUrlHash } from './supabaseClient';

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

// CRITICAL FIX: Don't clean hash from URL at the app level
// Let the AuthContext handle it properly in its initialization
function App() {
  // The app shouldn't redirect directly at startup since that leads to losing the token
  // All session handling should be done in the AuthContext
  // We'll just check if we have a hash to inform how we setup the router

  // For debugging in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('App mounted, current URL:', window.location.href);
      console.log('Has auth hash:', Boolean(window.location.hash && window.location.hash.includes('access_token')));
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
              {/* Add any other protected routes here */}
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
