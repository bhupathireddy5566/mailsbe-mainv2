import { NhostClient } from "@nhost/nhost-js";

export default async (req, res) => {
  // ─── IMPROVED DEBUGGING ────────────────────────────────
  console.log("☎️ TRACKING PIXEL REQUEST RECEIVED:", {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    query: req.query,
    headers: req.headers
  });

  // ─── 1) CORS ──────────────────────────────────────────────
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-hasura-admin-secret");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ─── 2) PIXEL UTILITY ────────────────────────────────────
  const sendPixel = () => {
    res.setHeader("Content-Type", "image/gif");
    res.send(Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64"));
  };

  try {
    // ─── 3) VALIDATE QUERY PARAM ────────────────────────────
    const imgText = req.query.text;
    if (!imgText) {
      console.warn("⚠️ No tracking ID (imgText) provided in query.");
      return sendPixel();
    }
    console.log(`ℹ️ Tracking ID received: ${imgText}`);

    // ─── 4) HARD-CODED VALUES FROM SCREENSHOTS ───────────────
    // Use the exact GraphQL URL from the API Explorer screenshot
    const graphqlUrl = "https://ttgygockyojigiwmkjsl.hasura.ap-south-1.nhost.run/v1/graphql";
    // Use admin secret from your API Explorer
    const adminSecret = "F$Iv7SMMyg*h5,8n(dC4Xfo#z-@^w80b";

    console.log(`📡 Using GraphQL URL: ${graphqlUrl}`);
    
    // ─── 5) INIT NHOST CLIENT WITH EXACT VALUES ───────────────
    const nhost = new NhostClient({
      graphqlUrl: graphqlUrl,
      adminSecret: adminSecret
    });
    console.log("✅ Nhost Client Initialized with exact hardcoded values");

    // ─── 6) FIND EMAIL BY IMG_TEXT ──────────────────────────
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
          "content-type": "application/json",
          "x-hasura-admin-secret": adminSecret
        }
      }
    );

    console.log("SELECT RESPONSE:", selectData, selectError);
    
    if (selectError) {
      console.error(`❌ SELECT Error: ${JSON.stringify(selectError)}`);
      return sendPixel();
    }

    if (!selectData?.emails?.length) {
      console.warn(`⚠️ No email found matching img_text: ${imgText}`);
      return sendPixel();
    }

    const { id: emailId, seen } = selectData.emails[0];
    console.log(`✅ Found email ID=${emailId}, current seen status: ${seen}`);

    // ─── 7) SKIP IF ALREADY SEEN ───────────────────────────
    if (seen === true) {
      console.log("ℹ️ Email already marked as seen; skipping update.");
      return sendPixel();
    }

    // ─── 8) USE EXACT MUTATION FROM API EXPLORER ───────────
    const seenAt = new Date().toISOString();
    console.log(`🔄 Updating email ID=${emailId} to seen=true, seen_at=${seenAt}`);
    
    // EXACT mutation from API Explorer screenshot
    const UPDATE_QUERY = `
      mutation UpdateEmail($id: Int!, $seenAt: timestamptz!) {
        update_emails_by_pk(
          pk_columns: { id: $id },
          _set: { seen: true, seen_at: $seenAt }
        ) {
          id
          seen
          seen_at
        }
      }
    `;

    const { data: updateData, error: updateError } = await nhost.graphql.request(
      UPDATE_QUERY,
      { id: parseInt(emailId, 10), seenAt: seenAt },
      {
        headers: {
          "content-type": "application/json",
          "x-hasura-admin-secret": adminSecret
        }
      }
    );

    console.log("UPDATE RESPONSE:", updateData, updateError);
    
    if (updateError) {
      console.error(`❌ UPDATE Error: ${JSON.stringify(updateError)}`);
    } else if (updateData?.update_emails_by_pk) {
      console.log(`✅ SUCCESS: Email ID=${emailId} marked as seen!`);
      console.log("UPDATED DATA:", JSON.stringify(updateData.update_emails_by_pk));
    } else {
      console.warn(`⚠️ No errors but unexpected response format`);
    }

    // ─── 9) ALWAYS RETURN PIXEL ──────────────────────────────
    return sendPixel();

  } catch (err) {
    console.error("💥 CRITICAL ERROR:", err);
    return sendPixel();
  }
};
