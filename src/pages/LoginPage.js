import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Typography, 
  Box, 
  Paper, 
  TextField, 
  Divider, 
  Alert,
  Collapse,
  IconButton
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import EmailIcon from '@mui/icons-material/Email';
import KeyIcon from '@mui/icons-material/Key';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import { Navigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [directLoginOpen, setDirectLoginOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const { signInWithGoogle, signInWithEmail, signInWithCredentials, session, authError } = useAuth();

  // Clear errors when form changes
  useEffect(() => {
    setLoginError('');
  }, [email, password]);

  // Show auth errors from context
  useEffect(() => {
    if (authError) {
      setLoginError(authError);
    }
  }, [authError]);

  // Redirect if already logged in
  if (session) {
    return <Navigate to="/dashboard" />;
  }

  // Handle Google sign in
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setLoginError('');
      await signInWithGoogle();
    } catch (err) {
      setLoginError(err.message || 'Failed to sign in with Google');
      toast.error('Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle email sign in with magic link
  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    try {
      setLoading(true);
      setLoginError('');
      await signInWithEmail(email);
      toast.success('Check your email for the login link!');
      setEmail('');
    } catch (err) {
      setLoginError(err.message || 'Failed to send magic link');
      toast.error(err.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  // Handle direct email/password login
  const handleDirectLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    try {
      setLoading(true);
      setLoginError('');
      await signInWithCredentials(email, password);
      toast.success('Login successful!');
    } catch (err) {
      setLoginError(err.message || 'Invalid email or password');
      toast.error('Login failed: ' + (err.message || 'Invalid credentials'));
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
        
        <Typography variant="body1" align="center" sx={{ mb: 3, color: '#4B5563' }}>
          Sign in to track your emails and see when they're opened
        </Typography>
        
        {loginError && (
          <Alert 
            severity="error" 
            sx={{ mb: 3, width: '100%' }}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => setLoginError('')}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
          >
            {loginError}
          </Alert>
        )}
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleSignIn}
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
        
        <form onSubmit={handleEmailSignIn} style={{ width: '100%' }}>
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
            Sign in with Email Link
          </Button>
        </form>
        
        <Box sx={{ width: '100%', mt: 3 }}>
          <Button
            variant="text"
            color="primary"
            endIcon={<ExpandMoreIcon 
              sx={{ 
                transform: directLoginOpen ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.3s'
              }} 
            />}
            onClick={() => setDirectLoginOpen(!directLoginOpen)}
            sx={{ mb: 1, textTransform: 'none' }}
          >
            Having trouble logging in?
          </Button>
          
          <Collapse in={directLoginOpen}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Direct Login
              </Typography>
              
              <form onSubmit={handleDirectLogin} style={{ width: '100%' }}>
                <TextField 
                  fullWidth
                  label="Email"
                  variant="outlined"
                  type="email"
                  size="small"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{ mb: 2 }}
                  required
                />
                
                <TextField 
                  fullWidth
                  label="Password"
                  variant="outlined"
                  type="password"
                  size="small"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  sx={{ mb: 2 }}
                  required
                />
                
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<KeyIcon />}
                  type="submit"
                  fullWidth
                  disabled={loading}
                  size="small"
                  sx={{ textTransform: 'none' }}
                >
                  Sign in with Password
                </Button>
              </form>
            </Paper>
          </Collapse>
        </Box>
        
        <Typography variant="caption" sx={{ mt: 3, color: '#6B7280', textAlign: 'center' }}>
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </Typography>
      </Paper>
    </Box>
  );
};

export default LoginPage; 