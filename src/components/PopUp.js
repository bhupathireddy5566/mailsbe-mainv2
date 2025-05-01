import React, { useState, useEffect, useRef } from "react";
import {
  TextField,
  Typography,
  IconButton,
  FormHelperText,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
} from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import toast from "react-hot-toast";
import { supabase } from "../supabaseClient"; // Import Supabase client
import { useAuth } from '../contexts/AuthContext'

// Update to use the Supabase function URL
const functionUrl = 'https://ajkfmaqdwksljzkygfkd.functions.supabase.co/swift-responder';

console.log(`Using Edge Function URL: ${functionUrl}`);

const PopUp = ({ setPopUp }) => {
  // State variables
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [imgText, setImgText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Ref for the image container
  const ref = useRef();

  const { user } = useAuth()

  // Get user data from Supabase
  useEffect(() => {
    if (user && user.user_metadata) {
      setName(user.user_metadata.name || "");
    }
  }, [user]);

  // Generate tracking pixel URL on component mount
  useEffect(() => {
    const time = new Date().getTime();
    setImgText(`${functionUrl}?text=${time}`);
    console.log("Generated tracking URL:", `${functionUrl}?text=${time}`);
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('emails')
        .insert({
          email,
          description,
          img_text: imgText.split("=")[1], // Extract the query parameter
          user_id: user.id
        })
        
      if (error) throw error;
      
      toast.success('Email tracking created successfully');
      setPopUp(false);
    } catch (err) {
      console.error("Error adding email:", err);
      setError(err.message);
      toast.error("Unable to add email");
    } finally {
      setLoading(false);
    }
  };

  // Tracking pixel display style
  const pixelDisplayStyle = {
    padding: '15px',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    backgroundColor: '#f5f5f5',
    marginBottom: '20px',
    position: 'relative',
    overflow: 'hidden',
    wordBreak: 'break-word',
  };

  const pixelHelperTextStyle = {
    fontSize: '12px',
    color: '#666',
    marginTop: '8px',
    display: 'block',
  };

  return (
    <Dialog 
      open={true} 
      onClose={() => setPopUp(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <Typography variant="h6">Enter new email details</Typography>
        <IconButton
          aria-label="Close popup"
          onClick={() => setPopUp(false)}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 3 }}>
          <FormControl sx={{ width: "100%" }} error={!!error}>
            {/* Email Field */}
            <TextField
              fullWidth
              color="primary"
              variant="outlined"
              type="email"
              label="Email"
              placeholder="Receiver's email"
              size="medium"
              margin="normal"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {/* Description Field */}
            <TextField
              color="primary"
              variant="outlined"
              multiline
              rows={2}
              label="Description"
              placeholder="Some distinct description"
              helperText="This text will help to separate emails."
              required
              fullWidth
              margin="normal"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {/* Name Field */}
            <TextField
              color="primary"
              variant="outlined"
              label="Your Name"
              placeholder="Enter your full name"
              helperText="An image will be attached with this text."
              required
              fullWidth
              margin="normal"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            {/* Tracking Pixel */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Tracking Pixel</Typography>
              <Box sx={pixelDisplayStyle} ref={ref}>
                {name && name.substring(0, 1)}
                <img
                  src={imgText}
                  width={1}
                  height={1}
                  alt="Tracking pixel"
                  style={{ opacity: 0 }}
                />
                {name && name.substring(1, name.length)}
              </Box>
              <Typography variant="caption" sx={pixelHelperTextStyle}>
                Copy this text and paste it in the email.{" "}
                <strong>Important: Don't erase it after pasting.</strong>
              </Typography>
            </Box>

            {/* Error Message */}
            {error && (
              <FormHelperText error>
                Error occurred! {error}
              </FormHelperText>
            )}
          </FormControl>
        </DialogContent>
        
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <LoadingButton
            variant="contained"
            color="primary"
            endIcon={<SaveIcon />}
            size="large"
            fullWidth
            type="submit"
            loading={loading}
          >
            Save
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PopUp;