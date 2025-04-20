import { NhostClient } from "@nhost/nhost-js";

// Reverting to the previously working configuration with better logging
export default async (req, res) => {
  try {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Always return the 1x1 tracking pixel GIF regardless of processing
    const sendPixel = () => {
      res.setHeader('Content-Type', 'image/gif');
      res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
    };

    const imgText = req.query.text;
    console.log("======= PIXEL TRACKING ACTIVATED =======");
    console.log("Tracking ID received:", imgText);

    // If no text parameter, just return the pixel
    if (!imgText) {
      console.log("ERROR: No tracking ID provided");
      return sendPixel();
    }

    // Use the admin secret from env or fallback
    const adminSecret = process.env.NHOST_ADMIN_SECRET || "F$Iv7SMMyg*h5,8n(dC4Xfo#z-@^w80b";
    console.log("Using admin secret:", adminSecret ? "YES" : "NO");

    // Initialize Nhost with direct GraphQL URL and admin secret (previously working method)
    const nhost = new NhostClient({
      graphqlUrl: 'https://ttgygockyojigiwmkjsl.hasura.ap-south-1.nhost.run/v1/graphql',
      adminSecret: adminSecret
    });

    console.log("Searching for email with tracking ID:", imgText);

    // Query to find the email - using the previously working format
    const GET_EMAIL_ID = `
      query GetEmailId($text: String!) {
        emails(where: {img_text: {_eq: $text}}) {
          id
          seen
        }
      }
    `;

    const { data, error } = await nhost.graphql.request(
      GET_EMAIL_ID,
      { text: imgText },
      { 
        'x-hasura-role': 'admin',
        'content-type': 'application/json',
        'x-hasura': 'true'
      }
    );

    console.log("Find email response:", JSON.stringify(data));
    
    if (error) {
      console.error("ERROR finding email:", error);
      return sendPixel();
    }

    if (!data || !data.emails || data.emails.length === 0) {
      console.error("ERROR: No email found with tracking ID:", imgText);
      return sendPixel();
    }

    const emailId = data.emails[0].id;
    const seen = data.emails[0].seen;
    console.log(`Found email with ID ${emailId}, seen status: ${seen}`);

    if (seen) {
      console.log("Email already marked as seen");
      return sendPixel();
    }

    // Using the exact mutation format provided by the user
    const UPDATE_QUERY = `
      mutation UpdateEmail($id: Int!, $seenAt: timestamptz!) {
        update_emails_by_pk(
          pk_columns: {id: $id},
          _set: {
            seen: true,
            seen_at: $seenAt
          }
        ) {
          id
          seen
          seen_at
        }
      }
    `;

    console.log("Attempting to update email ID:", emailId);
    
    // Execute update with the correct variable names format
    const currentTime = new Date().toISOString();
    console.log("Current timestamp:", currentTime);

    const { data: updateData, error: updateError } = await nhost.graphql.request(
      UPDATE_QUERY,
      {
        id: parseInt(emailId, 10),
        seenAt: currentTime
      },
      { 
        'x-hasura-role': 'admin',
        'content-type': 'application/json',
        'x-hasura': 'true'
      }
    );

    if (updateError) {
      console.error("ERROR updating email:", updateError);
      console.error("Error details:", JSON.stringify(updateError));
    } else {
      console.log("SUCCESS: Email marked as seen!");
      console.log("Update result:", JSON.stringify(updateData));
      
      // Verify the response matches expected format
      if (updateData?.update_emails_by_pk) {
        console.log("✓ Response format is correct");
      } else {
        console.log("✗ Response format is incorrect. Expected:", 
          JSON.stringify({
            data: {
              update_emails_by_pk: {
                id: parseInt(emailId, 10),
                seen: true,
                seen_at: currentTime
              }
            }
          }, null, 2)
        );
      }
    }

    // Always return the pixel
    return sendPixel();
  } catch (error) {
    console.error("CRITICAL ERROR:", error);
    
    // Return the pixel even if there's an error
    res.setHeader('Content-Type', 'image/gif');
    res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
  }
};