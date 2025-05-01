import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Spinner from './Spinner';

const ProtectedRoute = () => {
  const { session, loading } = useAuth();
  
  // Show loading spinner while checking auth status
  if (loading) {
    return <Spinner />;
  }
  
  // Redirect to login if not authenticated
  if (!session) {
    return <Navigate to="/" replace />;
  }
  
  // Render child routes if authenticated
  return <Outlet />;
};

export default ProtectedRoute; 