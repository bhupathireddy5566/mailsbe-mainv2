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
    // Direct handling of hash URLs after OAuth redirect
    if (window.location.hash && window.location.hash.includes('access_token')) {
      console.log('🔐 Access token found in URL');
      
      // Set a flag that we processed this login
      window.localStorage.setItem('just_logged_in', 'true');
      
      // Force a full page reload to ensure the hash is removed and session is set up
      setTimeout(() => {
        window.location.href = window.location.origin;
      }, 100);
      return;
    }
    
    // Simpler session check logic
    const checkSession = async () => {
      try {
        console.log('Checking for existing session...');
        const justLoggedIn = window.localStorage.getItem('just_logged_in');
        
        if (justLoggedIn) {
          console.log('Just logged in, clearing flag');
          window.localStorage.removeItem('just_logged_in');
        }
        
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('🔴 Error getting session:', error.message);
          setSession(null);
        } else if (data?.session) {
          console.log('✅ Found active session for', data.session.user.email);
          setSession(data.session);
        } else {
          console.log('❌ No active session found');
          setSession(null);
        }
      } catch (err) {
        console.error('🔴 Exception in session check:', err);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };
    
    // Initial session check
    checkSession();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('🔄 Auth state changed:', event);
      
      if (event === 'SIGNED_IN') {
        console.log('✅ SIGNED_IN event detected');
        setSession(newSession);
      } else if (event === 'SIGNED_OUT') {
        console.log('❌ SIGNED_OUT event detected');
        setSession(null);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 TOKEN_REFRESHED event detected');
        setSession(newSession);
      }
    });
    
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Log session state on changes for debugging
  useEffect(() => {
    if (session) {
      console.log('Current user:', session.user.email);
      console.log('Auth provider:', session.user.app_metadata.provider);
    }
  }, [session]);

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
