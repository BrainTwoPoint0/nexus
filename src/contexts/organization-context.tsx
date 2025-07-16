'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  sector: string;
  industry?: string;
  company_size?: string;
  founded_year?: number;
  headquarters_location?: string;
  logo_url?: string;
  website_url?: string;
  company_description?: string;
  board_size?: number;
  current_openings?: number;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'hr' | 'member';
  title?: string;
  department?: string;
  can_post_jobs: boolean;
  can_manage_applications: boolean;
  can_manage_organization: boolean;
  can_invite_members: boolean;
  status: 'active' | 'inactive' | 'pending';
  joined_at: string;
}

export interface OrganizationStats {
  active_roles: number;
  total_applications: number;
  interviews_scheduled: number;
  profile_views: number;
  recent_applications: number;
}

interface OrganizationContextType {
  organization: Organization | null;
  membership: OrganizationMember | null;
  stats: OrganizationStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  canManageOrganization: boolean;
  canPostJobs: boolean;
  canManageApplications: boolean;
  canInviteMembers: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | null>(null);

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error(
      'useOrganization must be used within an OrganizationProvider'
    );
  }
  return context;
}

interface OrganizationProviderProps {
  children: React.ReactNode;
}

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [membership, setMembership] = useState<OrganizationMember | null>(null);
  const [stats, setStats] = useState<OrganizationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const user = useUser();
  const router = useRouter();

  const fetchOrganizationData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // LinkedIn-style: All users are individuals who can manage organizations
      // Authorization is now based on organization membership, not user_type

      // Use API endpoint for organization data
      const response = await fetch('/api/organization');
      if (!response.ok) {
        if (response.status === 404) {
          // No organization found, redirect to org setup
          router.push('/org-setup');
          return;
        }
        throw new Error(`Failed to fetch organization: ${response.status}`);
      }

      const data = await response.json();
      setOrganization(data.organization);
      setMembership(data.membership);

      // Fetch organization stats
      await fetchStats();
    } catch (err) {
      console.error('Error fetching organization data:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch organization data'
      );
    } finally {
      setIsLoading(false);
    }
  }, [user, router]);

  const fetchStats = async () => {
    try {
      // Use API endpoint for organization stats
      const response = await fetch('/api/organization/stats');
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }

      const data = await response.json();
      setStats(data.overview);
    } catch (err) {
      console.error('Error fetching stats:', err);
      // Don't set error for stats, just log it
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!membership) return false;

    switch (permission) {
      case 'manage_organization':
        return membership.can_manage_organization;
      case 'post_jobs':
        return membership.can_post_jobs;
      case 'manage_applications':
        return membership.can_manage_applications;
      case 'invite_members':
        return membership.can_invite_members;
      default:
        return false;
    }
  };

  useEffect(() => {
    fetchOrganizationData();
  }, [user, fetchOrganizationData]);

  const value: OrganizationContextType = {
    organization,
    membership,
    stats,
    isLoading,
    error,
    refetch: fetchOrganizationData,
    hasPermission,
    canManageOrganization: hasPermission('manage_organization'),
    canPostJobs: hasPermission('post_jobs'),
    canManageApplications: hasPermission('manage_applications'),
    canInviteMembers: hasPermission('invite_members'),
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}
