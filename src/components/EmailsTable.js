import React, { useEffect, useState } from 'react';
import { 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Typography,
  CircularProgress,
  Alert,
  Box
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export default function EmailsTable() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        console.log('Fetching emails for user:', user?.id);
        setLoading(true);
        
        if (!user) {
          console.log('User not authenticated yet, delaying fetch');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('emails')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching emails:', error);
          setError(`Error loading emails: ${error.message}`);
          return;
        }

        console.log(`Fetched ${data.length} emails`);
        setEmails(data || []);
        setError(null);
      } catch (err) {
        console.error('Exception fetching emails:', err);
        setError(`Failed to load emails: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchEmails();

    // Set up real-time subscription for email updates
    const subscription = supabase
      .channel('emails_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'emails', filter: `user_id=eq.${user?.id}` },
        (payload) => {
          console.log('Real-time update received:', payload);
          fetchEmails();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (emails.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No emails tracked yet. Create your first tracking email by clicking "New Email".
        </Typography>
      </Paper>
    );
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(date);
    } catch (err) {
      console.error('Error formatting date:', err);
      return dateString;
    }
  }

  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="tracked emails table">
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            <TableCell>Email</TableCell>
            <TableCell>Description</TableCell>
            <TableCell align="center">Tracking ID</TableCell>
            <TableCell align="center">Status</TableCell>
            <TableCell align="center">Created At</TableCell>
            <TableCell align="center">Seen At</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {emails.map((row) => (
            <TableRow
              key={row.id}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {row.email}
              </TableCell>
              <TableCell>{row.description}</TableCell>
              <TableCell align="center">{row.img_text}</TableCell>
              <TableCell align="center">
                {row.seen ? (
                  <CheckCircleIcon color="success" />
                ) : (
                  <RadioButtonUncheckedIcon color="disabled" />
                )}
              </TableCell>
              <TableCell align="center">{formatDate(row.created_at)}</TableCell>
              <TableCell align="center">{row.seen ? formatDate(row.seen_at) : 'Not seen yet'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}