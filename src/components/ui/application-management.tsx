'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Search,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Calendar,
  MapPin,
  ExternalLink,
  ThumbsUp,
  UserX,
  Briefcase,
  Target,
} from 'lucide-react';
import { formatDate } from '@/lib/date-utils';

export type ApplicationStatus =
  | 'submitted'
  | 'reviewed'
  | 'shortlisted'
  | 'interviewing'
  | 'offered'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  cover_letter: string;
  status: ApplicationStatus;
  nexus_score: number;
  skills_score: number;
  experience_score: number;
  sector_score: number;
  location_score: number;
  availability_score: number;
  remote_work_score: number;
  recruiter_notes: string;
  feedback: string;
  rating: number;
  interview_scheduled_at: string | null;
  interview_feedback: string;
  interview_rating: number;
  last_contact_at: string | null;
  contact_count: number;
  reviewed_at: string | null;
  decision_made_at: string | null;
  withdrawn_at: string | null;
  applied_at: string;
  updated_at: string;
  job: {
    id: string;
    title: string;
    role_type: string;
  };
  candidate: {
    id: string;
    first_name: string;
    last_name: string;
    title: string;
    company: string;
    avatar_url: string;
    linkedin_url: string;
    location: string;
    sector_preferences: string[];
    skills: string[];
  };
}

interface ApplicationManagementProps {
  organizationId: string;
}

const STATUS_CONFIG: Record<
  ApplicationStatus,
  {
    color: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  }
> = {
  submitted: {
    color: 'bg-blue-100 text-blue-800',
    label: 'New',
    icon: Clock,
    description: 'Application just submitted',
  },
  reviewed: {
    color: 'bg-purple-100 text-purple-800',
    label: 'Reviewed',
    icon: Eye,
    description: 'Application has been reviewed',
  },
  shortlisted: {
    color: 'bg-green-100 text-green-800',
    label: 'Shortlisted',
    icon: Star,
    description: 'Candidate is shortlisted',
  },
  interviewing: {
    color: 'bg-orange-100 text-orange-800',
    label: 'Interviewing',
    icon: Calendar,
    description: 'Interview scheduled or in progress',
  },
  offered: {
    color: 'bg-emerald-100 text-emerald-800',
    label: 'Offered',
    icon: ThumbsUp,
    description: 'Offer has been extended',
  },
  accepted: {
    color: 'bg-teal-100 text-teal-800',
    label: 'Accepted',
    icon: CheckCircle,
    description: 'Offer accepted by candidate',
  },
  rejected: {
    color: 'bg-red-100 text-red-800',
    label: 'Rejected',
    icon: XCircle,
    description: 'Application rejected',
  },
  withdrawn: {
    color: 'bg-gray-100 text-gray-800',
    label: 'Withdrawn',
    icon: UserX,
    description: 'Candidate withdrew application',
  },
};

export function ApplicationManagement({
  organizationId,
}: ApplicationManagementProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>(
    'all'
  );
  const [jobFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [reviewDialog, setReviewDialog] = useState<{
    application: Application | null;
    isOpen: boolean;
  }>({ application: null, isOpen: false });

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (jobFilter !== 'all') params.append('job_id', jobFilter);

      const response = await fetch(`/api/organization/applications?${params}`);
      const data = await response.json();

      if (response.ok) {
        setApplications(data.applications || []);
        setStats(data.stats || {});
      }
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, jobFilter]);

  // Load applications
  useEffect(() => {
    loadApplications();
  }, [organizationId, statusFilter, jobFilter, loadApplications]);

  const updateApplicationStatus = async (
    applicationId: string,
    newStatus: ApplicationStatus,
    notes?: string,
    rating?: number
  ) => {
    try {
      const response = await fetch('/api/organization/applications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: applicationId,
          status: newStatus,
          recruiter_notes: notes,
          rating: rating,
        }),
      });

      if (response.ok) {
        await loadApplications();
        setReviewDialog({ application: null, isOpen: false });
      }
    } catch (error) {
      console.error('Error updating application:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      searchTerm === '' ||
      `${app.candidate.first_name} ${app.candidate.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      app.job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.candidate.company?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const ApplicationCard = ({ application }: { application: Application }) => {
    const statusConfig = STATUS_CONFIG[application.status];
    const StatusIcon = statusConfig.icon;
    const fullName = `${application.candidate.first_name} ${application.candidate.last_name}`;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          className="cursor-pointer transition-shadow hover:shadow-md"
          onClick={() => setSelectedApplication(application)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 font-semibold text-white">
                  {application.candidate.first_name[0]}
                  {application.candidate.last_name[0]}
                </div>
                <div>
                  <CardTitle className="text-lg">{fullName}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {application.candidate.title} •{' '}
                    {application.candidate.company}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getScoreBadgeColor(application.nexus_score)}>
                  {application.nexus_score}% Match
                </Badge>
                <Badge className={statusConfig.color}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {statusConfig.label}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    asChild
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setReviewDialog({ application, isOpen: true });
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Review
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        updateApplicationStatus(application.id, 'shortlisted');
                      }}
                    >
                      <Star className="mr-2 h-4 w-4" />
                      Shortlist
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        updateApplicationStatus(application.id, 'rejected');
                      }}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Applied to:</span>
                <span className="font-medium">{application.job.title}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Applied:</span>
                <span>{formatDate(application.applied_at)}</span>
              </div>

              {application.candidate.location && (
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{application.candidate.location}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div
                    className={`font-semibold ${getScoreColor(application.skills_score)}`}
                  >
                    {application.skills_score}%
                  </div>
                  <div className="text-muted-foreground">Skills</div>
                </div>
                <div className="text-center">
                  <div
                    className={`font-semibold ${getScoreColor(application.experience_score)}`}
                  >
                    {application.experience_score}%
                  </div>
                  <div className="text-muted-foreground">Experience</div>
                </div>
                <div className="text-center">
                  <div
                    className={`font-semibold ${getScoreColor(application.sector_score)}`}
                  >
                    {application.sector_score}%
                  </div>
                  <div className="text-muted-foreground">Sector</div>
                </div>
              </div>

              {application.candidate.skills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {application.candidate.skills
                    .slice(0, 3)
                    .map((skill, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {skill}
                      </Badge>
                    ))}
                  {application.candidate.skills.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{application.candidate.skills.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const ReviewDialog = () => {
    const [reviewStatus, setReviewStatus] = useState<ApplicationStatus>(
      reviewDialog.application?.status || 'reviewed'
    );
    const [notes, setNotes] = useState(
      reviewDialog.application?.recruiter_notes || ''
    );
    const [rating, setRating] = useState(reviewDialog.application?.rating || 3);

    if (!reviewDialog.application) return null;

    const application = reviewDialog.application;
    const candidate = application.candidate;

    return (
      <Dialog
        open={reviewDialog.isOpen}
        onOpenChange={(open) =>
          setReviewDialog({ ...reviewDialog, isOpen: open })
        }
      >
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Review Application - {candidate.first_name} {candidate.last_name}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="scores">Scores</TabsTrigger>
              <TabsTrigger value="cover-letter">Cover Letter</TabsTrigger>
              <TabsTrigger value="review">Review</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Candidate Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 font-semibold text-white">
                        {candidate.first_name[0]}
                        {candidate.last_name[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {candidate.first_name} {candidate.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {candidate.title}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{candidate.company}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{candidate.location}</span>
                      </div>
                      {candidate.linkedin_url && (
                        <div className="flex items-center space-x-2">
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={candidate.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            LinkedIn Profile
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Application Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Position:
                      </span>
                      <span className="text-sm font-medium">
                        {application.job.title}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Applied:
                      </span>
                      <span className="text-sm">
                        {formatDate(application.applied_at)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Status:
                      </span>
                      <Badge
                        className={STATUS_CONFIG[application.status].color}
                      >
                        {STATUS_CONFIG[application.status].label}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Nexus Score:
                      </span>
                      <Badge
                        className={getScoreBadgeColor(application.nexus_score)}
                      >
                        {application.nexus_score}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Skills & Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Skills</Label>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {candidate.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">
                        Sector Preferences
                      </Label>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {candidate.sector_preferences.map((sector, index) => (
                          <Badge key={index} variant="outline">
                            {sector}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="scores" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Target className="mr-2 h-5 w-5" />
                      Overall Match Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div
                        className={`text-4xl font-bold ${getScoreColor(application.nexus_score)}`}
                      >
                        {application.nexus_score}%
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Nexus Score
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Score Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Skills Match</span>
                      <span
                        className={`font-semibold ${getScoreColor(application.skills_score)}`}
                      >
                        {application.skills_score}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Experience</span>
                      <span
                        className={`font-semibold ${getScoreColor(application.experience_score)}`}
                      >
                        {application.experience_score}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Sector Relevance</span>
                      <span
                        className={`font-semibold ${getScoreColor(application.sector_score)}`}
                      >
                        {application.sector_score}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Location</span>
                      <span
                        className={`font-semibold ${getScoreColor(application.location_score)}`}
                      >
                        {application.location_score}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Availability</span>
                      <span
                        className={`font-semibold ${getScoreColor(application.availability_score)}`}
                      >
                        {application.availability_score}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="cover-letter" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Cover Letter</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap text-sm">
                    {application.cover_letter || 'No cover letter provided.'}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="review" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="status">Update Status</Label>
                    <Select
                      value={reviewStatus}
                      onValueChange={(value: ApplicationStatus) =>
                        setReviewStatus(value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_CONFIG).map(
                          ([status, config]) => (
                            <SelectItem key={status} value={status}>
                              {config.label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="rating">Rating (1-5)</Label>
                    <Select
                      value={rating.toString()}
                      onValueChange={(value) => setRating(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} Star{num > 1 ? 's' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Recruiter Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add your notes about this candidate..."
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    setReviewDialog({ application: null, isOpen: false })
                  }
                >
                  Cancel
                </Button>
                <Button
                  onClick={() =>
                    updateApplicationStatus(
                      application.id,
                      reviewStatus,
                      notes,
                      rating
                    )
                  }
                >
                  Save Review
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Application Management</h2>
          <p className="text-muted-foreground">
            Review and manage candidate applications
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Applications
                </p>
                <p className="text-2xl font-bold">{applications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">{stats.submitted || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Shortlisted</p>
                <p className="text-2xl font-bold">{stats.shortlisted || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-teal-600" />
              <div>
                <p className="text-sm text-muted-foreground">Offers Accepted</p>
                <p className="text-2xl font-bold">{stats.accepted || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
            <Input
              placeholder="Search candidates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex space-x-2">
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as ApplicationStatus | 'all')
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                <SelectItem key={status} value={status}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Applications */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      ) : filteredApplications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-2 text-lg font-semibold">
              No applications found
            </h3>
            <p className="text-muted-foreground">
              {searchTerm
                ? 'No applications match your search criteria.'
                : 'No applications have been submitted yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {filteredApplications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </div>
      )}

      {/* Application Detail Dialog */}
      {selectedApplication && (
        <Dialog
          open={!!selectedApplication}
          onOpenChange={() => setSelectedApplication(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedApplication.candidate.first_name}{' '}
                {selectedApplication.candidate.last_name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge
                  className={getScoreBadgeColor(
                    selectedApplication.nexus_score
                  )}
                >
                  {selectedApplication.nexus_score}% Match
                </Badge>
                <Badge
                  className={STATUS_CONFIG[selectedApplication.status].color}
                >
                  {STATUS_CONFIG[selectedApplication.status].label}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Position:</span>
                  <p className="font-medium">{selectedApplication.job.title}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Applied:</span>
                  <p>{formatDate(selectedApplication.applied_at)}</p>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedApplication(null)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setReviewDialog({
                      application: selectedApplication,
                      isOpen: true,
                    });
                    setSelectedApplication(null);
                  }}
                >
                  Review Application
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Review Dialog */}
      <ReviewDialog />
    </div>
  );
}
