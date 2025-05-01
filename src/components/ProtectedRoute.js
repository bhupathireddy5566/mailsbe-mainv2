import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Spinner from './Spinner';

const ProtectedRoute = () => {
  const { session, loading } = useAuth();
  
  // Debug logs for protected route
  useEffect(() => {
    console.log('ProtectedRoute state:', { 
      isAuthenticated: !!session, 
      isLoading: loading 
    });
  }, [session, loading]);

  // Prevent endless loading - add a timeout
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Auth loading timeout exceeded - may be stuck');
      }
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [loading]);
  
  // Show loading spinner while checking auth status
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <Spinner />
        <div>Verifying authentication...</div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!session) {
    console.log('No session found, redirecting to login');
    return <Navigate to="/" replace />;
  }
  
  // Render child routes if authenticated
  console.log('Session verified, rendering protected content');
  return <Outlet />;
};

export default ProtectedRoute; 