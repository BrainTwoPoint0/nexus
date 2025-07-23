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
  cvData: ExtractedCVData;
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

  const formatWorkExperience = (experience: {
    startDate?: string;
    endDate?: string;
  }) => {
    const startDate = experience.startDate || 'Unknown';
    const endDate = experience.endDate || 'Present';
    return `${startDate} - ${endDate}`;
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
              <div className="flex items-center gap-2">
                <span className="font-medium">Name:</span>
                <span>
                  {cvData.firstName} {cvData.lastName}
                </span>
              </div>
            )}
            {cvData.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{cvData.email}</span>
              </div>
            )}
            {cvData.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{cvData.phone}</span>
              </div>
            )}
            {cvData.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{cvData.location}</span>
              </div>
            )}
            {cvData.linkedInUrl && (
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
            )}
            {cvData.website && (
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
            )}
          </CardContent>
        </Card>
      )}

      {/* Professional Summary */}
      {(cvData.title || cvData.summary) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Professional Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cvData.title && (
              <div>
                <span className="font-medium">Current Title:</span>
                <p className="mt-1 text-sm text-muted-foreground">
                  {cvData.title}
                </p>
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

      {/* Work Experience */}
      {cvData.workExperience && cvData.workExperience.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Work Experience ({cvData.workExperience.length} positions)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cvData.workExperience
                .slice(0, expandedSections.has('work') ? undefined : 3)
                .map((job, index) => (
                  <div
                    key={index}
                    className="space-y-2 border-l-2 border-muted pl-4"
                  >
                    <div>
                      <h4 className="font-semibold">{job.position}</h4>
                      <p className="text-sm text-muted-foreground">
                        {job.company}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatWorkExperience(job)}
                      </p>
                      {job.location && (
                        <p className="text-xs text-muted-foreground">
                          {job.location}
                        </p>
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
                          {job.achievements.map((achievement, achIndex) => (
                            <li key={achIndex} className="list-disc">
                              {achievement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}

              {cvData.workExperience.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('work')}
                >
                  {expandedSections.has('work')
                    ? 'Show Less'
                    : `Show ${cvData.workExperience.length - 3} More`}
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
