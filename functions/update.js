// Use axios for HTTP requests - more reliable than raw https
// VERSION: 2.1 - REBUILD APPROACH
const axios = require('axios');

export default async (req, res) => {
  // Log function start and version
  console.log("🚀 --- Function Start: update.js (v2.1) ---");
  console.log("⏰ Timestamp:", new Date().toISOString());
  console.log("📦 Request Query:", req.query);

  // ─── CONFIGURATION (Hardcoded for Verification) ───────────
  const GRAPHQL_URL = 'https://ttgygockyojigiwmkjsl.hasura.ap-south-1.nhost.run/v1/graphql';
  const ADMIN_SECRET = "F$Iv7SMMyg*h5,8n(dC4Xfo#z-@^w80b"; // Hardcoded based on user info
  console.log(`🔌 Using GraphQL Endpoint: ${GRAPHQL_URL}`);
  console.log(`🔑 Using Admin Secret: ${ADMIN_SECRET ? ADMIN_SECRET.substring(0, 4) + '...' : 'Not Set!'}`);

  // ─── 1) CORS HEADERS ───────────────────────────────────────
  res.setHeader("Access-Control-Allow-Origin", "*"); // Allow all origins
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS"); // Only GET needed for pixel
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-hasura-admin-secret");

  if (req.method === "OPTIONS") {
    console.log("✈️ Responding to OPTIONS request");
    return res.status(200).end();
  }

  // ─── 2) PIXEL UTILITY ────────────────────────────────────
  const sendPixelResponse = () => {
    console.log("🖼️ Sending 1x1 transparent GIF pixel response");
    res.setHeader("Content-Type", "image/gif");
    // Standard 1x1 transparent GIF
    res.send(Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64"));
  };

  try {
    // ─── 3) VALIDATE QUERY PARAM ────────────────────────────
    const imgText = req.query.text;
    if (!imgText) {
      console.warn("⚠️ Missing 'text' query parameter.");
      return sendPixelResponse(); // Still send pixel even if invalid
    }
    console.log(`🆔 Tracking ID received: ${imgText}`);

    // ─── 4) SETUP AXIOS GRAPHQL REQUEST HELPER ──────────────
    const headers = {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': ADMIN_SECRET
    };

    async function executeGraphQL(query, variables) {
      const operationName = query.match(/(query|mutation)\s+(\w+)/)?.[2] || 'GraphQL Operation';
      console.log(`📡 [${operationName}] Sending request to Hasura...`);
      console.log(`   Variables: ${JSON.stringify(variables)}`);

      try {
        const response = await axios({
          url: GRAPHQL_URL,
          method: 'POST',
          headers: headers,
          data: {
            query: query,
            variables: variables
          },
          timeout: 5000 // Add a 5-second timeout
        });

        console.log(`✅ [${operationName}] Response Status: ${response.status}`);
        // Log potential GraphQL errors returned in the response body
        if (response.data && response.data.errors) {
          console.error(`❌ [${operationName}] GraphQL Errors:`, JSON.stringify(response.data.errors));
        }
        // Log successful data structure if present
        if (response.data && response.data.data) {
             console.log(`📊 [${operationName}] Response Data:`, JSON.stringify(response.data.data));
        }

        return response.data;
      } catch (error) {
        console.error(`❌ [${operationName}] Axios Request Failed: ${error.message}`);
        if (error.response) {
          // Log details if Hasura returned an HTTP error
          console.error(`   Status: ${error.response.status}`);
          console.error(`   Data: ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
           // The request was made but no response was received
           console.error('   Error: No response received from Hasura.');
        } else {
           // Something happened in setting up the request
           console.error('   Error setting up request:', error.message);
        }
        // Re-throw the error to be caught by the main try/catch
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

    const queryResult = await executeGraphQL(GET_EMAIL_QUERY, { text: imgText });

    // Check specifically for the data structure we expect
    const emailData = queryResult?.data?.emails;
    if (!emailData || emailData.length === 0) {
      console.warn(`🤷 No email found matching img_text: "${imgText}"`);
      return sendPixelResponse();
    }

    const email = emailData[0];
    console.log(`📧 Found Email ID: ${email.id}, Seen: ${email.seen}`);

    // ─── 6) SKIP IF ALREADY SEEN ───────────────────────────
    if (email.seen === true) {
      console.log(`👍 Email ID ${email.id} already marked as seen on ${email.seen_at}. Skipping update.`);
      return sendPixelResponse();
    }

    // ─── 7) UPDATE EMAIL AS SEEN ────────────────────────────
    const seenAt = new Date().toISOString();
    console.log(`✏️ Updating Email ID ${email.id} - Setting seen=true, seen_at=${seenAt}`);

    const UPDATE_MUTATION = `
      mutation UpdateEmailSeenStatus($id: Int!, $seenAt: timestamptz!) {
        update_emails_by_pk(
          pk_columns: { id: $id },
          _set: { seen: true, seen_at: $seenAt }
        ) {
          id # Only request ID back, minimal payload
        }
      }
    `;

    const mutationResult = await executeGraphQL(UPDATE_MUTATION, {
      id: parseInt(email.id, 10),
      seenAt: seenAt
    });

    // Verify mutation success
    if (mutationResult?.data?.update_emails_by_pk?.id) {
      console.log(`✅ Successfully updated seen status for Email ID: ${mutationResult.data.update_emails_by_pk.id}`);
    } else {
      // This case includes GraphQL errors logged by executeGraphQL or unexpected response structure
      console.warn(`⚠️ Update mutation did not return the expected result for Email ID: ${email.id}. Check previous logs.`);
    }

    // ─── 8) ALWAYS RETURN PIXEL ──────────────────────────────
    return sendPixelResponse();

  } catch (error) {
    // Catch errors from executeGraphQL or other synchronous code
    console.error(`💥 UNHANDLED CRITICAL ERROR in function execution: ${error.message}`);
    console.error(error.stack); // Log stack trace for debugging
    // Still attempt to send pixel response even on critical failure
    return sendPixelResponse();
  } finally {
      console.log("🏁 --- Function End: update.js (v2.1) --- ");
  }
};
