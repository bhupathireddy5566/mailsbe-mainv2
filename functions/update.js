import { NhostClient } from "@nhost/nhost-js";

// Make sure we have a backend URL - provide fallback if needed
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://ttgygockyojigiwmkjsl.ap-south-1.nhost.run';
// Get admin secret from environment variable
const adminSecret = process.env.NHOST_ADMIN_SECRET || 'F$Iv7SMMyg*h5,8n(dC4Xfo#z-@^w80b';

console.log("Starting update function with backend URL:", backendUrl);

// Initialize Nhost with admin secret to have write permissions
const nhost = new NhostClient({
  backendUrl: backendUrl,
  adminSecret: adminSecret
});

export default async (req, res) => {
  // CORS headers - enable for all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Log the request for debugging
  console.log("Received request:", {
    method: req.method,
    url: req.url,
    query: req.query,
    headers: req.headers,
  });

  const imgText = req.query.text;
  console.log("Processing tracking pixel for imgText:", imgText);

  if (!imgText) {
    console.error("No image token provided");
    return res.status(400).json({ error: "No image token provided" });
  }

  // Query to get email ID by img_text
  const GET_EMAIL_ID = `
    query GetEmailId($text: String!) {
      emails(where: {img_text: {_eq: $text}}) {
        id
        seen
      }
    }
  `;

  try {
    // Fetch email details
    console.log("Fetching email details for text:", imgText);
    const { data, error } = await nhost.graphql.request(GET_EMAIL_ID, {
      text: imgText,
    });

    if (error) {
      console.error("GraphQL query error:", error);
      return res.status(500).json({ error: error.message });
    }

    console.log("Email query result:", data);

    if (!data || !data.emails || data.emails.length === 0) {
      console.error("No email found for text:", imgText);
      // Return the pixel image anyway to avoid breaking email clients
      res.setHeader('Content-Type', 'image/gif');
      res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
      return;
    }

    const emailId = data.emails[0].id;
    const seen = data.emails[0].seen;
    console.log(`Email found with ID ${emailId}, seen status: ${seen}`);

    if (seen) {
      console.log("Email already marked as seen");
      // Return the pixel image anyway 
      res.setHeader('Content-Type', 'image/gif');
      res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
      return;
    }

    // Mutation to update email status
    const UPDATE_QUERY = `
      mutation UpdateEmail($id: Int!, $date: timestamp!) {
        update_emails(
          where: { id: { _eq: $id } },
          _set: { seen: true, seen_at: $date }
        ) {
          affected_rows
          returning {
            id
            seen
            seen_at
          }
        }
      }
    `;

    // Execute update
    const currentTime = new Date().toISOString();
    console.log(`Updating email ${emailId} as seen at ${currentTime}`);
    
    // Convert ID to number if it's stored as string
    const numericId = parseInt(emailId, 10);
    
    const { data: updateData, error: updateError } = await nhost.graphql.request(
      UPDATE_QUERY,
      {
        id: numericId,
        date: currentTime,
      }
    );

    if (updateError) {
      console.error("Update error:", updateError);
      // Still return the image even if update fails
      res.setHeader('Content-Type', 'image/gif');
      res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
      return;
    }

    console.log("Update successful:", updateData);

    // Return 1x1 pixel
    res.setHeader('Content-Type', 'image/gif');
    console.log("Sending tracking pixel response");
    res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
  } catch (error) {
    console.error("Unhandled error in update function:", error);
    // Always return the tracking pixel, even on error
    res.setHeader('Content-Type', 'image/gif');
    res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
  }
};