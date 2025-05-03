// VERSION: 3.0 - ZERO DEPENDENCIES
// Using only built-in Node.js modules - no external dependencies

export default async (req, res) => {
  console.log("🚀 --- PIXEL TRACKER v3.0 (NO DEPENDENCIES) ---");
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
    const makeRequest = (url, method, headers, body) => {
      return new Promise((resolve, reject) => {
        // Parse URL to get components
        const urlObj = new URL(url);
        
        // Set up the request options
        const options = {
          hostname: urlObj.hostname,
          path: urlObj.pathname + urlObj.search,
          method: method,
          headers: headers
        };
        
        // Dynamically require the appropriate module based on the protocol
        const httpModule = urlObj.protocol === 'https:' ? require('https') : require('http');
        
        // Make the request
        const req = httpModule.request(options, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            try {
              // Parse JSON response if possible
              const parsedData = JSON.parse(data);
              resolve({ status: res.statusCode, data: parsedData });
            } catch (e) {
              // Return raw data if not JSON
              resolve({ status: res.statusCode, data: data });
            }
          });
        });
        
        req.on('error', (error) => {
          reject(error);
        });
        
        // Send the body if provided
        if (body) {
          req.write(typeof body === 'string' ? body : JSON.stringify(body));
        }
        
        req.end();
      });
    };

    // ─── FIND EMAIL QUERY ────────────────────────────────
    console.log(`🔍 Searching for email with img_text = "${imgText}"`);
    
    const getEmailQuery = {
      query: `
        query GetEmailByImgText($text: String!) {
          emails(where: { img_text: { _eq: $text } }, limit: 1) {
            id
            seen
            seen_at
          }
        }
      `,
      variables: { text: imgText }
    };
    
    const headers = {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': ADMIN_SECRET
    };
    
    // Execute the query
    const queryResult = await makeRequest(
      GRAPHQL_URL,
      'POST',
      headers,
      getEmailQuery
    );
    
    console.log(`📥 Query response status: ${queryResult.status}`);
    
    // Check for errors or no data
    if (queryResult.status !== 200 || !queryResult.data?.data?.emails) {
      console.warn(`⚠️ No valid email data returned. Status: ${queryResult.status}`);
      return sendPixel();
    }
    
    // Check if email exists
    const emails = queryResult.data.data.emails;
    if (emails.length === 0) {
      console.warn(`⚠️ No email found with img_text = "${imgText}"`);
      return sendPixel();
    }
    
    // Extract email info
    const email = emails[0];
    console.log(`📧 Found Email ID: ${email.id}, Seen: ${email.seen}`);
    
    // Skip if already seen
    if (email.seen === true) {
      console.log(`👍 Email ID ${email.id} already marked as seen on ${email.seen_at}. Skipping update.`);
      return sendPixel();
    }
    
    // ─── UPDATE EMAIL ───────────────────────────────────
    const seenAt = new Date().toISOString();
    console.log(`✏️ Updating Email ID ${email.id} - Setting seen=true, seen_at=${seenAt}`);
    
    const updateMutation = {
      query: `
        mutation UpdateEmailSeenStatus($id: Int!, $seenAt: timestamptz!) {
          update_emails_by_pk(
            pk_columns: { id: $id },
            _set: { seen: true, seen_at: $seenAt }
          ) {
            id
          }
        }
      `,
      variables: {
        id: parseInt(email.id, 10),
        seenAt: seenAt
      }
    };
    
    // Execute the mutation
    const mutationResult = await makeRequest(
      GRAPHQL_URL,
      'POST',
      headers,
      updateMutation
    );
    
    // Check result
    if (mutationResult.status === 200 && mutationResult.data?.data?.update_emails_by_pk) {
      console.log(`✅ Successfully updated seen status for Email ID: ${email.id}`);
    } else {
      console.warn(`⚠️ Update failed or returned unexpected data. Status: ${mutationResult.status}`);
      if (mutationResult.data?.errors) {
        console.error(`❌ GraphQL errors:`, JSON.stringify(mutationResult.data.errors));
      }
    }
    
    // Always return the pixel response
    return sendPixel();
    
  } catch (error) {
    console.error(`💥 CRITICAL ERROR: ${error.message}`);
    console.error(error.stack);
    return sendPixel();
  } finally {
    console.log("🏁 --- Function End ---");
  }
};
