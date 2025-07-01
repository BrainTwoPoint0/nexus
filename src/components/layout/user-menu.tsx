"use client";

import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { Button } from "@/components/ui/Button";

export function UserMenu() {
    const supabase = useSupabaseClient();
    const user = useUser();

    if (!user) return null;

    return (
        <div className="flex items-center gap-3">
            <span className="text-sm text-foreground/80">
                {user.user_metadata?.first_name || user.email}
            </span>
            <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = "/";
                }}
            >
                Sign Out
            </Button>
        </div>
    );
} 