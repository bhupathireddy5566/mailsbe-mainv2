import {
  TextField,
  Typography,
  IconButton,
  FormHelperText,
  FormControl,
} from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import SaveIcon from "@mui/icons-material/Save";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import toast from "react-hot-toast";
import { useUserData } from "@nhost/react";

import styles from "../styles/components/Popup.module.css";
import { useState, useEffect, useRef, useMemo } from "react";
import { gql, useMutation } from "@apollo/client";

// --- Configuration --- 
// Ensure these match your Nhost project
const NHOST_SUBDOMAIN = process.env.REACT_APP_NHOST_SUBDOMAIN || "ttgygockyojigiwmkjsl";
const NHOST_REGION = process.env.REACT_APP_NHOST_REGION || "ap-south-1";

// Construct the base URL for Nhost functions
const FUNCTIONS_BASE_URL = `https://${NHOST_SUBDOMAIN}.functions.${NHOST_REGION}.nhost.run/v1`;
console.log(`[PopUp] Using Functions Base URL: ${FUNCTIONS_BASE_URL}`);

// GraphQL Mutation to add a new email entry
const ADD_EMAIL = gql`
  mutation addEmail(
    $email: String!
    $description: String!
    $img_text: String!       // This should store the UNIQUE ID (timestamp)
    $user_id: String!
  ) {
    insert_emails_one(object: {
      description: $description
      email: $email
      img_text: $img_text      // Storing the timestamp here
      user_id: $user_id
    }) {
      id                     // Request needed fields back
    }
  }
`;

const PopUp = ({ setPopUp }) => {
  const user = useUserData();

  // State for form fields
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [name, setName] = useState(user?.displayName || ""); 

  // --- Tracking Pixel Logic --- 
  // Generate a unique ID (timestamp) only once when the component mounts
  const uniqueTrackingId = useMemo(() => new Date().getTime().toString(), []); 
  
  // Construct the full tracking pixel URL using the unique ID
  const trackingPixelUrl = `${FUNCTIONS_BASE_URL}/update?text=${uniqueTrackingId}`;
  console.log(`[PopUp] Generated Tracking Pixel URL: ${trackingPixelUrl}`);
  console.log(`[PopUp] Unique Tracking ID to be saved: ${uniqueTrackingId}`);

  // Mutation hook
  const [addEmailMutation, { loading, error }] = useMutation(ADD_EMAIL);

  // Ref for the image container (if needed for copy functionality)
  const ref = useRef();

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Ensure user and tracking ID are available
    if (!user || !uniqueTrackingId) {
      toast.error("User data or tracking ID missing. Please try again.");
      return;
    }

    console.log(`[PopUp] Submitting form. Saving img_text: ${uniqueTrackingId}`);

    try {
      const result = await addEmailMutation({
        variables: {
          email: email,
          description: description,
          img_text: uniqueTrackingId, // IMPORTANT: Save ONLY the ID, not the full URL
          user_id: user.id,
        },
      });

      if (result.data?.insert_emails_one?.id) {
        toast.success(`Email added successfully (ID: ${result.data.insert_emails_one.id})`);
        setPopUp(false);
        // Consider updating local state instead of full reload if possible
        window.location.reload(); 
      } else {
         // Handle cases where the mutation succeeded but didn't return expected data
         console.error("[PopUp] Mutation succeeded but response format unexpected:", result);
         toast.error("Email added, but couldn't confirm response.");
         setPopUp(false);
      }

    } catch (err) {
      console.error("[PopUp] Error submitting form:", err);
      toast.error(`Unable to add email: ${err.message}`);
    }
  };

  // No useEffect needed just for setting the URL, useMemo handles the ID generation

  return (
    <div className={styles.popup}>
      <div className={styles.popUpDiv}>
        {/* Header */}
        <div className={styles.header}>
          <Typography variant="h6" component="h4">
            Enter new email details
          </Typography>
          <IconButton
            aria-label="Close popup"
            onClick={() => setPopUp(false)}
          >
            <HighlightOffIcon />
          </IconButton>
        </div>

        {/* Form */}
        <form className={styles.groupForm} onSubmit={handleSubmit}>
          <FormControl sx={{ m: 0, width: "100%" }} error={!!error}>
            {/* Email Field */}
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

            {/* Description Field */}
            <TextField
              className={styles.textAreaOutlinedTextField}
              color="primary"
              variant="outlined"
              multiline
              label="Description"
              placeholder="Some distinct description"
              helperText="This text will help to separate emails."
              required
              fullWidth
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
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            {/* Tracking Pixel Display - Uses the full URL */}
            <div className={styles.copyBox}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Copy the element below and paste it into your email body:
              </Typography>
              <div className={styles.imgDiv} ref={ref}>
                {/* Display name around the pixel */}
                {name && name.substring(0, 1)} 
                <img
                  src={trackingPixelUrl} // Use the generated URL here
                  className={styles.pixelImg}
                  width={1}
                  height={1}
                  alt=""
                  style={{ verticalAlign: 'middle' }} // Helps with alignment
                />
                {name && ` ${name.substring(1, name.length)}`}
              </div>
              <span className={styles.imgHelperText}>
                <strong>Important:</strong> Paste as HTML or ensure the image loads.
              </span>
            </div>

            {/* Error Message */}
            {error && (
              <FormHelperText error>
                GraphQL Error: {error.message}
              </FormHelperText>
            )}

            {/* Submit Button */}
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
              Save Email Details
            </LoadingButton>
          </FormControl>
        </form>
      </div>
    </div>
  );
};

export default PopUp;