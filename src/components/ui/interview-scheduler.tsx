'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Users,
  Phone,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  CalendarCheck,
  Timer,
  Star,
  MessageSquare,
} from 'lucide-react';
import { Application } from './application-management';
import { formatDate } from '@/lib/date-utils';

export type InterviewType = 'phone' | 'video' | 'in_person' | 'panel';
export type InterviewStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface Interview {
  id: string;
  application_id: string;
  profile_id: string;
  job_id: string;
  type: InterviewType;
  status: InterviewStatus;
  scheduled_at: string;
  duration_minutes: number;
  location: string | null;
  meeting_link: string | null;
  interviewer_ids: string[];
  notes: string;
  preparation_notes: string;
  feedback: string;
  rating: number | null;
  recommended_next_steps: string;
  created_at: string;
  updated_at: string;
  candidate: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    title: string;
    company: string;
  };
  job: {
    id: string;
    title: string;
    organization_id: string;
  };
  interviewers: {
    id: string;
    name: string;
    email: string;
    role: string;
  }[];
}

interface InterviewSchedulerProps {
  applications: Application[];
  organizationId: string;
}

const INTERVIEW_TYPES: {
  value: InterviewType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: 'phone', label: 'Phone Call', icon: Phone },
  { value: 'video', label: 'Video Call', icon: Video },
  { value: 'in_person', label: 'In Person', icon: MapPin },
  { value: 'panel', label: 'Panel Interview', icon: Users },
];

const INTERVIEW_STATUS: Record<
  InterviewStatus,
  {
    color: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  scheduled: {
    color: 'bg-blue-100 text-blue-800',
    label: 'Scheduled',
    icon: Calendar,
  },
  confirmed: {
    color: 'bg-green-100 text-green-800',
    label: 'Confirmed',
    icon: CheckCircle,
  },
  completed: {
    color: 'bg-purple-100 text-purple-800',
    label: 'Completed',
    icon: CalendarCheck,
  },
  cancelled: {
    color: 'bg-red-100 text-red-800',
    label: 'Cancelled',
    icon: AlertTriangle,
  },
  no_show: {
    color: 'bg-gray-100 text-gray-800',
    label: 'No Show',
    icon: Timer,
  },
};

const DURATION_OPTIONS = [
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
];

export function InterviewScheduler({
  applications,
  organizationId,
}: InterviewSchedulerProps) {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [feedbackDialog, setFeedbackDialog] = useState<Interview | null>(null);
  const [viewFilter, setViewFilter] = useState<
    'all' | 'upcoming' | 'completed'
  >('all');
  const [newInterview, setNewInterview] = useState({
    type: 'video' as InterviewType,
    scheduled_at: '',
    duration_minutes: 60,
    location: '',
    meeting_link: '',
    interviewer_ids: [] as string[],
    notes: '',
    preparation_notes: '',
  });

  const shortlistedApplications = applications.filter(
    (app) => app.status === 'shortlisted'
  );

  const scheduleInterview = async () => {
    if (!selectedApplication) return;

    const interview: Interview = {
      id: Math.random().toString(36).substr(2, 9),
      application_id: selectedApplication.id,
      profile_id: selectedApplication.profile_id,
      job_id: selectedApplication.job_id,
      type: newInterview.type,
      status: 'scheduled',
      scheduled_at: newInterview.scheduled_at,
      duration_minutes: newInterview.duration_minutes,
      location: newInterview.location || null,
      meeting_link: newInterview.meeting_link || null,
      interviewer_ids: newInterview.interviewer_ids,
      notes: newInterview.notes,
      preparation_notes: newInterview.preparation_notes,
      feedback: '',
      rating: null,
      recommended_next_steps: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      candidate: {
        id: selectedApplication.candidate.id,
        first_name: selectedApplication.candidate.first_name,
        last_name: selectedApplication.candidate.last_name,
        email: '', // Default empty string since candidate doesn't have email
        phone: '', // Default empty string since candidate doesn't have phone
        title: selectedApplication.candidate.title,
        company: selectedApplication.candidate.company,
      },
      job: {
        id: selectedApplication.job.id,
        title: selectedApplication.job.title,
        organization_id: organizationId,
      },
      interviewers: [], // Would be populated from API
    };

    setInterviews((prev) => [...prev, interview]);
    setScheduleDialog(false);
    setSelectedApplication(null);
    setNewInterview({
      type: 'video',
      scheduled_at: '',
      duration_minutes: 60,
      location: '',
      meeting_link: '',
      interviewer_ids: [],
      notes: '',
      preparation_notes: '',
    });
  };

  const updateInterviewStatus = (
    interviewId: string,
    status: InterviewStatus
  ) => {
    setInterviews((prev) =>
      prev.map((interview) =>
        interview.id === interviewId
          ? { ...interview, status, updated_at: new Date().toISOString() }
          : interview
      )
    );
  };

  const submitFeedback = (
    interview: Interview,
    feedback: string,
    rating: number,
    nextSteps: string
  ) => {
    setInterviews((prev) =>
      prev.map((i) =>
        i.id === interview.id
          ? {
              ...i,
              feedback,
              rating,
              recommended_next_steps: nextSteps,
              status: 'completed',
              updated_at: new Date().toISOString(),
            }
          : i
      )
    );
    setFeedbackDialog(null);
  };

  const filteredInterviews = interviews.filter((interview) => {
    const now = new Date();
    const interviewDate = new Date(interview.scheduled_at);

    switch (viewFilter) {
      case 'upcoming':
        return interviewDate >= now && interview.status !== 'completed';
      case 'completed':
        return interview.status === 'completed';
      default:
        return true;
    }
  });

  const upcomingInterviews = interviews.filter((i) => {
    const now = new Date();
    const interviewDate = new Date(i.scheduled_at);
    return interviewDate >= now && i.status !== 'completed';
  });

  const InterviewCard = ({ interview }: { interview: Interview }) => {
    const statusConfig = INTERVIEW_STATUS[interview.status];
    const StatusIcon = statusConfig.icon;
    const interviewType = INTERVIEW_TYPES.find(
      (t) => t.value === interview.type
    );
    const TypeIcon = interviewType?.icon || Calendar;

    return (
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center space-x-2">
                <TypeIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">
                  {interview.candidate.first_name}{' '}
                  {interview.candidate.last_name}
                </span>
                <Badge className={statusConfig.color}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {interview.job.title} • {interviewType?.label}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFeedbackDialog(interview)}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formatDate(interview.scheduled_at)}</span>
            <Clock className="ml-2 h-4 w-4 text-muted-foreground" />
            <span>{interview.duration_minutes} minutes</span>
          </div>

          {interview.location && (
            <div className="flex items-center space-x-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{interview.location}</span>
            </div>
          )}

          {interview.meeting_link && (
            <div className="flex items-center space-x-2 text-sm">
              <Video className="h-4 w-4 text-muted-foreground" />
              <a
                href={interview.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Join Meeting
              </a>
            </div>
          )}

          {interview.preparation_notes && (
            <div className="text-sm">
              <strong>Preparation Notes:</strong>
              <p className="mt-1 text-muted-foreground">
                {interview.preparation_notes}
              </p>
            </div>
          )}

          {interview.rating && (
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm">{interview.rating}/5</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="flex space-x-2">
              {interview.status === 'scheduled' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateInterviewStatus(interview.id, 'confirmed')
                  }
                >
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Confirm
                </Button>
              )}
              {(interview.status === 'scheduled' ||
                interview.status === 'confirmed') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateInterviewStatus(interview.id, 'completed')
                  }
                >
                  <CalendarCheck className="mr-1 h-3 w-3" />
                  Complete
                </Button>
              )}
            </div>
            <div className="flex space-x-2">
              <Button variant="ghost" size="sm">
                <Edit className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const FeedbackDialog = () => {
    const [feedback, setFeedback] = useState(feedbackDialog?.feedback || '');
    const [rating, setRating] = useState(feedbackDialog?.rating || 3);
    const [nextSteps, setNextSteps] = useState(
      feedbackDialog?.recommended_next_steps || ''
    );

    if (!feedbackDialog) return null;

    return (
      <Dialog
        open={!!feedbackDialog}
        onOpenChange={() => setFeedbackDialog(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Interview Feedback - {feedbackDialog.candidate.first_name}{' '}
              {feedbackDialog.candidate.last_name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="rating">Overall Rating</Label>
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

              <div>
                <Label>Interview Details</Label>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Date: {formatDate(feedbackDialog.scheduled_at)}</p>
                  <p>Duration: {feedbackDialog.duration_minutes} minutes</p>
                  <p>
                    Type:{' '}
                    {
                      INTERVIEW_TYPES.find(
                        (t) => t.value === feedbackDialog.type
                      )?.label
                    }
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="feedback">Interview Feedback</Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your thoughts on the candidate's performance, strengths, areas for improvement..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="nextSteps">Recommended Next Steps</Label>
              <Textarea
                id="nextSteps"
                value={nextSteps}
                onChange={(e) => setNextSteps(e.target.value)}
                placeholder="What should be the next steps for this candidate?"
                rows={2}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setFeedbackDialog(null)}>
                Cancel
              </Button>
              <Button
                onClick={() =>
                  submitFeedback(feedbackDialog, feedback, rating, nextSteps)
                }
              >
                Submit Feedback
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
          <h2 className="text-2xl font-bold">Interview Scheduler</h2>
          <p className="text-muted-foreground">
            Schedule and manage interviews with candidates
          </p>
        </div>
        <Button onClick={() => setScheduleDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Interview
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Interviews
                </p>
                <p className="text-2xl font-bold">{interviews.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold">
                  {upcomingInterviews.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {interviews.filter((i) => i.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Ready to Schedule
                </p>
                <p className="text-2xl font-bold">
                  {shortlistedApplications.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="interviews" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="interviews">All Interviews</TabsTrigger>
          <TabsTrigger value="candidates">Ready to Schedule</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="interviews" className="space-y-4">
          <div className="flex space-x-2">
            <Button
              variant={viewFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewFilter('all')}
            >
              All ({interviews.length})
            </Button>
            <Button
              variant={viewFilter === 'upcoming' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewFilter('upcoming')}
            >
              Upcoming ({upcomingInterviews.length})
            </Button>
            <Button
              variant={viewFilter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewFilter('completed')}
            >
              Completed (
              {interviews.filter((i) => i.status === 'completed').length})
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filteredInterviews.map((interview) => (
              <InterviewCard key={interview.id} interview={interview} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="candidates" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {shortlistedApplications.map((application) => (
              <Card
                key={application.id}
                className="transition-shadow hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 font-semibold text-white">
                        {application.candidate.first_name[0]}
                        {application.candidate.last_name[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {application.candidate.first_name}{' '}
                          {application.candidate.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {application.candidate.title} •{' '}
                          {application.candidate.company}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedApplication(application);
                        setScheduleDialog(true);
                      }}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Position:</span>
                      <span>{application.job.title}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Nexus Score:
                      </span>
                      <Badge variant="outline">
                        {application.nexus_score}%
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Applied:</span>
                      <span>{formatDate(application.applied_at)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="mb-2 text-lg font-semibold">Calendar View</h3>
              <p className="text-muted-foreground">
                Calendar integration coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Schedule Interview Dialog */}
      <Dialog open={scheduleDialog} onOpenChange={setScheduleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Schedule Interview
              {selectedApplication && (
                <span className="ml-2 font-normal text-muted-foreground">
                  - {selectedApplication.candidate.first_name}{' '}
                  {selectedApplication.candidate.last_name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="type">Interview Type</Label>
                <Select
                  value={newInterview.type}
                  onValueChange={(value: InterviewType) =>
                    setNewInterview((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVIEW_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="duration">Duration</Label>
                <Select
                  value={newInterview.duration_minutes.toString()}
                  onValueChange={(value) =>
                    setNewInterview((prev) => ({
                      ...prev,
                      duration_minutes: parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value.toString()}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="datetime">Date & Time</Label>
              <Input
                id="datetime"
                type="datetime-local"
                value={newInterview.scheduled_at}
                onChange={(e) =>
                  setNewInterview((prev) => ({
                    ...prev,
                    scheduled_at: e.target.value,
                  }))
                }
              />
            </div>

            {newInterview.type === 'in_person' && (
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newInterview.location}
                  onChange={(e) =>
                    setNewInterview((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  placeholder="Office address or meeting location"
                />
              </div>
            )}

            {(newInterview.type === 'video' ||
              newInterview.type === 'panel') && (
              <div>
                <Label htmlFor="meeting-link">Meeting Link</Label>
                <Input
                  id="meeting-link"
                  value={newInterview.meeting_link}
                  onChange={(e) =>
                    setNewInterview((prev) => ({
                      ...prev,
                      meeting_link: e.target.value,
                    }))
                  }
                  placeholder="Zoom, Teams, or other meeting link"
                />
              </div>
            )}

            <div>
              <Label htmlFor="prep-notes">Preparation Notes</Label>
              <Textarea
                id="prep-notes"
                value={newInterview.preparation_notes}
                onChange={(e) =>
                  setNewInterview((prev) => ({
                    ...prev,
                    preparation_notes: e.target.value,
                  }))
                }
                placeholder="Notes for the interviewer about topics to cover, questions to ask, etc."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setScheduleDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={scheduleInterview}>
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Interview
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <FeedbackDialog />
    </div>
  );
}
