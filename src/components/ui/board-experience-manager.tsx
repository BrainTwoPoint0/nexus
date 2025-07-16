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
  organization_name: string;
  position_title: string;
  organization_type: string;
  organization_sector: string | null;
  organization_size: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  key_responsibilities: string | null;
  notable_achievements: string | null;
  board_size?: number;
  committee_memberships?: string[];
}

interface BoardExperienceManagerProps {
  boardExperience: BoardExperience[];
  onUpdate: (experience: BoardExperience[]) => void;
  isEditing: boolean;
}

const ORGANIZATION_TYPES = [
  'Public Company',
  'Private Company',
  'Non-Profit',
  'Government',
  'Educational Institution',
  'Healthcare Organization',
  'Financial Services',
  'Technology Company',
  'Manufacturing',
  'Retail',
  'Other',
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
];

const BOARD_POSITIONS = [
  'Chair/Chairman',
  'Vice Chair',
  'Non-Executive Director',
  'Independent Director',
  'Executive Director',
  'Lead Director',
  'Committee Chair',
  'Committee Member',
];

const COMMITTEE_TYPES = [
  'Audit',
  'Compensation',
  'Governance',
  'Nominating',
  'Risk',
  'Technology',
  'Finance',
  'Strategy',
  'ESG/Sustainability',
  'Investment',
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
    organization_name: '',
    position_title: '',
    organization_type: '',
    organization_sector: '',
    organization_size: '',
    start_date: '',
    end_date: '',
    is_current: false,
    key_responsibilities: '',
    notable_achievements: '',
    board_size: undefined,
    committee_memberships: [],
  });

  const resetForm = () => {
    setFormData({
      organization_name: '',
      position_title: '',
      organization_type: '',
      organization_sector: '',
      organization_size: '',
      start_date: '',
      end_date: '',
      is_current: false,
      key_responsibilities: '',
      notable_achievements: '',
      board_size: undefined,
      committee_memberships: [],
    });
  };

  const handleAdd = () => {
    setEditingExperience(null);
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleEdit = (experience: BoardExperience) => {
    setEditingExperience(experience);
    setFormData({
      ...experience,
      committee_memberships: experience.committee_memberships || [],
    });
    setIsAddModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.organization_name || !formData.position_title) return;

    const newExperience: BoardExperience = {
      id: editingExperience?.id || crypto.randomUUID(),
      organization_name: formData.organization_name,
      position_title: formData.position_title,
      organization_type: formData.organization_type || '',
      organization_sector: formData.organization_sector || null,
      organization_size: formData.organization_size || null,
      start_date: formData.start_date || '',
      end_date: formData.is_current ? null : formData.end_date || null,
      is_current: formData.is_current || false,
      key_responsibilities: formData.key_responsibilities || null,
      notable_achievements: formData.notable_achievements || null,
      board_size: formData.board_size,
      committee_memberships: formData.committee_memberships || [],
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

  const toggleCommittee = (committee: string) => {
    const current = formData.committee_memberships || [];
    if (current.includes(committee)) {
      setFormData({
        ...formData,
        committee_memberships: current.filter((c) => c !== committee),
      });
    } else {
      setFormData({
        ...formData,
        committee_memberships: [...current, committee],
      });
    }
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
                            {experience.position_title}
                          </h4>
                          {experience.is_current && (
                            <Badge variant="default">Current</Badge>
                          )}
                        </div>
                        <div className="mt-1 flex items-center space-x-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {experience.organization_name}
                          </span>
                          {experience.organization_sector && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-sm text-muted-foreground">
                                {experience.organization_sector}
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

                    {experience.key_responsibilities && (
                      <div>
                        <h5 className="mb-2 text-sm font-medium">
                          Key Responsibilities
                        </h5>
                        <p className="text-sm text-muted-foreground">
                          {experience.key_responsibilities}
                        </p>
                      </div>
                    )}

                    {experience.notable_achievements && (
                      <div>
                        <h5 className="mb-2 text-sm font-medium">
                          Notable Achievements
                        </h5>
                        <p className="text-sm text-muted-foreground">
                          {experience.notable_achievements}
                        </p>
                      </div>
                    )}

                    {experience.committee_memberships &&
                      experience.committee_memberships.length > 0 && (
                        <div>
                          <h5 className="mb-2 text-sm font-medium">
                            Committee Memberships
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {experience.committee_memberships.map(
                              (committee) => (
                                <Badge key={committee} variant="secondary">
                                  {committee}
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{experience.organization_type}</span>
                      </div>
                      {experience.board_size && (
                        <div className="flex items-center space-x-1">
                          <span>Board Size: {experience.board_size}</span>
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
                  value={formData.organization_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      organization_name: e.target.value,
                    })
                  }
                  placeholder="e.g. TechCorp Ltd"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position Title *</Label>
                <Select
                  value={formData.position_title}
                  onValueChange={(value) =>
                    setFormData({ ...formData, position_title: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {BOARD_POSITIONS.map((position) => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="orgType">Organization Type</Label>
                <Select
                  value={formData.organization_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, organization_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORGANIZATION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sector">Sector</Label>
                <Select
                  value={formData.organization_sector || ''}
                  onValueChange={(value) =>
                    setFormData({ ...formData, organization_sector: value })
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
                    <SelectItem value="startup">Startup</SelectItem>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
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
              <Label htmlFor="committees">Committee Memberships</Label>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {COMMITTEE_TYPES.map((committee) => (
                  <div key={committee} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.committee_memberships?.includes(
                        committee
                      )}
                      onChange={() => toggleCommittee(committee)}
                    />
                    <span className="text-sm">{committee}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsibilities">Key Responsibilities</Label>
              <Textarea
                id="responsibilities"
                value={formData.key_responsibilities || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    key_responsibilities: e.target.value,
                  })
                }
                placeholder="Describe your main responsibilities and oversight areas..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="achievements">Notable Achievements</Label>
              <Textarea
                id="achievements"
                value={formData.notable_achievements || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    notable_achievements: e.target.value,
                  })
                }
                placeholder="Highlight key accomplishments and outcomes..."
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
                {editingExperience ? 'Update Position' : 'Add Position'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
