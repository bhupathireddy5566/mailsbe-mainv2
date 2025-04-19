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
import { useState, useEffect } from "react";

const PopUp = ({ setPopUp }) => {
  const user = useUserData();
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [name, setName] = useState(user.displayName || "");
  const [imgText, setImgText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Correct REST endpoint URL for tracking pixel
  const restEndpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/rest/update-seen-status`;

  useEffect(() => {
    if (!user.id) return;

    const timestamp = Date.now();
    setImgText(
      `${restEndpoint}?text=${timestamp}&user_id=${user.id}`
    );
  }, [user.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!email || !description) {
        throw new Error("Please fill all required fields");
      }

      // GraphQL mutation for email insertion
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/graphql`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Use user token instead of admin secret
            Authorization: `Bearer ${user.accessToken}`,
          },
          body: JSON.stringify({
            query: `
              mutation AddEmail(
                $email: String!,
                $description: String!,
                $img_text: String!,
                $user_id: uuid!
              ) {
                insert_emails_one(object: {
                  email: $email,
                  description: $description,
                  img_text: $img_text,
                  user_id: $user_id
                }) {
                  id
                }
              }
            `,
            variables: {
              email,
              description,
              img_text: imgText,
              user_id: user.id,
            },
          }),
        }
      );

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      toast.success("Email added successfully");
      setPopUp(false);
    } catch (err) {
      setError(err.message || "Something went wrong");
      toast.error("Failed to add email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.popup}>
      <div className={styles.popUpDiv}>
        <div className={styles.header}>
          <Typography variant="h6">Add New Email</Typography>
          <IconButton onClick={() => setPopUp(false)}>
            <HighlightOffIcon />
          </IconButton>
        </div>
        <form onSubmit={handleSubmit}>
          <FormControl fullWidth error={!!error}>
            <TextField
              label="Email Address"
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
              rows={3}
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
                {name?.[0] || ''}
                <img
                  src={imgText}
                  alt="Tracking pixel"
                  className={styles.pixelImg}
                />
                {name?.slice(1) || ''}
              </div>
              <span className={styles.imgHelperText}>
                Copy this text into your email
              </span>
            </div>

            {error && <FormHelperText>{error}</FormHelperText>}

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