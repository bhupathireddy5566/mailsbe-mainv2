// Direct Hasura approach - no Nhost client dependency
const fetch = require('node-fetch');

// Configuration
const HASURA_ENDPOINT = 'https://ttgygockyojigiwmkjsl.hasura.ap-south-1.nhost.run/v1/graphql';
const HASURA_ADMIN_SECRET = process.env.NHOST_ADMIN_SECRET || process.env.HASURA_GRAPHQL_ADMIN_SECRET;

// 1x1 transparent pixel as base64
const TRACKING_PIXEL = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

// Simplified error handling and direct Hasura access
export default async (req, res) => {
  console.log(`Tracking pixel request received: ${req.url}`);

  // Set up CORS and headers for the image response
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Always set up the response to be a GIF image
  res.setHeader('Content-Type', 'image/gif');
  
  try {
    // Get the tracking ID from the query parameters
    const trackingId = req.query.text;
    
    if (!trackingId) {
      console.log('No tracking ID provided');
      return res.send(Buffer.from(TRACKING_PIXEL, 'base64'));
    }
    
    console.log(`Processing tracking ID: ${trackingId}`);
    
    // Find the email with this tracking ID
    const findEmailResponse = await fetch(HASURA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': HASURA_ADMIN_SECRET
      },
      body: JSON.stringify({
        query: `
          query FindEmail($trackingId: String!) {
            emails(where: {img_text: {_eq: $trackingId}}) {
              id
              seen
              email
            }
          }
        `,
        variables: {
          trackingId: trackingId
        }
      })
    });
    
    // Parse the response
    const findEmailResult = await findEmailResponse.json();
    console.log('Find email result:', JSON.stringify(findEmailResult));
    
    // Check for errors or no emails found
    if (findEmailResult.errors) {
      console.error('GraphQL error:', findEmailResult.errors);
      return res.send(Buffer.from(TRACKING_PIXEL, 'base64'));
    }
    
    if (!findEmailResult.data || !findEmailResult.data.emails || findEmailResult.data.emails.length === 0) {
      console.log(`No email found with tracking ID: ${trackingId}`);
      return res.send(Buffer.from(TRACKING_PIXEL, 'base64'));
    }
    
    const email = findEmailResult.data.emails[0];
    console.log(`Found email: ${JSON.stringify(email)}`);
    
    // Skip update if already seen
    if (email.seen) {
      console.log(`Email ${email.id} already marked as seen`);
      return res.send(Buffer.from(TRACKING_PIXEL, 'base64'));
    }
    
    // Update the email as seen
    console.log(`Updating email ${email.id} as seen`);
    const updateResponse = await fetch(HASURA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': HASURA_ADMIN_SECRET
      },
      body: JSON.stringify({
        query: `
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
        `,
        variables: {
          id: email.id
        }
      })
    });
    
    const updateResult = await updateResponse.json();
    console.log('Update result:', JSON.stringify(updateResult));
    
    if (updateResult.errors) {
      console.error('Update error:', updateResult.errors);
    } else {
      console.log(`Successfully updated email ${email.id} as seen`);
    }
    
    // Return the tracking pixel
    return res.send(Buffer.from(TRACKING_PIXEL, 'base64'));
  } catch (error) {
    console.error('Error in tracking pixel function:', error);
    return res.send(Buffer.from(TRACKING_PIXEL, 'base64'));
  }
};