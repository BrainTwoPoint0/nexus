'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Edit,
  Trash2,
  Building,
  CalendarDays,
  Users,
} from 'lucide-react';

interface BoardExperience {
  id: string;
  organization: string;
  role: string;
  sector: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  organization_size: string | null;
  key_contributions: string | null;
  compensation_disclosed: boolean;
  annual_fee: number | null;
}

interface BoardExperienceManagerProps {
  boardExperience: BoardExperience[];
  onUpdate: (experience: BoardExperience[]) => void;
  isEditing: boolean;
}

const ORGANIZATION_SIZES = [
  { value: 'startup', label: 'Startup (1-10 employees)' },
  { value: 'small', label: 'Small (11-50 employees)' },
  { value: 'medium', label: 'Medium (51-200 employees)' },
  { value: 'large', label: 'Large (201-1000 employees)' },
  { value: 'public', label: 'Public Company (1000+ employees)' },
];

const SECTORS = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Real Estate',
  'Energy',
  'Manufacturing',
  'Retail',
  'Media',
  'Non-Profit',
  'Government',
  'Consulting',
  'Legal',
  'Transportation',
  'Hospitality',
  'Other',
];

const BOARD_ROLES = [
  'Chair/Chairman',
  'Vice Chair',
  'Non-Executive Director',
  'Independent Director',
  'Executive Director',
  'Lead Director',
  'Committee Chair',
  'Committee Member',
  'Advisory Board Member',
  'Observer',
];

export function BoardExperienceManager({
  boardExperience,
  onUpdate,
  isEditing,
}: BoardExperienceManagerProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExperience, setEditingExperience] =
    useState<BoardExperience | null>(null);
  const [formData, setFormData] = useState<Partial<BoardExperience>>({
    organization: '',
    role: '',
    sector: '',
    organization_size: '',
    start_date: '',
    end_date: '',
    is_current: false,
    key_contributions: '',
    compensation_disclosed: false,
    annual_fee: null,
  });

  const resetForm = () => {
    setFormData({
      organization: '',
      role: '',
      sector: '',
      organization_size: '',
      start_date: '',
      end_date: '',
      is_current: false,
      key_contributions: '',
      compensation_disclosed: false,
      annual_fee: null,
    });
  };

  const handleAdd = () => {
    setEditingExperience(null);
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleEdit = (experience: BoardExperience) => {
    setEditingExperience(experience);
    setFormData(experience);
    setIsAddModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.organization || !formData.role) return;

    const newExperience: BoardExperience = {
      id: editingExperience?.id || crypto.randomUUID(),
      organization: formData.organization!,
      role: formData.role!,
      sector: formData.sector || null,
      organization_size: formData.organization_size || null,
      start_date: formData.start_date || '',
      end_date: formData.is_current ? null : formData.end_date || null,
      is_current: formData.is_current || false,
      key_contributions: formData.key_contributions || null,
      compensation_disclosed: formData.compensation_disclosed || false,
      annual_fee: formData.annual_fee || null,
    };

    const updatedExperience = [...boardExperience];

    if (editingExperience) {
      const index = updatedExperience.findIndex(
        (exp) => exp.id === editingExperience.id
      );
      if (index !== -1) {
        updatedExperience[index] = newExperience;
      }
    } else {
      updatedExperience.push(newExperience);
    }

    onUpdate(updatedExperience);
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleDelete = (experienceId: string) => {
    const updatedExperience = boardExperience.filter(
      (exp) => exp.id !== experienceId
    );
    onUpdate(updatedExperience);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Board Experience</h3>
        {isEditing && (
          <Button variant="outline" size="sm" onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Position
          </Button>
        )}
      </div>

      {boardExperience.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Building className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {isEditing
                ? 'Add your board experience to showcase your governance expertise'
                : 'No board experience added yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {boardExperience.map((experience) => (
            <Card key={experience.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-lg font-semibold">
                            {experience.role}
                          </h4>
                          {experience.is_current && (
                            <Badge
                              variant="default"
                              className="bg-green-100 text-green-800"
                            >
                              Current
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 flex items-center space-x-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {experience.organization}
                          </span>
                          {experience.sector && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-sm text-muted-foreground">
                                {experience.sector}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="mt-1 flex items-center space-x-2">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {formatDate(experience.start_date)} -{' '}
                            {experience.is_current
                              ? 'Present'
                              : formatDate(experience.end_date || '')}
                          </span>
                        </div>
                      </div>

                      {isEditing && (
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(experience)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(experience.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {experience.key_contributions && (
                      <div>
                        <h5 className="mb-2 text-sm font-medium">
                          Key Contributions
                        </h5>
                        <p className="text-sm text-muted-foreground">
                          {experience.key_contributions}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center space-x-4">
                        {experience.organization_size && (
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>
                              {ORGANIZATION_SIZES.find(
                                (s) => s.value === experience.organization_size
                              )?.label || experience.organization_size}
                            </span>
                          </div>
                        )}
                      </div>
                      {experience.compensation_disclosed &&
                        experience.annual_fee && (
                          <div className="flex items-center space-x-1">
                            <span>
                              Annual Fee: £
                              {experience.annual_fee.toLocaleString()}
                            </span>
                          </div>
                        )}
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
              {editingExperience ? 'Edit Board Position' : 'Add Board Position'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="organization">Organization Name *</Label>
                <Input
                  id="organization"
                  value={formData.organization || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      organization: e.target.value,
                    })
                  }
                  placeholder="e.g. TechCorp Ltd"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Board Role *</Label>
                <Select
                  value={formData.role || ''}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {BOARD_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sector">Sector</Label>
                <Select
                  value={formData.sector || ''}
                  onValueChange={(value) =>
                    setFormData({ ...formData, sector: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTORS.map((sector) => (
                      <SelectItem key={sector} value={sector}>
                        {sector}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orgSize">Organization Size</Label>
                <Select
                  value={formData.organization_size || ''}
                  onValueChange={(value) =>
                    setFormData({ ...formData, organization_size: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORGANIZATION_SIZES.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <DatePicker
                id="startDate"
                label="Start Date"
                value={formData.start_date}
                onChange={(value) =>
                  setFormData({ ...formData, start_date: value })
                }
                placeholder="e.g., 22/05/2022"
                required
              />

              <DatePicker
                id="endDate"
                label="End Date"
                value={formData.end_date || ''}
                onChange={(value) =>
                  setFormData({ ...formData, end_date: value })
                }
                placeholder="e.g., 15/08/2024"
                disabled={formData.is_current}
              />

              <div className="space-y-2">
                <Label htmlFor="current">Current Position</Label>
                <div className="flex items-center space-x-2">
                  <input
                    id="current"
                    type="checkbox"
                    checked={formData.is_current}
                    onChange={(e) =>
                      setFormData({ ...formData, is_current: e.target.checked })
                    }
                  />
                  <span className="text-sm">
                    I currently hold this position
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contributions">Key Contributions</Label>
              <Textarea
                id="contributions"
                value={formData.key_contributions || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    key_contributions: e.target.value,
                  })
                }
                placeholder="Describe your main contributions and impact..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    id="compensation_disclosed"
                    type="checkbox"
                    checked={formData.compensation_disclosed || false}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        compensation_disclosed: e.target.checked,
                      })
                    }
                  />
                  <Label htmlFor="compensation_disclosed" className="text-sm">
                    Disclose compensation information
                  </Label>
                </div>
              </div>

              {formData.compensation_disclosed && (
                <div className="space-y-2">
                  <Label htmlFor="annual_fee">Annual Fee (£)</Label>
                  <Input
                    id="annual_fee"
                    type="number"
                    value={formData.annual_fee || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        annual_fee: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    placeholder="e.g. 50000"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formData.organization || !formData.role}
              >
                {editingExperience ? 'Update Position' : 'Add Position'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
