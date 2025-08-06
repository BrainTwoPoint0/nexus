'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronRight,
  User,
  Briefcase,
  GraduationCap,
  Award,
  Phone,
  Mail,
  MapPin,
  Linkedin,
  FileText,
  Lightbulb,
  Languages,
  ScrollText,
} from 'lucide-react';
import { ExtractedCVData } from '@/lib/cv-parser';

interface CVDataPreviewProps {
  cvData: ExtractedCVData;
  onContinue: () => void;
}

interface FieldStatus {
  label: string;
  status: 'complete' | 'partial' | 'missing';
  value?: string;
  icon: React.ReactNode;
}

export function CVDataPreview({ cvData, onContinue }: CVDataPreviewProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['personal'])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  // Analyze field completeness
  const analyzeFields = (): FieldStatus[] => {
    const fields: FieldStatus[] = [
      {
        label: 'Full Name',
        status:
          cvData.fullName || (cvData.firstName && cvData.lastName)
            ? 'complete'
            : cvData.firstName || cvData.lastName
              ? 'partial'
              : 'missing',
        value:
          cvData.fullName ||
          (cvData.firstName && cvData.lastName
            ? `${cvData.firstName} ${cvData.lastName}`
            : cvData.firstName || cvData.lastName),
        icon: <User className="h-4 w-4" />,
      },
      {
        label: 'Email',
        status: cvData.email ? 'complete' : 'missing',
        value: cvData.email,
        icon: <Mail className="h-4 w-4" />,
      },
      {
        label: 'Phone',
        status: cvData.phone ? 'complete' : 'missing',
        value: cvData.phone,
        icon: <Phone className="h-4 w-4" />,
      },
      {
        label: 'Location',
        status: cvData.location ? 'complete' : 'missing',
        value: cvData.location,
        icon: <MapPin className="h-4 w-4" />,
      },
      {
        label: 'LinkedIn',
        status: cvData.linkedInUrl ? 'complete' : 'missing',
        value: cvData.linkedInUrl,
        icon: <Linkedin className="h-4 w-4" />,
      },
      {
        label: 'Professional Headline',
        status: cvData.professionalBio ? 'complete' : 'missing',
        value: cvData.professionalBio,
        icon: <Briefcase className="h-4 w-4" />,
      },
      {
        label: 'Professional Summary',
        status:
          cvData.professionalBio || cvData.summary ? 'complete' : 'missing',
        value:
          cvData.professionalBio || cvData.summary ? 'Available' : undefined,
        icon: <FileText className="h-4 w-4" />,
      },
      {
        label: 'Work History',
        status:
          cvData.workHistory && cvData.workHistory.length > 0
            ? 'complete'
            : 'missing',
        value: cvData.workHistory
          ? `${cvData.workHistory.length} positions`
          : undefined,
        icon: <Briefcase className="h-4 w-4" />,
      },
      {
        label: 'Board Experience',
        status:
          cvData.boardExperience && cvData.boardExperience.length > 0
            ? 'complete'
            : 'missing',
        value: cvData.boardExperience
          ? `${cvData.boardExperience.length} roles`
          : undefined,
        icon: <Award className="h-4 w-4" />,
      },
      {
        label: 'Education',
        status:
          cvData.education && cvData.education.length > 0
            ? 'complete'
            : 'missing',
        value: cvData.education
          ? `${cvData.education.length} qualifications`
          : undefined,
        icon: <GraduationCap className="h-4 w-4" />,
      },
      {
        label: 'Skills',
        status:
          cvData.skills && cvData.skills.length > 0 ? 'complete' : 'missing',
        value: cvData.skills ? `${cvData.skills.length} skills` : undefined,
        icon: <Lightbulb className="h-4 w-4" />,
      },
      {
        label: 'Languages',
        status:
          cvData.languages && cvData.languages.length > 0
            ? 'complete'
            : 'missing',
        value: cvData.languages ? cvData.languages.join(', ') : undefined,
        icon: <Languages className="h-4 w-4" />,
      },
      {
        label: 'Certifications',
        status:
          cvData.certifications && cvData.certifications.length > 0
            ? 'complete'
            : 'missing',
        value: cvData.certifications
          ? `${cvData.certifications.length} certifications`
          : undefined,
        icon: <ScrollText className="h-4 w-4" />,
      },
    ];

    return fields;
  };

  const fields = analyzeFields();
  const completeFields = fields.filter((f) => f.status === 'complete');
  const partialFields = fields.filter((f) => f.status === 'partial');
  const missingFields = fields.filter((f) => f.status === 'missing');

  const completionPercentage = Math.round(
    (completeFields.length / fields.length) * 100
  );

  const getStatusIcon = (status: 'complete' | 'partial' | 'missing') => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'partial':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'missing':
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusBadge = (status: 'complete' | 'partial' | 'missing') => {
    switch (status) {
      case 'complete':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Complete
          </Badge>
        );
      case 'partial':
        return (
          <Badge variant="default" className="bg-yellow-100 text-yellow-800">
            Partial
          </Badge>
        );
      case 'missing':
        return <Badge variant="destructive">Missing</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header with completion status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                CV Data Extracted Successfully
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Profile completion: {completionPercentage}%
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {completionPercentage}%
              </div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-green-600 transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Summary Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Overview</CardTitle>
          <p className="text-sm text-muted-foreground">
            Key information extracted from your CV
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Essential Contact Info */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {fields
              .filter((f) =>
                ['Full Name', 'Email', 'Phone', 'Location'].includes(f.label)
              )
              .map((field, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-lg border bg-gray-50 p-3"
                >
                  {getStatusIcon(field.status)}
                  {field.icon}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {field.label}
                    </div>
                    {field.value && (
                      <div
                        className="truncate text-sm text-muted-foreground"
                        title={field.value}
                      >
                        {field.value}
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Work Experience Preview */}
      {cvData.workHistory && cvData.workHistory.length > 0 && (
        <Card>
          <CardHeader>
            <button
              onClick={() => toggleSection('work')}
              className="flex w-full items-center gap-2 text-left"
            >
              {expandedSections.has('work') ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <CardTitle>
                Work Experience ({cvData.workHistory.length} positions)
              </CardTitle>
            </button>
          </CardHeader>
          {expandedSections.has('work') && (
            <CardContent>
              <div className="space-y-4">
                {cvData.workHistory.slice(0, 3).map((job, index) => (
                  <div key={index} className="rounded-lg border bg-gray-50 p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <div className="mr-4 min-w-0 flex-1">
                        <div
                          className="truncate text-base font-semibold"
                          title={job.title}
                        >
                          {job.title}
                        </div>
                        <div
                          className="truncate text-sm font-medium text-blue-600"
                          title={job.company}
                        >
                          {job.company}
                        </div>
                      </div>
                      <div className="whitespace-nowrap text-right text-xs text-muted-foreground">
                        {job.start_date || 'Unknown'} -{' '}
                        {job.end_date ||
                          (job.is_current ? 'Present' : 'Unknown')}
                      </div>
                    </div>
                    {job.description && (
                      <div
                        className="mt-2 line-clamp-3 overflow-hidden text-sm text-gray-700"
                        title={job.description}
                      >
                        {job.description}
                      </div>
                    )}
                  </div>
                ))}
                {cvData.workHistory.length > 3 && (
                  <div className="py-2 text-center text-sm text-muted-foreground">
                    +{cvData.workHistory.length - 3} more positions
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Board Experience Preview */}
      {cvData.boardExperience && cvData.boardExperience.length > 0 && (
        <Card>
          <CardHeader>
            <button
              onClick={() => toggleSection('board')}
              className="flex w-full items-center gap-2 text-left"
            >
              {expandedSections.has('board') ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <CardTitle>
                Board Experience ({cvData.boardExperience.length} roles)
              </CardTitle>
            </button>
          </CardHeader>
          {expandedSections.has('board') && (
            <CardContent>
              <div className="space-y-4">
                {cvData.boardExperience.map((role, index) => (
                  <div key={index} className="rounded-lg border bg-blue-50 p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <div className="mr-4 min-w-0 flex-1">
                        <div
                          className="truncate text-base font-semibold text-blue-900"
                          title={role.role}
                        >
                          {role.role}
                        </div>
                        <div
                          className="truncate text-sm font-medium text-blue-700"
                          title={role.organization}
                        >
                          {role.organization}
                        </div>
                      </div>
                      <div className="whitespace-nowrap text-right text-xs text-blue-600">
                        {role.start_date || 'Unknown'} -{' '}
                        {role.end_date ||
                          (role.is_current ? 'Present' : 'Unknown')}
                      </div>
                    </div>
                    {role.key_contributions && (
                      <div
                        className="mt-2 line-clamp-3 overflow-hidden text-sm text-blue-800"
                        title={role.key_contributions}
                      >
                        {role.key_contributions}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Education Preview */}
      {cvData.education && cvData.education.length > 0 && (
        <Card>
          <CardHeader>
            <button
              onClick={() => toggleSection('education')}
              className="flex w-full items-center gap-2 text-left"
            >
              {expandedSections.has('education') ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <CardTitle>
                Education ({cvData.education.length} qualifications)
              </CardTitle>
            </button>
          </CardHeader>
          {expandedSections.has('education') && (
            <CardContent>
              <div className="space-y-3">
                {cvData.education.map((edu, index) => (
                  <div key={index} className="rounded-lg border p-3">
                    <div className="truncate font-medium" title={edu.degree}>
                      {edu.degree}
                    </div>
                    <div
                      className="truncate text-sm text-muted-foreground"
                      title={edu.institution}
                    >
                      {edu.institution}
                    </div>
                    {edu.field && (
                      <div
                        className="truncate text-sm text-muted-foreground"
                        title={edu.field}
                      >
                        {edu.field}
                      </div>
                    )}
                    {edu.endDate && (
                      <div className="text-xs text-muted-foreground">
                        {edu.endDate}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Skills Preview */}
      {cvData.skills && cvData.skills.length > 0 && (
        <Card>
          <CardHeader>
            <button
              onClick={() => toggleSection('skills')}
              className="flex w-full items-center gap-2 text-left"
            >
              {expandedSections.has('skills') ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <CardTitle>Skills ({cvData.skills.length})</CardTitle>
            </button>
          </CardHeader>
          {expandedSections.has('skills') && (
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {cvData.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Professional Summary */}
      {(cvData.professionalBio || cvData.summary) && (
        <Card>
          <CardHeader>
            <button
              onClick={() => toggleSection('summary')}
              className="flex w-full items-center gap-2 text-left"
            >
              {expandedSections.has('summary') ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <CardTitle>Professional Summary</CardTitle>
            </button>
          </CardHeader>
          {expandedSections.has('summary') && (
            <CardContent>
              <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                {cvData.professionalBio || cvData.summary}
              </p>
            </CardContent>
          )}
        </Card>
      )}

      {/* Certifications */}
      {cvData.certifications && cvData.certifications.length > 0 && (
        <Card>
          <CardHeader>
            <button
              onClick={() => toggleSection('certifications')}
              className="flex w-full items-center gap-2 text-left"
            >
              {expandedSections.has('certifications') ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <CardTitle>
                Certifications ({cvData.certifications.length})
              </CardTitle>
            </button>
          </CardHeader>
          {expandedSections.has('certifications') && (
            <CardContent>
              <div className="space-y-2">
                {cvData.certifications.map((cert, index) => (
                  <div key={index} className="rounded-lg border p-2">
                    <div className="text-sm">{cert}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Missing Information Alert */}
      {missingFields.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              Missing Information
            </CardTitle>
            <p className="text-sm text-yellow-700">
              The following information wasn't found in your CV. You can add
              these details in the next step.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {missingFields.map((field, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="border-yellow-300 text-yellow-700"
                >
                  {field.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      <div className="flex gap-4">
        <Button onClick={onContinue} className="flex-1" size="lg">
          Continue to Voice Interview
        </Button>
      </div>
    </motion.div>
  );
}
