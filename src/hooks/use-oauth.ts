/**
 * OAuth Authentication Hook
 * Handles LinkedIn and Google OAuth flows
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import { useState, useCallback } from 'react';
import { useSupabase } from '@/components/providers/supabase-provider';
import { normalizeOAuthProfile, getOAuthRedirectUrl } from '@/lib/oauth-utils';
import { Provider } from '@supabase/supabase-js';

interface UseOAuthReturn {
  signInWithOAuth: (provider: 'linkedin_oidc' | 'google') => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useOAuth(): UseOAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = useSupabase();

  const signInWithOAuth = useCallback(
    async (provider: 'linkedin_oidc' | 'google') => {
      try {
        setIsLoading(true);
        setError(null);

        const redirectTo = getOAuthRedirectUrl();

        const { error: oauthError } = await supabase.auth.signInWithOAuth({
          provider: provider as Provider,
          options: {
            redirectTo,
            scopes:
              provider === 'linkedin_oidc'
                ? 'openid profile email'
                : 'openid profile email',
          },
        });

        if (oauthError) {
          console.error(`${provider} OAuth error:`, oauthError);
          setError(oauthError.message);
          return;
        }

        // The redirect will happen automatically
        // Profile enrichment will be handled in the callback
      } catch (err) {
        console.error(`${provider} sign-in error:`, err);
        setError(
          err instanceof Error ? err.message : 'An unexpected error occurred'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [supabase.auth]
  );

  return {
    signInWithOAuth,
    isLoading,
    error,
  };
}

/**
 * Profile enrichment hook for OAuth data
 */
export function useProfileEnrichment() {
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentError, setEnrichmentError] = useState<string | null>(null);
  const supabase = useSupabase();

  const enrichProfileFromOAuth = useCallback(
    async (user: Record<string, any>) => {
      try {
        setIsEnriching(true);
        setEnrichmentError(null);

        // Get the OAuth provider from user identities
        const identities = user.identities || [];
        const oauthIdentity = identities.find((id: Record<string, any>) =>
          ['linkedin_oidc', 'google'].includes(id.provider)
        );

        if (!oauthIdentity) {
          console.log('No OAuth identity found for profile enrichment');
          return null;
        }

        // Extract profile data
        const normalizedProfile = normalizeOAuthProfile(
          user,
          oauthIdentity.provider
        );

        if (!normalizedProfile) {
          throw new Error(
            `Failed to normalize ${oauthIdentity.provider} profile data`
          );
        }

        console.log('Normalized OAuth profile:', normalizedProfile);

        return normalizedProfile;
      } catch (err) {
        console.error('Profile enrichment error:', err);
        setEnrichmentError(
          err instanceof Error ? err.message : 'Profile enrichment failed'
        );
        return null;
      } finally {
        setIsEnriching(false);
      }
    },
    []
  );

  return {
    enrichProfileFromOAuth,
    isEnriching,
    enrichmentError,
  };
}
