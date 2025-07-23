'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MainLayout } from '@/components/layout/main-layout';
import { LoadingSpinner } from '@/components/ui/loading';
import { ErrorMessage } from '@/components/ui/error-states';
import { JobForm, JobFormData } from '@/components/ui/job-form';
import { JobManagement } from '@/components/ui/job-management';
import {
  useOrganization,
  OrganizationProvider,
} from '@/contexts/organization-context';
import type { Job } from '@/components/ui/job-management';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { useToast } from '@/hooks/use-toast';
import { Users, FileText, Calendar, Plus, Search, Eye } from 'lucide-react';

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

// Component to display organization dashboard content
function OrganizationDashboardContent() {
  const { organization, stats, isLoading, error } = useOrganization();
  const supabase = useSupabaseClient();
  const user = useUser();
  const { toast } = useToast();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [isJobFormOpen, setIsJobFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'jobs'>('dashboard');

  const fetchJobs = useCallback(async () => {
    if (!organization?.id) return;

    setJobsLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, views_count, updated_at, organization_id')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Fix application_deadline type
      const fixedJobs = (data || []).map((job) => ({
        ...job,
        application_deadline:
          job.application_deadline === null
            ? undefined
            : job.application_deadline,
      }));
      setJobs(fixedJobs as Job[]);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load jobs',
        variant: 'destructive',
      });
    } finally {
      setJobsLoading(false);
    }
  }, [organization?.id, supabase, toast]);

  // Fetch jobs for the organization
  useEffect(() => {
    if (organization?.id) {
      fetchJobs();
    }
  }, [organization?.id, fetchJobs]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex h-64 items-center justify-center">
          <ErrorMessage message={error} />
        </div>
      </MainLayout>
    );
  }

  if (!organization) {
    return (
      <MainLayout>
        <div className="flex h-64 items-center justify-center">
          <ErrorMessage message="Organization not found" />
        </div>
      </MainLayout>
    );
  }

  const handleCreateJob = async (jobData: JobFormData) => {
    if (!organization?.id || !user?.id) return;

    try {
      const { error } = await supabase
        .from('jobs')
        .insert({
          organization_id: organization.id,
          posted_by: user.id,
          title: jobData.title,
          description: jobData.description,
          responsibilities: [jobData.responsibilities],
          requirements: jobData.requirements ? [jobData.requirements] : [],
          role_type: jobData.role_type,
          engagement_level: jobData.engagement_level,
          compensation_min: jobData.compensation_min,
          compensation_max: jobData.compensation_max,
          compensation_currency: jobData.compensation_currency,
          compensation_type: jobData.compensation_type,
          equity_offered: jobData.equity_offered,
          location: jobData.location,
          remote_work_allowed: jobData.remote_work_allowed,
          travel_required: jobData.travel_required,
          application_deadline: jobData.application_deadline,
          start_date: jobData.start_date,
          contract_duration: jobData.contract_duration,
          status: jobData.status,
          published_at:
            jobData.status === 'active' ? new Date().toISOString() : null,
          // Add missing fields from the schema
          sector: 'Technology', // Default sector
          required_skills: jobData.required_skills || [],
          employment_type: jobData.engagement_level, // Map engagement_level to employment_type
          time_commitment:
            jobData.engagement_level === 'part_time'
              ? 'Part-time'
              : 'Full-time',
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Job ${jobData.status === 'active' ? 'published' : 'saved as draft'} successfully`,
      });

      setIsJobFormOpen(false);
      fetchJobs();
    } catch (error) {
      console.error('Error creating job:', error);
      toast({
        title: 'Error',
        description: 'Failed to create job',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateJob = async (jobId: string, jobData: JobFormData) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({
          title: jobData.title,
          description: jobData.description,
          responsibilities: [jobData.responsibilities],
          requirements: jobData.requirements ? [jobData.requirements] : [],
          role_type: jobData.role_type,
          engagement_level: jobData.engagement_level,
          compensation_min: jobData.compensation_min,
          compensation_max: jobData.compensation_max,
          compensation_currency: jobData.compensation_currency,
          compensation_type: jobData.compensation_type,
          equity_offered: jobData.equity_offered,
          location: jobData.location,
          remote_work_allowed: jobData.remote_work_allowed,
          travel_required: jobData.travel_required,
          application_deadline: jobData.application_deadline,
          start_date: jobData.start_date,
          contract_duration: jobData.contract_duration,
          status: jobData.status,
          published_at:
            jobData.status === 'active' &&
            !jobs.find((j) => j.id === jobId)?.applications_count
              ? new Date().toISOString()
              : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Job updated successfully',
      });

      setEditingJob(null);
      setIsJobFormOpen(false);
      fetchJobs();
    } catch (error) {
      console.error('Error updating job:', error);
      toast({
        title: 'Error',
        description: 'Failed to update job',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      const { error } = await supabase.from('jobs').delete().eq('id', jobId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Job deleted successfully',
      });

      fetchJobs();
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

      fetchJobs();
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
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Job duplicated successfully',
      });

      fetchJobs();
    } catch (error) {
      console.error('Error duplicating job:', error);
      toast({
        title: 'Error',
        description: 'Failed to duplicate job',
        variant: 'destructive',
      });
    }
  };

  const openJobForm = (job?: Job) => {
    console.log('Opening job form:', job ? 'editing' : 'creating');
    if (job) {
      setEditingJob(job);
    } else {
      setEditingJob(null);
    }
    setIsJobFormOpen(true);
  };

  const activeJobs = jobs.filter((job) => job.status === 'active');
  const totalApplications = jobs.reduce(
    (sum, job) => sum + (job.applications_count || 0),
    0
  );

  const dashboardStats = [
    {
      title: 'Active Roles',
      value: activeJobs.length.toString(),
      icon: FileText,
      change: `${jobs.filter((job) => job.status === 'draft').length} drafts`,
    },
    {
      title: 'Applications Received',
      value: totalApplications.toString(),
      icon: Users,
      change: `from ${jobs.length} total roles`,
    },
    {
      title: 'Interviews Scheduled',
      value: stats?.interviews_scheduled?.toString() || '0',
      icon: Calendar,
      change: 'upcoming',
    },
    {
      title: 'Profile Views',
      value: stats?.profile_views?.toString() || '0',
      icon: Eye,
      change: '+24 this week',
    },
  ];

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
                  {organization.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {organization.name}
                </h1>
                <p className="text-muted-foreground">
                  {organization.sector} •{' '}
                  {organization.headquarters_location || 'Location TBD'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex space-x-1 rounded-lg bg-muted p-1">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                    activeTab === 'dashboard'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('jobs')}
                  className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                    activeTab === 'jobs'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Jobs ({jobs.length})
                </button>
              </div>
              <Button variant="outline" size="sm">
                <Search className="mr-2 h-4 w-4" />
                Browse Candidates
              </Button>
              <Button size="sm" onClick={() => openJobForm()}>
                <Plus className="mr-2 h-4 w-4" />
                Post New Role
              </Button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            {dashboardStats.map((stat, index) => {
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
                          {stat.value}
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

          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Active Roles */}
              <motion.div
                variants={itemVariants}
                className="space-y-6 lg:col-span-2"
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle>Active Roles</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab('jobs')}
                    >
                      View All
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {activeJobs.length > 0 ? (
                      activeJobs.slice(0, 3).map((job) => (
                        <div key={job.id} className="rounded-lg border p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{job.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {job.applications_count || 0} applications
                              </p>
                            </div>
                            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                              Active
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-lg border p-4 text-center text-muted-foreground">
                        <p>No active roles found.</p>
                        <p className="mt-2 text-sm">
                          Create your first job posting to start attracting
                          candidates.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Candidates */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle>Recent Candidates</CardTitle>
                    <Button variant="ghost" size="sm">
                      View All
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg border p-4 text-center text-muted-foreground">
                      <p>No applications received yet.</p>
                      <p className="mt-2 text-sm">
                        Applications will appear here once you post job
                        openings.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Sidebar */}
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
                      onClick={() => openJobForm()}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Post New Role
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Search className="mr-2 h-4 w-4" />
                      Search Candidates
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule Interview
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <FileText className="mr-2 h-4 w-4" />
                      Download Reports
                    </Button>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg border p-4 text-center text-muted-foreground">
                      <p>No recent activity.</p>
                      <p className="mt-2 text-sm">
                        Activity will appear here as you manage jobs and
                        candidates.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Upcoming Interviews */}
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Interviews</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg border p-4 text-center text-muted-foreground">
                      <p>No interviews scheduled.</p>
                      <p className="mt-2 text-sm">
                        Scheduled interviews will appear here.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}

          {activeTab === 'jobs' && (
            <motion.div variants={itemVariants}>
              <JobManagement
                jobs={jobs}
                onCreateJob={() => openJobForm()}
                onUpdateJob={(job) => openJobForm(job)}
                onDeleteJob={handleDeleteJob}
                onUpdateStatus={handleUpdateJobStatus}
                onDuplicateJob={handleDuplicateJob}
                isLoading={jobsLoading}
              />
            </motion.div>
          )}
        </motion.div>

        {/* Job Form Modal */}
        <JobForm
          isOpen={isJobFormOpen}
          onClose={() => {
            console.log('Closing job form');
            setIsJobFormOpen(false);
            setEditingJob(null);
          }}
          onSubmit={
            editingJob
              ? (data) => handleUpdateJob(editingJob.id, data)
              : handleCreateJob
          }
          initialData={
            editingJob
              ? {
                  title: editingJob.title,
                  description: editingJob.description,
                  responsibilities: Array.isArray(editingJob.responsibilities)
                    ? editingJob.responsibilities[0] || ''
                    : editingJob.responsibilities || '',
                  requirements:
                    editingJob.requirements &&
                    Array.isArray(editingJob.requirements)
                      ? editingJob.requirements[0] || ''
                      : editingJob.requirements || '',
                  role_type: editingJob.role_type as
                    | 'board_director'
                    | 'non_executive'
                    | 'chair'
                    | 'committee_chair'
                    | 'advisory',
                  engagement_level: editingJob.engagement_level as
                    | 'full_time'
                    | 'part_time'
                    | 'project_based'
                    | 'consulting',
                  compensation_min: editingJob.compensation_min,
                  compensation_max: editingJob.compensation_max,
                  compensation_currency: editingJob.compensation_currency as
                    | 'GBP'
                    | 'USD'
                    | 'EUR'
                    | 'CAD'
                    | 'AUD'
                    | 'CHF'
                    | 'SGD',
                  compensation_type: editingJob.compensation_type as
                    | 'annual'
                    | 'daily'
                    | 'hourly'
                    | 'retainer',
                  equity_offered: editingJob.equity_offered,
                  location: editingJob.location,
                  remote_work_allowed: editingJob.remote_work_allowed,
                  travel_required: editingJob.travel_required,
                  application_deadline: editingJob.application_deadline,
                  start_date: editingJob.start_date,
                  contract_duration: editingJob.contract_duration,
                  required_skills: editingJob.required_skills || [],
                  preferred_qualifications:
                    editingJob.preferred_qualifications || [],
                  status: editingJob.status,
                }
              : undefined
          }
          isEditing={!!editingJob}
          isLoading={false}
        />
      </div>
    </MainLayout>
  );
}

// Main component with OrganizationProvider
export default function OrganizationDashboardPage() {
  return (
    <OrganizationProvider>
      <OrganizationDashboardContent />
    </OrganizationProvider>
  );
}
