import { NhostClient } from "@nhost/nhost-js";

export default async (req, res) => {
  // ─── 1) CORS ──────────────────────────────────────────────
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-hasura-admin-secret"); // Allow admin secret header
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ─── 2) PIXEL UTILITY ────────────────────────────────────
  const sendPixel = () => {
    res.setHeader("Content-Type", "image/gif");
    res.send(
      Buffer.from(
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        "base64"
      )
    );
  };

  console.log("🔥 UPDATE FUNCTION FIRED 🔥", { method: req.method, query: req.query });

  try {
    // ─── 3) VALIDATE QUERY PARAM ────────────────────────────
    const imgText = req.query.text;
    if (!imgText) {
      console.warn("⚠️ No tracking ID (imgText) provided in query.");
      return sendPixel();
    }
    console.log(`ℹ️ Tracking ID received: ${imgText}`);

    // ─── 4) LOAD ADMIN SECRET ───────────────────────────────
    const adminSecret = process.env.NHOST_ADMIN_SECRET;
    if (!adminSecret) {
      console.error("❌ CRITICAL: NHOST_ADMIN_SECRET environment variable is not set.");
      return sendPixel(); // Still return pixel, but log critical error
    }
    console.log("✅ Admin secret loaded.");

    // ─── 5) INIT NHOST CLIENT (Corrected) ───────────────────
    // Use NHOST_BACKEND_URL if available, otherwise subdomain/region
    const backendUrl = process.env.NHOST_BACKEND_URL;
    const subdomain = process.env.NHOST_SUBDOMAIN;
    const region = process.env.NHOST_REGION;

    let nhostConfig = {};
    if (backendUrl) {
        nhostConfig = { backendUrl, adminSecret };
        console.log(`🚀 Initializing Nhost Client with backendUrl: ${backendUrl}`);
    } else if (subdomain && region) {
        nhostConfig = { subdomain, region, adminSecret };
        console.log(`🚀 Initializing Nhost Client with subdomain: ${subdomain}, region: ${region}`);
    } else {
        console.error("❌ CRITICAL: Nhost client config missing. Need NHOST_BACKEND_URL or NHOST_SUBDOMAIN/NHOST_REGION env vars.");
        return sendPixel();
    }

    const nhost = new NhostClient(nhostConfig);
    console.log("✅ Nhost Client Initialized.");

    // ─── 6) STEP 1: FIND EMAIL BY IMG_TEXT ──────────────────
    const GET_EMAIL_ID = `
      query GetEmailId($text: String!) {
        emails(where: { img_text: { _eq: $text } }, limit: 1) {
          id
          seen
        }
      }
    `;
    console.log(`🔍 Searching for email with img_text: ${imgText}`);
    const { data: selectData, error: selectError } = await nhost.graphql.request(
      GET_EMAIL_ID,
      { text: imgText },
      {
        headers: {
          "x-hasura-admin-secret": adminSecret // Pass admin secret for privileged access
        }
      }
    );

    if (selectError) {
      console.error(`❌ SELECT Error: ${selectError.message}`, selectError);
      return sendPixel();
    }

    if (!selectData?.emails?.length) {
      console.warn(`⚠️ No email found matching img_text: ${imgText}`);
      return sendPixel();
    }

    const { id: emailId, seen } = selectData.emails[0];
    console.log(`✅ Found email ID=${emailId}, current seen status: ${seen}`);

    // ─── 7) STEP 2: SKIP IF ALREADY SEEN ───────────────────
    // Reverted to checking for seen: true
    if (seen === true) {
      console.log("ℹ️ Email already marked as seen; skipping update.");
      return sendPixel();
    }

    // ─── 8) STEP 3: UPDATE SEEN STATUS (Reverted to seen: true) ───
    const seenAt = new Date().toISOString();
    console.log(`🔄 Updating email ID=${emailId} to seen=true, seen_at=${seenAt}`);

    const UPDATE_QUERY = `
      mutation UpdateEmail($id: Int!, $seenAt: timestamptz!) {
        update_emails_by_pk(
          pk_columns: { id: $id },
          _set: { seen: true, seen_at: $seenAt }
        ) {
          id # Request only ID back for confirmation
        }
      }
    `;

    const { data: updateData, error: updateError } = await nhost.graphql.request(
      UPDATE_QUERY,
      { id: parseInt(emailId, 10), seenAt },
      {
        headers: {
          "x-hasura-admin-secret": adminSecret // Pass admin secret for privileged access
        }
      }
    );

    if (updateError) {
      console.error(`❌ UPDATE Error for ID=${emailId}: ${updateError.message}`, updateError);
    } else if (updateData?.update_emails_by_pk?.id) {
      console.log(`✅ SUCCESS: Email ID=${updateData.update_emails_by_pk.id} marked as seen.`);
    } else {
        console.warn(`⚠️ Update mutation executed for ID=${emailId}, but response format was unexpected.`, updateData);
    }

    // ─── 9) FINAL: ALWAYS RETURN PIXEL ──────────────────────
    return sendPixel();

  } catch (err) {
    console.error("💥 CRITICAL ERROR in function execution:", err);
    return sendPixel(); // Ensure pixel is returned even on unexpected errors
  }
};
