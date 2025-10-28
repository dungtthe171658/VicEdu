// src/lib/supabase.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let supabaseClient: SupabaseClient | null = null;
if (url && anon) {
  supabaseClient = createClient(url, anon);
} else {
  // Avoid hard crash at import time; log helpful guidance instead.
  if (typeof console !== "undefined") {
    console.error(
      "Supabase client not initialized: missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Configure .env and restart dev server."
    );
  }
}

export const supabase = supabaseClient;
