'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MainLayout } from '@/components/layout/main-layout';
import {
  Building,
  Users,
  MapPin,
  Calendar,
  Globe,
  UserPlus,
  Settings,
  Plus,
  Briefcase,
  Star,
  Share2,
} from 'lucide-react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/date-utils';
import { containerVariants, itemVariants } from '@/lib/animation-variants';
import Image from 'next/image';

interface Organization {
  id: string;
  name: string;
  slug: string;
  sector: string;
  industry: string;
  company_size: string;
  founded_year: number;
  headquarters_location: string;
  logo_url: string | null;
  website_url: string | null;
  company_description: string;
  board_size: number;
  current_openings: number;
  created_at: string;
  updated_at: string;
}

interface OrganizationMember {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'hr' | 'member';
  title: string;
  department: string;
  can_post_jobs: boolean;
  can_manage_applications: boolean;
  can_manage_organization: boolean;
  can_invite_members: boolean;
  status: 'active' | 'inactive' | 'pending';
  joined_at: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
}

interface Job {
  id: string;
  title: string;
  location: string;
  employment_type: string;
  compensation_min: number | null;
  compensation_max: number | null;
  created_at: string;
  status: string;
  applications_count: number;
}

export default function OrganizationPage() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [userMembership, setUserMembership] =
    useState<OrganizationMember | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'team'>(
    'overview'
  );

  const fetchOrganizationData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch organization details
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', params.slug)
        .single();

      if (orgError) throw orgError;
      setOrganization(orgData);

      // Fetch user's membership if authenticated
      if (user) {
        const { data: membershipData } = await supabase
          .from('organization_members')
          .select('*')
          .eq('organization_id', orgData.id)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        setUserMembership(membershipData);
      }

      // Fetch organization members
      const { data: membersData } = await supabase
        .from('organization_members')
        .select(
          `
          *,
          profiles:user_id (
            first_name,
            last_name
          )
        `
        )
        .eq('organization_id', orgData.id)
        .eq('status', 'active')
        .order('joined_at');

      setMembers(membersData || []);

      // Fetch active jobs
      const { data: jobsData } = await supabase
        .from('jobs')
        .select(
          `
          id,
          title,
          location,
          employment_type,
          compensation_min,
          compensation_max,
          created_at,
          status,
          applications:applications(count)
        `
        )
        .eq('organization_id', orgData.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (jobsData) {
        const jobsWithCount = jobsData.map((job) => ({
          ...job,
          applications_count: job.applications?.[0]?.count || 0,
        }));
        setJobs(jobsWithCount);
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
      toast({
        title: 'Error',
        description: 'Failed to load organization data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [params.slug, user, supabase, toast]);

  const handleJoinOrganization = async () => {
    if (!user || !organization) return;

    try {
      const { error } = await supabase.from('organization_members').insert({
        organization_id: organization.id,
        user_id: user.id,
        role: 'member',
        status: 'pending',
        can_post_jobs: false,
        can_manage_applications: false,
        can_manage_organization: false,
        can_invite_members: false,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Your request to join has been sent',
      });

      // Refresh data
      await fetchOrganizationData();
    } catch (error) {
      console.error('Error joining organization:', error);
      toast({
        title: 'Error',
        description: 'Failed to send join request',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (params.slug) {
      fetchOrganizationData();
    }
  }, [params.slug, user, fetchOrganizationData]);

  if (loading) {
    return (
      <MainLayout>
        <div className="page-container py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-32 rounded-lg bg-muted"></div>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <div className="h-48 rounded-lg bg-muted"></div>
                <div className="h-64 rounded-lg bg-muted"></div>
              </div>
              <div className="space-y-6">
                <div className="h-32 rounded-lg bg-muted"></div>
                <div className="h-48 rounded-lg bg-muted"></div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!organization) {
    return (
      <MainLayout>
        <div className="page-container py-8">
          <Card>
            <CardContent className="p-12 text-center">
              <Building className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                Organization not found
              </h3>
              <p className="mt-2 text-muted-foreground">
                The organization you&apos;re looking for doesn&apos;t exist or
                may have been removed.
              </p>
              <Button
                onClick={() => router.push('/organizations')}
                className="mt-4"
              >
                Browse Organizations
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
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
          {/* Organization Header */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      {organization.logo_url ? (
                        <Image
                          src={organization.logo_url}
                          alt={`${organization.name} logo`}
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded"
                        />
                      ) : (
                        <Building className="h-8 w-8 text-primary" />
                      )}
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-foreground">
                        {organization.name}
                      </h1>
                      <p className="text-muted-foreground">
                        {organization.sector} • {organization.company_size}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row">
                    <Button variant="outline" size="sm">
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </Button>
                    <Button variant="outline" size="sm">
                      <Star className="mr-2 h-4 w-4" />
                      Follow
                    </Button>
                    {user && userMembership ? (
                      <div className="flex gap-2">
                        {userMembership.can_post_jobs && (
                          <Button
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/organizations/${organization.slug}/jobs/create`
                              )
                            }
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Post Job
                          </Button>
                        )}
                        {userMembership.can_manage_organization && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/organizations/${organization.slug}/settings`
                              )
                            }
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                          </Button>
                        )}
                      </div>
                    ) : user ? (
                      <Button size="sm" onClick={handleJoinOrganization}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Join Organization
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => router.push('/sign-in')}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Join Organization
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Navigation Tabs */}
          <motion.div variants={itemVariants}>
            <div className="flex space-x-1 rounded-lg bg-muted p-1">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'jobs', label: `Jobs (${jobs.length})` },
                { id: 'team', label: `Team (${members.length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() =>
                    setActiveTab(tab.id as 'overview' | 'jobs' | 'team')
                  }
                  className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Content based on active tab */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {activeTab === 'overview' && (
              <>
                <div className="space-y-6 lg:col-span-2">
                  <motion.div variants={itemVariants}>
                    <Card>
                      <CardHeader>
                        <CardTitle>About {organization.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="leading-relaxed text-muted-foreground">
                          {organization.company_description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Job Openings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {jobs.length === 0 ? (
                          <p className="py-8 text-center text-muted-foreground">
                            No job openings at the moment
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {jobs.slice(0, 3).map((job) => (
                              <div
                                key={job.id}
                                className="flex cursor-pointer items-center justify-between rounded-lg border p-4 hover:bg-accent/50"
                                onClick={() =>
                                  router.push(`/opportunities/${job.id}`)
                                }
                              >
                                <div className="flex-1">
                                  <h3 className="font-semibold text-foreground">
                                    {job.title}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    {job.location} • {job.employment_type}
                                  </p>
                                  <div className="mt-2 flex items-center gap-2">
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {job.applications_count} applications
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      Posted {formatDate(job.created_at)}
                                    </span>
                                  </div>
                                </div>
                                <Button variant="outline" size="sm">
                                  View Details
                                </Button>
                              </div>
                            ))}
                            {jobs.length > 3 && (
                              <div className="pt-4 text-center">
                                <Button
                                  variant="outline"
                                  onClick={() => setActiveTab('jobs')}
                                >
                                  View All {jobs.length} Jobs
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                <div className="space-y-6">
                  <motion.div variants={itemVariants}>
                    <Card>
                      <CardHeader>
                        <CardTitle>Quick Stats</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Founded
                            </p>
                            <p className="font-semibold">
                              {organization.founded_year}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Company Size
                            </p>
                            <p className="font-semibold">
                              {organization.company_size}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Headquarters
                            </p>
                            <p className="font-semibold">
                              {organization.headquarters_location}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Briefcase className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Current Openings
                            </p>
                            <p className="font-semibold">
                              {organization.current_openings}
                            </p>
                          </div>
                        </div>
                        {organization.website_url && (
                          <div className="pt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() =>
                                window.open(organization.website_url!, '_blank')
                              }
                            >
                              <Globe className="mr-2 h-4 w-4" />
                              Visit Website
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </>
            )}

            {activeTab === 'jobs' && (
              <div className="lg:col-span-3">
                <motion.div variants={itemVariants}>
                  <Card>
                    <CardHeader>
                      <CardTitle>All Job Openings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {jobs.length === 0 ? (
                        <div className="py-12 text-center">
                          <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/50" />
                          <h3 className="mt-4 text-lg font-semibold text-foreground">
                            No job openings
                          </h3>
                          <p className="mt-2 text-muted-foreground">
                            {organization.name} doesn&apos;t have any active job
                            postings at the moment.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {jobs.map((job) => (
                            <div
                              key={job.id}
                              className="flex cursor-pointer items-center justify-between rounded-lg border p-4 hover:bg-accent/50"
                              onClick={() =>
                                router.push(`/opportunities/${job.id}`)
                              }
                            >
                              <div className="flex-1">
                                <h3 className="font-semibold text-foreground">
                                  {job.title}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {job.location} • {job.employment_type}
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {job.applications_count} applications
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    Posted {formatDate(job.created_at)}
                                  </span>
                                </div>
                              </div>
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            )}

            {activeTab === 'team' && (
              <div className="lg:col-span-3">
                <motion.div variants={itemVariants}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Team Members</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center gap-3 rounded-lg border p-4"
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {member.profiles.first_name?.[0]}
                                {member.profiles.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold text-foreground">
                                {member.profiles.first_name}{' '}
                                {member.profiles.last_name}
                              </p>
                              <p className="truncate text-sm text-muted-foreground">
                                {member.title || member.role}
                              </p>
                              <div className="mt-1 flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {member.role}
                                </Badge>
                                {member.department && (
                                  <span className="text-xs text-muted-foreground">
                                    {member.department}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
