'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  User,
  Briefcase,
  GraduationCap,
  Award,
  Globe,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { ExtractedCVData } from '@/lib/cv-parser';

interface CVDataReviewProps {
  cvData: ExtractedCVData & Record<string, any>; // Allow additional fields from merging
  confidence: number;
  filePath: string;
  onApprove: () => void;
  onReject: () => void;
  isApplying?: boolean;
}

export function CVDataReview({
  cvData,
  confidence,
  filePath,
  onApprove,
  onReject,
  isApplying = false,
}: CVDataReviewProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );

  // Handle case where cvData is null/undefined
  if (!cvData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No CV data available to review.
          </p>
        </CardContent>
      </Card>
    );
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const formatWorkExperience = (experience: any) => {
    console.log('🔍 Formatting work experience:', experience);

    // Try multiple possible field names for dates
    const startDate =
      experience.start_date ||
      experience.startDate ||
      experience.from ||
      experience.startYear;
    const endDate =
      experience.end_date ||
      experience.endDate ||
      experience.to ||
      experience.endYear;

    // Check if current position
    const isCurrent =
      experience.is_current === true ||
      (typeof experience.is_current === 'string' &&
        experience.is_current.toLowerCase() === 'true') ||
      endDate === null ||
      endDate === 'Present' ||
      endDate === 'Current';

    // If we have valid dates, format them
    if (startDate && startDate !== 'Unknown' && startDate !== null) {
      const end =
        !isCurrent && endDate && endDate !== 'Unknown' && endDate !== null
          ? endDate
          : 'Present';
      return `${startDate} - ${end}`;
    }

    // If we still have 'Unknown', try to use the period field
    if (experience.period) {
      return experience.period;
    }

    // Try to extract dates from other fields
    if (experience.duration) {
      return experience.duration;
    }

    // Last resort - check if there are any date-like patterns in the object
    const datePattern = /(\d{4}|\w{3}\s\d{4}|\w+\s\d{4})/;
    const allValues = Object.values(experience).join(' ');
    const dateMatches = allValues.match(new RegExp(datePattern, 'g'));

    if (dateMatches && dateMatches.length >= 2) {
      return `${dateMatches[0]} - ${dateMatches[1]}`;
    } else if (dateMatches && dateMatches.length === 1) {
      return `${dateMatches[0]} - Present`;
    }

    // Final fallback
    return 'Not provided';
  };

  const formatEducation = (education: {
    startDate?: string;
    endDate?: string;
  }) => {
    const startDate = education.startDate || '';
    const endDate = education.endDate || '';
    const dateRange = startDate && endDate ? `${startDate} - ${endDate}` : '';
    return dateRange;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            CV Data Extracted Successfully
          </CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Confidence: {(confidence * 100).toFixed(1)}%</span>
            <span>•</span>
            <span>File: {filePath.split('/').pop()}</span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Review the information extracted from your CV below. This data will
            be added to your profile, filling in any missing fields without
            overwriting existing information.
          </p>
        </CardContent>
      </Card>

      {/* Personal Information */}
      {(cvData.firstName ||
        cvData.lastName ||
        cvData.email ||
        cvData.phone ||
        cvData.location) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(cvData.firstName || cvData.lastName) && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Full Name
                  </span>
                  <Badge variant="outline" className="text-sm">
                    CV
                  </Badge>
                </div>
                <div className="font-medium">
                  {cvData.firstName} {cvData.lastName}
                </div>
              </>
            )}
            {cvData.email && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <Badge variant="outline" className="text-sm">
                    CV
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{cvData.email}</span>
                </div>
              </>
            )}
            {cvData.phone && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Phone</span>
                  <Badge variant="outline" className="text-sm">
                    CV
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{cvData.phone}</span>
                </div>
              </>
            )}
            {cvData.location && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Location
                  </span>
                  <Badge variant="outline" className="text-sm">
                    CV
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{cvData.location}</span>
                </div>
              </>
            )}
            {cvData.linkedInUrl && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    LinkedIn
                  </span>
                  <Badge variant="outline" className="text-sm">
                    CV
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={cvData.linkedInUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    LinkedIn Profile
                  </a>
                </div>
              </>
            )}
            {cvData.website && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Website</span>
                  <Badge variant="outline" className="text-sm">
                    CV
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={cvData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {cvData.website}
                  </a>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Professional Summary */}
      {(cvData.title ||
        cvData.currentRole ||
        cvData.currentCompany ||
        cvData.summary) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Professional Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(cvData.currentRole || cvData.title) && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Current Role
                </span>
                <Badge variant="outline" className="text-sm">
                  CV
                </Badge>
                <span className="font-medium">
                  {cvData.currentRole || cvData.title}
                </span>
              </div>
            )}
            {cvData.currentCompany && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Current Company
                </span>
                <Badge variant="outline" className="text-sm">
                  CV
                </Badge>
                <span className="font-medium">{cvData.currentCompany}</span>
              </div>
            )}
            {cvData.summary && (
              <div>
                <span className="font-medium">Summary:</span>
                <p className="mt-1 text-sm text-muted-foreground">
                  {cvData.summary}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Professional Bio */}
      {cvData.professionalBio && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Professional Bio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Professional Bio
                </span>
                <Badge variant="outline" className="text-sm">
                  CV
                </Badge>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-sm leading-relaxed text-green-800">
                  {cvData.professionalBio}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                ✨ This professional bio was automatically generated from your
                CV content and will be added to your profile.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Work Experience */}
      {(cvData.workExperience || cvData.workHistory || cvData.work_history) &&
        ((cvData.workExperience?.length || 0) > 0 ||
          (cvData.workHistory?.length || 0) > 0 ||
          (cvData.work_history?.length || 0) > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Work Experience (
                {(
                  (cvData.workExperience ||
                    cvData.workHistory ||
                    cvData.work_history) as any[]
                )?.length || 0}{' '}
                positions)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(() => {
                  const workData =
                    cvData.workExperience ||
                    cvData.workHistory ||
                    cvData.work_history ||
                    [];
                  console.log('🔍 Work experience data to display:', workData);
                  return workData;
                })()
                  .slice(0, expandedSections.has('work') ? undefined : 3)
                  .map((job: any, index: number) => (
                    <div
                      key={index}
                      className="space-y-2 border-l-2 border-muted pl-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            Job Title
                          </span>
                          <Badge variant="outline" className="text-sm">
                            CV
                          </Badge>
                        </div>
                        <h4 className="font-semibold">
                          {job.position || job.title || job.role}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            Company
                          </span>
                          <Badge variant="outline" className="text-sm">
                            CV
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {job.company || job.organization || job.employer}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            Start Date
                          </span>
                          <Badge variant="outline" className="text-sm">
                            CV
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {job.start_date || job.startDate || 'Not provided'}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            End Date
                          </span>
                          <Badge variant="outline" className="text-sm">
                            CV
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {job.end_date || job.endDate || 'Not provided'}
                        </p>
                        {(job.location || job.city) && (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                Location
                              </span>
                              <Badge variant="outline" className="text-sm">
                                CV
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {job.location || job.city}
                            </p>
                          </>
                        )}
                      </div>
                      {job.description && (
                        <p className="text-sm">{job.description}</p>
                      )}
                      {job.achievements && job.achievements.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-sm font-medium">
                            Key Achievements:
                          </span>
                          <ul className="ml-4 space-y-1 text-sm text-muted-foreground">
                            {job.achievements.map(
                              (achievement: any, achIndex: number) => (
                                <li key={achIndex} className="list-disc">
                                  {achievement}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}

                {((
                  (cvData.workExperience ||
                    cvData.workHistory ||
                    cvData.work_history) as any[]
                )?.length || 0) > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection('work')}
                  >
                    {expandedSections.has('work')
                      ? 'Show Less'
                      : `Show ${(((cvData.workExperience || cvData.workHistory || cvData.work_history) as any[])?.length || 0) - 3} More`}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Board Experience */}
      {cvData.boardExperience && cvData.boardExperience.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Board Experience ({cvData.boardExperience.length} roles)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cvData.boardExperience
                .slice(0, expandedSections.has('board') ? undefined : 3)
                .map((board: any, index: number) => (
                  <div
                    key={index}
                    className="space-y-2 border-l-2 border-muted pl-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Board Role
                        </span>
                        <Badge variant="outline" className="text-sm">
                          CV
                        </Badge>
                      </div>
                      <h4 className="font-semibold">{board.role}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Organization
                        </span>
                        <Badge variant="outline" className="text-sm">
                          CV
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {board.organization}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Start Date
                        </span>
                        <Badge variant="outline" className="text-sm">
                          CV
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {board.start_date || 'Not provided'}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          End Date
                        </span>
                        <Badge variant="outline" className="text-sm">
                          CV
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {board.end_date || 'Not provided'}
                      </p>
                    </div>
                    {board.key_contributions && (
                      <div>
                        <span className="text-sm font-medium">
                          Key Contributions:
                        </span>
                        <p className="text-sm text-muted-foreground">
                          {board.key_contributions}
                        </p>
                      </div>
                    )}
                  </div>
                ))}

              {cvData.boardExperience.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('board')}
                >
                  {expandedSections.has('board')
                    ? 'Show Less'
                    : `Show ${cvData.boardExperience.length - 3} More`}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Education */}
      {cvData.education && cvData.education.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Education ({cvData.education.length} entries)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cvData.education.map((edu, index) => (
                <div key={index} className="space-y-2">
                  <div>
                    <h4 className="font-semibold">{edu.degree}</h4>
                    <p className="text-sm text-muted-foreground">
                      {edu.institution}
                    </p>
                    {edu.field && (
                      <p className="text-sm text-muted-foreground">
                        Field: {edu.field}
                      </p>
                    )}
                    {formatEducation(edu) && (
                      <p className="text-xs text-muted-foreground">
                        {formatEducation(edu)}
                      </p>
                    )}
                    {edu.gpa && (
                      <p className="text-xs text-muted-foreground">
                        GPA: {edu.gpa}
                      </p>
                    )}
                  </div>
                  {edu.achievements && edu.achievements.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-sm font-medium">Achievements:</span>
                      <div className="flex flex-wrap gap-1">
                        {edu.achievements.map((achievement, achIndex) => (
                          <Badge
                            key={achIndex}
                            variant="secondary"
                            className="text-xs"
                          >
                            {achievement}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skills & Additional Info */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Skills */}
        {cvData.skills && cvData.skills.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Skills ({cvData.skills.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {cvData.skills.map((skill, index) => (
                  <Badge key={index} variant="outline">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Languages */}
        {cvData.languages && cvData.languages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Languages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {cvData.languages.map((language, index) => (
                  <Badge key={index} variant="secondary">
                    {typeof language === 'string'
                      ? language
                      : typeof language === 'object' && language !== null
                        ? `${(language as Record<string, unknown>).language || language}${(language as Record<string, unknown>).proficiency ? ` (${(language as Record<string, unknown>).proficiency})` : ''}`
                        : String(language)}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Certifications */}
        {cvData.certifications && cvData.certifications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Certifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {cvData.certifications.map((cert, index) => (
                  <p key={index} className="text-sm">
                    {cert}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Achievements */}
        {cvData.achievements && cvData.achievements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {cvData.achievements.map((achievement, index) => (
                  <p key={index} className="text-sm">
                    {achievement}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Button
              onClick={onApprove}
              disabled={isApplying}
              className="flex-1"
            >
              {isApplying ? 'Applying...' : 'Apply to Profile'}
            </Button>
            <Button variant="outline" onClick={onReject} disabled={isApplying}>
              Cancel
            </Button>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            This will only fill in missing fields in your profile. Existing data
            will not be overwritten.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
