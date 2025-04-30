import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';
import { supabase } from './supabaseClient';

// Components
import Auth from './components/Auth';
import EmailsTable from './components/EmailsTable';
import Sidebar from './components/Sidebar';
import PopUp from './components/PopUp';

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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    // Cleanup subscription
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
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
