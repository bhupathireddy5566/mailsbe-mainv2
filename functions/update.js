
import { NhostClient } from "@nhost/nhost-js";

export default async (req, res) => {
  try {
    // ─── CORS ──────────────────────────────────────────────
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    // ─── TRACKING PIXEL ────────────────────────────────────
    const sendPixel = () => {
      res.setHeader("Content-Type", "image/gif");
      res.send(
        Buffer.from(
          "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
          "base64"
        )
      );
    };

    // ─── READ QUERY PARAM ──────────────────────────────────
    const imgText = req.query.text;
    console.log("======= PIXEL TRACKING ACTIVATED =======");
    console.log("Tracking ID received:", imgText);
    if (!imgText) {
      console.warn("No tracking ID provided");
      return sendPixel();
    }

    // ─── INIT NHOST CLIENT ─────────────────────────────────
    const adminSecret =
      process.env.NHOST_ADMIN_SECRET || "F$Iv7SMMyg*h5,8n(dC4Xfo#z-@^w80b";
    console.log("Using admin secret:", !!adminSecret);
    const nhost = new NhostClient({
      graphqlUrl:
        "https://ttgygockyojigiwmkjsl.hasura.ap-south-1.nhost.run/v1/graphql",
      adminSecret,
    });

    // ─── STEP 1: FIND EMAIL BY IMG_TEXT ───────────────────
    const GET_EMAIL_ID = `
      query GetEmailId($text: String!) {
        emails(where: { img_text: { _eq: $text } }) {
          id
          seen
        }
      }
    `;
    const { data, error: selectError } = await nhost.graphql.request(
      GET_EMAIL_ID,
      { text: imgText },
      {
        "x-hasura-admin-secret": adminSecret,
        "content-type": "application/json",
      }
    );
    console.log("Find email response:", data, selectError);
    if (selectError || !data?.emails?.length) {
      console.error("No email found or SELECT error:", selectError);
      return sendPixel();
    }

    const { id: emailId, seen } = data.emails[0];
    console.log(`Found email ID=${emailId}, seen=${seen}`);

    // ─── STEP 2: SKIP IF ALREADY SEEN ──────────────────────
    if (seen === true) {
      console.log("Already marked as seen; skipping update");
      return sendPixel();
    }

    // ─── STEP 3: UPDATE WITH REAL TIMESTAMP ───────────────
    const seenAt = new Date().toISOString();
    console.log("Updating seen_at to:", seenAt);
    const UPDATE_QUERY = `
      mutation UpdateEmail($id: Int!, $seenAt: timestamptz!) {
        update_emails_by_pk(
          pk_columns: { id: $id },
          _set: { seen: true, seen_at: $seenAt }
        ) {
          id
        }
      }
    `;
    const { error: updateError } = await nhost.graphql.request(
      UPDATE_QUERY,
      { id: parseInt(emailId, 10), seenAt },
      {
        "x-hasura-admin-secret": adminSecret,
        "content-type": "application/json",
      }
    );
    if (updateError) {
      console.error("Failed to update seen flag:", updateError);
    } else {
      console.log("✅ Email marked as seen:", emailId);
    }

    // ─── FINAL: ALWAYS RETURN PIXEL ────────────────────────
    return sendPixel();
  } catch (err) {
    console.error("CRITICAL ERROR in function:", err);
    res.setHeader("Content-Type", "image/gif");
    res.send(
      Buffer.from(
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        "base64"
      )
    );
  }
};
