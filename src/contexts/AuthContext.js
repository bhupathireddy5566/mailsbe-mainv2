import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

// Create auth context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const navigate = useNavigate();

  // Process URL access token directly - more reliable than waiting for Supabase
  const processUrlToken = () => {
    if (window.location.hash && window.location.hash.includes('access_token')) {
      console.log('Found access_token in URL hash - processing directly');
      
      // Extract the token for debugging
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      console.log('Access token found:', accessToken ? 'YES (token exists)' : 'NO');
      
      // Clean URL immediately - important!
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, document.title, '/dashboard');
      }
      
      return true;
    }
    return false;
  };

  // Main authentication initialization
  useEffect(() => {
    let isMounted = true;
    console.log('AuthProvider initializing...');

    const initializeAuth = async () => {
      // Process URL token first before checking session
      const hasProcessedToken = processUrlToken();
      
      try {
        // For URLs with tokens, do a forced session refresh
        if (hasProcessedToken) {
          console.log('Refreshing session after token processing...');
          setLoading(true);
          
          // Try to refresh the session for token URLs
          try {
            const { data, error } = await supabase.auth.refreshSession();
            
            if (error) {
              console.error('Session refresh error:', error.message);
              setAuthError(error.message);
            } else if (data?.session) {
              console.log('✓ Session obtained after token processing');
              if (isMounted) {
                setSession(data.session);
                setUser(data.session.user);
                setAuthError(null);
              }
            } else {
              console.warn('No session data after refresh');
            }
          } catch (refreshError) {
            console.error('Exception during session refresh:', refreshError);
          }
          
          if (isMounted) setLoading(false);
          return;
        }
        
        // Normal session check for regular page loads
        console.log('Performing regular session check...');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session check error:', error.message);
          if (isMounted) setAuthError(error.message);
        } else if (data?.session) {
          console.log('✓ Found existing session:', data.session.user.email);
          if (isMounted) {
            setSession(data.session);
            setUser(data.session.user);
            setAuthError(null);
          }
        } else {
          console.log('No active session found');
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
          setSession(currentSession);
          setUser(currentSession.user);
          setLoading(false);
        }
      }
    });

    // Cleanup function
    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [navigate]);

  // Direct sign-in method for testing
  const signInWithCredentials = async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Credentials sign-in error:', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

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