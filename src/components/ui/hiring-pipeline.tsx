'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Star,
  Calendar,
  BarChart3,
  Target,
  Award,
  AlertTriangle,
  ArrowRight,
  MoreVertical,
  Eye,
  MessageSquare,
  Timer,
  Zap,
  MapPin,
  Briefcase,
} from 'lucide-react';
import { Application, ApplicationStatus } from './application-management';
import { formatDate } from '@/lib/date-utils';

interface HiringPipelineProps {
  applications: Application[];
  jobId?: string;
}

interface PipelineStage {
  id: ApplicationStatus;
  name: string;
  description: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  applications: Application[];
  conversion_rate?: number;
  avg_time_in_stage?: number;
}

interface PipelineMetrics {
  total_applications: number;
  conversion_rates: Record<ApplicationStatus, number>;
  avg_time_to_hire: number;
  current_pipeline_value: number;
  bottlenecks: string[];
  recommendations: string[];
}

export function HiringPipeline({ applications, jobId }: HiringPipelineProps) {
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [viewMode, setViewMode] = useState<'board' | 'funnel' | 'metrics'>(
    'board'
  );

  // Filter applications by job if specified
  const filteredApplications = jobId
    ? applications.filter((app) => app.job_id === jobId)
    : applications;

  // Define pipeline stages
  const stages: PipelineStage[] = [
    {
      id: 'submitted',
      name: 'Applied',
      description: 'New applications received',
      color: 'bg-blue-500',
      icon: Clock,
      applications: filteredApplications.filter(
        (app) => app.status === 'submitted'
      ),
    },
    {
      id: 'reviewed',
      name: 'Reviewed',
      description: 'Applications under review',
      color: 'bg-purple-500',
      icon: Eye,
      applications: filteredApplications.filter(
        (app) => app.status === 'reviewed'
      ),
    },
    {
      id: 'shortlisted',
      name: 'Shortlisted',
      description: 'Top candidates selected',
      color: 'bg-green-500',
      icon: Star,
      applications: filteredApplications.filter(
        (app) => app.status === 'shortlisted'
      ),
    },
    {
      id: 'interviewing',
      name: 'Interviewing',
      description: 'Interview process ongoing',
      color: 'bg-orange-500',
      icon: Calendar,
      applications: filteredApplications.filter(
        (app) => app.status === 'interviewing'
      ),
    },
    {
      id: 'offered',
      name: 'Offered',
      description: 'Offer extended to candidate',
      color: 'bg-emerald-500',
      icon: Award,
      applications: filteredApplications.filter(
        (app) => app.status === 'offered'
      ),
    },
    {
      id: 'accepted',
      name: 'Hired',
      description: 'Offer accepted - hired!',
      color: 'bg-teal-500',
      icon: CheckCircle,
      applications: filteredApplications.filter(
        (app) => app.status === 'accepted'
      ),
    },
  ];

  // Calculate metrics
  const metrics: PipelineMetrics = {
    total_applications: filteredApplications.length,
    conversion_rates: stages.reduce(
      (acc, stage) => {
        acc[stage.id] =
          (stage.applications.length / filteredApplications.length) * 100;
        return acc;
      },
      {} as Record<ApplicationStatus, number>
    ),
    avg_time_to_hire: 14, // Mock data
    current_pipeline_value: stages.reduce(
      (sum, stage) => sum + stage.applications.length,
      0
    ),
    bottlenecks: ['Long review time', 'Interview scheduling delays'],
    recommendations: [
      'Speed up initial review process',
      'Implement automated screening',
      'Add more interview slots',
    ],
  };

  const moveApplication = (
    applicationId: string,
    newStatus: ApplicationStatus
  ) => {
    // In a real app, this would call an API
    console.log(`Moving application ${applicationId} to ${newStatus}`);
  };

  const CandidateCard = ({ application }: { application: Application }) => {
    const fullName = `${application.candidate.first_name} ${application.candidate.last_name}`;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="cursor-pointer rounded-lg border border-gray-200 bg-white p-3 transition-shadow hover:shadow-md"
        onClick={() => setSelectedApplication(application)}
      >
        <div className="mb-2 flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-semibold text-white">
              {application.candidate.first_name[0]}
              {application.candidate.last_name[0]}
            </div>
            <div>
              <h4 className="text-sm font-semibold">{fullName}</h4>
              <p className="text-xs text-muted-foreground">
                {application.candidate.title}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => moveApplication(application.id, 'shortlisted')}
              >
                <Star className="mr-2 h-3 w-3" />
                Shortlist
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => moveApplication(application.id, 'interviewing')}
              >
                <Calendar className="mr-2 h-3 w-3" />
                Interview
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => moveApplication(application.id, 'offered')}
              >
                <Award className="mr-2 h-3 w-3" />
                Make Offer
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => moveApplication(application.id, 'rejected')}
              >
                <XCircle className="mr-2 h-3 w-3" />
                Reject
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Match Score:</span>
            <span className="font-medium">{application.nexus_score}%</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Applied:</span>
            <span>{formatDate(application.applied_at)}</span>
          </div>
        </div>

        <div className="mt-2 border-t border-gray-100 pt-2">
          <div className="flex justify-between text-xs">
            <span>Skills: {application.skills_score}%</span>
            <span>Exp: {application.experience_score}%</span>
          </div>
        </div>
      </motion.div>
    );
  };

  const PipelineStageColumn = ({ stage }: { stage: PipelineStage }) => {
    const StageIcon = stage.icon;

    return (
      <div className="min-w-0 flex-1">
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div
                className={`h-8 w-8 rounded-full ${stage.color} flex items-center justify-center`}
              >
                <StageIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">{stage.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {stage.description}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {stage.applications.length}
            </Badge>
          </div>

          <div className="h-1 w-full rounded-full bg-gray-200">
            <div
              className={`h-1 rounded-full ${stage.color}`}
              style={{
                width: `${Math.min((stage.applications.length / 10) * 100, 100)}%`,
              }}
            />
          </div>
        </div>

        <div className="max-h-96 space-y-2 overflow-y-auto">
          {stage.applications.map((application) => (
            <CandidateCard key={application.id} application={application} />
          ))}

          {stage.applications.length === 0 && (
            <div className="py-8 text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <StageIcon className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm text-muted-foreground">No candidates</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const FunnelView = () => (
    <div className="space-y-4">
      {stages.map((stage, index) => {
        const nextStage = stages[index + 1];
        const conversionRate = nextStage
          ? (nextStage.applications.length /
              Math.max(stage.applications.length, 1)) *
            100
          : 0;

        return (
          <div key={stage.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`h-10 w-10 rounded-full ${stage.color} flex items-center justify-center`}
                >
                  <stage.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">{stage.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {stage.description}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {stage.applications.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  {(
                    (stage.applications.length / filteredApplications.length) *
                    100
                  ).toFixed(1)}
                  %
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="h-8 w-full rounded-full bg-gray-200">
                <div
                  className={`h-8 rounded-full ${stage.color} flex items-center justify-center font-semibold text-white`}
                  style={{
                    width: `${Math.max((stage.applications.length / filteredApplications.length) * 100, 5)}%`,
                  }}
                >
                  {stage.applications.length > 0 && stage.applications.length}
                </div>
              </div>
            </div>

            {nextStage && (
              <div className="flex items-center justify-center text-sm text-muted-foreground">
                <ArrowRight className="mr-1 h-4 w-4" />
                <span>
                  {conversionRate.toFixed(1)}% conversion to {nextStage.name}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const MetricsView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <Users className="mr-2 h-5 w-5" />
              Total Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {metrics.total_applications}
            </div>
            <div className="text-sm text-muted-foreground">All time</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <Timer className="mr-2 h-5 w-5" />
              Avg Time to Hire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.avg_time_to_hire}</div>
            <div className="text-sm text-muted-foreground">days</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <Target className="mr-2 h-5 w-5" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(metrics.conversion_rates.accepted || 0).toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">
              offer acceptance
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Conversion Rates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stages.map((stage) => (
              <div key={stage.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`h-3 w-3 rounded-full ${stage.color}`} />
                  <span className="text-sm">{stage.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {metrics.conversion_rates[stage.id]?.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stage.applications.length} candidates
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Bottlenecks & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="mb-2 font-semibold">Current Bottlenecks</h4>
              <div className="space-y-1">
                {metrics.bottlenecks.map((bottleneck, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">{bottleneck}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-semibold">Recommendations</h4>
              <div className="space-y-1">
                {metrics.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const ApplicationDetailDialog = () => {
    if (!selectedApplication) return null;

    const candidate = selectedApplication.candidate;
    const fullName = `${candidate.first_name} ${candidate.last_name}`;

    return (
      <Dialog
        open={!!selectedApplication}
        onOpenChange={() => setSelectedApplication(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{fullName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 font-semibold text-white">
                  {candidate.first_name[0]}
                  {candidate.last_name[0]}
                </div>
                <div>
                  <h3 className="font-semibold">{fullName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {candidate.title}
                  </p>
                </div>
              </div>
              <Badge variant="outline">
                {selectedApplication.nexus_score}% Match
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <h4 className="mb-2 font-semibold">Contact Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{candidate.company}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{candidate.location}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-semibold">Application Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Position:</span>
                    <span>{selectedApplication.job.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Applied:</span>
                    <span>{formatDate(selectedApplication.applied_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="outline">
                      {selectedApplication.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-semibold">Score Breakdown</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Skills Match</span>
                    <span className="font-medium">
                      {selectedApplication.skills_score}%
                    </span>
                  </div>
                  <Progress
                    value={selectedApplication.skills_score}
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Experience</span>
                    <span className="font-medium">
                      {selectedApplication.experience_score}%
                    </span>
                  </div>
                  <Progress
                    value={selectedApplication.experience_score}
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sector Fit</span>
                    <span className="font-medium">
                      {selectedApplication.sector_score}%
                    </span>
                  </div>
                  <Progress
                    value={selectedApplication.sector_score}
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Location</span>
                    <span className="font-medium">
                      {selectedApplication.location_score}%
                    </span>
                  </div>
                  <Progress
                    value={selectedApplication.location_score}
                    className="h-2"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setSelectedApplication(null)}
              >
                Close
              </Button>
              <Button>
                <MessageSquare className="mr-2 h-4 w-4" />
                Review Application
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Hiring Pipeline</h2>
          <p className="text-muted-foreground">
            Track candidates through your hiring process
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={viewMode === 'board' ? 'default' : 'outline'}
            onClick={() => setViewMode('board')}
          >
            Board View
          </Button>
          <Button
            variant={viewMode === 'funnel' ? 'default' : 'outline'}
            onClick={() => setViewMode('funnel')}
          >
            Funnel View
          </Button>
          <Button
            variant={viewMode === 'metrics' ? 'default' : 'outline'}
            onClick={() => setViewMode('metrics')}
          >
            Metrics
          </Button>
        </div>
      </div>

      {viewMode === 'board' && (
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {stages.map((stage) => (
            <PipelineStageColumn key={stage.id} stage={stage} />
          ))}
        </div>
      )}

      {viewMode === 'funnel' && <FunnelView />}

      {viewMode === 'metrics' && <MetricsView />}

      <ApplicationDetailDialog />
    </div>
  );
}
