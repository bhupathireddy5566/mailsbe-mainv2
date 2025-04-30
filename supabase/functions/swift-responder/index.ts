// Supabase Edge Function for email tracking
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// Supabase Service Role key for server-side operations
const supabaseUrl = 'https://ajkfmaqdwksljzkygfkd.supabase.co'
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqa2ZtYXFkd2tzbGp6a3lnZmtkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNDM4NTAyNiwiZXhwIjoyMDI5OTYxMDI2fQ.0hRFnDrBF70vKS7jKCRiUO31n3SsXFYp5yYwn-KTdOA'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Transparent 1x1 GIF in base64
const TRACKING_PIXEL = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  // Extract tracking ID from URL query parameters
  const url = new URL(req.url)
  const imgText = url.searchParams.get('text')

  console.log(`📢 Tracking request received for text=${imgText}`)

  try {
    // Skip processing if no tracking ID
    if (!imgText) {
      console.warn('⚠️ No tracking ID provided')
    } else {
      // Find email in database with this tracking ID
      const { data: email, error: selectError } = await supabase
        .from('emails')
        .select('id, seen, seen_at')
        .eq('img_text', imgText)
        .limit(1)
        .single()

      if (selectError) {
        console.error(`❌ Database query error:`, selectError.message)
      } else if (!email) {
        console.warn(`⚠️ No email found with img_text = "${imgText}"`)
      } else {
        console.log(`📧 Found email ID=${email.id}, seen=${email.seen}`)

        // Only update if not already seen
        if (!email.seen) {
          const seenAt = new Date().toISOString()
          console.log(`📝 Marking email as seen at ${seenAt}`)

          const { data: updatedEmail, error: updateError } = await supabase
            .from('emails')
            .update({ 
              seen: true, 
              seen_at: seenAt 
            })
            .eq('id', email.id)
            .select()
            .single()

          if (updateError) {
            console.error(`❌ Update error:`, updateError.message)
          } else {
            console.log(`✅ Email marked as seen successfully`)
          }
        } else {
          console.log(`ℹ️ Email already seen at ${email.seen_at}`)
        }
      }
    }

    // Always return the tracking pixel, regardless of processing outcome
    return new Response(
      Uint8Array.from(atob(TRACKING_PIXEL), c => c.charCodeAt(0)),
      { 
        headers: { 
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    )
  } catch (error) {
    console.error(`💥 ERROR:`, error.message)
    
    // Return the tracking pixel even if there's an error
    return new Response(
      Uint8Array.from(atob(TRACKING_PIXEL), c => c.charCodeAt(0)),
      { headers: { 'Content-Type': 'image/gif', 'Access-Control-Allow-Origin': '*' } }
    )
  }
}) 