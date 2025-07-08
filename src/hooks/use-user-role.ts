'use client';

import { useState, useEffect } from 'react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';

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

export const useUserRole = () => {
  const user = useUser();
  const supabase = useSupabaseClient();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [navigation, setNavigation] = useState<NavigationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      setNavigation([]);
      setLoading(false);
      return;
    }

    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get user profile with role information
        const { data: profileData, error: profileError } = await supabase
          .from('user_profile_with_role')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          // If profile doesn't exist, create one for this user
          if (profileError.code === 'PGRST116') {
            console.log('Profile not found, creating profile for user:', user.id);
            
            // Create profile for user
            const { error: createError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                email: user.email,
                first_name: user.user_metadata?.first_name || '',
                last_name: user.user_metadata?.last_name || '',
                role: 'candidate',
                onboarding_completed: false,
                onboarding_step: 0,
              });

            if (createError) {
              console.error('Failed to create profile:', createError);
              throw new Error('Failed to create user profile');
            }

            // Retry fetching the profile
            const { data: retryData, error: retryError } = await supabase
              .from('user_profile_with_role')
              .select('*')
              .eq('id', user.id)
              .single();

            if (retryError) {
              throw retryError;
            }
            
            if (retryData) {
              setUserProfile(retryData);
              setNavigation(getDefaultNavigation(retryData.role));
              return;
            }
          }
          
          throw profileError;
        }

        if (profileData) {
          setUserProfile(profileData);

          // Get navigation based on role
          const { data: navData, error: navError } = await supabase.rpc(
            'get_user_navigation',
            { user_id: user.id }
          );

          if (navError) {
            console.warn('Failed to get navigation:', navError);
            // Fallback to basic navigation
            setNavigation(getDefaultNavigation(profileData.role));
          } else {
            setNavigation(navData || getDefaultNavigation(profileData.role));
          }
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
        setNavigation(getDefaultNavigation('candidate'));
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, supabase]);

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
    navigation,
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

// Default navigation fallback
const getDefaultNavigation = (role: UserRole): NavigationItem[] => {
  const baseNav: NavigationItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Profile', href: '/profile' },
  ];

  switch (role) {
    case 'candidate':
      return [
        ...baseNav,
        { title: 'Opportunities', href: '/opportunities' },
        { title: 'Applications', href: '/applications' },
        { title: 'Learning', href: '/learning' },
      ];

    case 'organization_admin':
      return [
        ...baseNav,
        { title: 'Post Role', href: '/post-role' },
        { title: 'Candidates', href: '/talent' },
        { title: 'Team', href: '/team' },
        { title: 'Analytics', href: '/analytics' },
      ];

    case 'organization_employee':
      return [
        ...baseNav,
        { title: 'Our Searches', href: '/searches' },
        { title: 'Candidates', href: '/talent' },
      ];

    case 'consultant':
      return [
        ...baseNav,
        { title: 'Candidates', href: '/talent' },
        { title: 'Clients', href: '/clients' },
        { title: 'Searches', href: '/searches' },
      ];

    case 'platform_admin':
      return [
        ...baseNav,
        { title: 'Admin Panel', href: '/admin' },
        { title: 'Users', href: '/admin/users' },
        { title: 'Organizations', href: '/admin/organizations' },
        { title: 'Analytics', href: '/admin/analytics' },
      ];

    default:
      return baseNav;
  }
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
