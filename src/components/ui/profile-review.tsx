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
      className="space-y-6"
    >
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Review Your Profile
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Review and edit your information before creating your profile
              </p>
            </div>
            {completionStatus.isComplete ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="mr-1 h-3 w-3" />
                Ready to Save
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertCircle className="mr-1 h-3 w-3" />
                Missing Required Fields
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-4 w-4" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={editedData.firstName || editedData.first_name || ''}
                onChange={(e) => updateField('firstName', e.target.value)}
                placeholder="Enter your first name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={editedData.lastName || editedData.last_name || ''}
                onChange={(e) => updateField('lastName', e.target.value)}
                placeholder="Enter your last name"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={editedData.email || ''}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={editedData.phone || ''}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+44 7700 900000"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                value={editedData.location || ''}
                onChange={(e) => updateField('location', e.target.value)}
                placeholder="London, UK"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Briefcase className="h-4 w-4" />
            Professional Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="professionalHeadline">Professional Headline</Label>
            <Input
              id="professionalHeadline"
              value={editedData.professional_headline || editedData.title || ''}
              onChange={(e) =>
                updateField('professional_headline', e.target.value)
              }
              placeholder="e.g., Senior Software Engineer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Professional Bio</Label>
            <Textarea
              id="bio"
              value={editedData.professionalBio || editedData.bio || ''}
              onChange={(e) => updateField('bio', e.target.value)}
              placeholder="Tell us about your professional background and achievements..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="linkedInUrl">LinkedIn URL</Label>
              <div className="flex items-center gap-2">
                <Linkedin className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="linkedInUrl"
                  value={
                    editedData.linkedInUrl || editedData.linkedin_url || ''
                  }
                  onChange={(e) => updateField('linkedin_url', e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Personal Website</Label>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="website"
                  value={editedData.website || ''}
                  onChange={(e) => updateField('website', e.target.value)}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills & Expertise */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Briefcase className="h-4 w-4" />
            Skills & Expertise
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Skills */}
          <div className="space-y-2">
            <Label>Skills</Label>
            <div className="mb-2 flex flex-wrap gap-2">
              {editedData.skills?.map((skill: string, index: number) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {skill}
                  <button
                    onClick={() => removeArrayItem('skills', index)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add a skill"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addArrayItem('skills', newSkill);
                  }
                }}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => addArrayItem('skills', newSkill)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Languages */}
          <div className="space-y-2">
            <Label>Languages</Label>
            <div className="mb-2 flex flex-wrap gap-2">
              {editedData.languages?.map((language: string, index: number) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {language}
                  <button
                    onClick={() => removeArrayItem('languages', index)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                placeholder="Add a language (e.g., English - Native)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addArrayItem('languages', newLanguage);
                  }
                }}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => addArrayItem('languages', newLanguage)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Sectors */}
          <div className="space-y-2">
            <Label>Industry Sectors</Label>
            <div className="mb-2 flex flex-wrap gap-2">
              {editedData.sectors?.map((sector: string, index: number) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {sector}
                  <button
                    onClick={() => removeArrayItem('sectors', index)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newSector}
                onChange={(e) => setNewSector(e.target.value)}
                placeholder="Add an industry sector"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addArrayItem('sectors', newSector);
                  }
                }}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => addArrayItem('sectors', newSector)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-4 w-4" />
            Availability & Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="availability">Availability Status</Label>
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
                  <SelectItem value="immediately_available">
                    Immediately Available
                  </SelectItem>
                  <SelectItem value="available_3_months">
                    Available in 3 months
                  </SelectItem>
                  <SelectItem value="available_6_months">
                    Available in 6 months
                  </SelectItem>
                  <SelectItem value="not_available">
                    Not actively looking
                  </SelectItem>
                  <SelectItem value="by_arrangement">By arrangement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remote">Remote Work Preference</Label>
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
                  <SelectItem value="no">On-site only</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="full">Fully remote</SelectItem>
                  <SelectItem value="occasional">Occasional remote</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="minComp">Minimum Compensation (Optional)</Label>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
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
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxComp">Maximum Compensation (Optional)</Label>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
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
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        {onBack && (
          <Button variant="outline" onClick={onBack} disabled={isLoading}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={isLoading || !completionStatus.isComplete}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Profile
            </>
          )}
        </Button>
      </div>

      {/* Missing Fields Alert */}
      {!completionStatus.isComplete && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">
                  Missing Required Fields
                </p>
                <p className="text-sm text-muted-foreground">
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
