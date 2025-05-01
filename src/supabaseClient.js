import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and anon key from environment variables or defaults
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://ajkfmaqdwksljzkygfkd.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqa2ZtYXFkd2tzbGp6a3lnZmtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQzODUwMjYsImV4cCI6MjAyOTk2MTAyNn0.a6hS0CJBIqn6UCqXnCgvJJ9LZcww4gfXMDD-g85YELE';

console.log('Initializing Supabase client at URL:', supabaseUrl);

// Create Supabase client with enhanced configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'mailsbe-auth', // Simplified key name
    detectSessionInUrl: true,
    autoRefreshToken: true,
    flowType: 'pkce', // Change to PKCE (more secure and reliable)
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Process URL hash containing access token if present
export const processUrlHash = () => {
  if (window.location.hash && window.location.hash.includes('access_token')) {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const expiresIn = hashParams.get('expires_in');
    
    if (accessToken) {
      console.log('Found access token in URL, setting session manually');
      return { accessToken, refreshToken, expiresIn };
    }
  }
  return null;
};

// Set session from hash if available
export const setSessionFromHash = async () => {
  const tokens = processUrlHash();
  if (tokens) {
    try {
      const { data, error } = await supabase.auth.setSession({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken || ''
      });
      
      if (error) {
        console.error('Error setting session from URL hash:', error.message);
        return false;
      }
      
      if (data?.session) {
        console.log('Successfully set session from URL hash');
        return true;
      }
    } catch (err) {
      console.error('Exception setting session from hash:', err);
    }
  }
  return false;
};

// For debugging only
export const clearAuthStorage = () => {
  localStorage.removeItem('mailsbe-auth');
  console.log('Auth storage cleared');
};

// Debug listener for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log(`Auth event: ${event}`, session ? `(User: ${session.user.email})` : '(No session)');
}); 