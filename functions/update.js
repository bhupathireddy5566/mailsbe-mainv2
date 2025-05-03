// VERSION: 3.1 - ABSOLUTELY NO DEPENDENCIES, NOT EVEN IMPORTS
// We will only use built-in Node.js 'https' module when needed, but won't import it at the top

export default async (req, res) => {
  console.log("🚀 --- PIXEL TRACKER v3.1 (ABSOLUTELY NO IMPORTS) ---");
  console.log("⏰ Request received at:", new Date().toISOString());
  console.log("📦 Query parameters:", req.query);

  // ─── CORS HEADERS ───────────────────────────────────────
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-hasura-admin-secret");
  
  if (req.method === "OPTIONS") {
    console.log("✈️ Responding to OPTIONS request");
    return res.status(200).end();
  }

  // ─── PIXEL RESPONSE ────────────────────────────────────
  const sendPixel = () => {
    console.log("🖼️ Sending 1x1 transparent GIF pixel response");
    res.setHeader("Content-Type", "image/gif");
    // Standard 1x1 transparent GIF
    res.send(Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64"));
  };

  try {
    // ─── VALIDATE QUERY PARAM ────────────────────────────
    const imgText = req.query.text;
    if (!imgText) {
      console.warn("⚠️ Missing 'text' query parameter.");
      return sendPixel();
    }
    console.log(`🆔 Tracking ID received: ${imgText}`);

    // ─── CONFIGURATION ────────────────────────────────────
    const GRAPHQL_URL = 'https://ttgygockyojigiwmkjsl.hasura.ap-south-1.nhost.run/v1/graphql';
    const ADMIN_SECRET = "F$Iv7SMMyg*h5,8n(dC4Xfo#z-@^w80b";
    console.log(`🔌 GraphQL URL: ${GRAPHQL_URL}`);
    console.log(`🔑 Admin Secret: ${ADMIN_SECRET.substring(0, 3)}...`);

    // ─── HELPER FOR HTTP REQUESTS ────────────────────────
    const makeGraphQLRequest = async (query, variables) => {
      return new Promise((resolve, reject) => {
        // Require the https module only when needed (not at the top)
        const https = require('https');
        
        // Parse URL to get just the hostname and path
        const url = new URL(GRAPHQL_URL);
        
        // Prepare request body
        const requestBody = JSON.stringify({
          query: query,
          variables: variables
        });
        
        // Prepare request options
        const options = {
          hostname: url.hostname,
          path: url.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-hasura-admin-secret': ADMIN_SECRET,
            'Content-Length': Buffer.byteLength(requestBody)
          }
        };
        
        // Make the request
        const req = https.request(options, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            try {
              // Parse JSON response
              const result = JSON.parse(data);
              resolve(result);
            } catch (error) {
              reject(new Error(`Failed to parse JSON response: ${error.message}`));
            }
          });
        });
        
        req.on('error', (error) => {
          reject(error);
        });
        
        // Send the request body
        req.write(requestBody);
        req.end();
      });
    };

    // ─── FIND EMAIL BY IMG_TEXT ────────────────────────────
    console.log(`🔍 Looking for email with img_text: "${imgText}"`);
    
    const findEmailResult = await makeGraphQLRequest(
      `
      query GetEmail($text: String!) {
        emails(where: { img_text: { _eq: $text } }, limit: 1) {
          id
          seen
          seen_at
        }
      }
      `,
      { text: imgText }
    );
    
    // Check if we got valid data
    if (!findEmailResult.data || !findEmailResult.data.emails || findEmailResult.data.emails.length === 0) {
      console.warn(`⚠️ No email found with img_text: "${imgText}"`);
      return sendPixel();
    }
    
    // Extract email data
    const email = findEmailResult.data.emails[0];
    console.log(`✅ Found email with ID: ${email.id}, seen status: ${email.seen}`);
    
    // Skip update if already seen
    if (email.seen === true) {
      console.log(`ℹ️ Email already marked as seen at: ${email.seen_at}`);
      return sendPixel();
    }
    
    // ─── UPDATE EMAIL AS SEEN ────────────────────────────
    console.log(`📝 Updating email ID ${email.id} to seen=true`);
    
    const seenAt = new Date().toISOString();
    
    const updateResult = await makeGraphQLRequest(
      `
      mutation UpdateEmail($id: Int!, $seenAt: timestamptz!) {
        update_emails_by_pk(
          pk_columns: { id: $id },
          _set: { seen: true, seen_at: $seenAt }
        ) {
          id
        }
      }
      `,
      { 
        id: parseInt(email.id, 10),
        seenAt: seenAt
      }
    );
    
    // Check update result
    if (updateResult.data && updateResult.data.update_emails_by_pk) {
      console.log(`✅ Successfully updated email ID ${email.id} as seen at ${seenAt}`);
    } else {
      console.warn(`⚠️ Failed to update email seen status. Result:`, JSON.stringify(updateResult));
    }
    
    // Always return the tracking pixel
    return sendPixel();
    
  } catch (error) {
    console.error(`❌ Error in tracking pixel function: ${error.message}`);
    console.error(error.stack);
    // Still return the pixel even on error
    return sendPixel();
  }
};
