// Use axios for HTTP requests - more reliable than raw https
// VERSION: 2.0 - PURE AXIOS IMPLEMENTATION
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Supabase Service Role key should be used for server-side operations
const supabaseUrl = 'https://ajkfmaqdwksljzkygfkd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqa2ZtYXFkd2tzbGp6a3lnZmtkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNDM4NTAyNiwiZXhwIjoyMDI5OTYxMDI2fQ.0hRFnDrBF70vKS7jKCRiUO31n3SsXFYp5yYwn-KTdOA';

export default async (req, res) => {
  console.log("📢 SUPABASE TRACKING PIXEL - REQUEST RECEIVED", {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    query: req.query
  });

  // ─── 1) CORS HEADERS ───────────────────────────────────────
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ─── 2) PIXEL UTILITY ────────────────────────────────────
  const sendPixel = () => {
    // Return a 1x1 transparent GIF
    res.setHeader("Content-Type", "image/gif");
    res.send(Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64"));
  };

  try {
    // ─── 3) VALIDATE QUERY PARAM ────────────────────────────
    const imgText = req.query.text;
    if (!imgText) {
      console.warn("⚠️ No tracking ID provided in query parameters");
      return sendPixel();
    }
    console.log(`✅ Tracking ID (text param): ${imgText}`);

    // ─── 4) INITIALIZE SUPABASE CLIENT ────────────────────────
    console.log(`🔌 Connecting to Supabase at ${supabaseUrl}`);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // ─── 5) QUERY EMAIL BY IMG_TEXT ─────────────────────────
    console.log(`🔍 Finding email with img_text = "${imgText}"`);
    const { data: email, error: selectError } = await supabase
      .from('emails')
      .select('id, seen, seen_at')
      .eq('img_text', imgText)
      .limit(1)
      .single();
    
    // Handle query errors
    if (selectError) {
      console.error(`❌ Supabase query error:`, selectError);
      return sendPixel();
    }
    
    // Check if email exists
    if (!email) {
      console.warn(`⚠️ No email found with img_text = "${imgText}"`);
      return sendPixel();
    }
    
    console.log(`📧 Found email ID=${email.id}, current seen status=${email.seen}`);
    
    // ─── 6) SKIP IF ALREADY SEEN ───────────────────────────
    if (email.seen === true) {
      console.log(`ℹ️ Email ID=${email.id} already marked as seen at ${email.seen_at}`);
      return sendPixel();
    }
    
    // ─── 7) UPDATE EMAIL AS SEEN ────────────────────────────
    const seenAt = new Date().toISOString();
    console.log(`📝 Updating email ID=${email.id} to seen=true, seen_at=${seenAt}`);
    
    const { data: updatedEmail, error: updateError } = await supabase
      .from('emails')
      .update({ 
        seen: true, 
        seen_at: seenAt 
      })
      .eq('id', email.id)
      .select('id, seen, seen_at')
      .single();
    
    if (updateError) {
      console.error(`❌ Supabase update error:`, updateError);
    } else if (updatedEmail) {
      console.log(`✅ SUCCESSFULLY updated email ID=${email.id}`);
      console.log(`✅ New values: seen=${updatedEmail.seen}, seen_at=${updatedEmail.seen_at}`);
    } else {
      console.warn(`⚠️ Update returned no data`);
    }
    
    // ─── 8) ALWAYS RETURN PIXEL ──────────────────────────────
    return sendPixel();
    
  } catch (error) {
    console.error(`💥 CRITICAL ERROR: ${error.message}`);
    console.error(error.stack);
    return sendPixel();
  }
};
