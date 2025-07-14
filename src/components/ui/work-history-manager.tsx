'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  Calendar,
  MapPin,
  Users,
  TrendingUp,
  Clock,
} from 'lucide-react';

interface WorkHistory {
  id: string;
  company_name: string;
  position_title: string;
  department: string | null;
  employment_type: string;
  company_size: string | null;
  sector: string | null;
  location: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  key_responsibilities: string | null;
  major_achievements: string | null;
  reporting_to: string | null;
  team_size: number | null;
  reason_for_leaving: string | null;
}

interface WorkHistoryManagerProps {
  workHistory: WorkHistory[];
  onUpdate: (history: WorkHistory[]) => void;
  isEditing: boolean;
}

const EMPLOYMENT_TYPES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Consulting',
  'Interim',
  'Board Position',
  'Advisory Role',
];

const COMPANY_SIZES = [
  'Startup (1-50)',
  'Small (51-200)',
  'Medium (201-1000)',
  'Large (1001-5000)',
  'Enterprise (5000+)',
  'Government',
  'Non-Profit',
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
  'Consulting',
  'Legal',
  'Transportation',
  'Hospitality',
  'Government',
  'Non-Profit',
];

export function WorkHistoryManager({
  workHistory,
  onUpdate,
  isEditing,
}: WorkHistoryManagerProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingHistory, setEditingHistory] = useState<WorkHistory | null>(
    null
  );
  const [formData, setFormData] = useState<Partial<WorkHistory>>({
    company_name: '',
    position_title: '',
    department: '',
    employment_type: '',
    company_size: '',
    sector: '',
    location: '',
    start_date: '',
    end_date: '',
    is_current: false,
    key_responsibilities: '',
    major_achievements: '',
    reporting_to: '',
    team_size: undefined,
    reason_for_leaving: '',
  });

  const resetForm = () => {
    setFormData({
      company_name: '',
      position_title: '',
      department: '',
      employment_type: '',
      company_size: '',
      sector: '',
      location: '',
      start_date: '',
      end_date: '',
      is_current: false,
      key_responsibilities: '',
      major_achievements: '',
      reporting_to: '',
      team_size: undefined,
      reason_for_leaving: '',
    });
  };

  const handleAdd = () => {
    setEditingHistory(null);
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleEdit = (history: WorkHistory) => {
    setEditingHistory(history);
    setFormData(history);
    setIsAddModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.company_name || !formData.position_title) return;

    const newHistory: WorkHistory = {
      id: editingHistory?.id || crypto.randomUUID(),
      company_name: formData.company_name,
      position_title: formData.position_title,
      department: formData.department || null,
      employment_type: formData.employment_type || '',
      company_size: formData.company_size || null,
      sector: formData.sector || null,
      location: formData.location || null,
      start_date: formData.start_date || '',
      end_date: formData.is_current ? null : formData.end_date || null,
      is_current: formData.is_current || false,
      key_responsibilities: formData.key_responsibilities || null,
      major_achievements: formData.major_achievements || null,
      reporting_to: formData.reporting_to || null,
      team_size: formData.team_size || null,
      reason_for_leaving: formData.reason_for_leaving || null,
    };

    const updatedHistory = [...workHistory];

    if (editingHistory) {
      const index = updatedHistory.findIndex(
        (hist) => hist.id === editingHistory.id
      );
      if (index !== -1) {
        updatedHistory[index] = newHistory;
      }
    } else {
      updatedHistory.push(newHistory);
    }

    // Sort by start date (most recent first)
    updatedHistory.sort(
      (a, b) =>
        new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );

    onUpdate(updatedHistory);
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleDelete = (historyId: string) => {
    const updatedHistory = workHistory.filter((hist) => hist.id !== historyId);
    onUpdate(updatedHistory);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  };

  const calculateDuration = (startDate: string, endDate: string | null) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years === 0) {
      return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    } else if (remainingMonths === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    } else {
      return `${years} year${years !== 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    }
  };

  const sortedHistory = [...workHistory].sort(
    (a, b) =>
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Work History</h3>
        {isEditing && (
          <Button variant="outline" size="sm" onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Position
          </Button>
        )}
      </div>

      {sortedHistory.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Building className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {isEditing
                ? 'Add your work history to showcase your professional experience'
                : 'No work history added yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Timeline */}
          <div className="relative">
            {sortedHistory.map((history, index) => (
              <div key={history.id} className="relative">
                {/* Timeline line */}
                {index < sortedHistory.length - 1 && (
                  <div className="absolute left-6 top-12 h-full w-0.5 bg-border" />
                )}

                <div className="flex items-start space-x-4 pb-8">
                  {/* Timeline dot */}
                  <div className="relative flex-shrink-0">
                    <div
                      className={`flex h-3 w-3 items-center justify-center rounded-full ${
                        history.is_current ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    />
                  </div>

                  {/* Content */}
                  <Card className="flex-1">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start space-x-3">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="text-lg font-semibold">
                                  {history.position_title}
                                </h4>
                                {history.is_current && (
                                  <Badge variant="default">Current</Badge>
                                )}
                              </div>
                              <div className="mt-1 flex items-center space-x-2">
                                <Building className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {history.company_name}
                                </span>
                                {history.sector && (
                                  <>
                                    <span className="text-muted-foreground">
                                      •
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                      {history.sector}
                                    </span>
                                  </>
                                )}
                              </div>
                              <div className="mt-2 flex items-center space-x-4 text-sm text-muted-foreground">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>
                                    {formatDate(history.start_date)} -{' '}
                                    {history.is_current
                                      ? 'Present'
                                      : formatDate(history.end_date || '')}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {calculateDuration(
                                      history.start_date,
                                      history.end_date
                                    )}
                                  </span>
                                </div>
                                {history.location && (
                                  <div className="flex items-center space-x-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>{history.location}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {isEditing && (
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(history)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(history.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>

                          {history.key_responsibilities && (
                            <div>
                              <h5 className="mb-2 text-sm font-medium">
                                Key Responsibilities
                              </h5>
                              <p className="text-sm text-muted-foreground">
                                {history.key_responsibilities}
                              </p>
                            </div>
                          )}

                          {history.major_achievements && (
                            <div>
                              <h5 className="mb-2 text-sm font-medium">
                                Major Achievements
                              </h5>
                              <p className="text-sm text-muted-foreground">
                                {history.major_achievements}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Badge variant="outline">
                                {history.employment_type}
                              </Badge>
                            </div>
                            {history.company_size && (
                              <div className="flex items-center space-x-1">
                                <Users className="h-3 w-3" />
                                <span>{history.company_size}</span>
                              </div>
                            )}
                            {history.team_size && (
                              <div className="flex items-center space-x-1">
                                <TrendingUp className="h-3 w-3" />
                                <span>Team: {history.team_size}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingHistory ? 'Edit Work Experience' : 'Add Work Experience'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company">Company Name *</Label>
                <Input
                  id="company"
                  value={formData.company_name}
                  onChange={(e) =>
                    setFormData({ ...formData, company_name: e.target.value })
                  }
                  placeholder="e.g. Microsoft Corporation"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position Title *</Label>
                <Input
                  id="position"
                  value={formData.position_title}
                  onChange={(e) =>
                    setFormData({ ...formData, position_title: e.target.value })
                  }
                  placeholder="e.g. Chief Executive Officer"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  placeholder="e.g. Operations, Technology"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employment">Employment Type</Label>
                <Select
                  value={formData.employment_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, employment_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_TYPES.map((type) => (
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
                <Label htmlFor="companySize">Company Size</Label>
                <Select
                  value={formData.company_size || ''}
                  onValueChange={(value) =>
                    setFormData({ ...formData, company_size: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_SIZES.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="month"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="month"
                  value={formData.end_date || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                  disabled={formData.is_current}
                />
              </div>

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
                  <span className="text-sm">I currently work here</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location || ''}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="e.g. London, UK"
              />
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
                placeholder="Describe your main responsibilities and areas of oversight..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="achievements">Major Achievements</Label>
              <Textarea
                id="achievements"
                value={formData.major_achievements || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    major_achievements: e.target.value,
                  })
                }
                placeholder="Highlight key accomplishments and outcomes..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="reporting">Reporting To</Label>
                <Input
                  id="reporting"
                  value={formData.reporting_to || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, reporting_to: e.target.value })
                  }
                  placeholder="e.g. Board of Directors, CEO"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="teamSize">Team Size</Label>
                <Input
                  id="teamSize"
                  type="number"
                  value={formData.team_size || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      team_size: parseInt(e.target.value) || undefined,
                    })
                  }
                  placeholder="Number of direct reports"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingHistory ? 'Update Experience' : 'Add Experience'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
