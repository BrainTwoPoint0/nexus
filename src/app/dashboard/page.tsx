'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MainLayout } from '@/components/layout/main-layout';
import {
  Users,
  TrendingUp,
  Bell,
  Search,
  FileText,
  Calendar,
  Plus,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Building,
  Settings,
} from 'lucide-react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { RecommendationCard } from '@/components/ui/recommendation-card';
import { JobMatch } from '@/lib/matching-service';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { getStatusBadgeVariant } from '@/lib/status-utils';
import { formatRelativeDate as formatDate } from '@/lib/date-utils';
import { containerVariants, itemVariants } from '@/lib/animation-variants';

// Using shared animation variants from lib/animation-variants.ts

interface Profile {
  first_name: string | null;
  last_name: string | null;
  professional_headline: string | null;
  location: string | null;
}

interface OrganizationMembership {
  id: string;
  organization_id: string;
  role: 'owner' | 'admin' | 'hr' | 'member';
  can_post_jobs: boolean;
  can_manage_applications: boolean;
  can_manage_organization: boolean;
  organization: {
    id: string;
    name: string;
    slug: string;
    sector: string;
    current_openings: number;
  };
}

interface Job {
  id: string;
  title: string;
  organizations: {
    name: string;
  };
  location: string;
  created_at: string;
  compensation_min: number | null;
  compensation_max: number | null;
  status: string;
}

interface Application {
  id: string;
  status: string;
  applied_at: string;
  job_id: string;
  jobs: Job;
}

interface DashboardStats {
  applications_count: number;
  profile_views: number; // Will be mock for now
  matched_jobs_count: number;
  upcoming_events_count: number; // Will be mock for now
}

export default function DashboardPage() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [recommendations, setRecommendations] = useState<JobMatch[]>([]);
  const [organizationMemberships, setOrganizationMemberships] = useState<
    OrganizationMembership[]
  >([]);
  const [stats, setStats] = useState<DashboardStats>({
    applications_count: 0,
    profile_views: 0,
    matched_jobs_count: 0,
    upcoming_events_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);

  // Memoize the fetch recommendations function
  const fetchRecommendations = useCallback(async () => {
    if (!user) return;

    setLoadingRecommendations(true);
    try {
      const response = await fetch(
        `/api/recommendations/jobs?candidateId=${user.id}&limit=5`
      );
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setRecommendations(result.data);
        } else {
          console.warn('API returned invalid data:', result);
          setRecommendations([]);
        }
      } else {
        console.error(
          'API response not ok:',
          response.status,
          response.statusText
        );
        setRecommendations([]);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setRecommendations([]);
    } finally {
      setLoadingRecommendations(false);
    }
  }, [user]);

  // Memoize the refresh recommendations function
  const refreshRecommendations = useCallback(async () => {
    if (!user) return;

    setLoadingRecommendations(true);
    try {
      // First trigger recalculation
      const recalcResponse = await fetch('/api/recommendations/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: user.id, forceRecalculate: true }),
      });

      if (!recalcResponse.ok) {
        console.warn('Recalculation request failed, continuing with fetch...');
      }

      // Then fetch fresh recommendations
      await fetchRecommendations();

      toast({
        title: 'Success',
        description: 'Recommendations refreshed successfully!',
      });
    } catch (error) {
      console.error('Error refreshing recommendations:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh recommendations',
        variant: 'destructive',
      });
    } finally {
      setLoadingRecommendations(false);
    }
  }, [user, fetchRecommendations, toast]);

  // Memoize interaction handler
  const handleRecommendationInteraction = useCallback(
    async (
      jobId: string,
      interactionType: string,
      data: Record<string, unknown> = {}
    ) => {
      try {
        await fetch('/api/recommendations/interactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId,
            interactionType,
            interactionData: data,
            sessionId: `session_${Date.now()}`,
          }),
        });
      } catch (error) {
        console.error('Error recording interaction:', error);
      }
    },
    []
  );

  useEffect(() => {
    if (!user) return;

    async function fetchDashboardData() {
      try {
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name, professional_headline, location')
          .eq('id', user?.id)
          .single();

        if (profileData) setProfile(profileData as Profile);

        // Get user's organization memberships
        if (!user) return;
        const { data: orgMembershipsData } = await supabase
          .from('organization_members')
          .select(
            `
              id,
              organization_id,
              role,
              can_post_jobs,
              can_manage_applications,
              can_manage_organization,
              organization:organization_id(*)
            `
          )
          .eq('user_id', user.id)
          .eq('status', 'active');

        if (orgMembershipsData) {
          // Ensure organization is an object, not an array
          const fixedMemberships = (
            orgMembershipsData as Record<string, unknown>[]
          ).map((m) => {
            const org = m.organization;
            return {
              ...m,
              organization: Array.isArray(org) ? org[0] : org,
            };
          });
          setOrganizationMemberships(
            fixedMemberships as OrganizationMembership[]
          );
        }

        // Fetch user's applications with job details
        const { data: applicationsData, error: applicationsError } =
          await supabase
            .from('applications')
            .select(
              `
            id,
            status,
            applied_at,
            job_id,
            jobs!inner(
              id,
              title,
              location,
              created_at,
              compensation_min,
              compensation_max,
              status,
              organization_id,
              organizations!inner(name)
            )
          `
            )
            .eq('profile_id', user?.id)
            .order('applied_at', { ascending: false })
            .limit(10);

        if (applicationsError) {
          console.error('Error fetching applications:', applicationsError);
        }

        if (applicationsData) {
          setApplications(applicationsData as unknown as Application[]);
          setStats((prev) => ({
            ...prev,
            applications_count: applicationsData.length,
          }));
        }

        // Fetch recent job opportunities (active jobs)
        const { data: jobsData, error: jobsError } = await supabase
          .from('jobs')
          .select(
            `
            id,
            title,
            location,
            created_at,
            compensation_min,
            compensation_max,
            status,
            organization_id,
            organizations!inner(name)
          `
          )
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(6);

        if (jobsError) {
          console.error('Error fetching jobs:', jobsError);
        }

        if (jobsData) {
          setRecentJobs(jobsData as unknown as Job[]);
          setStats((prev) => ({
            ...prev,
            matched_jobs_count: jobsData.length,
          }));
        }

        // TODO: Add real profile views tracking later
        // For now, using simulated data based on profile completeness (consistent calculation)
        const profileCompletenessScore = [
          profileData?.first_name,
          profileData?.last_name,
          profileData?.professional_headline,
          profileData?.location,
        ].filter(Boolean).length;

        // Use a consistent calculation based on profile completeness and user ID
        const userIdSum = user?.id ? parseInt(user.id.slice(-4), 16) % 20 : 5;
        const simulatedProfileViews = Math.max(
          0,
          profileCompletenessScore * 8 + userIdSum
        );

        setStats((prev) => ({
          ...prev,
          profile_views: simulatedProfileViews,
          // TODO: Replace with real events when event system is built
          upcoming_events_count: 2,
        }));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    async function loadRecommendations() {
      await fetchRecommendations();
    }

    fetchDashboardData();
    loadRecommendations();
  }, [user, supabase, fetchRecommendations]);

  // Real-time subscriptions for live updates
  useEffect(() => {
    if (!user) return;

    // Subscribe to application updates
    const applicationsSubscription = supabase
      .channel('applications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications',
          filter: `profile_id=eq.${user?.id}`,
        },
        (payload) => {
          console.log('Application change received:', payload);

          if (payload.eventType === 'INSERT') {
            // Add new application to state
            const newApplication = payload.new as Application;
            setApplications((prev) => [newApplication, ...prev]);
            setStats((prev) => ({
              ...prev,
              applications_count: prev.applications_count + 1,
            }));
          } else if (payload.eventType === 'UPDATE') {
            // Update existing application
            setApplications((prev) =>
              prev.map((app) =>
                app.id === payload.new.id ? { ...app, ...payload.new } : app
              )
            );
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted application
            setApplications((prev) =>
              prev.filter((app) => app.id !== payload.old.id)
            );
            setStats((prev) => ({
              ...prev,
              applications_count: Math.max(0, prev.applications_count - 1),
            }));
          }
        }
      )
      .subscribe();

    // Subscribe to new job opportunities
    const jobsSubscription = supabase
      .channel('jobs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'jobs',
          filter: 'status=eq.active',
        },
        (payload) => {
          console.log('New job opportunity:', payload);
          // Could show a toast notification here
          // For now, we'll just refresh the recent jobs list
          // TODO: Add toast notification for new opportunities
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      applicationsSubscription.unsubscribe();
      jobsSubscription.unsubscribe();
    };
  }, [user, supabase]);

  const displayName = (() => {
    if (profile?.first_name || profile?.last_name) {
      return `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim();
    }
    return user?.email?.split('@')[0] || 'User';
  })();
  const initials =
    (profile?.first_name?.[0] ?? '') + (profile?.last_name?.[0] ?? '') ||
    (user?.email?.[0] ?? 'U');
  const professionalHeadline = profile?.professional_headline || '';

  // Memoize expensive stats calculations
  const dynamicStats = useMemo(
    () => [
      {
        title: 'Applications Sent',
        value: stats.applications_count.toString(),
        icon: FileText,
        change: `${
          applications.filter((app) => {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            return new Date(app.applied_at) > oneWeekAgo;
          }).length
        } this week`,
      },
      {
        title: 'Profile Views',
        value: stats.profile_views.toString(),
        icon: Users,
        change: `+${Math.floor(stats.profile_views * 0.2)} this week`,
      },
      {
        title: 'Opportunities Available',
        value: stats.matched_jobs_count.toString(),
        icon: TrendingUp,
        change: `${
          recentJobs.filter((job) => {
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            return new Date(job.created_at) > threeDaysAgo;
          }).length
        } new this week`,
      },
      {
        title: 'Upcoming Events',
        value: stats.upcoming_events_count.toString(),
        icon: Calendar,
        change: 'This month',
      },
    ],
    [stats, applications, recentJobs]
  );

  // Using shared utility functions from lib/status-utils.ts and lib/date-utils.ts

  return (
    <MainLayout>
      <div className="page-container py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Header */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col space-y-4"
          >
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12 flex-shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-2xl font-bold text-foreground sm:text-3xl">
                  Welcome back, {displayName.split(' ')[0]}
                </h1>
                <p className="truncate text-muted-foreground" role="text">
                  {professionalHeadline}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-initial"
                onClick={() => router.push('/opportunities')}
              >
                <Search className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Browse Opportunities</span>
                <span className="sm:hidden">Browse Jobs</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-initial"
              >
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </Button>
              {organizationMemberships.length === 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-initial"
                  onClick={() => router.push('/organizations/create')}
                >
                  <Building className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Create Organization</span>
                  <span className="sm:hidden">Create Org</span>
                </Button>
              )}
            </div>
          </motion.div>

          {/* Stats Cards */}
          <section aria-labelledby="dashboard-stats-heading">
            <h2 id="dashboard-stats-heading" className="sr-only">
              Dashboard Statistics
            </h2>
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
            >
              {dynamicStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card
                    key={index}
                    className="transition-shadow hover:shadow-md"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            {stat.title}
                          </p>
                          <p className="text-2xl font-bold text-foreground">
                            {loading ? '...' : stat.value}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {stat.change}
                          </p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </motion.div>
          </section>

          {/* Organization Management - LinkedIn Style */}
          {organizationMemberships.length > 0 && (
            <section aria-labelledby="organization-management-heading">
              <h2 id="organization-management-heading" className="sr-only">
                Organization Management
              </h2>
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5 text-primary" />
                        My Organizations
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/organizations/create')}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Organization
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {organizationMemberships.map((membership) => (
                        <Card
                          key={membership.id}
                          className="cursor-pointer transition-shadow hover:shadow-md"
                          onClick={() =>
                            router.push(
                              `/organizations/${membership.organization.slug}`
                            )
                          }
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-foreground">
                                  {membership.organization.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {membership.organization.sector}
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {membership.role}
                                  </Badge>
                                  {membership.organization.current_openings >
                                    0 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {membership.organization.current_openings}{' '}
                                      openings
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col gap-1">
                                {membership.can_post_jobs && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(
                                        `/organizations/${membership.organization.slug}/jobs/create`
                                      );
                                    }}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                )}
                                {membership.can_manage_organization && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(
                                        `/organizations/${membership.organization.slug}/settings`
                                      );
                                    }}
                                  >
                                    <Settings className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </section>
          )}

          <div className="grid grid-cols-1 gap-6 lg:gap-8 xl:grid-cols-3">
            {/* AI-Powered Recommendations */}
            <section
              aria-labelledby="ai-recommendations-heading"
              className="xl:col-span-2"
            >
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 flex-shrink-0 text-primary" />
                        <CardTitle
                          id="ai-recommendations-heading"
                          className="text-lg sm:text-xl"
                        >
                          AI-Powered Recommendations
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={refreshRecommendations}
                          disabled={loadingRecommendations}
                          className="flex-1 sm:flex-initial"
                        >
                          <RefreshCw
                            className={`mr-2 h-4 w-4 ${loadingRecommendations ? 'animate-spin' : ''}`}
                          />
                          <span className="hidden sm:inline">Refresh</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 sm:flex-initial"
                          onClick={() => router.push('/opportunities')}
                        >
                          <span className="hidden sm:inline">View All</span>
                          <span className="sm:hidden">All</span>
                          <ExternalLink className="ml-1 h-4 w-4 sm:ml-2" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loadingRecommendations ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="animate-pulse rounded-lg border p-6"
                          >
                            <div className="mb-3 h-5 w-3/4 rounded bg-muted"></div>
                            <div className="mb-2 h-3 w-1/2 rounded bg-muted"></div>
                            <div className="mb-4 h-3 w-1/4 rounded bg-muted"></div>
                            <div className="space-y-2">
                              <div className="h-2 w-full rounded bg-muted"></div>
                              <div className="h-2 w-2/3 rounded bg-muted"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : recommendations.length > 0 ? (
                      <div className="space-y-4">
                        {recommendations.slice(0, 3).map((recommendation) => (
                          <RecommendationCard
                            key={recommendation.jobId}
                            recommendation={recommendation}
                            onLike={(jobId) => {
                              handleRecommendationInteraction(
                                jobId,
                                'recommendation_like'
                              );
                              toast({
                                title: 'Thanks for the feedback!',
                                description:
                                  'This helps us improve your recommendations.',
                              });
                            }}
                            onDislike={(jobId) => {
                              handleRecommendationInteraction(
                                jobId,
                                'recommendation_dislike'
                              );
                              toast({
                                title: 'Thanks for the feedback!',
                                description:
                                  "We'll improve our recommendations based on your input.",
                              });
                            }}
                            onView={(jobId) => {
                              handleRecommendationInteraction(
                                jobId,
                                'recommendation_view'
                              );
                              router.push(`/opportunities/${jobId}`);
                            }}
                            onApply={(jobId) => {
                              handleRecommendationInteraction(
                                jobId,
                                'job_application',
                                { source: 'dashboard_recommendation' }
                              );
                              router.push(`/opportunities/${jobId}`);
                            }}
                            className="border-l-4 border-l-primary"
                          />
                        ))}
                        {recommendations.length > 3 && (
                          <div className="pt-4 text-center">
                            <Button
                              variant="outline"
                              onClick={() => router.push('/opportunities')}
                            >
                              View {recommendations.length - 3} more
                              recommendations
                              <ExternalLink className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <Sparkles className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                        <p className="text-lg font-medium text-muted-foreground">
                          No personalized recommendations yet
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Complete your profile to get AI-powered job
                          recommendations tailored to your experience and
                          preferences.
                        </p>
                        <div className="mt-4 space-x-2">
                          <Button
                            size="sm"
                            onClick={() => router.push('/profile')}
                          >
                            Complete Profile
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={refreshRecommendations}
                          >
                            Try Again
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </section>

            {/* Recent Activity & Quick Actions */}
            <aside
              aria-labelledby="dashboard-sidebar-heading"
              className="space-y-6"
            >
              <h2 id="dashboard-sidebar-heading" className="sr-only">
                Quick Actions and Recent Activity
              </h2>
              <motion.div variants={itemVariants} className="space-y-6">
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      onClick={() => router.push('/profile')}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Update Profile
                    </Button>
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      onClick={() => router.push('/opportunities')}
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Search Opportunities
                    </Button>
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      onClick={() => router.push('/learning')}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Learning Center
                    </Button>
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      onClick={() => router.push('/profile')}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      My Profile
                    </Button>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex animate-pulse space-x-3">
                            <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-muted" />
                            <div className="flex-1 space-y-1">
                              <div className="h-3 w-3/4 rounded bg-muted"></div>
                              <div className="h-2 w-1/2 rounded bg-muted"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : applications.length > 0 ? (
                      applications.slice(0, 4).map((app) => (
                        <div key={app.id} className="flex space-x-3">
                          <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm text-foreground">
                              You applied for {app.jobs.title} at{' '}
                              {app.jobs.organizations.name}
                            </p>
                            <div className="flex items-center space-x-2">
                              <p className="text-xs text-muted-foreground">
                                {formatDate(app.applied_at)}
                              </p>
                              <Badge
                                variant={getStatusBadgeVariant(app.status)}
                                className="px-1 py-0 text-xs"
                              >
                                {app.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-center">
                        <p className="text-sm text-muted-foreground">
                          No recent activity.
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Start applying to see your activity here.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </aside>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
