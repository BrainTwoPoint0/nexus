"use client";

import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | undefined;

export function getSupabaseBrowserClient() {
    if (!supabase) {
        supabase = createBrowserSupabaseClient();
    }
    return supabase;
} 