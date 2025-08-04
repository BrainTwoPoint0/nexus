/**
 * OAuth Utilities for LinkedIn and Google Integration
 * Extracts and normalizes profile data from OAuth providers
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface LinkedInProfile {
  id: string;
  firstName: string;
  lastName: string;
  headline?: string;
  summary?: string;
  industry?: string;
  location?: string;
  profileUrl?: string;
  email?: string;
  picture?: string;
}

export interface GoogleProfile {
  id: string;
  email: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
  verified_email?: boolean;
}

export interface NormalizedProfile {
  firstName: string;
  lastName: string;
  email: string;
  title?: string;
  bio?: string;
  location?: string;
  linkedinUrl?: string;
  profilePicture?: string;
  provider: 'linkedin' | 'google';
  providerData: Record<string, any>;
  confidence: number;
}

/**
 * Extract profile data from LinkedIn OAuth response
 */
export function extractLinkedInProfile(
  user: Record<string, any>
): NormalizedProfile {
  const userData = user.user_metadata || {};
  const identities = user.identities || [];
  const linkedinIdentity = identities.find(
    (id: Record<string, any>) => id.provider === 'linkedin_oidc'
  );

  const profile: NormalizedProfile = {
    firstName: userData.given_name || userData.first_name || '',
    lastName: userData.family_name || userData.last_name || '',
    email: user.email || '',
    title: userData.headline || '',
    bio: userData.summary || '',
    location: userData.location || '',
    linkedinUrl: userData.profile_url || userData.public_profile_url || '',
    profilePicture: userData.picture || userData.avatar_url || '',
    provider: 'linkedin',
    providerData: {
      linkedinId: linkedinIdentity?.id || userData.sub,
      industry: userData.industry,
      headline: userData.headline,
      summary: userData.summary,
      profileUrl: userData.profile_url || userData.public_profile_url,
      rawData: userData,
    },
    confidence: 0.9, // LinkedIn data is typically high quality
  };

  return profile;
}

/**
 * Extract profile data from Google OAuth response
 */
export function extractGoogleProfile(
  user: Record<string, any>
): NormalizedProfile {
  const userData = user.user_metadata || {};
  const identities = user.identities || [];
  const googleIdentity = identities.find(
    (id: Record<string, any>) => id.provider === 'google'
  );

  const profile: NormalizedProfile = {
    firstName: userData.given_name || userData.first_name || '',
    lastName: userData.family_name || userData.last_name || '',
    email: user.email || '',
    profilePicture: userData.picture || userData.avatar_url || '',
    provider: 'google',
    providerData: {
      googleId: googleIdentity?.id || userData.sub,
      locale: userData.locale,
      verifiedEmail: userData.email_verified,
      rawData: userData,
    },
    confidence: 0.7, // Google has less professional data
  };

  return profile;
}

/**
 * Normalize profile data from any OAuth provider
 */
export function normalizeOAuthProfile(
  user: Record<string, any>,
  provider: 'linkedin_oidc' | 'google'
): NormalizedProfile | null {
  try {
    switch (provider) {
      case 'linkedin_oidc':
        return extractLinkedInProfile(user);
      case 'google':
        return extractGoogleProfile(user);
      default:
        console.warn(`Unsupported OAuth provider: ${provider}`);
        return null;
    }
  } catch (error) {
    console.error(`Error normalizing ${provider} profile:`, error);
    return null;
  }
}

/**
 * Map OAuth profile to our database profile fields
 */
export function mapOAuthToProfile(normalizedProfile: NormalizedProfile) {
  const profileData: Record<string, any> = {
    first_name: normalizedProfile.firstName,
    last_name: normalizedProfile.lastName,
    email: normalizedProfile.email,
    data_sources: {
      [normalizedProfile.provider]: {
        imported_at: new Date().toISOString(),
        confidence: normalizedProfile.confidence,
        fields: Object.keys(normalizedProfile).filter(
          (key) =>
            normalizedProfile[key as keyof NormalizedProfile] !== undefined &&
            normalizedProfile[key as keyof NormalizedProfile] !== ''
        ),
        providerData: normalizedProfile.providerData,
      },
    },
  };

  // Add optional fields if they exist
  if (normalizedProfile.title) {
    profileData.professional_headline = normalizedProfile.title;
  }

  if (normalizedProfile.bio) {
    profileData.bio = normalizedProfile.bio;
  }

  if (normalizedProfile.location) {
    profileData.location = normalizedProfile.location;
  }

  if (normalizedProfile.linkedinUrl) {
    profileData.linkedin_url = normalizedProfile.linkedinUrl;
  }

  return profileData;
}

/**
 * Get OAuth redirect URL for development/production (2025 best practices)
 */
export function getOAuthRedirectUrl(): string {
  // Check if we're in production (Netlify deployment)
  if (
    typeof window !== 'undefined' &&
    window.location.hostname === 'thenexus-ai.netlify.app'
  ) {
    return 'https://thenexus-ai.netlify.app/auth/callback';
  }

  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ??
    process?.env?.NEXT_PUBLIC_VERCEL_URL ??
    'http://localhost:3000/';

  // Ensure URL has protocol
  url = url.startsWith('http') ? url : `https://${url}`;
  // Ensure URL has trailing slash
  url = url.endsWith('/') ? url : `${url}/`;

  // Add auth callback path
  return `${url}auth/callback`;
}

/**
 * Validate OAuth configuration
 */
export function validateOAuthConfig(): {
  isConfigured: boolean;
  providers: string[];
  missing: string[];
} {
  const config = {
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  };

  const providers: string[] = [];
  const missing: string[] = [];

  if (config.linkedin.clientId && config.linkedin.clientSecret) {
    providers.push('linkedin_oidc');
  } else {
    missing.push('LinkedIn (LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET)');
  }

  if (config.google.clientId && config.google.clientSecret) {
    providers.push('google');
  } else {
    missing.push('Google (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)');
  }

  return {
    isConfigured: providers.length > 0,
    providers,
    missing,
  };
}
