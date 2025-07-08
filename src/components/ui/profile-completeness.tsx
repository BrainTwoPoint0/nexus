'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Plus, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileCompletenessProps {
  completeness: number;
  suggestions?: CompletionSuggestion[];
  compact?: boolean;
  showSuggestions?: boolean;
  onSuggestionClick?: (suggestion: CompletionSuggestion) => void;
}

interface CompletionSuggestion {
  id: string;
  title: string;
  description: string;
  points: number;
  section: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

const defaultSuggestions: CompletionSuggestion[] = [
  {
    id: 'bio',
    title: 'Add Professional Bio',
    description: 'Write a compelling professional bio (minimum 50 characters)',
    points: 7,
    section: 'personal',
    completed: false,
    priority: 'high',
  },
  {
    id: 'phone',
    title: 'Add Phone Number',
    description: 'Provide contact phone number',
    points: 4,
    section: 'personal',
    completed: false,
    priority: 'medium',
  },
  {
    id: 'linkedin',
    title: 'Add LinkedIn Profile',
    description: 'Connect your LinkedIn profile URL',
    points: 3,
    section: 'personal',
    completed: false,
    priority: 'medium',
  },
  {
    id: 'skills',
    title: 'Add Skills',
    description: 'Add at least 3 professional skills',
    points: 8,
    section: 'skills',
    completed: false,
    priority: 'high',
  },
  {
    id: 'work_history',
    title: 'Add Work Experience',
    description: 'Add your professional work history',
    points: 12,
    section: 'experience',
    completed: false,
    priority: 'high',
  },
  {
    id: 'board_experience',
    title: 'Add Board Experience',
    description: "Add any board positions you've held",
    points: 10,
    section: 'experience',
    completed: false,
    priority: 'high',
  },
  {
    id: 'education',
    title: 'Add Education',
    description: 'Add your educational background',
    points: 5,
    section: 'experience',
    completed: false,
    priority: 'medium',
  },
  {
    id: 'certifications',
    title: 'Add Certifications',
    description: 'Add professional certifications',
    points: 5,
    section: 'skills',
    completed: false,
    priority: 'medium',
  },
  {
    id: 'resume',
    title: 'Upload Resume',
    description: 'Upload your current CV or resume',
    points: 8,
    section: 'documents',
    completed: false,
    priority: 'high',
  },
];

export function ProfileCompleteness({
  completeness,
  suggestions = defaultSuggestions,
  compact = false,
  showSuggestions = true,
  onSuggestionClick,
}: ProfileCompletenessProps) {
  const [displayedCompleteness, setDisplayedCompleteness] = useState(0);

  // Animate the progress bar
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayedCompleteness(completeness);
    }, 100);
    return () => clearTimeout(timer);
  }, [completeness]);

  const getCompletenessStatus = (percentage: number) => {
    if (percentage >= 90)
      return {
        label: 'Excellent',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
      };
    if (percentage >= 70)
      return { label: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (percentage >= 50)
      return {
        label: 'Fair',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
      };
    return {
      label: 'Needs Attention',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    };
  };

  const status = getCompletenessStatus(completeness);
  const pendingSuggestions = suggestions.filter((s) => !s.completed);
  const nextSuggestions = pendingSuggestions.slice(0, 3);

  if (compact) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium">Profile Completeness</span>
            <span className="text-sm font-semibold">{completeness}%</span>
          </div>
          <Progress value={displayedCompleteness} className="h-2" />
        </div>
        <Badge variant="outline" className={cn(status.color, status.bgColor)}>
          {status.label}
        </Badge>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Profile Completeness</CardTitle>
          <Badge variant="outline" className={cn(status.color, status.bgColor)}>
            {status.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {completeness >= 90 ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingUp className="h-5 w-5 text-blue-500" />
              )}
              <span className="text-lg font-medium">
                {completeness}% Complete
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {100 - completeness} points to go
            </div>
          </div>

          <Progress value={displayedCompleteness} className="h-3" />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Basic</span>
            <span>Good</span>
            <span>Excellent</span>
          </div>
        </div>

        {/* Completion Message */}
        {completeness >= 90 ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Excellent Profile!</p>
                <p className="text-sm text-green-700">
                  Your profile is highly attractive to organizations looking for
                  board members.
                </p>
              </div>
            </div>
          </div>
        ) : completeness >= 70 ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-800">Good Progress!</p>
                <p className="text-sm text-blue-700">
                  You&apos;re on track. Complete a few more sections to maximize
                  your visibility.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">
                  Boost Your Profile
                </p>
                <p className="text-sm text-orange-700">
                  Complete more sections to attract top board opportunities.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {showSuggestions &&
          nextSuggestions.length > 0 &&
          completeness < 100 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Quick Wins</h4>
                <span className="text-xs text-muted-foreground">
                  {pendingSuggestions.length} remaining
                </span>
              </div>

              <div className="space-y-2">
                {nextSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:bg-secondary/50"
                    onClick={() => onSuggestionClick?.(suggestion)}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={cn(
                          'h-2 w-2 rounded-full',
                          suggestion.priority === 'high'
                            ? 'bg-red-500'
                            : suggestion.priority === 'medium'
                              ? 'bg-orange-500'
                              : 'bg-green-500'
                        )}
                      />
                      <div>
                        <p className="text-sm font-medium">
                          {suggestion.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {suggestion.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        +{suggestion.points}
                      </Badge>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>

              {pendingSuggestions.length > 3 && (
                <Button variant="outline" size="sm" className="w-full">
                  View All Suggestions ({pendingSuggestions.length - 3} more)
                </Button>
              )}
            </div>
          )}

        {/* Profile Benefits */}
        {completeness < 70 && (
          <div className="rounded-lg border bg-muted/30 p-4">
            <h4 className="mb-2 font-medium">Complete Profile Benefits</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Higher visibility in organization searches</li>
              <li>• Better quality board opportunity matches</li>
              <li>• Increased chances of interview invitations</li>
              <li>• Access to premium networking events</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Hook for calculating profile completeness from profile data
export function useProfileCompleteness(
  profile: Record<string, string | number | string[] | null> | null
) {
  const [completeness, setCompleteness] = useState(0);
  const [suggestions, setSuggestions] =
    useState<CompletionSuggestion[]>(defaultSuggestions);

  useEffect(() => {
    if (!profile) return;

    // Calculate completeness based on profile data
    let score = 0;
    const updatedSuggestions = [...defaultSuggestions];

    // Basic information (30 points)
    if (
      profile.firstName &&
      typeof profile.firstName === 'string' &&
      profile.firstName.trim()
    )
      score += 3;
    if (
      profile.lastName &&
      typeof profile.lastName === 'string' &&
      profile.lastName.trim()
    )
      score += 3;
    if (
      profile.email &&
      typeof profile.email === 'string' &&
      profile.email.trim()
    )
      score += 3;
    if (
      profile.phone &&
      typeof profile.phone === 'string' &&
      profile.phone.trim()
    ) {
      score += 4;
      updatedSuggestions.find((s) => s.id === 'phone')!.completed = true;
    }
    if (
      profile.title &&
      typeof profile.title === 'string' &&
      profile.title.trim()
    )
      score += 5;
    if (
      profile.bio &&
      typeof profile.bio === 'string' &&
      profile.bio.trim() &&
      profile.bio.length > 50
    ) {
      score += 7;
      updatedSuggestions.find((s) => s.id === 'bio')!.completed = true;
    }
    if (
      profile.location &&
      typeof profile.location === 'string' &&
      profile.location.trim()
    )
      score += 5;

    // Professional details (20 points)
    if (
      profile.skills &&
      Array.isArray(profile.skills) &&
      profile.skills.length >= 3
    ) {
      score += 8;
      updatedSuggestions.find((s) => s.id === 'skills')!.completed = true;
    }
    if (
      profile.linkedin_url &&
      typeof profile.linkedin_url === 'string' &&
      profile.linkedin_url.trim()
    ) {
      score += 3;
      updatedSuggestions.find((s) => s.id === 'linkedin')!.completed = true;
    }
    if (
      profile.languages &&
      Array.isArray(profile.languages) &&
      profile.languages.length > 0
    )
      score += 2;
    if (
      profile.sector_preferences &&
      Array.isArray(profile.sector_preferences) &&
      profile.sector_preferences.length > 0
    )
      score += 4;
    if (profile.availability_status) score += 3;

    // Experience sections would be calculated from related tables
    // For now, we'll use mock data or props to determine completion
    // This would be replaced with actual database queries

    setCompleteness(Math.min(score, 100));
    setSuggestions(updatedSuggestions);
  }, [profile]);

  return { completeness, suggestions };
}
