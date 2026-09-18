/**
 * Shared Supabase client, or `null` when the project is not configured.
 *
 * Only the public URL and anon key are used here. What each visitor may read
 * or write is enforced by row-level security in `supabase/migrations`, not by
 * this code.
 */

import { createClient } from "@supabase/supabase-js";

import { SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabase } from "../../config/env.js";

export const supabase = hasSupabase
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;
