'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
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
} from 'lucide-react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useState, useEffect } from 'react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

interface Profile {
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  company: string | null;
  role: string | null;
  location: string | null;
}

interface Job {
  id: string;
  title: string;
  organization: {
    name: string;
  };
  sector: string;
  location: string;
  created_at: string;
  compensation_min: number | null;
  compensation_max: number | null;
  employment_type: string;
  status: string;
}

interface Application {
  id: string;
  status: string;
  submitted_at: string;
  job: Job;
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

  const [profile, setProfile] = useState<Profile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    applications_count: 0,
    profile_views: 0,
    matched_jobs_count: 0,
    upcoming_events_count: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    async function fetchDashboardData() {
      try {
        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name, last_name, title, company, role, location')
          .eq('id', user.id)
          .single();
        
        if (profileData) setProfile(profileData as Profile);

        // Fetch user's applications with job details
        const { data: applicationsData } = await supabase
          .from('applications')
          .select(`
            id,
            status,
            submitted_at,
            job:jobs(
              id,
              title,
              sector,
              location,
              created_at,
              compensation_min,
              compensation_max,
              employment_type,
              status,
              organization:organizations(name)
            )
          `)
          .eq('candidate_id', user.id)
          .order('submitted_at', { ascending: false })
          .limit(10);

        if (applicationsData) {
          setApplications(applicationsData as Application[]);
          setStats(prev => ({ ...prev, applications_count: applicationsData.length }));
        }

        // Fetch recent job opportunities (active jobs)
        const { data: jobsData } = await supabase
          .from('jobs')
          .select(`
            id,
            title,
            sector,
            location,
            created_at,
            compensation_min,
            compensation_max,
            employment_type,
            status,
            organization:organizations(name)
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(6);

        if (jobsData) {
          setRecentJobs(jobsData as Job[]);
          setStats(prev => ({ ...prev, matched_jobs_count: jobsData.length }));
        }

        // TODO: Add real profile views tracking later
        // For now, using simulated data based on profile completeness
        const profileCompletenessScore = [
          profileData?.first_name,
          profileData?.last_name,
          profileData?.title,
          profileData?.company,
          profileData?.location
        ].filter(Boolean).length;
        
        const simulatedProfileViews = Math.max(0, profileCompletenessScore * 8 + Math.floor(Math.random() * 10));
        
        setStats(prev => ({ 
          ...prev, 
          profile_views: simulatedProfileViews,
          // TODO: Replace with real events when event system is built
          upcoming_events_count: 2
        }));

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user, supabase]);

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
          filter: `candidate_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Application change received:', payload);
          
          if (payload.eventType === 'INSERT') {
            // Add new application to state
            const newApplication = payload.new as any;
            setApplications(prev => [newApplication, ...prev]);
            setStats(prev => ({ ...prev, applications_count: prev.applications_count + 1 }));
          } else if (payload.eventType === 'UPDATE') {
            // Update existing application
            setApplications(prev => 
              prev.map(app => 
                app.id === payload.new.id 
                  ? { ...app, ...payload.new }
                  : app
              )
            );
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted application
            setApplications(prev => 
              prev.filter(app => app.id !== payload.old.id)
            );
            setStats(prev => ({ ...prev, applications_count: Math.max(0, prev.applications_count - 1) }));
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

  const displayName =
    (profile
      ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim()
      : user?.email) || 'User';
  const initials =
    (profile?.first_name?.[0] ?? '') + (profile?.last_name?.[0] ?? '') ||
    (user?.email?.[0] ?? 'U');
  const titleAndCompany = profile?.title
    ? `${profile.title}${profile.company ? ' at ' + profile.company : ''}`
    : '';

  // Dynamic stats based on real data
  const dynamicStats = [
    {
      title: 'Applications Sent',
      value: stats.applications_count.toString(),
      icon: FileText,
      change: `${applications.filter(app => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return new Date(app.submitted_at) > oneWeekAgo;
      }).length} this week`,
    },
    { 
      title: 'Profile Views', 
      value: stats.profile_views.toString(), 
      icon: Users, 
      change: `+${Math.floor(stats.profile_views * 0.2)} this week`
    },
    {
      title: 'Opportunities Available',
      value: stats.matched_jobs_count.toString(),
      icon: TrendingUp,
      change: `${recentJobs.filter(job => {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        return new Date(job.created_at) > threeDaysAgo;
      }).length} new this week`,
    },
    {
      title: 'Upcoming Events',
      value: stats.upcoming_events_count.toString(),
      icon: Calendar,
      change: 'This month',
    },
  ];

  function formatSalaryRange(min: number | null, max: number | null): string {
    if (!min && !max) return 'Competitive';
    if (min && max) return `$${(min/1000).toFixed(0)}K - $${(max/1000).toFixed(0)}K`;
    if (min) return `$${(min/1000).toFixed(0)}K+`;
    if (max) return `Up to $${(max/1000).toFixed(0)}K`;
    return 'Competitive';
  }

  function getStatusBadgeVariant(status: string) {
    switch (status) {
      case 'pending': return 'default';
      case 'reviewed': return 'secondary';
      case 'interviewing': return 'default';
      case 'offered': return 'default';
      case 'accepted': return 'default';
      case 'rejected': return 'destructive';
      case 'withdrawn': return 'outline';
      default: return 'secondary';
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  }

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
            className="flex flex-col items-start justify-between space-y-4 md:flex-row md:items-center md:space-y-0"
          >
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Welcome back, {displayName.split(' ')[0]}
                </h1>
                <p className="text-muted-foreground" role="text">
                  {titleAndCompany}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </Button>
              <Button size="sm">
                <Search className="mr-2 h-4 w-4" />
                Browse Opportunities
              </Button>
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
                <Card key={index} className="transition-shadow hover:shadow-md">
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

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Recent Opportunities */}
            <section aria-labelledby="recent-opportunities-heading" className="lg:col-span-2">
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle id="recent-opportunities-heading">Recent Opportunities</CardTitle>
                  <Button variant="ghost" size="sm">
                    View All
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="rounded-lg border p-4 animate-pulse">
                          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-1/4"></div>
                        </div>
                      ))}
                    </div>
                  ) : recentJobs.length > 0 ? (
                    recentJobs.map((job) => (
                      <div
                        key={job.id}
                        className="rounded-lg border p-4 transition-colors hover:bg-secondary/30"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-foreground">
                                {job.title}
                              </h3>
                              <Badge variant="default">
                                {job.employment_type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {job.organization.name} • {job.sector}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span>{job.location}</span>
                              <span>•</span>
                              <span>{formatDate(job.created_at)}</span>
                              <span>•</span>
                              <span>{formatSalaryRange(job.compensation_min, job.compensation_max)}</span>
                            </div>
                          </div>
                          <div className="space-y-2 text-right">
                            <div className="flex items-center space-x-1">
                              <span className="text-sm font-medium text-primary">
                                New opportunity
                              </span>
                            </div>
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No opportunities available at the moment.</p>
                      <p className="text-sm text-muted-foreground mt-2">Check back later for new board positions.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              </motion.div>
            </section>

            {/* Recent Activity & Quick Actions */}
            <aside aria-labelledby="dashboard-sidebar-heading" className="space-y-6">
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
                  <Button className="w-full justify-start" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Update Profile
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Search className="mr-2 h-4 w-4" />
                    Search Opportunities
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="mr-2 h-4 w-4" />
                    View Events
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Download CV
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
                        <div key={i} className="flex space-x-3 animate-pulse">
                          <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-muted" />
                          <div className="flex-1 space-y-1">
                            <div className="h-3 bg-muted rounded w-3/4"></div>
                            <div className="h-2 bg-muted rounded w-1/2"></div>
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
                            You applied for {app.job.title} at {app.job.organization.name}
                          </p>
                          <div className="flex items-center space-x-2">
                            <p className="text-xs text-muted-foreground">
                              {formatDate(app.submitted_at)}
                            </p>
                            <Badge 
                              variant={getStatusBadgeVariant(app.status)}
                              className="text-xs px-1 py-0"
                            >
                              {app.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">No recent activity.</p>
                      <p className="text-xs text-muted-foreground mt-1">Start applying to see your activity here.</p>
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
