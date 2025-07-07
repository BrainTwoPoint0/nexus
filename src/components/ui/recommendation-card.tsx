'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/progress';
import {
  ThumbsUp,
  ThumbsDown,
  Eye,
  MapPin,
  Building,
  Briefcase,
  Star,
  ExternalLink,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { JobMatch } from '@/lib/matching-service';

interface RecommendationCardProps {
  recommendation: JobMatch;
  onLike?: (jobId: string) => void;
  onDislike?: (jobId: string) => void;
  onView?: (jobId: string) => void;
  onApply?: (jobId: string) => void;
  className?: string;
}

export function RecommendationCard({
  recommendation,
  onLike,
  onDislike,
  onView,
  onApply,
  className = '',
}: RecommendationCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const { job, score } = recommendation;

  const handleLike = () => {
    setIsLiked(!isLiked);
    setIsDisliked(false);
    onLike?.(recommendation.jobId);
  };

  const handleDislike = () => {
    setIsDisliked(!isDisliked);
    setIsLiked(false);
    onDislike?.(recommendation.jobId);
  };

  const handleView = () => {
    onView?.(recommendation.jobId);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent Match';
    if (score >= 75) return 'Great Match';
    if (score >= 60) return 'Good Match';
    return 'Fair Match';
  };

  return (
    <Card className={`transition-shadow hover:shadow-md ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 break-words text-lg font-semibold">
              {job.title}
            </h3>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Building className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{job.organization}</span>
            </div>
          </div>
          <div className="flex flex-shrink-0 flex-row items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
            <div
              className={`text-xl font-bold sm:text-2xl ${getScoreColor(score.overall_score)}`}
            >
              {score.overall_score}%
            </div>
            <Badge variant="secondary" className="whitespace-nowrap text-xs">
              {getScoreLabel(score.overall_score)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-3">
          {/* Location and Sector */}
          <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{job.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Briefcase className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{job.sector}</span>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Skills Match</span>
              <span className="font-medium">{score.skills_score}%</span>
            </div>
            <Progress value={score.skills_score} className="h-1" />

            <div className="flex items-center justify-between text-sm">
              <span>Experience</span>
              <span className="font-medium">
                {score.experience_relevance_score}%
              </span>
            </div>
            <Progress
              value={score.experience_relevance_score}
              className="h-1"
            />

            <div className="flex items-center justify-between text-sm">
              <span>Sector Fit</span>
              <span className="font-medium">
                {score.sector_expertise_score}%
              </span>
            </div>
            <Progress value={score.sector_expertise_score} className="h-1" />
          </div>

          {/* Recommendation Reasons */}
          {score.recommendation_reasons &&
            score.recommendation_reasons.length > 0 && (
              <div className="mt-3">
                <div className="mb-2 flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">Why this matches:</span>
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {score.recommendation_reasons
                    .slice(0, 2)
                    .map((reason, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="mt-1 text-yellow-500">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                </ul>
                {score.recommendation_reasons.length > 2 && (
                  <Dialog open={showDetails} onOpenChange={setShowDetails}>
                    <DialogTrigger asChild>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                      >
                        +{score.recommendation_reasons.length - 2} more reasons
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Match Analysis: {job.title}</DialogTitle>
                        <DialogDescription>
                          Detailed breakdown of why this position matches your
                          profile
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <h4 className="mb-2 font-medium">
                            Overall Score: {score.overall_score}%
                          </h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">
                                Skills Match:
                              </span>
                              <span className="ml-2 font-medium">
                                {score.skills_score}%
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Experience:
                              </span>
                              <span className="ml-2 font-medium">
                                {score.experience_relevance_score}%
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Sector Fit:
                              </span>
                              <span className="ml-2 font-medium">
                                {score.sector_expertise_score}%
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Cultural Fit:
                              </span>
                              <span className="ml-2 font-medium">
                                {score.cultural_fit_score}%
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Compensation:
                              </span>
                              <span className="ml-2 font-medium">
                                {score.compensation_alignment_score}%
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Location:
                              </span>
                              <span className="ml-2 font-medium">
                                {score.geographic_preference_score}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="mb-2 font-medium">
                            Recommendation Reasons:
                          </h4>
                          <ul className="space-y-2">
                            {score.recommendation_reasons.map(
                              (reason, index) => (
                                <li
                                  key={index}
                                  className="flex items-start gap-2 text-sm"
                                >
                                  <Star className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-500" />
                                  <span>{reason}</span>
                                </li>
                              )
                            )}
                          </ul>
                        </div>

                        {score.explanation && (
                          <div>
                            <h4 className="mb-2 font-medium">Match Summary:</h4>
                            <p className="text-sm text-muted-foreground">
                              {score.explanation}
                            </p>
                          </div>
                        )}

                        {score.board_experience_weight > 0 && (
                          <div>
                            <h4 className="mb-2 font-medium">
                              Board Experience Boost:
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Your board experience adds a{' '}
                              {Math.round(score.board_experience_weight * 100)}%
                              boost to this match based on relevant governance
                              experience.
                            </p>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            )}
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-2 pt-3 sm:flex-row">
        <div className="flex w-full gap-2 sm:flex-1">
          <Button
            onClick={handleView}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Eye className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">View Details</span>
            <span className="sm:hidden">View</span>
          </Button>

          <Button
            onClick={() => onApply?.(recommendation.jobId)}
            size="sm"
            className="flex-1"
          >
            <ExternalLink className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Apply Now</span>
            <span className="sm:hidden">Apply</span>
          </Button>
        </div>

        <div className="flex justify-center gap-1 sm:justify-end">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isLiked ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleLike}
                  className="px-2"
                >
                  <ThumbsUp className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Like this recommendation</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isDisliked ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={handleDislike}
                  className="px-2"
                >
                  <ThumbsDown className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Not interested</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardFooter>
    </Card>
  );
}

export default RecommendationCard;
