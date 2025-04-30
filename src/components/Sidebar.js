import React from 'react';
import { Box, Button, Typography, Divider, IconButton, Avatar } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import { supabase } from '../supabaseClient';

const Sidebar = ({ userName, userEmail, setShowPopup }) => {
  // Handle logout
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error signing out:', error);
  };

  return (
    <Box
      sx={{
        width: 250,
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #E5E7EB',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
      }}
    >
      {/* Logo */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
        <Typography 
          variant="h5" 
          component="div" 
          sx={{ 
            fontWeight: 'bold', 
            color: '#00875A',
            letterSpacing: '-0.5px'
          }}
        >
          MAILSBE
        </Typography>
      </Box>

      {/* Compose Button */}
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setShowPopup(true)}
        sx={{ 
          m: 2, 
          py: 1,
          textTransform: 'none',
          fontWeight: 'medium'
        }}
      >
        Compose mail
      </Button>

      {/* Navigation */}
      <Box sx={{ p: 1 }}>
        <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: '#6B7280' }}>
          Menu
        </Typography>
        
        <Button
          fullWidth
          startIcon={<DashboardIcon />}
          sx={{ 
            justifyContent: 'flex-start', 
            textTransform: 'none',
            py: 1,
            px: 2,
            mb: 1,
            color: '#111827',
            backgroundColor: '#F3F4F6',
            '&:hover': {
              backgroundColor: '#E5E7EB',
            }
          }}
        >
          Overview
        </Button>
        
        <Button
          fullWidth
          startIcon={<SettingsIcon />}
          sx={{ 
            justifyContent: 'flex-start', 
            textTransform: 'none',
            py: 1,
            px: 2,
            color: '#6B7280',
            '&:hover': {
              backgroundColor: '#F3F4F6',
            }
          }}
        >
          Settings
        </Button>
      </Box>

      {/* Spacer */}
      <Box sx={{ flexGrow: 1 }} />

      {/* Profile Section */}
      <Box sx={{ p: 2 }}>
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ mr: 2, bgcolor: '#00875A' }}>
            {userName?.charAt(0) || 'U'}
          </Avatar>
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <Typography variant="subtitle2" noWrap>
              {userName || 'User'}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {userEmail || 'user@example.com'}
            </Typography>
          </Box>
        </Box>
        
        {/* Logout Button */}
        <Button
          fullWidth
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{ 
            justifyContent: 'flex-start', 
            textTransform: 'none',
            py: 1,
            px: 2,
            color: '#EF4444',
            '&:hover': {
              backgroundColor: '#FEE2E2',
            }
          }}
        >
          Log out
        </Button>
      </Box>
    </Box>
  );
};

export default Sidebar;
