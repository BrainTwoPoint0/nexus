'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  MessageCircle,
  UserCheck,
  Eye,
  MapPin,
  Briefcase,
  Star,
  Award,
  TrendingUp,
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
import { CandidateMatch } from '@/lib/matching-service';

interface CandidateRecommendationCardProps {
  recommendation: CandidateMatch;
  onContact?: (candidateId: string) => void;
  onShortlist?: (candidateId: string) => void;
  onView?: (candidateId: string) => void;
  className?: string;
}

export function CandidateRecommendationCard({
  recommendation,
  onContact,
  onShortlist,
  onView,
  className = '',
}: CandidateRecommendationCardProps) {
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const { candidate, score } = recommendation;

  const handleShortlist = () => {
    setIsShortlisted(!isShortlisted);
    onShortlist?.(recommendation.candidateId);
  };

  const handleView = () => {
    onView?.(recommendation.candidateId);
  };

  const handleContact = () => {
    onContact?.(recommendation.candidateId);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Exceptional';
    if (score >= 75) return 'Strong Match';
    if (score >= 60) return 'Good Fit';
    return 'Potential';
  };

  const getProfileCompletenessColor = (completeness: number) => {
    if (completeness >= 90) return 'text-green-600';
    if (completeness >= 75) return 'text-blue-600';
    if (completeness >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className={`transition-shadow hover:shadow-md ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{candidate.name}</h3>
              {score.board_experience_weight > 0.5 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Award className="h-4 w-4 text-yellow-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Extensive board experience</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Briefcase className="h-4 w-4" />
              <span>{candidate.title}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{candidate.location}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div
              className={`text-2xl font-bold ${getScoreColor(score.overall_score)}`}
            >
              {score.overall_score}%
            </div>
            <Badge variant="secondary" className="text-xs">
              {getScoreLabel(score.overall_score)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-3">
          {/* Profile Completeness */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Profile Completeness</span>
            <span
              className={`font-medium ${getProfileCompletenessColor(candidate.profileCompleteness)}`}
            >
              {candidate.profileCompleteness}%
            </span>
          </div>
          <Progress value={candidate.profileCompleteness} className="h-1" />

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
              <span>Sector Expertise</span>
              <span className="font-medium">
                {score.sector_expertise_score}%
              </span>
            </div>
            <Progress value={score.sector_expertise_score} className="h-1" />

            {score.cultural_fit_score > 50 && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span>Cultural Fit</span>
                  <span className="font-medium">
                    {score.cultural_fit_score}%
                  </span>
                </div>
                <Progress value={score.cultural_fit_score} className="h-1" />
              </>
            )}
          </div>

          {/* Board Experience Highlight */}
          {score.board_experience_weight > 0 && (
            <div className="flex items-center gap-2 rounded-md bg-yellow-50 p-2">
              <TrendingUp className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                {Math.round(score.board_experience_weight * 100)}% board
                experience boost
              </span>
            </div>
          )}

          {/* Recommendation Reasons */}
          {score.recommendation_reasons &&
            score.recommendation_reasons.length > 0 && (
              <div className="mt-3">
                <div className="mb-2 flex items-center gap-1">
                  <Star className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">
                    Why this candidate:
                  </span>
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {score.recommendation_reasons
                    .slice(0, 2)
                    .map((reason, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="mt-1 text-blue-500">•</span>
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
                        +{score.recommendation_reasons.length - 2} more insights
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          Candidate Analysis: {candidate.name}
                        </DialogTitle>
                        <DialogDescription>
                          Detailed assessment of candidate fit for this position
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <h4 className="mb-2 font-medium">
                            Overall Match Score: {score.overall_score}%
                          </h4>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">
                                Skills:
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
                                Sector:
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
                          <h4 className="mb-2 font-medium">Key Strengths:</h4>
                          <ul className="space-y-2">
                            {score.recommendation_reasons.map(
                              (reason, index) => (
                                <li
                                  key={index}
                                  className="flex items-start gap-2 text-sm"
                                >
                                  <Star className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                                  <span>{reason}</span>
                                </li>
                              )
                            )}
                          </ul>
                        </div>

                        {score.explanation && (
                          <div>
                            <h4 className="mb-2 font-medium">
                              Assessment Summary:
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {score.explanation}
                            </p>
                          </div>
                        )}

                        {score.board_experience_weight > 0 && (
                          <div>
                            <h4 className="mb-2 font-medium">
                              Board Experience:
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              This candidate has significant board experience
                              (weight:{' '}
                              {Math.round(score.board_experience_weight * 100)}
                              %) which enhances their suitability for governance
                              roles and adds valuable perspective.
                            </p>
                          </div>
                        )}

                        {score.skills_match_detail && (
                          <div>
                            <h4 className="mb-2 font-medium">
                              Skills Analysis:
                            </h4>
                            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                              {score.skills_match_detail.matched_skills.length >
                                0 && (
                                <div>
                                  <span className="font-medium text-green-600">
                                    Matched Skills:
                                  </span>
                                  <ul className="mt-1 text-muted-foreground">
                                    {score.skills_match_detail.matched_skills.map(
                                      (skill, index) => (
                                        <li key={index}>• {skill}</li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              )}
                              {score.skills_match_detail.missing_skills.length >
                                0 && (
                                <div>
                                  <span className="font-medium text-red-600">
                                    Development Areas:
                                  </span>
                                  <ul className="mt-1 text-muted-foreground">
                                    {score.skills_match_detail.missing_skills
                                      .slice(0, 5)
                                      .map((skill, index) => (
                                        <li key={index}>• {skill}</li>
                                      ))}
                                  </ul>
                                </div>
                              )}
                            </div>
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

      <CardFooter className="gap-2 pt-3">
        <Button
          onClick={handleView}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          <Eye className="mr-1 h-4 w-4" />
          View Profile
        </Button>

        <Button onClick={handleContact} size="sm" className="flex-1">
          <MessageCircle className="mr-1 h-4 w-4" />
          Contact
        </Button>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isShortlisted ? 'default' : 'outline'}
                size="sm"
                onClick={handleShortlist}
                className="px-3"
              >
                <UserCheck className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
}

export default CandidateRecommendationCard;
