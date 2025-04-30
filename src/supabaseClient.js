import { createClient } from '@supabase/supabase-js';

// Supabase project URL and anon key (public)
const supabaseUrl = 'https://ajkfmaqdwksljzkygfkd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqa2ZtYXFkd2tzbGp6a3lnZmtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQzODUwMjYsImV4cCI6MjAyOTk2MTAyNn0.a6hS0CJBIqn6UCqXnCgvJJ9LZcww4gfXMDD-g85YELE';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey); 