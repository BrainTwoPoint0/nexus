"use client";

import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { useState } from "react";

interface Props {
    children: React.ReactNode;
}

export function SupabaseProvider({ children }: Props) {
    const [supabaseClient] = useState(() => createBrowserSupabaseClient());

    return (
        <SessionContextProvider supabaseClient={supabaseClient}>
            {children}
        </SessionContextProvider>
    );
} 