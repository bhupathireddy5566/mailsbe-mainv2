import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, setSessionFromHash } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

// Create auth context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const navigate = useNavigate();

  // Main authentication initialization
  useEffect(() => {
    let isMounted = true;
    console.log('AuthProvider initializing...');

    const initializeAuth = async () => {
      try {
        setLoading(true);
        
        // First try to set session from URL hash if available
        const hashSessionSet = await setSessionFromHash();
        
        if (hashSessionSet) {
          console.log('Session established from URL hash');
          // After setting the session, we need to get it to update local state
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error getting session after hash processing:', error.message);
            if (isMounted) setAuthError(error.message);
          } else if (data?.session) {
            console.log('Session confirmed after hash processing');
            if (isMounted) {
              setSession(data.session);
              setUser(data.session.user);
              setAuthError(null);
            }
            
            // After successfully setting session from hash, clean URL
            if (window.history && window.history.replaceState) {
              window.history.replaceState({}, document.title, '/dashboard');
            }
          }
        } else {
          // Regular session check if no hash session was set
          console.log('Checking for existing session...');
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Session check error:', error.message);
            if (isMounted) setAuthError(error.message);
          } else if (data?.session) {
            console.log('Found existing session:', data.session.user.email);
            if (isMounted) {
              setSession(data.session);
              setUser(data.session.user);
              setAuthError(null);
            }
          } else {
            console.log('No active session found');
            // If on dashboard without a valid session, redirect to login
            if (window.location.pathname.includes('/dashboard')) {
              navigate('/');
            }
          }
        }
      } catch (err) {
        console.error('Authentication initialization error:', err);
        if (isMounted) setAuthError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    // Listen for Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log(`AUTH EVENT: ${event}`, currentSession ? `(User: ${currentSession.user.email})` : '(No session)');
      
      if (event === 'SIGNED_IN') {
        if (isMounted) {
          setSession(currentSession);
          setUser(currentSession.user);
          setLoading(false);
          setAuthError(null);
          
          // Navigate only if we're not already on the dashboard
          if (window.location.pathname !== '/dashboard') {
            navigate('/dashboard');
          }
        }
      } 
      else if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setSession(null);
          setUser(null);
          setLoading(false);
          navigate('/');
        }
      }
      else if (event === 'TOKEN_REFRESHED' && currentSession) {
        if (isMounted) {
          console.log('Token refreshed, updating session state');
          setSession(currentSession);
          setUser(currentSession.user);
          setLoading(false);
          setAuthError(null);
        }
      }
    });

    // Cleanup function
    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [navigate]);

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setAuthError(null);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline'
          }
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Google sign-in error:', error.message);
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with email magic link
  const signInWithEmail = async (email) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Email sign-in error:', error.message);
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Direct sign-in method with email/password
  const signInWithCredentials = async (email, password) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Credentials sign-in error:', error.message);
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign-out error:', error.message);
      setAuthError(error.message);
    } finally {
      setLoading(false);
      navigate('/');
    }
  };

  // Export context value
  const value = {
    session,
    user,
    loading,
    authError,
    signInWithGoogle,
    signInWithEmail,
    signInWithCredentials,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 