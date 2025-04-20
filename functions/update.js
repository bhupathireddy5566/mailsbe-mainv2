// Use axios for HTTP requests - more reliable than raw https
const axios = require('axios');

export default async (req, res) => {
  console.log("📢 TRACKING PIXEL REQUEST RECEIVED", {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    query: req.query
  });

  // ─── 1) CORS HEADERS ───────────────────────────────────────
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-hasura-admin-secret");
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ─── 2) PIXEL UTILITY ────────────────────────────────────
  const sendPixel = () => {
    // Return a 1x1 transparent GIF
    res.setHeader("Content-Type", "image/gif");
    res.send(Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64"));
  };

  try {
    // ─── 3) VALIDATE QUERY PARAM ────────────────────────────
    const imgText = req.query.text;
    if (!imgText) {
      console.warn("⚠️ No tracking ID provided in query parameters");
      return sendPixel();
    }
    console.log(`✅ Tracking ID (text param): ${imgText}`);

    // ─── 4) SETUP DIRECT AXIOS REQUEST ─────────────────────
    // The Hasura endpoint from the API Explorer screenshot
    const GRAPHQL_URL = 'https://ttgygockyojigiwmkjsl.hasura.ap-south-1.nhost.run/v1/graphql';
    const ADMIN_SECRET = "F$Iv7SMMyg*h5,8n(dC4Xfo#z-@^w80b";
    
    const headers = {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': ADMIN_SECRET
    };
    
    // Helper function to make GraphQL requests
    async function executeGraphQL(query, variables) {
      try {
        console.log(`🔄 Executing GraphQL: ${query.substring(0, 80)}...`);
        console.log(`🔄 Variables: ${JSON.stringify(variables)}`);
        
        const response = await axios({
          url: GRAPHQL_URL,
          method: 'POST',
          headers: headers,
          data: {
            query: query,
            variables: variables
          }
        });
        
        console.log(`✅ GraphQL response status: ${response.status}`);
        console.log(`✅ GraphQL response data: ${JSON.stringify(response.data)}`);
        
        return response.data;
      } catch (error) {
        console.error("❌ GraphQL request failed:", error.message);
        if (error.response) {
          console.error(`Status: ${error.response.status}`);
          console.error(`Data: ${JSON.stringify(error.response.data)}`);
        }
        throw error;
      }
    }

    // ─── 5) QUERY EMAIL BY IMG_TEXT ─────────────────────────
    const GET_EMAIL_QUERY = `
      query GetEmailByImgText($text: String!) {
        emails(where: { img_text: { _eq: $text } }, limit: 1) {
          id
          seen
          seen_at
        }
      }
    `;
    
    console.log(`🔍 Finding email with img_text = "${imgText}"`);
    const queryResult = await executeGraphQL(GET_EMAIL_QUERY, { text: imgText });
    
    // Check if email exists
    if (!queryResult.data || !queryResult.data.emails || queryResult.data.emails.length === 0) {
      console.warn(`⚠️ No email found with img_text = "${imgText}"`);
      return sendPixel();
    }
    
    // Extract email info
    const email = queryResult.data.emails[0];
    console.log(`📧 Found email ID=${email.id}, current seen status=${email.seen}`);
    
    // ─── 6) SKIP IF ALREADY SEEN ───────────────────────────
    if (email.seen === true) {
      console.log(`ℹ️ Email ID=${email.id} already marked as seen at ${email.seen_at}`);
      return sendPixel();
    }
    
    // ─── 7) UPDATE EMAIL AS SEEN ────────────────────────────
    const seenAt = new Date().toISOString();
    console.log(`📝 Updating email ID=${email.id} to seen=true, seen_at=${seenAt}`);
    
    // Use simple mutation format from API Explorer
    const UPDATE_MUTATION = `
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
    
    const mutationResult = await executeGraphQL(UPDATE_MUTATION, {
      id: parseInt(email.id, 10),
      seenAt: seenAt
    });
    
    if (mutationResult.data && mutationResult.data.update_emails_by_pk) {
      console.log(`✅ SUCCESSFULLY updated email ID=${email.id}`);
      console.log(`✅ New values: seen=${mutationResult.data.update_emails_by_pk.seen}, seen_at=${mutationResult.data.update_emails_by_pk.seen_at}`);
    } else {
      console.warn(`⚠️ Unexpected mutation response:`, JSON.stringify(mutationResult));
    }
    
    // ─── 8) ALWAYS RETURN PIXEL ──────────────────────────────
    return sendPixel();
    
  } catch (error) {
    console.error(`💥 CRITICAL ERROR: ${error.message}`);
    console.error(error.stack);
    return sendPixel();
  }
};
