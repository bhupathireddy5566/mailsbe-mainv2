import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check for session on initial load
  useEffect(() => {
    console.log('AuthProvider init');
    
    const checkSession = async () => {
      console.log('Checking session...');
      try {
        setLoading(true); // Ensure loading is true when checking
        
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error fetching session:', error.message);
          setSession(null);
          setUser(null);
        } else {
          console.log('Session data:', data?.session ? 'Found' : 'Not found');
          setSession(data?.session || null);
          setUser(data?.session?.user || null);
        }
      } catch (err) {
        console.error('Session check failed:', err);
        setSession(null);
        setUser(null);
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    };

    // Handle access token in URL
    if (window.location.hash && window.location.hash.includes('access_token')) {
      console.log('Access token found in URL - waiting for session');
      // Wait a bit for the session to be established
      setTimeout(() => {
        checkSession().then(() => {
          if (window.history && window.history.replaceState) {
            window.history.replaceState({}, document.title, '/dashboard');
          }
        });
      }, 1000);
    } else {
      checkSession();
    }

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log('Auth event:', event, currentSession ? 'with session' : 'no session');
      
      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        setLoading(false);
        
        if (event === 'SIGNED_IN') {
          console.log('User signed in, navigating to dashboard');
          navigate('/dashboard');
        }
      } else {
        setSession(null);
        setUser(null);
        setLoading(false);
        
        if (event === 'SIGNED_OUT') {
          console.log('User signed out, navigating to home');
          navigate('/');
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate]);

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline'
          }
        }
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error signing in with Google:', error.message);
      throw error;
    }
  };

  // Sign in with email magic link
  const signInWithEmail = async (email) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        throw error;
      }
      return { success: true };
    } catch (error) {
      console.error('Error signing in with email:', error.message);
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error.message);
    }
  };

  // Debug logging
  useEffect(() => {
    console.log('Auth state updated:', { 
      isAuthenticated: !!session, 
      isLoading: loading,
      user: user?.email
    });
  }, [session, loading, user]);

  const value = {
    session,
    user,
    loading,
    signInWithGoogle,
    signInWithEmail,
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