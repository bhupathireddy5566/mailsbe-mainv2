import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import theme from './theme';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import NavBar from './components/NavBar';
import { Toaster } from 'react-hot-toast';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to refresh the session
  const refreshSession = async () => {
    console.log('Refreshing session...');
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        setSession(null);
      } else {
        console.log('Session data:', data);
        setSession(data.session);
      }
    } catch (error) {
      console.error('Exception getting session:', error);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if we're in an OAuth callback
    const isCallback = window.location.href.includes('#access_token=') || 
                      window.location.search.includes('?code=');
    
    if (isCallback) {
      console.log('Detected OAuth callback URL');
    }

    // Initial session check
    refreshSession();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state change:', event);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          console.log('User signed in or token refreshed');
          setSession(currentSession);
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          setSession(null);
        }
        
        setLoading(false);
      }
    );

    // Clean up subscription
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          backgroundColor: '#f9fafb'
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster position="top-center" />
      <ToastContainer position="top-right" autoClose={3000} />
      <Router>
        {session ? (
          <>
            <NavBar session={session} />
            <Routes>
              <Route path="/" element={<Dashboard session={session} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </>
        ) : (
          <Routes>
            <Route path="/" element={<Auth />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </Router>
    </ThemeProvider>
  );
}

export default App;
