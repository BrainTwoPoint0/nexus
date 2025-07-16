'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Filter,
  Users,
  Target,
  Star,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  Zap,
  Brain,
} from 'lucide-react';
import { Application } from './application-management';

interface CandidateScreeningProps {
  applications: Application[];
  onUpdateApplications: (applications: Application[]) => void;
  jobId?: string;
}

interface ScreeningCriteria {
  minNexusScore: number;
  minSkillsScore: number;
  minExperienceScore: number;
  minSectorScore: number;
  requiredSkills: string[];
  preferredSectors: string[];
  locationPreference: string[];
  maxApplicationsToReview: number;
  prioritizeRecent: boolean;
  requireCoverLetter: boolean;
}

interface ScreeningResult {
  qualified: Application[];
  maybeQualified: Application[];
  notQualified: Application[];
  summary: {
    totalApplications: number;
    qualifiedCount: number;
    maybeQualifiedCount: number;
    notQualifiedCount: number;
    avgNexusScore: number;
    topSkills: string[];
    recommendedActions: string[];
  };
}

const defaultCriteria: ScreeningCriteria = {
  minNexusScore: 70,
  minSkillsScore: 60,
  minExperienceScore: 50,
  minSectorScore: 40,
  requiredSkills: [],
  preferredSectors: [],
  locationPreference: [],
  maxApplicationsToReview: 50,
  prioritizeRecent: true,
  requireCoverLetter: false,
};

export function CandidateScreening({
  applications,
  onUpdateApplications,
  jobId,
}: CandidateScreeningProps) {
  const [criteria, setCriteria] = useState<ScreeningCriteria>(defaultCriteria);
  const [screening, setScreening] = useState<ScreeningResult | null>(null);
  const [isScreening, setIsScreening] = useState(false);
  const [bulkActionDialog, setBulkActionDialog] = useState<{
    isOpen: boolean;
    action: 'shortlist' | 'reject' | null;
    applications: Application[];
  }>({ isOpen: false, action: null, applications: [] });

  const performScreening = () => {
    setIsScreening(true);

    // Simulate screening process
    setTimeout(() => {
      const qualified: Application[] = [];
      const maybeQualified: Application[] = [];
      const notQualified: Application[] = [];

      let filteredApplications = applications;

      // Filter by job if specified
      if (jobId) {
        filteredApplications = applications.filter(
          (app) => app.job_id === jobId
        );
      }

      // Apply screening criteria
      filteredApplications.forEach((app) => {
        const meetsBasicCriteria =
          app.nexus_score >= criteria.minNexusScore &&
          app.skills_score >= criteria.minSkillsScore &&
          app.experience_score >= criteria.minExperienceScore &&
          app.sector_score >= criteria.minSectorScore;

        const hasCoverLetter = criteria.requireCoverLetter
          ? app.cover_letter?.trim().length > 0
          : true;

        const hasRequiredSkills =
          criteria.requiredSkills.length === 0 ||
          criteria.requiredSkills.every((skill) =>
            app.candidate.skills.some((candidateSkill) =>
              candidateSkill.toLowerCase().includes(skill.toLowerCase())
            )
          );

        if (meetsBasicCriteria && hasCoverLetter && hasRequiredSkills) {
          if (app.nexus_score >= 80) {
            qualified.push(app);
          } else {
            maybeQualified.push(app);
          }
        } else {
          notQualified.push(app);
        }
      });

      // Sort by score and recent applications if prioritized
      const sortFn = (a: Application, b: Application) => {
        if (criteria.prioritizeRecent) {
          const scoreWeight = (b.nexus_score - a.nexus_score) * 0.7;
          const timeWeight =
            (new Date(b.applied_at).getTime() -
              new Date(a.applied_at).getTime()) *
            0.3;
          return scoreWeight + timeWeight;
        }
        return b.nexus_score - a.nexus_score;
      };

      qualified.sort(sortFn);
      maybeQualified.sort(sortFn);

      // Limit results
      const limitedQualified = qualified.slice(
        0,
        Math.floor(criteria.maxApplicationsToReview * 0.6)
      );
      const limitedMaybe = maybeQualified.slice(
        0,
        Math.floor(criteria.maxApplicationsToReview * 0.4)
      );

      // Calculate summary
      const allScores = filteredApplications.map((app) => app.nexus_score);
      const avgNexusScore =
        allScores.reduce((sum, score) => sum + score, 0) / allScores.length;

      const skillCounts: Record<string, number> = {};
      filteredApplications.forEach((app) => {
        app.candidate.skills.forEach((skill) => {
          skillCounts[skill] = (skillCounts[skill] || 0) + 1;
        });
      });

      const topSkills = Object.entries(skillCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([skill]) => skill);

      const recommendedActions = [];
      if (qualified.length < 3) {
        recommendedActions.push(
          'Consider lowering screening criteria to identify more qualified candidates'
        );
      }
      if (avgNexusScore < 60) {
        recommendedActions.push(
          'Job requirements may be too specific - consider broader skill requirements'
        );
      }
      if (notQualified.length > qualified.length * 3) {
        recommendedActions.push(
          'High volume of unqualified applications - review job description clarity'
        );
      }

      setScreening({
        qualified: limitedQualified,
        maybeQualified: limitedMaybe,
        notQualified,
        summary: {
          totalApplications: filteredApplications.length,
          qualifiedCount: limitedQualified.length,
          maybeQualifiedCount: limitedMaybe.length,
          notQualifiedCount: notQualified.length,
          avgNexusScore,
          topSkills,
          recommendedActions,
        },
      });

      setIsScreening(false);
    }, 2000);
  };

  const handleBulkAction = async (
    action: 'shortlist' | 'reject',
    applications: Application[]
  ) => {
    setBulkActionDialog({ isOpen: true, action, applications });
  };

  const confirmBulkAction = async () => {
    if (!bulkActionDialog.action) return;

    const status =
      bulkActionDialog.action === 'shortlist' ? 'shortlisted' : 'rejected';

    // Update applications (in real app, this would call the API)
    const updatedApplications = applications.map((app) => {
      if (
        bulkActionDialog.applications.some((bulkApp) => bulkApp.id === app.id)
      ) {
        return { ...app, status: status as 'shortlisted' | 'rejected' };
      }
      return app;
    });

    onUpdateApplications(updatedApplications);
    setBulkActionDialog({ isOpen: false, action: null, applications: [] });
  };

  const CriteriaForm = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Filter className="mr-2 h-5 w-5" />
          Screening Criteria
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="minNexusScore">Minimum Nexus Score</Label>
            <Input
              id="minNexusScore"
              type="number"
              min="0"
              max="100"
              value={criteria.minNexusScore}
              onChange={(e) =>
                setCriteria((prev) => ({
                  ...prev,
                  minNexusScore: parseInt(e.target.value) || 0,
                }))
              }
            />
          </div>

          <div>
            <Label htmlFor="minSkillsScore">Minimum Skills Score</Label>
            <Input
              id="minSkillsScore"
              type="number"
              min="0"
              max="100"
              value={criteria.minSkillsScore}
              onChange={(e) =>
                setCriteria((prev) => ({
                  ...prev,
                  minSkillsScore: parseInt(e.target.value) || 0,
                }))
              }
            />
          </div>

          <div>
            <Label htmlFor="minExperienceScore">Minimum Experience Score</Label>
            <Input
              id="minExperienceScore"
              type="number"
              min="0"
              max="100"
              value={criteria.minExperienceScore}
              onChange={(e) =>
                setCriteria((prev) => ({
                  ...prev,
                  minExperienceScore: parseInt(e.target.value) || 0,
                }))
              }
            />
          </div>

          <div>
            <Label htmlFor="minSectorScore">Minimum Sector Score</Label>
            <Input
              id="minSectorScore"
              type="number"
              min="0"
              max="100"
              value={criteria.minSectorScore}
              onChange={(e) =>
                setCriteria((prev) => ({
                  ...prev,
                  minSectorScore: parseInt(e.target.value) || 0,
                }))
              }
            />
          </div>
        </div>

        <div>
          <Label htmlFor="maxApplications">
            Maximum Applications to Review
          </Label>
          <Input
            id="maxApplications"
            type="number"
            min="1"
            max="200"
            value={criteria.maxApplicationsToReview}
            onChange={(e) =>
              setCriteria((prev) => ({
                ...prev,
                maxApplicationsToReview: parseInt(e.target.value) || 50,
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="prioritizeRecent"
              checked={criteria.prioritizeRecent}
              onCheckedChange={(checked) =>
                setCriteria((prev) => ({
                  ...prev,
                  prioritizeRecent: checked as boolean,
                }))
              }
            />
            <Label htmlFor="prioritizeRecent" className="text-sm">
              Prioritize recent applications
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="requireCoverLetter"
              checked={criteria.requireCoverLetter}
              onCheckedChange={(checked) =>
                setCriteria((prev) => ({
                  ...prev,
                  requireCoverLetter: checked as boolean,
                }))
              }
            />
            <Label htmlFor="requireCoverLetter" className="text-sm">
              Require cover letter
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ScreeningResults = () => {
    if (!screening) return null;

    const { qualified, maybeQualified, notQualified, summary } = screening;

    return (
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Qualified</p>
                  <p className="text-2xl font-bold">{summary.qualifiedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Maybe Qualified
                  </p>
                  <p className="text-2xl font-bold">
                    {summary.maybeQualifiedCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Not Qualified</p>
                  <p className="text-2xl font-bold">
                    {summary.notQualifiedCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Score</p>
                  <p className="text-2xl font-bold">
                    {summary.avgNexusScore.toFixed(0)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {summary.topSkills.map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {summary.recommendedActions.map((action, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <Zap className="mt-0.5 h-4 w-4 text-yellow-500" />
                    <p className="text-sm">{action}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Tabs */}
        <Tabs defaultValue="qualified" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="qualified"
              className="flex items-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Qualified ({qualified.length})</span>
            </TabsTrigger>
            <TabsTrigger value="maybe" className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Maybe ({maybeQualified.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="not-qualified"
              className="flex items-center space-x-2"
            >
              <XCircle className="h-4 w-4" />
              <span>Not Qualified ({notQualified.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="qualified" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Qualified Candidates</h3>
              {qualified.length > 0 && (
                <Button
                  onClick={() => handleBulkAction('shortlist', qualified)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Star className="mr-2 h-4 w-4" />
                  Shortlist All
                </Button>
              )}
            </div>
            <CandidateList applications={qualified} />
          </TabsContent>

          <TabsContent value="maybe" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Maybe Qualified Candidates
              </h3>
              {maybeQualified.length > 0 && (
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleBulkAction('shortlist', maybeQualified)
                    }
                  >
                    <Star className="mr-2 h-4 w-4" />
                    Shortlist All
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleBulkAction('reject', maybeQualified)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject All
                  </Button>
                </div>
              )}
            </div>
            <CandidateList applications={maybeQualified} />
          </TabsContent>

          <TabsContent value="not-qualified" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Not Qualified Candidates
              </h3>
              {notQualified.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => handleBulkAction('reject', notQualified)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject All
                </Button>
              )}
            </div>
            <CandidateList applications={notQualified} />
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  const CandidateList = ({ applications }: { applications: Application[] }) => {
    if (applications.length === 0) {
      return (
        <Card>
          <CardContent className="py-8 text-center">
            <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              No candidates in this category
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-2">
        {applications.map((app) => (
          <Card key={app.id} className="transition-shadow hover:shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 font-semibold text-white">
                    {app.candidate.first_name[0]}
                    {app.candidate.last_name[0]}
                  </div>
                  <div>
                    <h4 className="font-semibold">
                      {app.candidate.first_name} {app.candidate.last_name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {app.candidate.title} • {app.candidate.company}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{app.nexus_score}% Match</Badge>
                  <div className="flex space-x-1">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">
                        Skills
                      </div>
                      <div className="text-sm font-semibold">
                        {app.skills_score}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Exp</div>
                      <div className="text-sm font-semibold">
                        {app.experience_score}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">
                        Sector
                      </div>
                      <div className="text-sm font-semibold">
                        {app.sector_score}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Candidate Screening</h2>
          <p className="text-muted-foreground">
            Automatically screen and categorize candidates based on your
            criteria
          </p>
        </div>
        <Button
          onClick={performScreening}
          disabled={isScreening}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isScreening ? (
            <>
              <Brain className="mr-2 h-4 w-4 animate-pulse" />
              Screening...
            </>
          ) : (
            <>
              <Target className="mr-2 h-4 w-4" />
              Run Screening
            </>
          )}
        </Button>
      </div>

      <CriteriaForm />

      {isScreening && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            <h3 className="mb-2 text-lg font-semibold">Screening Candidates</h3>
            <p className="text-muted-foreground">
              Analyzing {applications.length} applications against your
              criteria...
            </p>
          </CardContent>
        </Card>
      )}

      {screening && <ScreeningResults />}

      {/* Bulk Action Confirmation */}
      <AlertDialog
        open={bulkActionDialog.isOpen}
        onOpenChange={(open) =>
          setBulkActionDialog((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkActionDialog.action === 'shortlist' ? 'Shortlist' : 'Reject'}{' '}
              Candidates
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {bulkActionDialog.action}{' '}
              {bulkActionDialog.applications.length} candidates? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkAction}>
              {bulkActionDialog.action === 'shortlist' ? 'Shortlist' : 'Reject'}{' '}
              All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
