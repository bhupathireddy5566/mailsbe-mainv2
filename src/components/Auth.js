import React, { useState } from 'react';
import { Button, Typography, Box, Paper, TextField, Divider } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import EmailIcon from '@mui/icons-material/Email';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Handle Google sign in
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setLoginError('');
      
      // Store a flag that we're attempting login
      localStorage.setItem('auth_in_progress', 'true');
      
      console.log('Starting Google sign in with redirect to: ', window.location.origin);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          // Ensure provider always shows account selection
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline'
          }
        }
      });
      
      if (error) {
        setLoginError(error.message);
        toast.error('Google sign in failed: ' + error.message);
        console.error('Error signing in with Google:', error);
      }
    } catch (err) {
      setLoginError('Network error connecting to authentication service');
      toast.error('Failed to connect to authentication service');
      console.error('Exception during Google sign in:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle email sign in with magic link
  const signInWithEmail = async (e) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    try {
      setLoading(true);
      setLoginError('');
      
      console.log('Starting email sign in with redirect to: ', window.location.origin);
      
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      
      if (error) {
        setLoginError(error.message);
        toast.error(error.message);
        console.error('Error signing in with email:', error);
      } else {
        toast.success('Check your email for the login link!');
        setEmail('');
      }
    } catch (err) {
      setLoginError('Network error sending magic link');
      toast.error('Failed to send magic link');
      console.error('Exception during email sign in:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        padding: 2
      }}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          maxWidth: 400,
          width: '100%',
          borderRadius: 2
        }}
      >
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            fontWeight: 'bold', 
            color: '#00875A',
            letterSpacing: '-0.5px',
            mb: 1
          }}
        >
          MAILSBE
        </Typography>
        
        <Typography variant="body1" align="center" sx={{ mb: 4, color: '#4B5563' }}>
          Sign in to track your emails and see when they're opened
        </Typography>
        
        {loginError && (
          <Typography color="error" sx={{ mb: 2, fontSize: '0.875rem' }}>
            {loginError}
          </Typography>
        )}
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<GoogleIcon />}
          onClick={signInWithGoogle}
          fullWidth
          size="large"
          disabled={loading}
          sx={{ 
            mb: 2,
            py: 1.5,
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '1rem'
          }}
        >
          Sign in with Google
        </Button>
        
        <Divider sx={{ width: '100%', mb: 3, mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            or
          </Typography>
        </Divider>
        
        <form onSubmit={signInWithEmail} style={{ width: '100%' }}>
          <TextField 
            fullWidth
            label="Email"
            variant="outlined"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
            placeholder="your.email@example.com"
            required
          />
          
          <Button
            variant="outlined"
            color="primary"
            startIcon={<EmailIcon />}
            type="submit"
            fullWidth
            disabled={loading}
            sx={{ 
              py: 1.5,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '1rem'
            }}
          >
            Sign in with Email
          </Button>
        </form>
        
        <Typography variant="caption" sx={{ mt: 3, color: '#6B7280', textAlign: 'center' }}>
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Auth; 