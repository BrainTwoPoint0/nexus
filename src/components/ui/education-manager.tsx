'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Edit,
  Trash2,
  GraduationCap,
  Calendar,
  MapPin,
  Award,
  BookOpen,
} from 'lucide-react';

interface Education {
  id: string;
  institution_name: string;
  institution_country: string | null;
  degree_type: string;
  degree_name: string | null;
  field_of_study: string | null;
  specialization: string | null;
  grade_classification: string | null;
  gpa: number | null;
  start_year: number | null;
  graduation_year: number | null;
  is_ongoing: boolean;
  thesis_title: string | null;
  honors_awards: string[] | null;
  relevant_coursework: string[] | null;
  extracurricular_activities: string[] | null;
}

interface EducationManagerProps {
  education: Education[];
  onUpdate: (education: Education[]) => void;
  isEditing: boolean;
}

const DEGREE_TYPES = [
  "Bachelor's Degree",
  "Master's Degree",
  'Doctoral Degree',
  'Professional Degree',
  'Associate Degree',
  'Certificate',
  'Diploma',
  'Professional Qualification',
];


const FIELDS_OF_STUDY = [
  'Business Administration',
  'Finance',
  'Accounting',
  'Economics',
  'Law',
  'Computer Science',
  'Engineering',
  'Medicine',
  'Marketing',
  'Management',
  'International Business',
  'Public Administration',
  'Psychology',
  'Education',
  'Liberal Arts',
  'Other',
];

export function EducationManager({
  education,
  onUpdate,
  isEditing,
}: EducationManagerProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEducation, setEditingEducation] = useState<Education | null>(
    null
  );
  const [formData, setFormData] = useState<Partial<Education>>({
    institution_name: '',
    institution_country: '',
    degree_type: '',
    degree_name: '',
    field_of_study: '',
    specialization: '',
    grade_classification: '',
    gpa: null,
    start_year: null,
    graduation_year: null,
    is_ongoing: false,
    thesis_title: '',
    honors_awards: [],
    relevant_coursework: [],
    extracurricular_activities: [],
  });

  const resetForm = () => {
    setFormData({
      institution_name: '',
      institution_country: null,
      degree_type: '',
      degree_name: null,
      field_of_study: null,
      specialization: null,
      grade_classification: null,
      gpa: null,
      start_year: null,
      graduation_year: null,
      is_ongoing: false,
      thesis_title: null,
      honors_awards: null,
      relevant_coursework: null,
      extracurricular_activities: null,
    });
  };

  const handleAdd = () => {
    setEditingEducation(null);
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleEdit = (edu: Education) => {
    setEditingEducation(edu);
    setFormData(edu);
    setIsAddModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.institution_name || !formData.degree_type) return;

    const newEducation: Education = {
      id: editingEducation?.id || crypto.randomUUID(),
      institution_name: formData.institution_name || '',
      institution_country: formData.institution_country || null,
      degree_type: formData.degree_type || '',
      degree_name: formData.degree_name || null,
      field_of_study: formData.field_of_study || null,
      specialization: formData.specialization || null,
      grade_classification: formData.grade_classification || null,
      gpa: formData.gpa || null,
      start_year: formData.start_year || null,
      graduation_year: formData.graduation_year || null,
      is_ongoing: formData.is_ongoing || false,
      thesis_title: formData.thesis_title || null,
      honors_awards: formData.honors_awards || null,
      relevant_coursework: formData.relevant_coursework || null,
      extracurricular_activities: formData.extracurricular_activities || null,
    };

    const updatedEducation = [...education];

    if (editingEducation) {
      const index = updatedEducation.findIndex(
        (edu) => edu.id === editingEducation.id
      );
      if (index !== -1) {
        updatedEducation[index] = newEducation;
      }
    } else {
      updatedEducation.push(newEducation);
    }

    // Sort by graduation year (most recent first)
    updatedEducation.sort((a, b) => {
      const aDate = a.graduation_year || new Date().getFullYear();
      const bDate = b.graduation_year || new Date().getFullYear();
      return bDate - aDate;
    });

    onUpdate(updatedEducation);
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleDelete = (educationId: string) => {
    const updatedEducation = education.filter((edu) => edu.id !== educationId);
    onUpdate(updatedEducation);
  };


  const sortedEducation = [...education].sort((a, b) => {
    const aDate = a.graduation_year || new Date().getFullYear();
    const bDate = b.graduation_year || new Date().getFullYear();
    return bDate - aDate;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Education & Qualifications</h3>
        {isEditing && (
          <Button variant="outline" size="sm" onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Education
          </Button>
        )}
      </div>

      {sortedEducation.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <GraduationCap className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {isEditing
                ? 'Add your educational background to showcase your qualifications'
                : 'No education information added yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedEducation.map((edu) => (
            <Card key={edu.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-lg font-semibold">
                            {edu.degree_type}
                          </h4>
                          {edu.is_ongoing && (
                            <Badge variant="default">Current</Badge>
                          )}
                        </div>
                        <div className="mt-1 flex items-center space-x-2">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {edu.institution_name}
                          </span>
                          {edu.field_of_study && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-sm text-muted-foreground">
                                {edu.field_of_study}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {edu.start_year} -{' '}
                              {edu.is_ongoing
                                ? 'Present'
                                : edu.graduation_year || 'Unknown'}
                            </span>
                          </div>
                          {edu.institution_country && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{edu.institution_country}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {isEditing && (
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(edu)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(edu.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {(edu.honors_awards || edu.gpa) && (
                      <div className="flex items-center space-x-4 text-sm">
                        {edu.honors_awards && edu.honors_awards.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Award className="h-3 w-3 text-yellow-500" />
                            <span>{edu.honors_awards.join(', ')}</span>
                          </div>
                        )}
                        {edu.gpa && (
                          <div>
                            <span className="text-muted-foreground">GPA: </span>
                            <span className="font-medium">{edu.gpa}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {edu.extracurricular_activities && edu.extracurricular_activities.length > 0 && (
                      <div>
                        <h5 className="mb-2 text-sm font-medium">
                          Activities & Achievements
                        </h5>
                        <p className="text-sm text-muted-foreground">
                          {edu.extracurricular_activities.join(', ')}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <BookOpen className="h-3 w-3" />
                        <span>{edu.field_of_study || 'General Studies'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingEducation ? 'Edit Education' : 'Add Education'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="institution">Institution Name *</Label>
                <Input
                  id="institution"
                  value={formData.institution_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      institution_name: e.target.value,
                    })
                  }
                  placeholder="e.g. Harvard University"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="degree">Degree Type *</Label>
                <Select
                  value={formData.degree_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, degree_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select degree" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEGREE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="field">Field of Study</Label>
                <Select
                  value={formData.field_of_study || ''}
                  onValueChange={(value) =>
                    setFormData({ ...formData, field_of_study: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELDS_OF_STUDY.map((field) => (
                      <SelectItem key={field} value={field}>
                        {field}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  value={formData.specialization || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, specialization: e.target.value })
                  }
                  placeholder="e.g. Finance, Computer Graphics"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="startYear">Start Year *</Label>
                <Input
                  id="startYear"
                  type="number"
                  min="1900"
                  max="2030"
                  value={formData.start_year || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, start_year: parseInt(e.target.value) || null })
                  }
                  placeholder="e.g. 2020"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="graduationYear">Graduation Year</Label>
                <Input
                  id="graduationYear"
                  type="number"
                  min="1900"
                  max="2030"
                  value={formData.graduation_year || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, graduation_year: parseInt(e.target.value) || null })
                  }
                  placeholder="e.g. 2024"
                  disabled={formData.is_ongoing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current">Current Study</Label>
                <div className="flex items-center space-x-2">
                  <input
                    id="current"
                    type="checkbox"
                    checked={formData.is_ongoing || false}
                    onChange={(e) =>
                      setFormData({ ...formData, is_ongoing: e.target.checked })
                    }
                  />
                  <span className="text-sm">Currently studying</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.institution_country || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, institution_country: e.target.value })
                  }
                  placeholder="e.g. Cambridge, MA"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gpa">GPA</Label>
                <Input
                  id="gpa"
                  value={formData.gpa?.toString() || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ 
                      ...formData, 
                      gpa: value === '' ? null : parseFloat(value) || null 
                    });
                  }}
                  placeholder="e.g. 3.8/4.0"
                  type="number"
                  step="0.01"
                  min="0"
                  max="5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thesis">Thesis Title</Label>
              <Input
                id="thesis"
                value={formData.thesis_title || ''}
                onChange={(e) =>
                  setFormData({ ...formData, thesis_title: e.target.value })
                }
                placeholder="e.g. The Impact of AI on Modern Business"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">Grade Classification</Label>
              <Input
                id="grade"
                value={formData.grade_classification || ''}
                onChange={(e) =>
                  setFormData({ ...formData, grade_classification: e.target.value })
                }
                placeholder="e.g. First Class, Upper Second"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingEducation ? 'Update Education' : 'Add Education'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
