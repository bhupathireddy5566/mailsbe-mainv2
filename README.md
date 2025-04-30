# MAILSBE

Email tracking application built with React and Supabase.

## Overview

MAILSBE allows you to track when your emails are opened. Simply create a tracked email, copy the special tracking text into your email, and you'll be notified when the recipient opens it.

## Features

- Email tracking with read receipts
- Google authentication
- Email magic link authentication
- Real-time tracking notifications
- Clean, modern UI

## Technology Stack

- React (Create React App)
- Supabase (Authentication, Database, Edge Functions)
- Material UI
- React Router

## Setup Instructions

### Prerequisites

- Node.js and npm installed
- Supabase account

### Local Development

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the project root with your Supabase credentials:
   ```
   REACT_APP_SUPABASE_URL=https://your-supabase-url.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Start the development server:
   ```
   npm start
   ```

### Supabase Setup

1. Create a new Supabase project
2. Set up Google OAuth:
   - Go to Supabase Dashboard → Authentication → Providers
   - Enable Google provider and configure with your Google Cloud credentials
3. Create the emails table:
   ```sql
   CREATE TABLE emails (
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

   -- Create policies for user access
   CREATE POLICY "Allow users to view their own emails"
     ON emails FOR SELECT USING (auth.uid() = user_id);

   CREATE POLICY "Allow users to insert their own emails"
     ON emails FOR INSERT WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Allow service role to access all emails"
     ON emails FOR ALL TO service_role USING (true);
   ```
4. Deploy the tracking function:
   - Create a new Edge Function in Supabase
   - Deploy the code in `functions/update.js`

## Deployment

This project can be deployed to any static hosting service (Vercel, Netlify, GitHub Pages):

```
npm run build
```

## License

MIT
