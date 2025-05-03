// VERSION: 3.0 - ZERO DEPENDENCIES
// Using only built-in Node.js modules - no external dependencies

export default async (req, res) => {
  console.log("🚀 --- PIXEL TRACKER v3.0 (NO DEPENDENCIES) ---");
  console.log("⏰ Request received at:", new Date().toISOString());
  console.log("📦 Query parameters:", req.query);

  // ─── CORS HEADERS ───────────────────────────────────────
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-hasura-admin-secret");
  
  if (req.method === "OPTIONS") {
    console.log("✈️ Responding to OPTIONS request");
    return res.status(200).end();
  }

  // ─── PIXEL RESPONSE ────────────────────────────────────
  const sendPixel = () => {
    console.log("🖼️ Sending 1x1 transparent GIF pixel response");
    res.setHeader("Content-Type", "image/gif");
    res.setHeader("Cache-Control", "no-store, no-cache");
    res.send(Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64"));
  };

  try {
    const imgText = req.query.text;
    if (!imgText) return sendPixel();

    // GraphQL query to find the email
    const query = {
      query: `
        query ($img_text: String!) {
          emails(where: {img_text: {_eq: $img_text}}, limit: 1) {
            id
            seen
          }
        }
      `,
      variables: { img_text: imgText }
    };

    // GraphQL mutation to update seen status
    const mutation = (id) => ({
      query: `
        mutation ($id: Int!, $seenAt: timestamptz!) {
          update_emails_by_pk(
            pk_columns: {id: $id},
            _set: {seen: true, seen_at: $seenAt}
          ) { id }
        }
      `,
      variables: { id, seenAt: new Date().toISOString() }
    });

    // Helper to make GraphQL requests
    const https = require('https');
    const HASURA_URL = 'https://ttgygockyojigiwmkjsl.hasura.ap-south-1.nhost.run/v1/graphql';
    const ADMIN_SECRET = "F$Iv7SMMyg*h5,8n(dC4Xfo#z-@^w80b";
    const doGraphQL = (body) => new Promise((resolve, reject) => {
      const url = new URL(HASURA_URL);
      const req2 = https.request({
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': ADMIN_SECRET,
        }
      }, (res2) => {
        let data = '';
        res2.on('data', chunk => data += chunk);
        res2.on('end', () => resolve(JSON.parse(data)));
      });
      req2.on('error', reject);
      req2.write(JSON.stringify(body));
      req2.end();
    });

    // 1. Find the email
    const result = await doGraphQL(query);
    const email = result?.data?.emails?.[0];
    if (!email) return sendPixel();
    if (email.seen) return sendPixel();

    // 2. Update as seen
    await doGraphQL(mutation(email.id));
    return sendPixel();

  } catch (e) {
    // Always return the pixel, even on error
    return sendPixel();
  } finally {
    console.log("🏁 --- Function End ---");
  }
};
