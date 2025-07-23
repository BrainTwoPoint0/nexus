import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import { normalizeOAuthProfile, mapOAuthToProfile } from '@/lib/oauth-utils';

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  const supabase = await createClient();

  // Handle OAuth callback (code exchange)
  if (code) {
    const { data: authData, error: authError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (authError) {
      console.error('OAuth code exchange error:', authError);
      redirect('/auth/auth-error?error=oauth_failed');
    }

    if (authData?.user) {
      console.log('OAuth user authenticated:', authData.user.id);

      // Try to enrich profile with OAuth data (don't let errors break the flow)
      try {
        await enrichProfileFromOAuth(authData.user, supabase);
      } catch (enrichError) {
        console.error('Profile enrichment error (non-blocking):', enrichError);
      }

      // Check if this is a new user by looking at profile completion
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', authData.user.id)
        .single();

      const isNewUser = !existingProfile?.onboarding_completed;
      const redirectPath = isNewUser ? '/onboarding' : next;

      redirect(redirectPath);
    }
  }

  // Handle email OTP verification (existing flow)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      redirect(next);
    }
  }

  // Redirect to error page if nothing matched
  redirect('/auth/auth-error?error=invalid_callback');
}

/**
 * Enrich user profile with OAuth data
 */
async function enrichProfileFromOAuth(
  user: Record<string, any>,
  supabase: any
) {
  try {
    // Get OAuth provider from user identities
    const identities = user.identities || [];
    const oauthIdentity = identities.find((id: Record<string, any>) =>
      ['linkedin_oidc'].includes(id.provider)
    );

    if (!oauthIdentity) {
      console.log('No OAuth identity found for profile enrichment');
      return;
    }

    console.log(
      'Enriching profile from OAuth provider:',
      oauthIdentity.provider
    );

    // Extract and normalize profile data
    const normalizedProfile = normalizeOAuthProfile(
      user,
      oauthIdentity.provider
    );

    if (!normalizedProfile) {
      console.error('Failed to normalize OAuth profile data');
      return;
    }

    // Map to database profile fields
    const profileData = mapOAuthToProfile(normalizedProfile);

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, data_sources')
      .eq('id', user.id)
      .single();

    if (existingProfile) {
      // Update existing profile with OAuth data
      const existingSources = existingProfile.data_sources || {};
      const oauthSource = normalizedProfile.provider;

      const updatedSources = {
        ...existingSources,
        [oauthSource]: {
          imported_at: new Date().toISOString(),
          fields: Object.keys(profileData),
        },
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          data_sources: updatedSources,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile with OAuth data:', updateError);
      } else {
        console.log(
          'Profile updated with OAuth data:',
          normalizedProfile.provider
        );
      }
    } else {
      // Create new profile with OAuth data in both tables (for backward compatibility)
      const oauthSource = normalizedProfile.provider;

      // Create new profile with OAuth data
      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        ...profileData,
        languages: ['English'],
        onboarding_completed: false,
        data_sources: {
          [oauthSource]: {
            imported_at: new Date().toISOString(),
            fields: Object.keys(profileData),
          },
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (insertError) {
        console.error('Error creating profile with OAuth data:', insertError);
      } else {
        console.log(
          'Profile created with OAuth data:',
          normalizedProfile.provider
        );
      }
    }
  } catch (error) {
    console.error('Profile enrichment error:', error);
    // Don't throw - we don't want to break the auth flow
  }
}
