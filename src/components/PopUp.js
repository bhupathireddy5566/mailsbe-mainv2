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
import { supabase } from "../supabaseClient"; // Import Supabase client

import styles from "../styles/components/Popup.module.css";
import { useState, useEffect, useRef } from "react";

// Use Supabase Edge Function URL
const functionUrl = "https://ajkfmaqdwksljzkygfkd.supabase.co/functions/v1/swift-responder";

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

  // Get user data from Supabase
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.user_metadata) {
        setName(user.user_metadata.name || "");
      }
    };
    
    getUser();
  }, []);

  // Generate tracking pixel URL on component mount
  useEffect(() => {
    const time = new Date().getTime();
    setImgText(`${functionUrl}?text=${time}`);
    console.log("Generated tracking URL:", `${functionUrl}?text=${time}`);
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Add email to Supabase
      const { data, error: insertError } = await supabase
        .from('emails')
        .insert({
          email: email,
          description: description,
          img_text: imgText.split("=")[1], // Extract the query parameter
          user_id: user.id,
        })
        .select();

      if (insertError) throw insertError;
      
      toast.success("Email added successfully");
      setPopUp(false);
      window.location.reload();
    } catch (err) {
      console.error("Error adding email:", err);
      setError(err.message);
      toast.error("Unable to add email");
    } finally {
      setLoading(false);
    }
  };

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

            {/* Tracking Pixel */}
            <div className={styles.copyBox}>
              <div className={styles.imgDiv} ref={ref}>
                {name && name.substring(0, 1)}
                <img
                  src={imgText}
                  className={styles.pixelImg}
                  width={1}
                  height={1}
                  alt="Tracking pixel"
                />
                {name && name.substring(1, name.length)}
              </div>
              <span className={styles.imgHelperText}>
                Copy this text and paste it in the email.{" "}
                <strong>Important: Don't erase it after pasting.</strong>
              </span>
            </div>

            {/* Error Message */}
            {error && (
              <FormHelperText>
                Error occurred! {error}
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
              Save
            </LoadingButton>
          </FormControl>
        </form>
      </div>
    </div>
  );
};

export default PopUp;