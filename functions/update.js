import { NhostClient } from "@nhost/nhost-js";

// Make sure we have a backend URL - provide fallback if needed
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://ttgygockyojigiwmkjsl.ap-south-1.nhost.run';
// Get admin secret from environment variable
const adminSecret = process.env.NHOST_ADMIN_SECRET || 'F$Iv7SMMyg*h5,8n(dC4Xfo#z-@^w80b';

console.log("Starting update function with backend URL:", backendUrl);
console.log("Admin secret available:", !!adminSecret);

// Initialize Nhost with admin secret for elevated permissions
const nhost = new NhostClient({
  backendUrl,
  adminSecret
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
    // Still return the pixel image
    res.setHeader('Content-Type', 'image/gif');
    res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
    return;
  }

  try {
    // Direct SQL approach with hasura_role as admin
    const FIND_EMAIL = `
      query FindEmail($text: String!) {
        emails(where: {img_text: {_eq: $text}}) {
          id
          seen
        }
      }
    `;

    console.log("Searching for email with text:", imgText);
    const { data: findData, error: findError } = await nhost.graphql.request(FIND_EMAIL, {
      text: imgText
    });
    
    if (findError) {
      console.error("Error finding email:", findError);
      // Return pixel anyway
      res.setHeader('Content-Type', 'image/gif');
      res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
      return;
    }

    console.log("Find email result:", findData);
    
    if (!findData || !findData.emails || findData.emails.length === 0) {
      console.error("No email found with text:", imgText);
      // Return pixel anyway
      res.setHeader('Content-Type', 'image/gif');
      res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
      return;
    }

    const email = findData.emails[0];
    console.log("Found email:", email);
    
    if (email.seen) {
      console.log("Email already marked as seen");
      res.setHeader('Content-Type', 'image/gif');
      res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
      return;
    }

    // Now use a direct update mutation with admin permissions
    const UPDATE_MUTATION = `
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

    console.log("Attempting to update email id:", email.id);
    const { data: updateData, error: updateError } = await nhost.graphql.request(
      UPDATE_MUTATION,
      { id: parseInt(email.id, 10) }
    );

    if (updateError) {
      console.error("Failed to update email:", updateError);
      // Return pixel anyway
      res.setHeader('Content-Type', 'image/gif');
      res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
      return;
    }

    console.log("Email successfully updated:", updateData);

    // Always return the pixel image
    res.setHeader('Content-Type', 'image/gif');
    res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
  } catch (error) {
    console.error("Unhandled error in serverless function:", error);
    // Always return the tracking pixel, even on error
    res.setHeader('Content-Type', 'image/gif');
    res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
  }
};