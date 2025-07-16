'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { JobStatus } from '@/components/ui/job-form';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  MoreVertical,
  Edit,
  Eye,
  Pause,
  Play,
  Trash2,
  Users,
  MapPin,
  Calendar,
  DollarSign,
  Globe,
  Copy,
  BarChart3,
  Archive,
  Briefcase,
} from 'lucide-react';
import { formatDate } from '@/lib/date-utils';

export interface Job {
  id: string;
  title: string;
  description: string;
  responsibilities: string;
  requirements: string;
  role_type: string;
  engagement_level: string;
  compensation_min: number | null;
  compensation_max: number | null;
  compensation_currency: string;
  compensation_type: string;
  equity_offered: boolean;
  location: string | null;
  remote_work_allowed: boolean;
  travel_required: string | null;
  application_deadline: string | null;
  start_date: string | null;
  contract_duration: string | null;
  required_skills: string[];
  preferred_qualifications: string[];
  status: JobStatus;
  applications_count: number;
  views_count: number;
  created_at: string;
  updated_at: string;
  organization_id: string;
}

interface JobManagementProps {
  jobs: Job[];
  onCreateJob: () => void;
  onUpdateJob: (job: Job) => void;
  onDeleteJob: (id: string) => Promise<void>;
  onUpdateStatus: (id: string, status: JobStatus) => Promise<void>;
  onDuplicateJob: (job: Job) => Promise<void>;
  isLoading?: boolean;
}

const STATUS_CONFIG: Record<
  JobStatus,
  {
    color: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft', icon: Edit },
  active: {
    color: 'bg-green-100 text-green-800',
    label: 'Active',
    icon: Globe,
  },
  paused: {
    color: 'bg-yellow-100 text-yellow-800',
    label: 'Paused',
    icon: Pause,
  },
  closed: { color: 'bg-red-100 text-red-800', label: 'Closed', icon: Archive },
  filled: { color: 'bg-blue-100 text-blue-800', label: 'Filled', icon: Users },
};

const ROLE_TYPE_LABELS: Record<string, string> = {
  board_director: 'Board Director',
  non_executive: 'Non-Executive Director',
  chair: 'Chair/Chairman',
  committee_chair: 'Committee Chair',
  advisory: 'Advisory Role',
};

const ENGAGEMENT_LABELS: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  project_based: 'Project-based',
  consulting: 'Consulting',
};

export function JobManagement({
  jobs,
  onCreateJob,
  onUpdateJob,
  onDeleteJob,
  onUpdateStatus,
  onDuplicateJob,
  isLoading = false,
}: JobManagementProps) {
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');

  const filteredJobs = jobs.filter(
    (job) => statusFilter === 'all' || job.status === statusFilter
  );

  const handleCreateJob = () => {
    onCreateJob();
  };

  const handleEditJob = (job: Job) => {
    onUpdateJob(job);
  };

  const handleDuplicateJob = async (job: Job) => {
    await onDuplicateJob(job);
  };

  const handleDeleteJob = async () => {
    if (deleteJobId) {
      await onDeleteJob(deleteJobId);
      setDeleteJobId(null);
    }
  };

  const formatCompensation = (job: Job) => {
    if (!job.compensation_min && !job.compensation_max) return 'Not specified';

    const currency = job.compensation_currency;
    const type = job.compensation_type;

    if (job.compensation_min && job.compensation_max) {
      return `${currency} ${job.compensation_min.toLocaleString()} - ${job.compensation_max.toLocaleString()} ${type}`;
    } else if (job.compensation_min) {
      return `${currency} ${job.compensation_min.toLocaleString()}+ ${type}`;
    } else {
      return `Up to ${currency} ${job.compensation_max?.toLocaleString()} ${type}`;
    }
  };

  const JobCard = ({ job }: { job: Job }) => {
    const statusConfig = STATUS_CONFIG[job.status];
    const StatusIcon = statusConfig.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-1 flex items-center space-x-2">
                  <CardTitle className="text-lg">{job.title}</CardTitle>
                  <Badge className={statusConfig.color}>
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {statusConfig.label}
                  </Badge>
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>{ROLE_TYPE_LABELS[job.role_type]}</span>
                  <span>•</span>
                  <span>{ENGAGEMENT_LABELS[job.engagement_level]}</span>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEditJob(job)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDuplicateJob(job)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </DropdownMenuItem>
                  {job.status === 'active' && (
                    <DropdownMenuItem
                      onClick={() => onUpdateStatus(job.id, 'paused')}
                    >
                      <Pause className="mr-2 h-4 w-4" />
                      Pause
                    </DropdownMenuItem>
                  )}
                  {job.status === 'paused' && (
                    <DropdownMenuItem
                      onClick={() => onUpdateStatus(job.id, 'active')}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Activate
                    </DropdownMenuItem>
                  )}
                  {(job.status === 'active' || job.status === 'paused') && (
                    <DropdownMenuItem
                      onClick={() => onUpdateStatus(job.id, 'closed')}
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      Close
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => setDeleteJobId(job.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
              {job.description}
            </p>

            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-center space-x-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{job.location || 'Location not specified'}</span>
                {job.remote_work_allowed && (
                  <Badge variant="outline" className="text-xs">
                    Remote OK
                  </Badge>
                )}
              </div>

              <div className="flex items-center space-x-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>{formatCompensation(job)}</span>
                {job.equity_offered && (
                  <Badge variant="outline" className="text-xs">
                    Equity
                  </Badge>
                )}
              </div>

              {job.application_deadline && (
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Deadline: {formatDate(job.application_deadline)}</span>
                </div>
              )}

              <div className="flex items-center space-x-2 text-sm">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span>
                  {job.applications_count} applications • {job.views_count}{' '}
                  views
                </span>
              </div>
            </div>

            {job.required_skills.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-1">
                {job.required_skills.slice(0, 3).map((skill, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {job.required_skills.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{job.required_skills.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Created {formatDate(job.created_at)}</span>
              <Button variant="outline" size="sm">
                <Eye className="mr-1 h-3 w-3" />
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Job Management</h2>
          <p className="text-muted-foreground">
            Manage your organization&apos;s job postings and applications
          </p>
        </div>
        <Button onClick={handleCreateJob} disabled={isLoading}>
          <Plus className="mr-2 h-4 w-4" />
          Post New Job
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Active Jobs</p>
                <p className="text-2xl font-bold">
                  {jobs.filter((j) => j.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Applications
                </p>
                <p className="text-2xl font-bold">
                  {jobs.reduce((sum, job) => sum + job.applications_count, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">
                  {jobs.reduce((sum, job) => sum + job.views_count, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Filled Positions
                </p>
                <p className="text-2xl font-bold">
                  {jobs.filter((j) => j.status === 'filled').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex space-x-2">
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('all')}
        >
          All ({jobs.length})
        </Button>
        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
          const count = jobs.filter((j) => j.status === status).length;
          return (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status as JobStatus)}
            >
              {config.label} ({count})
            </Button>
          );
        })}
      </div>

      {/* Job List */}
      {filteredJobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-2 text-lg font-semibold">No jobs found</h3>
            <p className="mb-4 text-muted-foreground">
              {statusFilter === 'all'
                ? 'You haven&apos;t posted any jobs yet.'
                : `No jobs with status &quot;${STATUS_CONFIG[statusFilter as JobStatus]?.label}&quot;.`}
            </p>
            <Button onClick={handleCreateJob}>
              <Plus className="mr-2 h-4 w-4" />
              Post Your First Job
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteJobId}
        onOpenChange={() => setDeleteJobId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job Posting</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this job posting? This action
              cannot be undone. All applications and associated data will be
              permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteJob}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
