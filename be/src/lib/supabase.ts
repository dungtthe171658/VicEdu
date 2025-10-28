import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL as string | undefined;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;

if (!url || !serviceKey) {
  // Do not throw to keep app booting; warn instead
  console.warn("Supabase admin not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
}

export const supabaseAdmin = url && serviceKey ? createClient(url, serviceKey) : (null as any);

