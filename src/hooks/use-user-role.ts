'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';

export type UserRole =
  | 'candidate'
  | 'organization_admin'
  | 'organization_employee'
  | 'consultant'
  | 'platform_admin';

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: UserRole;
  onboarding_completed: boolean;
  onboarding_step: number;
  permissions: Record<string, boolean>;
  role_display_name: string;
}

export interface NavigationItem {
  title: string;
  href: string;
  description?: string;
  icon?: string;
}

// Map raw profile data to UserProfile interface
const mapProfileData = (data: Record<string, unknown>): UserProfile => ({
  id: data.id as string,
  first_name: data.first_name as string | null,
  last_name: data.last_name as string | null,
  email: data.email as string | null,
  role: 'candidate', // Default role since role field doesn't exist in current schema
  onboarding_completed: (data.onboarding_completed as boolean) || false,
  onboarding_step: 0, // Default since onboarding_step doesn't exist in current schema
  permissions: {},
  role_display_name: 'Candidate',
});

// Create a singleton cache for user profile data
let profileCache: {
  userId: string | null;
  profile: UserProfile | null;
  timestamp: number;
} = {
  userId: null,
  profile: null,
  timestamp: 0,
};

const CACHE_DURATION = 5000; // 5 seconds cache

export const useUserRole = () => {
  const user = useUser();
  const supabase = useSupabaseClient();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoggedRef = useRef(false);

  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      setLoading(false);
      profileCache = { userId: null, profile: null, timestamp: 0 };
      return;
    }

    // Check cache first
    const now = Date.now();
    if (
      profileCache.userId === user.id &&
      profileCache.profile &&
      now - profileCache.timestamp < CACHE_DURATION
    ) {
      setUserProfile(profileCache.profile);
      setLoading(false);
      return;
    }

    // Skip profile loading entirely during onboarding
    const currentPath = window.location.pathname;
    const isOnboardingPath =
      currentPath === '/onboarding' ||
      currentPath === '/auth/callback' ||
      currentPath.startsWith('/auth/');

    if (isOnboardingPath) {
      // Only log once across all instances
      if (!hasLoggedRef.current) {
        console.log(
          '[useUserRole] Onboarding page detected - using minimal profile'
        );
        hasLoggedRef.current = true;
      }
      // Return minimal profile for onboarding
      const onboardingProfile: UserProfile = {
        id: user.id,
        first_name: user.user_metadata?.first_name || null,
        last_name: user.user_metadata?.last_name || null,
        email: user.email || null,
        role: 'candidate',
        onboarding_completed: false,
        onboarding_step: 0,
        permissions: {},
        role_display_name: 'Candidate',
      };

      // Cache the profile
      profileCache = {
        userId: user.id,
        profile: onboardingProfile,
        timestamp: now,
      };

      setUserProfile(onboardingProfile);
      setLoading(false);
      return;
    }

    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get user profile with role information (may not exist for new users)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          // If profile doesn't exist, user needs to complete onboarding
          if (profileError.code === 'PGRST116') {
            console.log(
              'Profile not found for user:',
              user.id,
              '- User needs to complete onboarding'
            );

            // Check if we're already on an onboarding-related page
            const currentPath = window.location.pathname;
            const isOnboardingPath =
              currentPath === '/onboarding' ||
              currentPath === '/auth/callback' ||
              currentPath.startsWith('/auth/');

            if (!isOnboardingPath) {
              console.log('🚀 Redirecting to onboarding - no profile exists');
              router.push('/onboarding');
              return;
            }

            // Return a fallback profile that indicates onboarding is required
            const fallbackProfile: UserProfile = {
              id: user.id,
              first_name: user.user_metadata?.first_name || null,
              last_name: user.user_metadata?.last_name || null,
              email: user.email || null,
              role: 'candidate',
              onboarding_completed: false,
              onboarding_step: 0,
              permissions: {},
              role_display_name: 'Candidate',
            };
            setUserProfile(fallbackProfile);
            return;
          }

          throw profileError;
        }

        if (profileData) {
          const mappedProfile = mapProfileData(profileData);

          // Cache the profile
          profileCache = {
            userId: user.id,
            profile: mappedProfile,
            timestamp: Date.now(),
          };

          setUserProfile(mappedProfile);
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load user profile');

        // Fallback: create a basic profile with candidate role
        const fallbackProfile: UserProfile = {
          id: user.id,
          first_name: user.user_metadata?.first_name || null,
          last_name: user.user_metadata?.last_name || null,
          email: user.email || null,
          role: 'candidate',
          onboarding_completed: false,
          onboarding_step: 0,
          permissions: {},
          role_display_name: 'Candidate',
        };
        setUserProfile(fallbackProfile);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, supabase, router]);

  // Check if user has specific permission
  const hasPermission = async (permission: string): Promise<boolean> => {
    if (!user || !userProfile) return false;

    try {
      const { data, error } = await supabase.rpc('has_permission', {
        user_id: user.id,
        permission,
      });

      if (error) {
        console.warn('Permission check failed:', error);
        return getDefaultPermission(userProfile.role, permission);
      }

      return data || false;
    } catch (err) {
      console.warn('Permission check error:', err);
      return getDefaultPermission(userProfile.role, permission);
    }
  };

  // Check permission synchronously based on role (for immediate UI decisions)
  const hasPermissionSync = (permission: string): boolean => {
    if (!userProfile) return false;
    return getDefaultPermission(userProfile.role, permission);
  };

  // Check if user can access a specific route
  const canAccessRoute = (route: string): boolean => {
    if (!userProfile) return false;

    const roleAccess: Record<string, UserRole[]> = {
      '/admin': ['platform_admin'],
      '/post-role': ['organization_admin', 'organization_employee'],
      '/talent': ['organization_admin', 'organization_employee', 'consultant'],
      '/team': ['organization_admin'],
      '/analytics': ['organization_admin', 'platform_admin'],
      '/clients': ['consultant'],
      '/searches': ['organization_employee', 'consultant'],
      '/opportunities': ['candidate'],
      '/applications': ['candidate'],
      '/learning': ['candidate'],
    };

    const allowedRoles = roleAccess[route];
    if (!allowedRoles) return true; // Public route

    return allowedRoles.includes(userProfile.role);
  };

  return {
    userProfile,
    loading,
    error,
    hasPermission,
    hasPermissionSync,
    canAccessRoute,
    isCandidate: userProfile?.role === 'candidate',
    isOrganizationAdmin: userProfile?.role === 'organization_admin',
    isOrganizationEmployee: userProfile?.role === 'organization_employee',
    isConsultant: userProfile?.role === 'consultant',
    isPlatformAdmin: userProfile?.role === 'platform_admin',
    needsOnboarding: userProfile ? !userProfile.onboarding_completed : false,
  };
};

// Default permission checking fallback
const getDefaultPermission = (role: UserRole, permission: string): boolean => {
  const rolePermissions: Record<UserRole, string[]> = {
    platform_admin: ['*'], // All permissions
    organization_admin: [
      'post_jobs',
      'view_candidates',
      'manage_team',
      'view_analytics',
    ],
    organization_employee: ['view_candidates', 'view_searches'],
    consultant: ['view_candidates', 'manage_searches', 'view_clients'],
    candidate: ['view_opportunities', 'apply_jobs', 'manage_profile'],
  };

  const permissions = rolePermissions[role] || [];
  return permissions.includes('*') || permissions.includes(permission);
};
