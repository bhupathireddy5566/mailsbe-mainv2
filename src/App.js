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

  useEffect(() => {
    const handleAuthChange = async () => {
      console.log('Checking authentication state...');
      setLoading(true);
      
      // Check if we're on an OAuth callback URL
      const hasAuthParams = window.location.hash || window.location.search.includes('access_token') || window.location.search.includes('code');
      
      try {
        // First try to get current session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error.message);
          setSession(null);
          setLoading(false);
          return;
        }
        
        console.log('Current session:', data?.session ? 'Found session' : 'No session');
        
        if (data?.session) {
          setSession(data.session);
          
          // If we have a session and we're on a callback URL, clean the URL
          if (hasAuthParams && window.history && window.history.replaceState) {
            console.log('Cleaning URL parameters after successful authentication');
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } else if (hasAuthParams) {
          // If we don't have a session but we're on a callback URL, try a session refresh
          console.log('On callback URL but no session - trying session refresh');
          const { data: refreshData } = await supabase.auth.refreshSession();
          if (refreshData?.session) {
            console.log('Session refreshed successfully');
            setSession(refreshData.session);
            
            // Clean the URL
            if (window.history && window.history.replaceState) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          } else {
            console.log('Failed to refresh session on callback');
          }
        }
      } catch (error) {
        console.error('Error in auth change handler:', error);
      } finally {
        setLoading(false);
      }
    };

    handleAuthChange();

    // Set up auth listener for future changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      setSession(session);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Debug output
  useEffect(() => {
    if (session) {
      console.log('Session active for user:', session.user.email);
    } else if (!loading) {
      console.log('No active session');
    }
  }, [session, loading]);

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
