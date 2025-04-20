import { NhostClient } from "@nhost/nhost-js";

// Simplified minimal function to avoid 500 error
export default async (req, res) => {
  try {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Always send the pixel first to ensure email clients display properly
    const sendPixel = () => {
      res.setHeader('Content-Type', 'image/gif');
      return res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
    };

    // Try to get the tracking ID
    const trackingId = req.query.text;
    
    // If no tracking ID, just return the pixel
    if (!trackingId) {
      return sendPixel();
    }

    // Initialize Nhost client - simplest possible way
    const nhost = new NhostClient({
      subdomain: 'ttgygockyojigiwmkjsl',
      region: 'ap-south-1',
      adminSecret: 'F$Iv7SMMyg*h5,8n(dC4Xfo#z-@^w80b'
    });

    // Simple query to find the email
    const { data } = await nhost.graphql.request(`
      query GetEmail($text: String!) {
        emails(where: {img_text: {_eq: $text}}) {
          id
          seen
        }
      }
    `, { text: trackingId });

    // If email found and not already seen, update it
    if (data?.emails && data.emails.length > 0 && !data.emails[0].seen) {
      const emailId = data.emails[0].id;
      
      // Update the seen status (simplest possible query)
      await nhost.graphql.request(`
        mutation UpdateEmail($id: Int!) {
          update_emails_by_pk(
            pk_columns: {id: $id},
            _set: {
              seen: true,
              seen_at: "now()"
            }
          ) {
            id
          }
        }
      `, { id: parseInt(emailId, 10) });
    }

    // Always return the pixel
    return sendPixel();
  } catch (error) {
    // On any error, still return the pixel
    res.setHeader('Content-Type', 'image/gif');
    res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
  }
};