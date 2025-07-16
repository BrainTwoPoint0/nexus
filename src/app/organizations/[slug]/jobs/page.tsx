'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { MainLayout } from '@/components/layout/main-layout';
import { JobManagement } from '@/components/ui/job-management';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Job } from '@/components/ui/job-management';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function OrganizationJobsPage({
  params: paramsPromise,
}: PageProps) {
  const params = use(paramsPromise);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [organization, setOrganization] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useSupabaseClient();
  const user = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const fetchOrganizationAndJobs = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', params.slug)
        .single();

      if (orgError || !orgData) {
        throw new Error('Organization not found');
      }

      setOrganization(orgData);

      // Get jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*, updated_at, views_count, organization_id')
        .eq('organization_id', orgData.id)
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      // Fix application_deadline type
      const fixedJobs = (jobsData || []).map(job => ({
        ...job,
        application_deadline: job.application_deadline === null ? undefined : job.application_deadline,
      }));
      setJobs(fixedJobs as Job[]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load jobs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, params.slug, supabase, toast]);

  useEffect(() => {
    fetchOrganizationAndJobs();
  }, [params.slug, fetchOrganizationAndJobs]);

  const handleCreateJob = () => {
    router.push(`/organizations/${params.slug}/jobs/create`);
  };

  const handleUpdateJob = (job: Job) => {
    router.push(`/organizations/${params.slug}/jobs/${job.id}/edit`);
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      const { error } = await supabase.from('jobs').delete().eq('id', jobId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Job deleted successfully',
      });

      await fetchOrganizationAndJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete job',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateJobStatus = async (
    jobId: string,
    status: Job['status']
  ) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({
          status,
          published_at:
            status === 'active' ? new Date().toISOString() : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Job ${status === 'active' ? 'published' : 'updated'} successfully`,
      });

      await fetchOrganizationAndJobs();
    } catch (error) {
      console.error('Error updating job status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update job status',
        variant: 'destructive',
      });
    }
  };

  const handleDuplicateJob = async (job: Job) => {
    if (!organization?.id || !user?.id) return;

    try {
      const { error } = await supabase
        .from('jobs')
        .insert({
          organization_id: organization.id,
          posted_by: user.id,
          title: `${job.title} (Copy)`,
          description: job.description,
          responsibilities: job.responsibilities,
          requirements: job.requirements,
          role_type: job.role_type,
          engagement_level: job.engagement_level,
          compensation_min: job.compensation_min,
          compensation_max: job.compensation_max,
          compensation_currency: job.compensation_currency,
          compensation_type: job.compensation_type,
          equity_offered: job.equity_offered,
          location: job.location,
          remote_work_allowed: job.remote_work_allowed,
          travel_required: job.travel_required,
          application_deadline: job.application_deadline,
          start_date: job.start_date,
          contract_duration: job.contract_duration,
          status: 'draft',
          sector: 'Technology',
          required_skills: job.required_skills || [],
          employment_type: job.engagement_level,
          time_commitment:
            job.engagement_level === 'part_time' ? 'Part-time' : 'Full-time',
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Job duplicated successfully',
      });

      await fetchOrganizationAndJobs();
    } catch (error) {
      console.error('Error duplicating job:', error);
      toast({
        title: 'Error',
        description: 'Failed to duplicate job',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="page-container py-8">
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="page-container py-8">
        <div className="mb-8">
          <Link href={`/organizations/${params.slug}`}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{organization?.name} - Jobs</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your job postings and track applications
          </p>
        </div>

        <JobManagement
          jobs={jobs}
          onCreateJob={handleCreateJob}
          onUpdateJob={handleUpdateJob}
          onDeleteJob={handleDeleteJob}
          onUpdateStatus={handleUpdateJobStatus}
          onDuplicateJob={handleDuplicateJob}
          isLoading={loading}
        />
      </div>
    </MainLayout>
  );
}
