import { NhostClient } from "@nhost/nhost-js";

// Simplified function with better error handling and detailed logging
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
    console.log("======= PIXEL TRACKING ACTIVATED =======");
    console.log("Tracking ID received:", imgText);
    console.log("Request URL:", req.url);
    console.log("Request method:", req.method);
    console.log("Request headers:", JSON.stringify(req.headers));

    // If no text parameter, just return the pixel
    if (!imgText) {
      console.log("ERROR: No tracking ID provided in query parameters");
      return sendPixel();
    }

    // Hard-coded admin secret as backup - replace with your actual admin secret
    const adminSecret = process.env.NHOST_ADMIN_SECRET || "F$Iv7SMMyg*h5,8n(dC4Xfo#z-@^w80b";
    console.log("Using admin secret:", adminSecret ? "YES (available)" : "NO (missing)");

    // Initialize Nhost client with explicit values
    const nhost = new NhostClient({
      subdomain: "ttgygockyojigiwmkjsl",
      region: "ap-south-1",
      adminSecret: adminSecret
    });

    console.log("Initialized Nhost client");
    console.log("Searching for email with tracking ID:", imgText);

    // Simple query to find the email - with detailed logging
    const findEmailResponse = await nhost.graphql.request(
      `query GetEmail($text: String!) {
        emails(where: {img_text: {_eq: $text}}) {
          id
          seen
        }
      }`,
      { text: imgText }
    );
    
    console.log("Find email response:", JSON.stringify(findEmailResponse));
    
    if (findEmailResponse.error) {
      console.log("ERROR finding email:", findEmailResponse.error);
      return sendPixel();
    }
    
    const emails = findEmailResponse.data?.emails || [];
    console.log("Emails found:", emails.length);
    
    if (emails.length === 0) {
      console.log("ERROR: No email found with tracking ID:", imgText);
      return sendPixel();
    }

    const email = emails[0];
    console.log("Found email:", JSON.stringify(email));
    
    // Skip update if already seen
    if (email.seen) {
      console.log("Email already marked as seen");
      return sendPixel();
    }

    console.log("Attempting to update email with ID:", email.id);
    
    // Prepare the update mutation
    const UPDATE_MUTATION = `
      mutation UpdateEmail($id: Int!) {
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
    
    // Try direct fetch approach as alternative
    try {
      console.log("Executing update mutation...");
      const updateResponse = await nhost.graphql.request(
        UPDATE_MUTATION,
        { id: parseInt(email.id, 10) }
      );
      
      console.log("Update response:", JSON.stringify(updateResponse));
      
      if (updateResponse.error) {
        console.log("ERROR updating email:", updateResponse.error);
      } else if (updateResponse.data?.update_emails_by_pk) {
        console.log("SUCCESS: Email marked as seen!");
        console.log("Updated data:", JSON.stringify(updateResponse.data.update_emails_by_pk));
      } else {
        console.log("WARNING: Update operation returned no errors but no confirmation data");
      }
    } catch (updateError) {
      console.log("EXCEPTION during update:", updateError);
    }

    // Always return the pixel, even if the update fails
    return sendPixel();
  } catch (error) {
    console.error("CRITICAL ERROR:", error);
    
    // Return the pixel even if there's an error
    res.setHeader('Content-Type', 'image/gif');
    res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
  }
};