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

    // Log the full request details for debugging
    console.log("Tracking request received:", {
      method: req.method,
      url: req.url,
      query: req.query,
      headers: req.headers
    });

    // Always return the 1x1 tracking pixel GIF regardless of processing
    // This ensures emails don't break even if there's an error
    const sendPixel = () => {
      res.setHeader('Content-Type', 'image/gif');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
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
    const subdomain = process.env.REACT_APP_NHOST_SUBDOMAIN || "ttgygockyojigiwmkjsl";
    const region = process.env.REACT_APP_NHOST_REGION || "ap-south-1";
    const adminSecret = process.env.NHOST_ADMIN_SECRET;
    
    console.log("Nhost configuration:", {
      subdomain,
      region,
      hasAdminSecret: !!adminSecret
    });
    
    const nhost = new NhostClient({
      subdomain,
      region,
      adminSecret
    });

    // Use the explicit mutation name that's in your Allow List
    const FIND_EMAIL_QUERY = `
      query GetEmail($text: String!) {
        emails(where: {img_text: {_eq: $text}}) {
          id
          seen
          email
          created_at
        }
      }
    `;

    console.log("Executing query to find email with tracking ID:", imgText);
    
    // Simple query to find the email
    const { data, error } = await nhost.graphql.request(
      FIND_EMAIL_QUERY,
      { text: imgText }
    );

    if (error) {
      console.error("GraphQL query error:", error);
      return sendPixel();
    }
    
    if (!data?.emails?.length) {
      console.log("No matching emails found for tracking ID:", imgText);
      return sendPixel();
    }

    const email = data.emails[0];
    console.log("Found email:", JSON.stringify(email));
    
    // Skip update if already seen
    if (email.seen) {
      console.log("Email already marked as seen - no update needed");
      return sendPixel();
    }

    console.log("Email found and needs to be marked as seen. ID:", email.id);

    // Use the exact mutation name that's in your Allow List
    const UPDATE_EMAIL_MUTATION = `
      mutation UpdateEmailSeen($id: Int!) {
        update_emails_by_pk(
          pk_columns: {id: $id},
          _set: {
            seen: true,
            seen_at: "now()"
          }
        ) {
          id
          seen
          seen_at
        }
      }
    `;

    // Update the email status
    console.log("Executing UpdateEmailSeen mutation for email ID:", email.id);
    const updateResult = await nhost.graphql.request(
      UPDATE_EMAIL_MUTATION,
      { id: parseInt(email.id, 10) }
    );

    if (updateResult.error) {
      console.error("Update error:", updateResult.error);
    } else {
      console.log("Successfully updated email tracking status:", updateResult.data);
    }

    // Always return the pixel, even if the update fails
    return sendPixel();
  } catch (error) {
    console.error("Unhandled error:", error);
    
    // Return the pixel even if there's an error
    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
  }
};