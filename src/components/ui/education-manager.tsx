'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  Award,
} from 'lucide-react';

interface Education {
  id: string;
  institution: string;
  degree: string;
  field_of_study: string | null;
  graduation_year: number | null;
  gpa: string | null;
  honors: string[];
  description: string | null;
}

interface EducationManagerProps {
  education: Education[];
  onUpdate: (education: Education[]) => void;
  isEditing: boolean;
}

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
    institution: '',
    degree: '',
    field_of_study: '',
    graduation_year: undefined,
    gpa: '',
    honors: [],
    description: '',
  });

  const resetForm = () => {
    setFormData({
      institution: '',
      degree: '',
      field_of_study: '',
      graduation_year: undefined,
      gpa: '',
      honors: [],
      description: '',
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
    if (!formData.institution || !formData.degree) return;

    const newEducation: Education = {
      id: editingEducation?.id || crypto.randomUUID(),
      institution: formData.institution,
      degree: formData.degree,
      field_of_study: formData.field_of_study || null,
      graduation_year: formData.graduation_year || null,
      gpa: formData.gpa || null,
      honors: formData.honors || [],
      description: formData.description || null,
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
    updatedEducation.sort(
      (a, b) => (b.graduation_year || 0) - (a.graduation_year || 0)
    );

    onUpdate(updatedEducation);
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleDelete = (educationId: string) => {
    const updatedEducation = education.filter((edu) => edu.id !== educationId);
    onUpdate(updatedEducation);
  };

  const sortedEducation = [...education].sort(
    (a, b) => (b.graduation_year || 0) - (a.graduation_year || 0)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Education</h3>
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
                ? 'Add your educational background'
                : 'No education records added yet'}
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
                            {edu.degree}
                          </h4>
                        </div>
                        <div className="mt-1 flex items-center space-x-2">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{edu.institution}</span>
                        </div>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-muted-foreground">
                          {edu.graduation_year && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>Graduated {edu.graduation_year}</span>
                            </div>
                          )}
                          {edu.gpa && (
                            <div className="flex items-center space-x-1">
                              <Award className="h-3 w-3" />
                              <span>GPA: {edu.gpa}</span>
                            </div>
                          )}
                        </div>
                        {edu.field_of_study && (
                          <div className="mt-2">
                            <span className="text-sm text-muted-foreground">
                              Field of Study: {edu.field_of_study}
                            </span>
                          </div>
                        )}
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

                    {edu.description && (
                      <div>
                        <h5 className="mb-2 text-sm font-medium">
                          Description
                        </h5>
                        <p className="text-sm text-muted-foreground">
                          {edu.description}
                        </p>
                      </div>
                    )}

                    {edu.honors && edu.honors.length > 0 && (
                      <div>
                        <h5 className="mb-2 text-sm font-medium">
                          Honors & Awards
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {edu.honors.map((honor, index) => (
                            <Badge key={index} variant="secondary">
                              {honor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
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
                <Label htmlFor="institution">Institution *</Label>
                <Input
                  id="institution"
                  value={formData.institution}
                  onChange={(e) =>
                    setFormData({ ...formData, institution: e.target.value })
                  }
                  placeholder="e.g. Harvard University"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="degree">Degree *</Label>
                <Input
                  id="degree"
                  value={formData.degree}
                  onChange={(e) =>
                    setFormData({ ...formData, degree: e.target.value })
                  }
                  placeholder="e.g. Bachelor of Science"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="field">Field of Study</Label>
                <Input
                  id="field"
                  value={formData.field_of_study || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, field_of_study: e.target.value })
                  }
                  placeholder="e.g. Computer Science"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Graduation Year</Label>
                <Input
                  id="year"
                  type="number"
                  min="1950"
                  max="2030"
                  value={formData.graduation_year || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      graduation_year: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="e.g. 2023"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gpa">GPA / Grade</Label>
              <Input
                id="gpa"
                value={formData.gpa || ''}
                onChange={(e) =>
                  setFormData({ ...formData, gpa: e.target.value })
                }
                placeholder="e.g. 3.8 / 4.0 or First Class Honours"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe relevant coursework, projects, or achievements..."
                rows={3}
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
