'use client';

import { SessionContextProvider } from '@supabase/auth-helpers-react';
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
