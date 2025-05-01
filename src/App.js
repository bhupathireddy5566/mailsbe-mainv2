import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import EmailsTable from './components/EmailsTable';
import Sidebar from './components/Sidebar';
import PopUp from './components/PopUp';
import Spinner from './components/Spinner';
import { Toaster } from 'react-hot-toast';
import 'react-toastify/dist/ReactToastify.css';

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

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);

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
      console.log('Detected OAuth callback URL - refreshing session');
      // If we detect auth parameters in URL, explicitly refresh the session
      refreshSession();
      
      // Clean URL - remove hash and query params
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } else {
      // Normal session check
      refreshSession();
    }

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state change:', event, currentSession ? 'Session exists' : 'No session');
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          console.log('User signed in or token refreshed');
          setSession(currentSession);
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          setSession(null);
        }
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
    return <Spinner />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster position="top-center" />
      <ToastContainer position="top-right" autoClose={3000} />
      <Router>
        {session ? (
          <div style={{ display: 'flex' }}>
            <Sidebar 
              userName={session.user.user_metadata?.name || session.user.email}
              userEmail={session.user.email}
              setShowPopup={setShowPopup}
            />
            <div style={{ flexGrow: 1, padding: '20px' }}>
              <Routes>
                <Route path="/" element={<EmailsTable />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
            {showPopup && <PopUp setPopUp={setShowPopup} />}
          </div>
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
