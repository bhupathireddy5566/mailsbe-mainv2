import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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

// Handle access token in URL
if (window.location.hash && window.location.hash.includes('access_token')) {
  console.log('🔐 Access token detected in URL hash - redirecting to dashboard');
  const cleanURL = window.location.origin + '/dashboard';
  window.location.href = cleanURL;
}

// Dashboard component with session check
const Dashboard = ({ session }) => {
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  
  useEffect(() => {
    if (!session) {
      navigate('/');
    }
  }, [session, navigate]);
  
  if (!session) return <Spinner />;
  
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar 
        userName={session.user.user_metadata?.name || session.user.email}
        userEmail={session.user.email}
        setShowPopup={setShowPopup}
      />
      <div style={{ flexGrow: 1, padding: '20px' }}>
        <EmailsTable />
      </div>
      {showPopup && <PopUp setPopUp={setShowPopup} />}
    </div>
  );
};

// Root component to redirect based on auth state
const Root = ({ session }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    if (session && location.pathname === '/') {
      navigate('/dashboard');
    }
  }, [session, navigate, location]);
  
  return session ? <Navigate to="/dashboard" replace /> : <Auth />;
};

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('Checking for existing session...');
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
    
    checkSession();
    
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

  if (loading) {
    return <Spinner />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster position="top-center" />
      <ToastContainer position="top-right" autoClose={3000} />
      <Router>
        <Routes>
          <Route path="/" element={<Root session={session} />} />
          <Route 
            path="/dashboard" 
            element={
              session ? <Dashboard session={session} /> : <Navigate to="/" replace />
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
