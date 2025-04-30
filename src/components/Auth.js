import React from 'react';
import { Button, Typography, Box, Paper } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { supabase } from '../supabaseClient';

const Auth = () => {
  // Handle Google sign in
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    
    if (error) {
      console.error('Error signing in with Google:', error.message);
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
          width: '100%'
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          MAILSBE
        </Typography>
        
        <Typography variant="body1" align="center" sx={{ mb: 3 }}>
          Sign in to track your emails and see when they're opened
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<GoogleIcon />}
          onClick={signInWithGoogle}
          fullWidth
          size="large"
          sx={{ mt: 2 }}
        >
          Sign in with Google
        </Button>
      </Paper>
    </Box>
  );
};

export default Auth; 