import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Spinner from './Spinner';
import { Box, Typography, Button, Alert, Paper } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';

const ProtectedRoute = () => {
  const { session, user, loading, authError } = useAuth();
  const [localLoading, setLocalLoading] = useState(true);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const location = useLocation();

  // Debug logs for route protection
  useEffect(() => {
    console.log(`ProtectedRoute (${location.pathname}):`, { 
      isAuthenticated: !!session, 
      isLoading: loading,
      user: user?.email,
      error: authError
    });
    
    // Add a short delay to prevent flash of loading state
    const timer = setTimeout(() => {
      setLocalLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [session, loading, user, authError, location.pathname]);

  // Handle timeout for stuck loading state
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Auth loading timeout reached - possible auth flow issue');
        setTimeoutReached(true);
      }
    }, 5000); // 5 seconds timeout - reduced from 8

    return () => clearTimeout(timeoutId);
  }, [loading]);

  // Force page refresh handler
  const handleForceRefresh = () => {
    console.log('User initiated force refresh');
    window.location.reload();
  };

  // Handle return to login
  const handleReturnToLogin = () => {
    console.log('User requested return to login');
    window.location.href = '/';
  };

  // Show manual refresh option after timeout
  if (timeoutReached && loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Paper sx={{ p: 4, maxWidth: 500, width: '100%', textAlign: 'center' }}>
          <Alert severity="warning" sx={{ mb: 3 }}>
            Authentication is taking longer than expected.
          </Alert>
          <Typography variant="body1" paragraph>
            We're having trouble verifying your authentication state. This might be due to network issues or an authentication service problem.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<RefreshIcon />} 
              onClick={handleForceRefresh}
            >
              Refresh Page
            </Button>
            <Button
              variant="outlined"
              startIcon={<HomeIcon />}
              onClick={handleReturnToLogin}
            >
              Return to Login
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }
  
  // Show loading while checking auth
  if (loading || localLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <Spinner />
        <Typography variant="body1" color="text.secondary">
          Verifying your authentication...
        </Typography>
      </Box>
    );
  }
  
  // Handle authentication errors
  if (authError || !session) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Paper sx={{ p: 4, maxWidth: 500, width: '100%' }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            Authentication Error
          </Alert>
          <Typography variant="body1" paragraph>
            {authError || "Your session has expired or is invalid. Please log in again."}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleReturnToLogin}
            fullWidth
          >
            Return to Login
          </Button>
        </Paper>
      </Box>
    );
  }
  
  // Render protected routes when authenticated
  console.log('Authentication verified, rendering protected content');
  return <Outlet />;
};

export default ProtectedRoute; 