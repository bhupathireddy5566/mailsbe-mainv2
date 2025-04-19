import { NhostClient } from "@nhost/nhost-js";

// Use the exact GraphQL endpoint from the API Explorer
const graphqlUrl = 'https://ttgygockyojigiwmkjsl.hasura.ap-south-1.nhost.run/v1/graphql';
// Get admin secret from environment variable
const adminSecret = process.env.NHOST_ADMIN_SECRET || process.env.HASURA_GRAPHQL_ADMIN_SECRET;

console.log("Starting update function with GraphQL URL:", graphqlUrl);
console.log("Admin secret available:", !!adminSecret);

// Initialize Nhost with admin secret for elevated permissions and the correct GraphQL endpoint
const nhost = new NhostClient({
  graphqlUrl: graphqlUrl,
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
    // Still return the pixel image
    res.setHeader('Content-Type', 'image/gif');
    res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
    return;
  }

  try {
    // First find the email ID for the provided tracking text
    const FIND_EMAIL = `
      query FindEmail($text: String!) {
        emails(where: {img_text: {_eq: $text}}) {
          id
          seen
        }
      }
    `;

    console.log("Searching for email with text:", imgText);
    const { data: findData, error: findError } = await nhost.graphql.request(
      FIND_EMAIL, 
      { text: imgText },
      // Add explicit headers to ensure admin role is used
      { 
        'x-hasura-role': 'admin',
        'content-type': 'application/json',
        'x-hasura': 'true'
      }
    );
    
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

    console.log("Attempting to update email id:", email.id);

    // Using the exact mutation format provided by the user
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

    // Let's try with this exact mutation format
    let updateData, updateError;
    try {
      console.log("Using provided mutation format");
      const result = await nhost.graphql.request(
        UPDATE_MUTATION,
        { id: parseInt(email.id, 10) },
        { 
          'x-hasura-role': 'admin',
          'content-type': 'application/json',
          'x-hasura': 'true'
        }
      );
      updateData = result.data;
      updateError = result.error;
    } catch (err) {
      console.error("Mutation failed:", err);
      updateError = err;
    }

    if (updateError) {
      console.error("Failed to update email:", updateError);
      // Return pixel anyway
      res.setHeader('Content-Type', 'image/gif');
      res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
      return;
    }

    if (updateData) {
      console.log("Email successfully updated:", updateData);
    } else {
      console.log("Update operation completed but no data returned");
    }

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