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
import { gql, useMutation } from "@apollo/client";
import { useState, useEffect, useRef } from "react";

import styles from "../styles/components/Popup.module.css";

// your Functions URL (no trailing slash)
const FUNCTIONS_BASE =
  "https://ttgygockyojigiwmkjsl.functions.ap-south-1.nhost.run/v1";

//––– simplified mutation without name –––
const ADD_EMAIL = gql`
  mutation addEmail(
    $email: String!
    $description: String!
    $img_text: String!
    $user_id: String!
  ) {
    insert_emails_one(
      object: {
        email: $email
        description: $description
        img_text: $img_text
        user_id: $user_id
      }
    ) {
      id
      email
      description
      img_text
      seen
      created_at
    }
  }
`;

export default function PopUp({ setPopUp, refetchEmails }) {
  const user = useUserData();
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [imgText, setImgText] = useState("");
  const [addEmail, { loading, error }] = useMutation(ADD_EMAIL);
  const ref = useRef();

  // generate a new tracking‐ID + URL on mount
  useEffect(() => {
    const trackingId = Date.now().toString();
    const url = `${FUNCTIONS_BASE}/update?text=${trackingId}`;
    console.log("🔍 trackingId:", trackingId, "URL:", url);
    setImgText(url);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // parse ?text=… with URL API
    let trackingId;
    try {
      trackingId = new URL(imgText).searchParams.get("text");
    } catch {
      toast.error("Invalid tracking URL");
      return;
    }
    if (!trackingId) {
      toast.error("Invalid tracking URL");
      return;
    }

    try {
      const { data } = await addEmail({
        variables: {
          email,
          description,
          img_text: trackingId,
          user_id: user.id,
        },
      });

      if (data?.insert_emails_one?.id) {
        toast.success("Email added!");
        if (typeof refetchEmails === "function") {
          await refetchEmails();
        }
        setPopUp(false);
      } else {
        toast.error("Failed to add email");
      }
    } catch (err) {
      console.error("📮 addEmail error:", err);
      toast.error("Unable to add email: " + (err.message || ""));
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

        <form onSubmit={handleSubmit} className={styles.groupForm}>
          <FormControl fullWidth error={!!error}>
            <TextField
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
            />

            <TextField
              label="Description"
              helperText="A short note to help you identify this email"
              multiline
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
            />

            <div className={styles.copyBox}>
              <div className={styles.imgDiv} ref={ref}>
                <img
                  src={imgText}
                  width="1"
                  height="1"
                  alt="Tracking pixel"
                  loading="eager"
                  className={styles.pixelImg}
                  onLoad={() => console.log("✅ Tracking pixel loaded")}
                  onError={(e) => console.error("❌ Pixel load failed", e)}
                />
              </div>
              <Typography
                variant="caption"
                className={styles.imgHelperText}
              >
                <strong>Important:</strong> copy this invisible pixel URL into
                your email body exactly as shown.
              </Typography>
            </div>

            {error && (
              <FormHelperText>
                Error: {error.message}
              </FormHelperText>
            )}

            <LoadingButton
              type="submit"
              variant="contained"
              endIcon={<SaveIcon />}
              loading={loading}
              fullWidth
            >
              Save
            </LoadingButton>
          </FormControl>
        </form>
      </div>
    </div>
  );
}
