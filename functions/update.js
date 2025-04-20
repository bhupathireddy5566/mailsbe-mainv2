import { NhostClient } from "@nhost/nhost-js";

// Simplified function with better error handling
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
    // This ensures emails don't break even if there's an error
    const sendPixel = () => {
      res.setHeader('Content-Type', 'image/gif');
      res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
    };

    const imgText = req.query.text;
    console.log("Processing tracking pixel for:", imgText);

    // If no text parameter, just return the pixel
    if (!imgText) {
      console.log("No tracking ID provided");
      return sendPixel();
    }

    // Initialize Nhost client - use environment variables or fallback values
    const nhost = new NhostClient({
      subdomain: process.env.REACT_APP_NHOST_SUBDOMAIN || "ttgygockyojigiwmkjsl",
      region: process.env.REACT_APP_NHOST_REGION || "ap-south-1",
      adminSecret: process.env.NHOST_ADMIN_SECRET
    });

    // Simple query to find the email
    const { data, error } = await nhost.graphql.request(
      `query GetEmail($text: String!) {
        emails(where: {img_text: {_eq: $text}}) {
          id
          seen
        }
      }`,
      { text: imgText }
    );

    if (error || !data?.emails?.length) {
      console.log("Query error or no emails found:", error || "No matching emails");
      return sendPixel();
    }

    const email = data.emails[0];
    
    // Skip update if already seen
    if (email.seen) {
      console.log("Email already marked as seen");
      return sendPixel();
    }

    // Update the email status
    const updateResult = await nhost.graphql.request(
      `mutation UpdateEmail($id: Int!) {
        update_emails_by_pk(
          pk_columns: {id: $id},
          _set: {
            seen: true,
            seen_at: "now()"
          }
        ) {
          id
        }
      }`,
      { id: parseInt(email.id, 10) }
    );

    if (updateResult.error) {
      console.log("Update error:", updateResult.error);
    } else {
      console.log("Successfully updated email with ID:", email.id);
    }

    // Always return the pixel, even if the update fails
    return sendPixel();
  } catch (error) {
    console.error("Unhandled error:", error);
    
    // Return the pixel even if there's an error
    res.setHeader('Content-Type', 'image/gif');
    res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
  }
};