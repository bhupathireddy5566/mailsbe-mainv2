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
import { useState, useEffect, useRef } from "react";
import { gql, useMutation } from "@apollo/client";

// Fixed: Correct GraphQL mutation with proper error handling
const ADD_EMAIL = gql`
  mutation addEmail(
    $email: String!
    $description: String!
    $img_text: String!
    $user_id: uuid!  // Changed to UUID type
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
  const user = useUserData();
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [name, setName] = useState(user.displayName || ""); // Added fallback
  const [imgText, setImgText] = useState("");

  const [addEmail, { loading, error }] = useMutation(ADD_EMAIL);

  // Fixed: Generate proper tracking pixel URL
  useEffect(() => {
    const timestamp = Date.now();
    const trackingUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/functions/update?text=${timestamp}`;
    setImgText(trackingUrl);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { data } = await addEmail({
        variables: {
          email,
          description,
          img_text: imgText.split("=")[1], // Extract token from query param
          user_id: user.id,
        },
      });

      if (data?.insert_emails_one) {
        toast.success("Email added successfully");
        setPopUp(false);
      }
    } catch (err) {
      console.error(err); // Added error logging
      toast.error(`Failed to add email: ${err.message}`);
    }
  };

  // Fixed: Add loading state and error display
  return (
    <div className={styles.popup}>
      <div className={styles.popUpDiv}>
        <div className={styles.header}>
          <Typography variant="h6" component="h4">
            Enter new email details
          </Typography>
          <IconButton onClick={() => setPopUp(false)}>
            <HighlightOffIcon />
          </IconButton>
        </div>
        <form className={styles.groupForm} onSubmit={handleSubmit}>
          <FormControl fullWidth error={!!error}>
            <TextField
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              margin="normal"
            />
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              required
              fullWidth
              margin="normal"
            />
            <TextField
              label="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              margin="normal"
            />
            
            {/* Tracking pixel preview */}
            <div className={styles.copyBox}>
              <div className={styles.imgDiv}>
                {name && name.substring(0, 1)}
                <img
                  src={imgText}
                  alt="Tracking pixel"
                  className={styles.pixelImg}
                />
                {name && name.substring(1)}
              </div>
              <span className={styles.imgHelperText}>
                Copy this text and paste it in the email
              </span>
            </div>

            {error && (
              <FormHelperText error>
                Error: {error.message}
              </FormHelperText>
            )}

            <LoadingButton
              type="submit"
              loading={loading}
              variant="contained"
              startIcon={<SaveIcon />}
              fullWidth
              sx={{ mt: 2 }}
            >
              Save Email
            </LoadingButton>
          </FormControl>
        </form>
      </div>
    </div>
  );
};

export default PopUp;