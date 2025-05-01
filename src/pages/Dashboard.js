import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Typography, Paper, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import EmailsTable from '../components/EmailsTable';
import PopUp from '../components/PopUp';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';
import RefreshIcon from '@mui/icons-material/Refresh';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [showPopup, setShowPopup] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Handle errors in dashboard components
  useEffect(() => {
    console.log('Dashboard mounted, user:', user?.email);
    
    // Add window error handler
    const handleError = (event) => {
      console.error('Dashboard error caught:', event);
      setError('An error occurred in the dashboard. Please try refreshing.');
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [user]);

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    setLoading(true);
    setError(null);
    console.log('Manual dashboard refresh');
    
    // Force reload after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }, []);

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Dashboard'}
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 4
      }}>
        <Box>
          <Typography variant="h4" component="h1" color="primary" gutterBottom>
            Email Tracking Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Welcome back, {user?.user_metadata?.name || user?.email || 'User'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setShowPopup(true)}
          >
            New Email
          </Button>
          <Button 
            variant="outlined"
            color="primary"
            startIcon={<LogoutIcon />}
            onClick={signOut}
          >
            Sign Out
          </Button>
        </Box>
      </Box>

      <Box sx={{ position: 'relative' }}>
        {/* Wrap EmailsTable in error boundary */}
        <React.Suspense fallback={<div>Loading emails...</div>}>
          <EmailsTable />
        </React.Suspense>
      </Box>
      
      {showPopup && <PopUp setPopUp={setShowPopup} />}
    </Box>
  );
};

export default Dashboard; 