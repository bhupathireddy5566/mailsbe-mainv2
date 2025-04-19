import {
  TextField,
  Typography,
  IconButton,
  FormHelperText,
  FormControl,
  Button,
  Box,
} from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import SaveIcon from "@mui/icons-material/Save";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import toast from "react-hot-toast";
import { useUserData } from "@nhost/react";

import styles from "../styles/components/Popup.module.css";
import { useState, useEffect, useRef } from "react";
import { gql, useMutation } from "@apollo/client";

// Use the exact functions URL from the Nhost dashboard
const functionsUrl = 'https://ttgygockyojigiwmkjsl.functions.ap-south-1.nhost.run/v1';

const ADD_EMAIL = gql`
  mutation addEmail(
    $email: String!
    $description: String!
    $img_text: String!
    $user_id: String!
  ) {
    insert_emails_one(object: {
      description: $description
      email: $email
      img_text: $img_text
      user_id: $user_id
    }) {
      id
      email
      description
      img_text
      seen
      created_at
    }
  }
`;

const PopUp = ({ setPopUp }) => {
  //get the user data
  const user = useUserData();

  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [name, setName] = useState(user.displayName);
  const [imgText, setImgText] = useState("");

  const [addEmail, { data, loading, error }] = useMutation(ADD_EMAIL);

  const ref = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Extract the tracking ID from the URL
    const trackingUrl = imgText;
    const trackingId = trackingUrl.split("=")[1];
    
    console.log("Submitting email with tracking ID:", trackingId);
    console.log("Full tracking URL:", trackingUrl);
    
    if (!trackingId) {
      toast.error("Invalid tracking URL");
      return;
    }

    try {
      // Save both the full tracking URL and ID for verification
      const result = await addEmail({
        variables: {
          email: email,
          description: description,
          img_text: trackingId, // This is what the server will look for
          user_id: user.id,
        },
      });
      
      console.log("Email successfully added with result:", result);
      toast.success("Email added successfully");
      setPopUp(false);
      window.location.reload();
    } catch (err) {
      console.error("Error adding email:", err);
      toast.error("Unable to add email: " + (err.message || "Unknown error"));
    }
  };

  useEffect(() => {
    // Generate a unique timestamp for tracking - use current time in milliseconds
    const time = new Date().getTime();
    // Use the correct functions URL with the update function
    const trackingUrl = `${functionsUrl}/update?text=${time}`;
    console.log("Generated tracking URL:", trackingUrl);
    console.log("Tracking ID:", time);
    
    setImgText(trackingUrl);
  }, []);

  // This function will copy just the URL of the tracking pixel
  const copyTrackingUrl = () => {
    navigator.clipboard.writeText(imgText)
      .then(() => {
        toast.success("Tracking URL copied! Insert as image in your email");
      })
      .catch(err => {
        console.error("Failed to copy tracking URL:", err);
        toast.error("Failed to copy tracking URL");
      });
  };
  
  // Display instructions based on email client
  const showEmailInstructions = () => {
    toast.success(
      <div>
        <p><strong>How to add tracking in your email:</strong></p>
        <p>1. Copy the tracking URL</p>
        <p>2. In your email, insert an image using the URL</p>
        <p>3. Make the image very small (1x1px)</p>
      </div>,
      { duration: 8000 }
    );
  };

  return (
    <div className={styles.popup}>
      <div className={styles.popUpDiv}>
        <div className={styles.header}>
          <Typography variant="h6" component="h4">
            Enter new email details
          </Typography>

          <IconButton aria-label="close" onClick={() => setPopUp(false)}>
            <HighlightOffIcon />
          </IconButton>
        </div>
        <form className={styles.groupForm} onSubmit={handleSubmit}>
          <FormControl sx={{ m: 0, width: "100%" }} error={error}>
            <TextField
              className={styles.inputOutlinedTextField}
              fullWidth
              color="primary"
              variant="outlined"
              type="email"
              label="Email"
              placeholder="Receiver's email"
              size="medium"
              margin="none"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              className={styles.textAreaOutlinedTextField}
              color="primary"
              variant="outlined"
              multiline
              label="Description"
              placeholder="Some distinct description"
              helperText="This text will help to seperate emails."
              required
              fullWidth
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <TextField
              color="primary"
              variant="outlined"
              label="Your Name"
              placeholder="Enter your full name"
              helperText="An image will be attached with this text."
              required
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ marginBottom: 2 }}
            />

            <Box sx={{ 
              border: '1px solid #e0e0e0', 
              borderRadius: 1, 
              padding: 2,
              marginBottom: 2,
              backgroundColor: '#f5f5f5'
            }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
                Track when your email is opened
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, marginY: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<ContentCopyIcon />}
                  onClick={copyTrackingUrl}
                  fullWidth
                >
                  COPY TRACKING URL
                </Button>
                
                <Button 
                  variant="outlined"
                  color="info"
                  onClick={showEmailInstructions}
                  fullWidth
                >
                  HOW TO USE IN EMAIL
                </Button>
              </Box>
              
              <Typography variant="caption" color="textSecondary">
                Add this as a tiny invisible image in your email to track when it's opened
              </Typography>
              
              <TextField
                value={imgText}
                size="small"
                fullWidth
                InputProps={{ readOnly: true }}
                sx={{ mt: 1, fontSize: '0.75rem' }}
                variant="outlined"
              />
            </Box>

            {error && (
              <FormHelperText>{`Error occured! ${error.message}`}</FormHelperText>
            )}

            <LoadingButton
              className={styles.buttonContainedText}
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
          </FormControl>
        </form>
      </div>
    </div>
  );
};

export default PopUp;
