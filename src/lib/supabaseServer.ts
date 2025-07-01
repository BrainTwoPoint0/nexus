import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";

export function getSupabaseServerClient() {
    return createServerSupabaseClient({
        headers: { cookie: cookies().toString() },
    });
} 