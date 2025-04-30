import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip
} from '@mui/material';
import { supabase } from '../supabaseClient';
import Spinner from './Spinner';

// Format date to a readable format
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString();
};

const EmailsTable = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch emails from Supabase
    const fetchEmails = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        // Fetch emails for current user
        const { data, error } = await supabase
          .from('emails')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setEmails(data || []);
      } catch (err) {
        console.error('Error fetching emails:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmails();
  }, []);

  // Subscribe to changes in real-time
  useEffect(() => {
    const setupSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;
        
        // Set up real-time subscription
        const subscription = supabase
          .channel('emails-changes')
          .on('postgres_changes', {
            event: '*', 
            schema: 'public',
            table: 'emails',
            filter: `user_id=eq.${user.id}`
          }, (payload) => {
            // Update local state based on change type
            if (payload.eventType === 'INSERT') {
              setEmails(prev => [payload.new, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setEmails(prev => prev.map(email => 
                email.id === payload.new.id ? payload.new : email
              ));
            }
          })
          .subscribe();
          
        // Clean up subscription on unmount
        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error('Error setting up subscription:', err);
      }
    };
    
    setupSubscription();
  }, []);

  if (loading) return <Spinner />;
  
  if (error) {
    return (
      <Typography color="error" variant="h6" align="center" sx={{ my: 4 }}>
        Error loading emails: {error}
      </Typography>
    );
  }
  
  if (emails.length === 0) {
    return (
      <Typography variant="h6" align="center" sx={{ my: 4 }}>
        No emails added yet. Add your first email to track opens!
      </Typography>
    );
  }
  
  return (
    <TableContainer component={Paper} sx={{ mt: 4 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell><strong>Email</strong></TableCell>
            <TableCell><strong>Description</strong></TableCell>
            <TableCell><strong>Status</strong></TableCell>
            <TableCell><strong>Created At</strong></TableCell>
            <TableCell><strong>Last Seen</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {emails.map((email) => (
            <TableRow key={email.id}>
              <TableCell>{email.email}</TableCell>
              <TableCell>{email.description}</TableCell>
              <TableCell>
                {email.seen ? (
                  <Chip label="Seen" color="success" size="small" />
                ) : (
                  <Chip label="Not Seen" color="warning" size="small" />
                )}
              </TableCell>
              <TableCell>{formatDate(email.created_at)}</TableCell>
              <TableCell>{email.seen ? formatDate(email.seen_at) : 'Not opened yet'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default EmailsTable;