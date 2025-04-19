import { NhostClient } from "@nhost/nhost-js";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

// Initialize Nhost without admin secret (use public role)
const nhost = new NhostClient({
  backendUrl: backendUrl,
});

export default async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const imgText = req.query.text;
  console.log("imgText", imgText);

  if (!imgText) {
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
    const { data, error } = await nhost.graphql.request(GET_EMAIL_ID, {
      text: imgText,
    });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data || !data.emails || data.emails.length === 0) {
      return res.status(404).json({ error: "No email found" });
    }

    const emailId = data.emails[0].id;
    const seen = data.emails[0].seen;

    if (seen) {
      return res.status(200).json({ message: "Email already marked as seen" });
    }

    // Mutation to update email status
    const UPDATE_QUERY = `
      mutation UpdateEmail($id: Int!, $date: timestamp!) {
        update_emails(
          where: { id: { _eq: $id } },
          _set: { seen: true, seen_at: $date }
        ) {
          affected_rows
        }
      }
    `;

    // Execute update
    const { data: updateData, error: updateError } = await nhost.graphql.request(
      UPDATE_QUERY,
      {
        id: emailId,
        date: new Date().toISOString(), // Use ISO string for timestamptz
      }
    );

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    // Return 1x1 pixel
    res.setHeader('Content-Type', 'image/gif');
    res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};