'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Edit3,
  Save,
  X,
  Plus,
  Trash2,
  User,
  Briefcase,
  Award,
  AlertTriangle,
} from 'lucide-react';
import { ExtractedCVData } from '@/lib/cv-parser-robust';
import {
  FieldSuggestionEngine,
  QuickFillPatterns,
} from '@/lib/field-suggestions';

interface CVDataReviewEditableProps {
  cvData: ExtractedCVData & Record<string, any>;
  onSave: (updatedData: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface EditingField {
  section: string;
  field: string;
  index?: number;
}

export function CVDataReviewEditable({
  cvData,
  onSave,
  onCancel,
  isLoading = false,
}: CVDataReviewEditableProps) {
  const [editedData, setEditedData] = useState<any>({ ...cvData });
  const [editingField, setEditingField] = useState<EditingField | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Track data sources
  const getFieldSource = (_fieldName: string): 'cv' | 'manual' => {
    return 'cv'; // Default to CV source
  };

  const getSourceBadge = (source: 'cv' | 'manual') => {
    switch (source) {
      case 'cv':
        return (
          <Badge variant="outline" className="bg-blue-50 text-xs text-blue-700">
            CV
          </Badge>
        );
      case 'manual':
        return (
          <Badge
            variant="outline"
            className="bg-purple-50 text-xs text-purple-700"
          >
            Manual
          </Badge>
        );
    }
  };

  const updateField = (
    section: string,
    field: string,
    value: any,
    index?: number
  ) => {
    const newData = { ...editedData };

    if (index !== undefined && Array.isArray(newData[section])) {
      newData[section][index][field] = value;
    } else if (section === 'personal') {
      newData[field] = value;
    } else {
      if (!newData[section]) newData[section] = {};
      newData[section][field] = value;
    }

    setEditedData(newData);
    setHasChanges(true);
  };

  const addArrayItem = (section: string, newItem: any) => {
    const newData = { ...editedData };
    if (!newData[section]) newData[section] = [];
    newData[section].push(newItem);
    setEditedData(newData);
    setHasChanges(true);
  };

  const removeArrayItem = (section: string, index: number) => {
    const newData = { ...editedData };
    if (newData[section] && Array.isArray(newData[section])) {
      newData[section].splice(index, 1);
      setEditedData(newData);
      setHasChanges(true);
    }
  };

  const startEditing = (section: string, field: string, index?: number) => {
    setEditingField({ section, field, index });
  };

  const stopEditing = () => {
    setEditingField(null);
  };

  const isEditing = (section: string, field: string, index?: number) => {
    return (
      editingField?.section === section &&
      editingField?.field === field &&
      editingField?.index === index
    );
  };

  const EditableField = ({
    section,
    field,
    value,
    label,
    type = 'text',
    index,
    multiline = false,
  }: {
    section: string;
    field: string;
    value: any;
    label: string;
    type?: string;
    index?: number;
    multiline?: boolean;
  }) => {
    const source = getFieldSource(field);

    // Generate suggestions for empty or incomplete fields
    const suggestions =
      !value || value.trim() === ''
        ? FieldSuggestionEngine.generateSuggestions({
            cvData: editedData,
            fieldName: field,
            section,
            index,
          })
        : [];

    if (isEditing(section, field, index)) {
      return (
        <div className="space-y-2">
          <Label>{label}</Label>
          <div className="flex gap-2">
            {multiline ? (
              <Textarea
                value={value || ''}
                onChange={(e) =>
                  updateField(section, field, e.target.value, index)
                }
                className="flex-1"
                rows={3}
                placeholder={
                  suggestions.length > 0
                    ? `Suggestion: ${suggestions[0].suggestion}`
                    : ''
                }
              />
            ) : (
              <Input
                type={type}
                value={value || ''}
                onChange={(e) =>
                  updateField(section, field, e.target.value, index)
                }
                className="flex-1"
                placeholder={
                  suggestions.length > 0
                    ? `Suggestion: ${suggestions[0].suggestion}`
                    : ''
                }
              />
            )}
            <Button size="sm" onClick={stopEditing} className="px-2">
              <Save className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                stopEditing();
                // Reset to original value if needed
              }}
              className="px-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* AI Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">
                AI Suggestions:
              </div>
              <div className="space-y-1">
                {suggestions.slice(0, 3).map((suggestion, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateField(
                          section,
                          field,
                          suggestion.suggestion,
                          index
                        )
                      }
                      className="h-7 px-2 text-xs"
                    >
                      Use: "{suggestion.suggestion}"
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      ({Math.round(suggestion.confidence * 100)}% confidence)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Fill Patterns for Date Fields */}
          {type === 'text' &&
            (field.includes('Date') || field.includes('date')) && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">
                  Quick Fill:
                </div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(QuickFillPatterns.dates).map(
                    ([key, dateValue]) => (
                      <Button
                        key={key}
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateField(section, field, dateValue, index)
                        }
                        className="h-6 px-2 text-xs"
                      >
                        {dateValue}
                      </Button>
                    )
                  )}
                </div>
              </div>
            )}
        </div>
      );
    }

    return (
      <div className="group flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <Label className="text-sm font-medium">{label}</Label>
            {getSourceBadge(source)}
            {suggestions.length > 0 && (
              <Badge
                variant="outline"
                className="border-yellow-200 bg-yellow-50 text-xs text-yellow-700"
              >
                <AlertTriangle className="mr-1 h-3 w-3" />
                AI Suggestion Available
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {value || (
              <span className="italic text-gray-400">
                Not provided
                {suggestions.length > 0 && (
                  <span className="text-blue-600">
                    {' '}
                    • Click to see AI suggestions
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => startEditing(section, field, index)}
          className="px-2 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <Edit3 className="h-3 w-3" />
        </Button>
      </div>
    );
  };

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
                <Edit3 className="h-5 w-5 text-blue-600" />
                Review & Edit Your Profile
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Click any field to edit. Changes will be highlighted.
              </p>
            </div>
            {hasChanges && (
              <Badge className="bg-orange-100 text-orange-800">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Unsaved Changes
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <EditableField
              section="personal"
              field="fullName"
              value={
                editedData.fullName ||
                (editedData.firstName && editedData.lastName
                  ? `${editedData.firstName} ${editedData.lastName}`
                  : editedData.firstName || editedData.lastName)
              }
              label="Full Name"
            />
            <EditableField
              section="personal"
              field="email"
              value={editedData.email}
              label="Email"
              type="email"
            />
            <EditableField
              section="personal"
              field="phone"
              value={editedData.phone}
              label="Phone"
              type="tel"
            />
            <EditableField
              section="personal"
              field="location"
              value={editedData.location}
              label="Location"
            />
          </div>
        </CardContent>
      </Card>

      {/* Professional Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Professional Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <EditableField
            section="professional"
            field="currentRole"
            value={
              editedData.currentRole ||
              editedData.workHistory?.find((job: any) => job.isCurrent)
                ?.title ||
              editedData.title
            }
            label="Current Role"
          />
          <EditableField
            section="professional"
            field="currentCompany"
            value={
              editedData.currentCompany ||
              editedData.workHistory?.find((job: any) => job.isCurrent)?.company
            }
            label="Current Company"
          />
          <EditableField
            section="professional"
            field="professionalBio"
            value={editedData.professionalBio}
            label="Professional Bio"
            multiline
          />
        </CardContent>
      </Card>

      {/* Work Experience */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Work Experience ({editedData.workHistory?.length || 0})
            </CardTitle>
            <Button
              size="sm"
              onClick={() =>
                addArrayItem('workHistory', {
                  title: '',
                  company: '',
                  startDate: '',
                  endDate: '',
                  isCurrent: false,
                  description: '',
                })
              }
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Position
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {editedData.workHistory && editedData.workHistory.length > 0 ? (
            <div className="space-y-6">
              {editedData.workHistory.map((job: any, index: number) => (
                <div key={index} className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium">Position {index + 1}</h4>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeArrayItem('workHistory', index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <EditableField
                      section="workHistory"
                      field="title"
                      value={job.title}
                      label="Job Title"
                      index={index}
                    />
                    <EditableField
                      section="workHistory"
                      field="company"
                      value={job.company}
                      label="Company"
                      index={index}
                    />
                    <EditableField
                      section="workHistory"
                      field="startDate"
                      value={job.startDate}
                      label="Start Date"
                      index={index}
                    />
                    <EditableField
                      section="workHistory"
                      field="endDate"
                      value={job.endDate}
                      label="End Date"
                      index={index}
                    />
                  </div>

                  <EditableField
                    section="workHistory"
                    field="description"
                    value={job.description}
                    label="Description"
                    index={index}
                    multiline
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Briefcase className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p>No work experience added</p>
              <Button
                className="mt-2"
                onClick={() =>
                  addArrayItem('workHistory', {
                    title: '',
                    company: '',
                    startDate: '',
                    endDate: '',
                    isCurrent: false,
                    description: '',
                  })
                }
              >
                Add First Position
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Board Experience */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Board Experience ({editedData.boardExperience?.length || 0})
            </CardTitle>
            <Button
              size="sm"
              onClick={() =>
                addArrayItem('boardExperience', {
                  role: '',
                  organization: '',
                  startDate: '',
                  endDate: '',
                  isCurrent: false,
                  description: '',
                })
              }
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Board Role
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {editedData.boardExperience &&
          editedData.boardExperience.length > 0 ? (
            <div className="space-y-6">
              {editedData.boardExperience.map((role: any, index: number) => (
                <div
                  key={index}
                  className="space-y-4 rounded-lg border bg-blue-50 p-4"
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium">Board Role {index + 1}</h4>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeArrayItem('boardExperience', index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <EditableField
                      section="boardExperience"
                      field="role"
                      value={role.role}
                      label="Board Role"
                      index={index}
                    />
                    <EditableField
                      section="boardExperience"
                      field="organization"
                      value={role.organization}
                      label="Organization"
                      index={index}
                    />
                    <EditableField
                      section="boardExperience"
                      field="startDate"
                      value={role.startDate}
                      label="Start Date"
                      index={index}
                    />
                    <EditableField
                      section="boardExperience"
                      field="endDate"
                      value={role.endDate}
                      label="End Date"
                      index={index}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Award className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p>No board experience added</p>
              <Button
                className="mt-2"
                onClick={() =>
                  addArrayItem('boardExperience', {
                    role: '',
                    organization: '',
                    startDate: '',
                    endDate: '',
                    isCurrent: false,
                    description: '',
                  })
                }
              >
                Add First Board Role
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 border-t pt-6">
        <Button
          onClick={onCancel}
          variant="outline"
          size="lg"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          onClick={() => onSave(editedData)}
          size="lg"
          className="flex-1"
          disabled={isLoading || !hasChanges}
        >
          {isLoading ? (
            <>Saving...</>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Profile ({hasChanges ? 'with changes' : 'no changes'})
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
