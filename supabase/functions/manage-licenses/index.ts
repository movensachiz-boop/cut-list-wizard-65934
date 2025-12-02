import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, ...data } = await req.json();

    // Validate action doesn't require authentication
    if (action === 'validate') {
      const { license_key } = data;
      
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
        return new Response(JSON.stringify({ 
          valid: false, 
          error: 'Invalid license key' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if license is suspended
      if (license.status === 'suspended') {
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
        return new Response(JSON.stringify({ 
          valid: false, 
          error: 'License has expired',
          expiry_date: license.expiry_date 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // License is valid
      return new Response(JSON.stringify({ 
        valid: true,
        company_name: license.company_name,
        expiry_date: license.expiry_date,
        status: license.status
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // All other actions require authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!userRole) {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
        status: 403,
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