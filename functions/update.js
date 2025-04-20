// Directly use Node.js modules instead of external libraries
const https = require('https');

export default async (req, res) => {
  console.log("📢 TRACKING PIXEL REQUEST RECEIVED", {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    query: req.query,
    headers: req.headers
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

    // ─── 4) MAKE DIRECT HTTP REQUEST TO HASURA ─────────────
    // Use direct HTTPS API without any external library
    const directGraphQLRequest = (query, variables) => {
      return new Promise((resolve, reject) => {
        // Hasura endpoint
        const graphqlEndpoint = 'ttgygockyojigiwmkjsl.hasura.ap-south-1.nhost.run';
        const graphqlPath = '/v1/graphql';
        
        // Admin secret from the API Explorer
        const adminSecret = "F$Iv7SMMyg*h5,8n(dC4Xfo#z-@^w80b";
        
        // Request body
        const requestBody = JSON.stringify({
          query: query,
          variables: variables
        });
        
        console.log(`📤 GraphQL Request: ${query.substring(0, 80)}...`);
        console.log(`📤 Variables: ${JSON.stringify(variables)}`);
        
        // Request options
        const options = {
          hostname: graphqlEndpoint,
          path: graphqlPath,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-hasura-admin-secret': adminSecret,
            'Content-Length': Buffer.byteLength(requestBody)
          }
        };
        
        // Create request
        const request = https.request(options, (response) => {
          let data = '';
          
          // A chunk of data has been received
          response.on('data', (chunk) => {
            data += chunk;
          });
          
          // The whole response has been received
          response.on('end', () => {
            console.log(`📥 GraphQL Response Status: ${response.statusCode}`);
            try {
              const parsedData = JSON.parse(data);
              console.log(`📥 GraphQL Response Body: ${JSON.stringify(parsedData)}`);
              resolve(parsedData);
            } catch (e) {
              console.error(`❌ Error parsing response: ${e.message}`);
              console.log(`Raw response: ${data}`);
              reject(e);
            }
          });
        });
        
        // Handle errors
        request.on('error', (error) => {
          console.error(`❌ Request Error: ${error.message}`);
          reject(error);
        });
        
        // Write request body and end
        request.write(requestBody);
        request.end();
      });
    };

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
    const queryResult = await directGraphQLRequest(GET_EMAIL_QUERY, { text: imgText });
    
    // Check for GraphQL errors
    if (queryResult.errors) {
      console.error(`❌ GraphQL Query Error:`, queryResult.errors);
      return sendPixel();
    }
    
    // Check if email exists
    if (!queryResult.data || !queryResult.data.emails || queryResult.data.emails.length === 0) {
      console.warn(`⚠️ No email found with img_text = "${imgText}"`);
      return sendPixel();
    }
    
    // Extract email info
    const email = queryResult.data.emails[0];
    console.log(`✅ Found email ID=${email.id}, current seen status=${email.seen}`);
    
    // ─── 6) SKIP IF ALREADY SEEN ───────────────────────────
    if (email.seen === true) {
      console.log(`ℹ️ Email ID=${email.id} already marked as seen at ${email.seen_at}`);
      return sendPixel();
    }
    
    // ─── 7) UPDATE EMAIL AS SEEN ────────────────────────────
    const seenAt = new Date().toISOString();
    console.log(`🔄 Updating email ID=${email.id} to seen=true, seen_at=${seenAt}`);
    
    // Use simple mutation format exactly like API Explorer
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
    
    const mutationResult = await directGraphQLRequest(UPDATE_MUTATION, {
      id: parseInt(email.id, 10),
      seenAt: seenAt
    });
    
    // Check for GraphQL errors
    if (mutationResult.errors) {
      console.error(`❌ GraphQL Mutation Error:`, mutationResult.errors);
    } else if (mutationResult.data && mutationResult.data.update_emails_by_pk) {
      console.log(`✅ SUCCESSFULLY updated email ID=${email.id}`);
      console.log(`   Updated values: seen=${mutationResult.data.update_emails_by_pk.seen}, seen_at=${mutationResult.data.update_emails_by_pk.seen_at}`);
    } else {
      console.warn(`⚠️ Unexpected mutation response format:`, mutationResult);
    }
    
    // ─── 8) ALWAYS RETURN PIXEL ──────────────────────────────
    return sendPixel();
    
  } catch (error) {
    console.error(`💥 CRITICAL ERROR: ${error.message}`);
    console.error(error.stack);
    return sendPixel();
  }
};
