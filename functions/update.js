// Simple serverless function with minimal dependencies
// Configuration
const HASURA_ENDPOINT = 'https://ttgygockyojigiwmkjsl.hasura.ap-south-1.nhost.run/v1/graphql';
const HASURA_ADMIN_SECRET = process.env.NHOST_ADMIN_SECRET || process.env.HASURA_GRAPHQL_ADMIN_SECRET || 'F$Iv7SMMyg*h5,8n(dC4Xfo#z-@^w80b';

// 1x1 transparent pixel as base64
const TRACKING_PIXEL = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

// Simplified error handling and direct Hasura access
export default async (req, res) => {
  // First, set up the response to always be an image
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log("Tracking request received:", req.url);
    
    // Get the tracking ID from the query parameters
    const trackingId = req.query.text;
    
    if (!trackingId) {
      console.log('No tracking ID provided');
      return res.send(Buffer.from(TRACKING_PIXEL, 'base64'));
    }
    
    console.log(`Processing tracking ID: ${trackingId}`);
    
    try {
      // Simple direct update - avoid complex GraphQL operations
      const update = await fetch(HASURA_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': HASURA_ADMIN_SECRET
        },
        body: JSON.stringify({
          query: `
            mutation MarkEmailAsSeen($trackingId: String!) {
              update_emails(
                where: {img_text: {_eq: $trackingId}},
                _set: {seen: true, seen_at: "now()"}
              ) {
                affected_rows
              }
            }
          `,
          variables: {
            trackingId: trackingId
          }
        })
      });
      
      const result = await update.json();
      console.log("Update result:", result);
      
      if (result.data && result.data.update_emails.affected_rows > 0) {
        console.log(`Successfully marked email as seen: ${result.data.update_emails.affected_rows} row(s) affected`);
      } else {
        console.log("No emails were updated");
      }
    } catch (err) {
      console.error("Error updating email:", err);
      // Continue to return the pixel even if the update fails
    }
    
    // Always return the tracking pixel GIF
    return res.send(Buffer.from(TRACKING_PIXEL, 'base64'));
  } catch (error) {
    console.error('Error in tracking pixel function:', error);
    // Always return the tracking pixel even on error
    return res.send(Buffer.from(TRACKING_PIXEL, 'base64'));
  }
};