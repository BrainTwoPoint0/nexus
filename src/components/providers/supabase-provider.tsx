'use client';

import {
  SessionContextProvider,
  useSupabaseClient,
} from '@supabase/auth-helpers-react';
import { createClient } from '@/lib/supabaseClient';
import { useState } from 'react';

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());

  return (
    <SessionContextProvider supabaseClient={supabase}>
      {children}
    </SessionContextProvider>
  );
}

// Export the hook for use in components
export const useSupabase = useSupabaseClient;
