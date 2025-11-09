// supabase/functions/file-uploader/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ✅ هدرهای CORS را بسیار باز کردیم
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // اجازه به همه
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE', // اجازه همه متدها
  'Access-Control-Allow-Headers': '*', // اجازه همه هدرها
};

serve(async (req) => {
  // ✅ پاسخ صریح به درخواست OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const filePath = req.headers.get('X-File-Path');
    if (!filePath) {
      throw new Error('Missing X-File-Path header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const fileBlob = await req.blob();

    const { data, error: uploadError } = await supabaseClient.storage
      .from('files')
      .upload(filePath, fileBlob, {
        contentType: req.headers.get('Content-Type') || 'application/octet-stream',
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});