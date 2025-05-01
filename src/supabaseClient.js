import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and anon key from environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('Initializing Supabase client with URL:', supabaseUrl);

// Create Supabase client with session persistence enabled
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'mailsbe-auth-token',
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'implicit'
  },
  global: {
    headers: {
      'x-application-name': 'mailsbe'
    }
  }
});

// Log initialization
console.log('Supabase client initialized successfully');

// Debug listener for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log(`🔑 Auth event: ${event}`);
  if (session) {
    console.log(`User: ${session.user.email}`);
  }
}); 