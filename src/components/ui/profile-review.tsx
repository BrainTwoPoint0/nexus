'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Save,
  ArrowLeft,
  User,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Linkedin,
  Globe,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  X,
  Plus,
} from 'lucide-react';
import { logger } from '@/lib/logger';
import {
  AVAILABILITY_STATUS_LABELS,
  REMOTE_WORK_LABELS,
  AvailabilityStatus,
  RemoteWorkPreference,
} from '@/lib/enums';

interface ProfileReviewProps {
  profileData: any;
  onSave: (updatedData: any) => void;
  onBack?: () => void;
  isLoading?: boolean;
}

export function ProfileReview({
  profileData,
  onSave,
  onBack,
  isLoading = false,
}: ProfileReviewProps) {
  const [editedData, setEditedData] = useState(() => ({
    ...profileData,
    skills: profileData.skills || [],
    languages: profileData.languages || [],
    sectors: profileData.sectors || [],
  }));
  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newSector, setNewSector] = useState('');

  const updateField = (field: string, value: any) => {
    setEditedData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addArrayItem = (
    field: 'skills' | 'languages' | 'sectors',
    value: string
  ) => {
    if (value.trim()) {
      updateField(field, [...(editedData[field] || []), value.trim()]);
      if (field === 'skills') setNewSkill('');
      if (field === 'languages') setNewLanguage('');
      if (field === 'sectors') setNewSector('');
    }
  };

  const removeArrayItem = (
    field: 'skills' | 'languages' | 'sectors',
    index: number
  ) => {
    updateField(
      field,
      editedData[field].filter((_: any, i: number) => i !== index)
    );
  };

  const handleSave = () => {
    logger.info(
      'Profile review: Save clicked',
      {
        originalKeys: Object.keys(profileData),
        editedKeys: Object.keys(editedData),
        changes: Object.keys(editedData).filter(
          (key) =>
            JSON.stringify(editedData[key]) !== JSON.stringify(profileData[key])
        ),
      },
      'PROFILE_REVIEW'
    );

    onSave(editedData);
  };

  const getCompletionStatus = () => {
    const requiredFields = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'location',
    ];
    const missingRequired = requiredFields.filter(
      (field) => !editedData[field]
    );

    const enhancedFields = [
      'linkedInUrl',
      'skills',
      'sectors',
      'availability_status',
      'remote_work_preference',
    ];
    const filledEnhanced = enhancedFields.filter((field) => {
      const value = editedData[field];
      return value && (Array.isArray(value) ? value.length > 0 : true);
    });

    return {
      isComplete: missingRequired.length === 0,
      missingRequired,
      enhancedCompletion: (filledEnhanced.length / enhancedFields.length) * 100,
    };
  };

  const completionStatus = getCompletionStatus();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 sm:space-y-6"
    >
      {/* Basic Information */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <User className="h-4 w-4" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="firstName" className="text-sm">
                First Name *
              </Label>
              <Input
                id="firstName"
                value={editedData.firstName || editedData.first_name || ''}
                onChange={(e) => updateField('firstName', e.target.value)}
                placeholder="Enter your first name"
                required
              />
            </div>
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="lastName" className="text-sm">
                Last Name *
              </Label>
              <Input
                id="lastName"
                value={editedData.lastName || editedData.last_name || ''}
                onChange={(e) => updateField('lastName', e.target.value)}
                placeholder="Enter your last name"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
            <div className="space-y-1 sm:space-y-2">
              <Label
                htmlFor="email"
                className="flex items-center gap-2 text-sm"
              >
                <Mail className="h-3 w-3 text-muted-foreground sm:hidden" />
                Email *
              </Label>
              <div className="flex items-center gap-2">
                <Mail className="hidden h-3 w-3 text-muted-foreground sm:flex sm:h-4 sm:w-4" />
                <Input
                  id="email"
                  type="email"
                  value={editedData.email || ''}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="your@email.com"
                  required
                  className={editedData.email ? '' : 'sm:ml-0'}
                />
              </div>
            </div>
            <div className="space-y-1 sm:space-y-2">
              <Label
                htmlFor="phone"
                className="flex items-center gap-2 text-sm"
              >
                <Phone className="h-3 w-3 text-muted-foreground sm:hidden" />
                Phone *
              </Label>
              <div className="flex items-center gap-2">
                <Phone className="hidden h-3 w-3 text-muted-foreground sm:flex sm:h-4 sm:w-4" />
                <Input
                  id="phone"
                  type="tel"
                  value={editedData.phone || ''}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+44 7700 900000"
                  required
                  className={editedData.phone ? '' : 'sm:ml-0'}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1 sm:space-y-2">
            <Label
              htmlFor="location"
              className="flex items-center gap-2 text-sm"
            >
              <MapPin className="h-3 w-3 text-muted-foreground sm:hidden" />
              Location *
            </Label>
            <div className="flex items-center gap-2">
              <MapPin className="hidden h-3 w-3 text-muted-foreground sm:flex sm:h-4 sm:w-4" />
              <Input
                id="location"
                value={editedData.location || ''}
                onChange={(e) => updateField('location', e.target.value)}
                placeholder="London, UK"
                required
                className={editedData.location ? '' : 'sm:ml-0'}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Information */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Briefcase className="h-4 w-4" />
            Professional Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="professionalHeadline" className="text-sm">
              Professional Headline
            </Label>
            <Input
              id="professionalHeadline"
              value={editedData.professional_headline || editedData.title || ''}
              onChange={(e) =>
                updateField('professional_headline', e.target.value)
              }
              placeholder="e.g., Senior Software Engineer"
            />
          </div>

          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="bio" className="text-sm">
              Professional Bio
            </Label>
            <Textarea
              id="bio"
              value={editedData.professionalBio || editedData.bio || ''}
              onChange={(e) => updateField('bio', e.target.value)}
              placeholder="Tell us about your professional background and achievements..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
            <div className="space-y-1 sm:space-y-2">
              <Label
                htmlFor="linkedInUrl"
                className="flex items-center gap-2 text-sm"
              >
                <Linkedin className="h-3 w-3 text-muted-foreground sm:hidden" />
                LinkedIn URL
              </Label>
              <div className="flex items-center gap-2">
                <Linkedin className="hidden h-3 w-3 text-muted-foreground sm:flex sm:h-4 sm:w-4" />
                <Input
                  id="linkedInUrl"
                  value={
                    editedData.linkedInUrl || editedData.linkedin_url || ''
                  }
                  onChange={(e) => updateField('linkedin_url', e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className={
                    editedData.linkedInUrl || editedData.linkedin_url
                      ? ''
                      : 'sm:ml-0'
                  }
                />
              </div>
            </div>
            <div className="space-y-1 sm:space-y-2">
              <Label
                htmlFor="website"
                className="flex items-center gap-2 text-sm"
              >
                <Globe className="h-3 w-3 text-muted-foreground sm:hidden" />
                Personal Website
              </Label>
              <div className="flex items-center gap-2">
                <Globe className="hidden h-3 w-3 text-muted-foreground sm:flex sm:h-4 sm:w-4" />
                <Input
                  id="website"
                  value={editedData.website || ''}
                  onChange={(e) => updateField('website', e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className={editedData.website ? '' : 'sm:ml-0'}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills & Expertise */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Briefcase className="h-4 w-4" />
            Skills & Expertise
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          {/* Skills */}
          <div className="space-y-1 sm:space-y-2">
            <Label className="text-sm">Skills</Label>
            <div className="mb-2 flex flex-wrap gap-1 sm:gap-2">
              {editedData.skills?.map((skill: string, index: number) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex min-w-0 items-center px-1.5 py-0.5 text-xs"
                >
                  <span className="max-w-[100px] truncate sm:max-w-[120px]">
                    {skill}
                  </span>
                  <button
                    onClick={() => removeArrayItem('skills', index)}
                    className="ml-2 flex-shrink-0 hover:text-destructive"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Add a skill (press Enter)"
              className="text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addArrayItem('skills', newSkill);
                }
              }}
            />
          </div>

          {/* Languages */}
          <div className="space-y-1 sm:space-y-2">
            <Label className="text-sm">Languages</Label>
            <div className="mb-2 flex flex-wrap gap-1 sm:gap-2">
              {editedData.languages?.map((language: string, index: number) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex min-w-0 items-center px-1.5 py-0.5 text-xs"
                >
                  <span className="max-w-[100px] truncate sm:max-w-[120px]">
                    {language}
                  </span>
                  <button
                    onClick={() => removeArrayItem('languages', index)}
                    className="ml-2 flex-shrink-0 hover:text-destructive"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
            <Input
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              placeholder="Add a language (press Enter)"
              className="text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addArrayItem('languages', newLanguage);
                }
              }}
            />
          </div>

          {/* Sectors */}
          <div className="space-y-1 sm:space-y-2">
            <Label className="text-sm">Industry Sectors</Label>
            <div className="mb-2 flex flex-wrap gap-1 sm:gap-2">
              {editedData.sectors?.map((sector: string, index: number) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex min-w-0 items-center px-1.5 py-0.5 text-xs"
                >
                  <span className="max-w-[100px] truncate sm:max-w-[120px]">
                    {sector}
                  </span>
                  <button
                    onClick={() => removeArrayItem('sectors', index)}
                    className="ml-2 flex-shrink-0 hover:text-destructive"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
            <Input
              value={newSector}
              onChange={(e) => setNewSector(e.target.value)}
              placeholder="Add an industry sector (press Enter)"
              className="text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addArrayItem('sectors', newSector);
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calendar className="h-4 w-4" />
            Availability & Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="availability" className="text-sm">
                Availability Status
              </Label>
              <Select
                value={editedData.availability_status || ''}
                onValueChange={(value) =>
                  updateField('availability_status', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select availability" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(AVAILABILITY_STATUS_LABELS).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="remote" className="text-sm">
                Remote Work Preference
              </Label>
              <Select
                value={editedData.remote_work_preference || ''}
                onValueChange={(value) =>
                  updateField('remote_work_preference', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select preference" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REMOTE_WORK_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
            <div className="space-y-1 sm:space-y-2">
              <Label
                htmlFor="minComp"
                className="flex items-center gap-2 text-sm"
              >
                <DollarSign className="h-3 w-3 text-muted-foreground sm:hidden" />
                Min Compensation
              </Label>
              <div className="flex items-center gap-2">
                <DollarSign className="hidden h-3 w-3 text-muted-foreground sm:flex sm:h-4 sm:w-4" />
                <Input
                  id="minComp"
                  type="number"
                  value={editedData.compensation_expectation_min || ''}
                  onChange={(e) =>
                    updateField(
                      'compensation_expectation_min',
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  placeholder="e.g., 100000"
                  className={
                    editedData.compensation_expectation_min ? '' : 'sm:ml-0'
                  }
                />
              </div>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <Label
                htmlFor="maxComp"
                className="flex items-center gap-2 text-sm"
              >
                <DollarSign className="h-3 w-3 text-muted-foreground sm:hidden" />
                Max Compensation
              </Label>
              <div className="flex items-center gap-2">
                <DollarSign className="hidden h-3 w-3 text-muted-foreground sm:flex sm:h-4 sm:w-4" />
                <Input
                  id="maxComp"
                  type="number"
                  value={editedData.compensation_expectation_max || ''}
                  onChange={(e) =>
                    updateField(
                      'compensation_expectation_max',
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  placeholder="e.g., 150000"
                  className={
                    editedData.compensation_expectation_max ? '' : 'sm:ml-0'
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 sm:gap-4">
        {onBack && (
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isLoading}
            className="px-3 sm:px-4"
          >
            <ArrowLeft className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-sm">Back</span>
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={isLoading || !completionStatus.isComplete}
          className="flex-1 px-3 sm:px-4"
        >
          {isLoading ? (
            <>
              <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-background border-t-transparent sm:h-4 sm:w-4" />
              <span className="text-sm">Saving...</span>
            </>
          ) : (
            <>
              <Save className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-sm">Save Profile</span>
            </>
          )}
        </Button>
      </div>

      {/* Missing Fields Alert */}
      {!completionStatus.isComplete && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-start gap-2 sm:gap-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-destructive sm:h-5 sm:w-5" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-destructive sm:text-base">
                  Missing Required Fields
                </p>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Please fill in: {completionStatus.missingRequired.join(', ')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
