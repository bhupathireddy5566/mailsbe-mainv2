// Supabase Edge Function for email tracking
import { createClient } from '@supabase/supabase-js';

// Supabase Service Role key should be used for server-side operations
const supabaseUrl = 'https://ajkfmaqdwksljzkygfkd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqa2ZtYXFkd2tzbGp6a3lnZmtkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNDM4NTAyNiwiZXhwIjoyMDI5OTYxMDI2fQ.0hRFnDrBF70vKS7jKCRiUO31n3SsXFYp5yYwn-KTdOA';

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Supabase Edge Function handler
export default async (req, res) => {
  console.log("📢 TRACKING PIXEL REQUEST RECEIVED", {
    timestamp: new Date().toISOString(),
    method: req.method,
    query: req.query
  });

  // Set CORS headers to allow requests from any origin
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Function to send a 1x1 transparent GIF
  const sendPixel = () => {
    res.setHeader("Content-Type", "image/gif");
    res.send(Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64"));
  };

  try {
    // Get tracking ID from query parameters
    const imgText = req.query.text;
    if (!imgText) {
      console.warn("⚠️ No tracking ID provided");
      return sendPixel();
    }
    console.log(`✅ Tracking ID: ${imgText}`);

    // Find email in database
    const { data: email, error: selectError } = await supabase
      .from('emails')
      .select('id, seen, seen_at')
      .eq('img_text', imgText)
      .limit(1)
      .single();
    
    if (selectError) {
      console.error(`❌ Database query error:`, selectError);
      return sendPixel();
    }
    
    if (!email) {
      console.warn(`⚠️ No email found with img_text = "${imgText}"`);
      return sendPixel();
    }
    
    console.log(`📧 Found email ID=${email.id}, seen=${email.seen}`);
    
    // Skip update if already marked as seen
    if (email.seen === true) {
      console.log(`ℹ️ Email already seen at ${email.seen_at}`);
      return sendPixel();
    }
    
    // Update email as seen
    const seenAt = new Date().toISOString();
    console.log(`📝 Marking email as seen`);
    
    const { data: updatedEmail, error: updateError } = await supabase
      .from('emails')
      .update({ 
        seen: true, 
        seen_at: seenAt 
      })
      .eq('id', email.id)
      .select()
      .single();
    
    if (updateError) {
      console.error(`❌ Update error:`, updateError);
    } else {
      console.log(`✅ Email marked as seen successfully`);
    }
    
    // Always return the tracking pixel
    return sendPixel();
    
  } catch (error) {
    console.error(`💥 ERROR:`, error.message);
    return sendPixel();
  }
};
