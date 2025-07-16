'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { MainLayout } from '@/components/layout/main-layout';
import { JobForm, JobFormData } from '@/components/ui/job-form';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function CreateJobPage({ params: paramsPromise }: PageProps) {
  const params = use(paramsPromise);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = useSupabaseClient();
  const user = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const handleCreateJob = async (jobData: JobFormData) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // First get the organization ID from the slug
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', params.slug)
        .single();

      if (orgError || !organization) {
        throw new Error('Organization not found');
      }

      // Create the job
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
          employment_type: jobData.engagement_level,
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

      // Redirect back to organization dashboard
      router.push(`/organizations/${params.slug}`);
    } catch (error) {
      console.error('Error creating job:', error);
      toast({
        title: 'Error',
        description: 'Failed to create job',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    router.push(`/organizations/${params.slug}`);
  };

  return (
    <MainLayout>
      <div className="page-container py-8">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <Link href={`/organizations/${params.slug}`}>
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Create New Job Posting</h1>
            <p className="mt-2 text-muted-foreground">
              Create a new job posting to attract qualified candidates
            </p>
          </div>

          {/* Job Form */}
          <JobForm
            isOpen={true}
            onClose={handleClose}
            onSubmit={handleCreateJob}
            isEditing={false}
            isLoading={isLoading}
          />
        </div>
      </div>
    </MainLayout>
  );
}
