import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-forwarded-for',
};

// Helper to get client IP
function getClientIP(req: Request): string {
  // Check various headers for the client IP
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  return 'unknown';
}

// Helper to get IP geolocation
async function getIPLocation(ip: string): Promise<{ country?: string; city?: string; region?: string; isp?: string }> {
  if (ip === 'unknown' || ip === '127.0.0.1' || ip === '::1') {
    return { country: 'Local', city: 'Local', region: 'Local', isp: 'Local' };
  }
  
  try {
    // Using ip-api.com free tier (limited to 45 requests per minute)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,regionName,isp`);
    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        country: data.country || null,
        city: data.city || null,
        region: data.regionName || null,
        isp: data.isp || null
      };
    }
  } catch (error) {
    console.error('Geolocation lookup failed:', error);
  }
  
  return {};
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const clientIP = getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const { action, ...data } = await req.json();

    // Validate action doesn't require authentication
    if (action === 'validate') {
      const { license_key } = data;
      
      // Get geolocation data for logging
      const location = await getIPLocation(clientIP);
      
      // Check if IP is blocked first
      const { data: blockedIP } = await supabase
        .from('blocked_ips')
        .select('*')
        .eq('ip_address', clientIP)
        .single();

      if (blockedIP) {
        // Check if 5 seconds have passed since the IP was blocked
        const blockedAt = new Date(blockedIP.created_at);
        const now = new Date();
        const secondsSinceBlocked = (now.getTime() - blockedAt.getTime()) / 1000;
        
        if (secondsSinceBlocked >= 5) {
          console.log('Blocked IP attempted access:', clientIP);
          // Log the blocked attempt with location
          await supabase.from('ip_logs').insert({
            ip_address: clientIP,
            license_key: license_key || null,
            user_agent: userAgent,
            action: 'blocked_attempt',
            country: location.country,
            city: location.city,
            region: location.region,
            isp: location.isp
          });
          
          return new Response(JSON.stringify({ 
            valid: false, 
            error: 'Access denied from this location',
            blocked: true
          }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        // In grace period - return warning with seconds remaining
        const secondsRemaining = Math.ceil(5 - secondsSinceBlocked);
        console.log('IP blocked but in grace period:', clientIP, 'seconds remaining:', secondsRemaining);
        return new Response(JSON.stringify({ 
          valid: false, 
          error: 'Your access is being revoked',
          grace_period: true,
          seconds_remaining: secondsRemaining,
          reason: blockedIP.reason
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (!license_key) {
        return new Response(JSON.stringify({ 
          valid: false, 
          error: 'License key is required' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: license, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('license_key', license_key)
        .single();

      if (error || !license) {
        console.log('License not found:', license_key);
        // Log failed attempt with location
        await supabase.from('ip_logs').insert({
          ip_address: clientIP,
          license_key: license_key,
          user_agent: userAgent,
          action: 'invalid_license',
          country: location.country,
          city: location.city,
          region: location.region,
          isp: location.isp
        });
        
        return new Response(JSON.stringify({ 
          valid: false, 
          error: 'Invalid license key' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if license is suspended
      if (license.status === 'suspended') {
        await supabase.from('ip_logs').insert({
          ip_address: clientIP,
          license_key: license_key,
          user_agent: userAgent,
          action: 'suspended_license',
          country: location.country,
          city: location.city,
          region: location.region,
          isp: location.isp
        });
        
        return new Response(JSON.stringify({ 
          valid: false, 
          error: 'License has been suspended',
          reason: license.suspended_reason 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if license is expired
      const now = new Date();
      const expiryDate = new Date(license.expiry_date);
      if (expiryDate < now) {
        await supabase.from('ip_logs').insert({
          ip_address: clientIP,
          license_key: license_key,
          user_agent: userAgent,
          action: 'expired_license',
          country: location.country,
          city: location.city,
          region: location.region,
          isp: location.isp
        });
        
        return new Response(JSON.stringify({ 
          valid: false, 
          error: 'License has expired',
          expiry_date: license.expiry_date 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // License is valid - log successful access with location
      await supabase.from('ip_logs').insert({
        ip_address: clientIP,
        license_key: license_key,
        user_agent: userAgent,
        action: 'valid_access',
        country: location.country,
        city: location.city,
        region: location.region,
        isp: location.isp
      });

      return new Response(JSON.stringify({ 
        valid: true,
        company_name: license.company_name,
        expiry_date: license.expiry_date,
        status: license.status
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // All other actions require admin authentication via secret
    const adminSecret = data.admin_secret;
    const VALID_ADMIN_SECRET = 'ADMIN_XY_W_SECRET_2024';
    
    if (adminSecret !== VALID_ADMIN_SECRET) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    switch (action) {
      case 'create': {
        // Generate license key and API key
        const { data: licenseKey } = await supabase.rpc('generate_license_key');
        const { data: apiKey } = await supabase.rpc('generate_api_key');

        const { data: license, error } = await supabase
          .from('licenses')
          .insert({
            company_name: data.company_name,
            license_key: licenseKey,
            api_key: apiKey,
            expiry_date: data.expiry_date,
            status: data.status || 'trial',
            notes: data.notes || null,
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, license }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'list': {
        const { data: licenses, error } = await supabase
          .from('licenses')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, licenses }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update': {
        const { id, ...updateData } = data;
        const { data: license, error } = await supabase
          .from('licenses')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, license }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'suspend': {
        const { data: license, error } = await supabase
          .from('licenses')
          .update({
            status: 'suspended',
            suspended_at: new Date().toISOString(),
            suspended_reason: data.reason || 'Suspended by admin',
          })
          .eq('id', data.id)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, license }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        const { error } = await supabase
          .from('licenses')
          .delete()
          .eq('id', data.id);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'stats': {
        const { data: licenses } = await supabase
          .from('licenses')
          .select('status');

        const stats = {
          total: licenses?.length || 0,
          active: licenses?.filter(l => l.status === 'active').length || 0,
          trial: licenses?.filter(l => l.status === 'trial').length || 0,
          suspended: licenses?.filter(l => l.status === 'suspended').length || 0,
          expired: licenses?.filter(l => l.status === 'expired').length || 0,
        };

        return new Response(JSON.stringify({ success: true, stats }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // IP Management Actions
      case 'list_ip_logs': {
        const { data: logs, error } = await supabase
          .from('ip_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, logs }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'list_blocked_ips': {
        const { data: blocked, error } = await supabase
          .from('blocked_ips')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, blocked }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'block_ip': {
        const { data: blocked, error } = await supabase
          .from('blocked_ips')
          .insert({
            ip_address: data.ip_address,
            reason: data.reason || 'Blocked by admin',
            blocked_by: null,
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, blocked }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'unblock_ip': {
        const { error } = await supabase
          .from('blocked_ips')
          .delete()
          .eq('id', data.id);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Error in manage-licenses function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
