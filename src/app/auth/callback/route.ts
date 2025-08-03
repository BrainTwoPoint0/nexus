import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import { normalizeOAuthProfile, mapOAuthToProfile } from '@/lib/oauth-utils';

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(request: NextRequest) {
  console.log('🚀 AUTH CALLBACK STARTED');
  try {
    const { searchParams } = new URL(request.url);
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type') as EmailOtpType | null;
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dashboard';
    console.log('📋 Auth callback parameters:', {
      hasCode: !!code,
      hasTokenHash: !!token_hash,
      type,
      nextParam: searchParams.get('next'),
      defaultNext: next,
    });

    console.log('🔗 Auth callback called with:', {
      code: !!code,
      token_hash: !!token_hash,
      type,
      next,
    });

    console.log('⏱️ Creating Supabase client...');
    const supabase = await createClient();
    console.log('✅ Supabase client created');

    // Handle OAuth callback (code exchange)
    if (code) {
      console.log('🔄 Processing OAuth code exchange...');

      console.log('⏱️ Starting code exchange...');
      const { data: authData, error: authError } =
        await supabase.auth.exchangeCodeForSession(code);
      console.log('✅ Code exchange completed', {
        hasUser: !!authData?.user,
        hasError: !!authError,
      });

      if (authError) {
        console.error('❌ OAuth code exchange error:', authError);
        redirect('/auth/auth-error?error=oauth_failed');
      }

      if (authData?.user) {
        console.log('✅ OAuth user authenticated:', authData.user.id);

        // Check if this is a new user BEFORE trying to enrich profile
        console.log('🔍 Checking existing profile...');
        const { data: existingProfile, error: profileCheckError } =
          await supabase
            .from('profiles')
            .select('onboarding_completed, id')
            .eq('id', authData.user.id)
            .single();

        let isNewUser = false;

        if (profileCheckError) {
          console.log('📝 No existing profile found, this is a new user');
          isNewUser = true;
        } else {
          console.log('👤 Existing profile found:', {
            id: existingProfile.id,
            onboarding_completed: existingProfile.onboarding_completed,
          });
          // User is new if onboarding is not completed
          isNewUser = !existingProfile.onboarding_completed;
        }

        console.log('🆕 Is new user (needs onboarding):', isNewUser);

        // Skip profile creation for new users - let onboarding handle it
        if (!isNewUser) {
          // Only try to enrich existing profiles
          try {
            console.log('📊 Starting profile enrichment for existing user...');
            const enrichmentPromise = enrichProfileFromOAuth(
              authData.user,
              supabase,
              isNewUser
            );
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error('Profile enrichment timeout')),
                10000
              )
            );

            await Promise.race([enrichmentPromise, timeoutPromise]);
            console.log('✅ Profile enrichment completed');
          } catch (enrichError) {
            console.error(
              '⚠️ Profile enrichment error (non-blocking):',
              enrichError
            );
          }
        } else {
          console.log(
            '👤 New user detected - skipping profile creation, will handle in onboarding'
          );
        }

        // Simplified redirect logic - new users always go to onboarding
        let redirectPath = '/onboarding'; // Default for new users

        if (!isNewUser) {
          // For existing users, check if they completed onboarding
          try {
            console.log('🔍 Checking onboarding status for existing user...');
            const { data: profileCheck } = await supabase
              .from('profiles')
              .select('onboarding_completed')
              .eq('id', authData.user.id)
              .single();

            if (profileCheck?.onboarding_completed) {
              redirectPath = next; // Redirect to intended destination
            }
            // If onboarding not completed, keep redirectPath as '/onboarding'
          } catch (profileCheckError) {
            console.error(
              '⚠️ Profile check failed, defaulting to onboarding:',
              profileCheckError
            );
            // Keep redirectPath as '/onboarding'
          }
        }
        console.log('🎯 Final redirect decision:', {
          path: redirectPath,
          reason:
            redirectPath === '/onboarding'
              ? 'User needs onboarding'
              : 'User already onboarded',
          userId: authData.user.id,
          email: authData.user.email,
          isNewUser: isNewUser,
          redirectingTo: redirectPath,
        });

        console.log('🚀 REDIRECTING USER TO:', redirectPath);
        redirect(redirectPath);
      } else {
        console.error('❌ No user data from OAuth');
        redirect('/auth/auth-error?error=no_user_data');
      }
    }

    // Handle email OTP verification (existing flow)
    if (token_hash && type) {
      console.log('📧 Processing email OTP verification...');

      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      });

      if (!error) {
        console.log('✅ Email OTP verified, redirecting to:', next);
        redirect(next);
      } else {
        console.error('❌ Email OTP verification failed:', error);
      }
    }

    // Redirect to error page if nothing matched
    console.log('❌ No valid callback parameters, redirecting to error page');
    redirect('/auth/auth-error?error=invalid_callback');
  } catch (error) {
    // Next.js redirect() throws a special error that should not be caught
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      console.log('✅ Normal Next.js redirect, re-throwing...');
      throw error;
    }

    console.error('🚨 UNEXPECTED ERROR in auth callback:', error);
    console.error('🚨 Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      type: typeof error,
      error: error,
    });
    redirect('/auth/auth-error?error=unexpected_error');
  }
}

/**
 * Enrich user profile with OAuth data
 */
async function enrichProfileFromOAuth(
  user: Record<string, any>,
  supabase: any,
  isNewUser: boolean
) {
  try {
    console.log('🔍 Looking for OAuth identity...');

    // Get OAuth provider from user identities
    const identities = user.identities || [];
    const oauthIdentity = identities.find((id: Record<string, any>) =>
      ['linkedin_oidc'].includes(id.provider)
    );

    if (!oauthIdentity) {
      console.log('⚠️ No OAuth identity found for profile enrichment');
      if (isNewUser) {
        console.log('📝 Creating basic profile for new user...');
        await createBasicProfile(user, supabase);
      }
      return;
    }

    console.log('🔗 Found OAuth provider:', oauthIdentity.provider);

    // Extract and normalize profile data
    const normalizedProfile = normalizeOAuthProfile(
      user,
      oauthIdentity.provider
    );

    if (!normalizedProfile) {
      console.error('❌ Failed to normalize OAuth profile data');
      if (isNewUser) {
        await createBasicProfile(user, supabase);
      }
      return;
    }

    console.log('✅ Normalized OAuth profile data');

    // Map to database profile fields
    const profileData = mapOAuthToProfile(normalizedProfile);
    console.log('📋 Mapped profile data:', Object.keys(profileData));

    if (isNewUser) {
      console.log('📝 Creating new profile with OAuth data...');

      // Create new profile with OAuth data - let database handle timestamps
      const oauthSource = normalizedProfile.provider;

      const profileToCreate = {
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
        // Let database handle timestamps
      };

      console.log(
        '🔍 DEBUGGING: Full profile object being sent to database:',
        JSON.stringify(profileToCreate, null, 2)
      );

      console.log('📝 Creating profile with data:', {
        id: profileToCreate.id,
        onboarding_completed: profileToCreate.onboarding_completed,
        hasProfileData: Object.keys(profileData).length > 0,
        source: oauthSource,
      });

      // Try a minimal insert first to test what's causing the title field error
      console.log('🧪 Testing minimal profile insert...');
      const minimalProfile = {
        id: user.id,
        email: user.email,
        onboarding_completed: false,
      };

      const { error: minimalError } = await supabase
        .from('profiles')
        .upsert(minimalProfile, {
          onConflict: 'id',
          ignoreDuplicates: false,
        });

      if (minimalError) {
        console.error('❌ Even minimal profile insert failed:', minimalError);
        console.log(
          '⚠️ Skipping profile creation due to database issue, user can complete profile in onboarding'
        );
        // Don't throw error, let user proceed to onboarding where profile creation may work differently
        return;
      }

      console.log(
        '✅ Minimal profile insert succeeded, now trying full profile...'
      );
      const { error: insertError } = await supabase
        .from('profiles')
        .upsert(profileToCreate, {
          onConflict: 'id',
          ignoreDuplicates: false,
        });

      if (insertError) {
        console.error(
          '❌ Error creating profile with OAuth data:',
          insertError
        );
        console.log('🔄 Falling back to basic profile creation...');
        await createBasicProfile(user, supabase);
      } else {
        console.log(
          '✅ Profile created with OAuth data from:',
          normalizedProfile.provider
        );

        // Verify the profile was created correctly
        const { data: verificationCheck } = await supabase
          .from('profiles')
          .select('onboarding_completed, id, first_name, last_name')
          .eq('id', user.id)
          .single();

        console.log('🔍 Profile creation verification:', {
          profileId: verificationCheck?.id,
          onboardingCompleted: verificationCheck?.onboarding_completed,
          firstName: verificationCheck?.first_name,
          lastName: verificationCheck?.last_name,
        });
      }
    } else {
      console.log('🔄 Updating existing profile with OAuth data...');

      // Update existing profile with OAuth data
      const existingSources = await getExistingDataSources(user.id, supabase);
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
          // Let database handle timestamps
        })
        .eq('id', user.id);

      if (updateError) {
        console.error(
          '❌ Error updating profile with OAuth data:',
          updateError
        );
      } else {
        console.log(
          '✅ Profile updated with OAuth data from:',
          normalizedProfile.provider
        );
      }
    }
  } catch (error) {
    console.error('❌ Profile enrichment error:', error);
    // Create basic profile as fallback for new users
    if (isNewUser) {
      console.log('🔄 Creating basic profile as fallback...');
      await createBasicProfile(user, supabase);
    }
  }
}

/**
 * Create a basic profile when OAuth enrichment fails
 */
async function createBasicProfile(user: Record<string, any>, supabase: any) {
  try {
    console.log('📝 Creating basic profile for user:', user.id);

    const basicProfile = {
      id: user.id,
      first_name: user.user_metadata?.first_name || '',
      last_name: user.user_metadata?.last_name || '',
      email: user.email || '',
      languages: ['English'],
      onboarding_completed: false,
      data_sources: {
        basic: {
          imported_at: new Date().toISOString(),
          fields: ['first_name', 'last_name', 'email'],
        },
      },
    };

    console.log(
      '🔍 DEBUGGING: Basic profile object being sent to database:',
      JSON.stringify(basicProfile, null, 2)
    );

    console.log('📝 Creating basic profile with data:', {
      id: basicProfile.id,
      onboarding_completed: basicProfile.onboarding_completed,
      email: basicProfile.email,
      first_name: basicProfile.first_name,
      last_name: basicProfile.last_name,
    });

    const { error: basicInsertError } = await supabase
      .from('profiles')
      .upsert(basicProfile, {
        onConflict: 'id',
        ignoreDuplicates: false,
      });

    if (basicInsertError) {
      console.error('❌ Error creating basic profile:', basicInsertError);
    } else {
      console.log('✅ Basic profile created successfully');
    }
  } catch (error) {
    console.error('❌ Failed to create basic profile:', error);
  }
}

/**
 * Get existing data sources for a user
 */
async function getExistingDataSources(userId: string, supabase: any) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('data_sources')
      .eq('id', userId)
      .single();

    return profile?.data_sources || {};
  } catch (error) {
    console.error('Error fetching existing data sources:', error);
    return {};
  }
}
