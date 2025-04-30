import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { supabase } from './supabaseClient';

// Components
import Auth from './components/Auth';
import EmailsTable from './components/EmailsTable';
import Sidebar from './components/Sidebar';
import PopUp from './components/PopUp';
import Spinner from './components/Spinner';

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
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    // Handle URL hash for access token authentication
    const handleHashParams = async () => {
      // Check if URL has an access token in the hash
      if (window.location.hash.includes('access_token=')) {
        // The redirected user has a hash with access_token, we need to explicitly refresh to get session
        try {
          const { data, error } = await supabase.auth.getSession();
          if (!error && data.session) {
            setSession(data.session);
          }
          // Remove hash to clean up URL
          window.location.hash = '';
        } catch (error) {
          console.error('Error handling hash params:', error);
        }
      }
    };

    handleHashParams();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session ? 'Logged in' : 'Not logged in');
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session ? 'Has session' : 'No session');
        setSession(session);
        setLoading(false);
      }
    );

    // Cleanup subscription
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <Spinner />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster position="top-center" />
      
      <BrowserRouter>
        {!session ? (
          <Auth />
        ) : (
          <div style={{ display: 'flex' }}>
            <Sidebar 
              userName={session.user.user_metadata?.name || session.user.email}
              userEmail={session.user.email}
              setShowPopup={setShowPopup}
            />
            
            <div style={{ flexGrow: 1, padding: '20px' }}>
              <Routes>
                <Route 
                  path="/" 
                  element={<EmailsTable />} 
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
            
            {showPopup && <PopUp setPopUp={setShowPopup} />}
          </div>
        )}
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
