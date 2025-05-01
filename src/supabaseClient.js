import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and anon key from environment variables or defaults
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://ajkfmaqdwksljzkygfkd.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqa2ZtYXFkd2tzbGp6a3lnZmtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQzODUwMjYsImV4cCI6MjAyOTk2MTAyNn0.a6hS0CJBIqn6UCqXnCgvJJ9LZcww4gfXMDD-g85YELE';

console.log('Initializing Supabase client at URL:', supabaseUrl);

// Create Supabase client with enhanced configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Enable session persistence  
    storageKey: 'mailsbe-auth-session', // Custom storage key
    detectSessionInUrl: true, // Detect access token in URL
    autoRefreshToken: true, // Enable automatic token refresh
    debug: true, // Enable debug logging for auth
    flowType: 'implicit' // Use implicit flow (works better with Vercel)
  },
  global: {
    headers: {
      'x-application-name': 'mailsbe',
      'x-application-version': '1.0.0'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Log session details for debugging
const logSessionDetails = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error fetching session:', error.message);
    } else if (data?.session) {
      console.log('Session found for user:', data.session.user.email);
    } else {
      console.log('No active session found');
    }
  } catch (err) {
    console.error('Error checking session:', err);
  }
};

// Check initial session
logSessionDetails();

// Debug listener for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log(`🔑 Auth event: ${event}`);
  if (session) {
    console.log(`User: ${session.user.email}`);
  }
}); 