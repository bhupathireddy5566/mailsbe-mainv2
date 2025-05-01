import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import EmailsTable from '../components/EmailsTable';
import PopUp from '../components/PopUp';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [showPopup, setShowPopup] = useState(false);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 4
      }}>
        <Box>
          <Typography variant="h4" component="h1" color="primary" gutterBottom>
            Email Tracking Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Welcome back, {user?.user_metadata?.name || user?.email}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setShowPopup(true)}
          >
            New Email
          </Button>
          <Button 
            variant="outlined"
            color="primary"
            startIcon={<LogoutIcon />}
            onClick={signOut}
          >
            Sign Out
          </Button>
        </Box>
      </Box>

      <EmailsTable />
      
      {showPopup && <PopUp setPopUp={setShowPopup} />}
    </Box>
  );
};

export default Dashboard; 