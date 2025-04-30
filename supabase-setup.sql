-- Create emails table in Supabase
CREATE TABLE IF NOT EXISTS emails (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  description TEXT,
  img_text TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  seen BOOLEAN DEFAULT FALSE,
  seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view only their own data
CREATE POLICY "Allow users to view their own emails"
  ON emails
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for users to insert their own data
CREATE POLICY "Allow users to insert their own emails"
  ON emails
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own data
CREATE POLICY "Allow users to update their own emails"
  ON emails
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow service function to read/write any email data (for tracking pixel)
CREATE POLICY "Allow service role to access all emails"
  ON emails
  FOR ALL
  TO service_role
  USING (true); 