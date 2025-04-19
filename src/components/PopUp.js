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

  // REST API endpoint from Hasura configuration [[8]]
  const restEndpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/rest/update-seen-status`;

  useEffect(() => {
    const timestamp = Date.now();
    // Construct tracking URL using REST endpoint pattern [[8]]
    setImgText(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/functions/update?text=${timestamp}`
    );
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // REST API call using fetch() [[6]]
      const response = await fetch(restEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Use secure authentication headers [[8]]
          "x-hasura-admin-secret": process.env.NHOST_ADMIN_SECRET,
        },
        body: JSON.stringify({
          email,
          description,
          img_text: imgText.split("=")[1],
          user_id: user.id,
        }),
      });

      if (!response.ok) throw new Error("Network response was not ok");

      toast.success("Email added successfully");
      setPopUp(false);
    } catch (err) {
      setError(err.message);
      toast.error("Failed to add email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.popup}>
      <div className={styles.popUpDiv}>
        <div className={styles.header}>
          <Typography variant="h6">Enter new email details</Typography>
          <IconButton onClick={() => setPopUp(false)}>
            <HighlightOffIcon />
          </IconButton>
        </div>
        <form onSubmit={handleSubmit}>
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
            
            {/* Tracking pixel preview with REST integration [[8]] */}
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
                Copy this text and paste it in the email
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