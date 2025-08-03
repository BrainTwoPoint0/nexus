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
  Calendar,
  MapPin,
  Clock,
  Briefcase,
} from 'lucide-react';

interface WorkHistory {
  id: string;
  company: string;
  title: string;
  company_size: string | null;
  location: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  key_achievements: string[] | null;
}

interface WorkHistoryManagerProps {
  workHistory: WorkHistory[];
  onUpdate: (history: WorkHistory[]) => void;
  isEditing: boolean;
}

const COMPANY_SIZES = [
  { value: 'startup', label: 'Startup (1-10 employees)' },
  { value: 'small', label: 'Small (11-50 employees)' },
  { value: 'medium', label: 'Medium (51-200 employees)' },
  { value: 'large', label: 'Large (201-1000 employees)' },
  { value: 'enterprise', label: 'Enterprise (1000+ employees)' },
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
    company: '',
    title: '',
    company_size: '',
    location: '',
    start_date: '',
    end_date: '',
    is_current: false,
    description: '',
    key_achievements: [],
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  };

  const calculateDuration = (startDate: string, endDate: string | null) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());

    if (months < 12) {
      return `${months} ${months === 1 ? 'month' : 'months'}`;
    } else {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      if (remainingMonths === 0) {
        return `${years} ${years === 1 ? 'year' : 'years'}`;
      } else {
        return `${years} ${years === 1 ? 'year' : 'years'} ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
      }
    }
  };

  const handleAdd = () => {
    setEditingHistory(null);
    setFormData({
      company: '',
      title: '',
      company_size: '',
      location: '',
      start_date: '',
      end_date: '',
      is_current: false,
      description: '',
      key_achievements: [],
    });
    setIsAddModalOpen(true);
  };

  const handleEdit = (history: WorkHistory) => {
    setEditingHistory(history);
    setFormData(history);
    setIsAddModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.company || !formData.title || !formData.start_date) return;

    const newHistory: WorkHistory = {
      id: editingHistory?.id || crypto.randomUUID(),
      company: formData.company!,
      title: formData.title!,
      company_size: formData.company_size || null,
      location: formData.location || null,
      start_date: formData.start_date!,
      end_date: formData.is_current ? null : formData.end_date || null,
      is_current: formData.is_current || false,
      description: formData.description || null,
      key_achievements: formData.key_achievements || null,
    };

    if (editingHistory) {
      onUpdate(
        workHistory.map((h) => (h.id === editingHistory.id ? newHistory : h))
      );
    } else {
      onUpdate([...workHistory, newHistory]);
    }

    setIsAddModalOpen(false);
  };

  const handleDelete = (id: string) => {
    onUpdate(workHistory.filter((h) => h.id !== id));
  };

  // Sort by start date (most recent first)
  const sortedHistory = [...workHistory].sort(
    (a, b) =>
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Briefcase className="h-5 w-5" />
          Work History
        </h3>
        {isEditing && (
          <Button variant="outline" size="sm" onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Position
          </Button>
        )}
      </div>

      {sortedHistory.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Briefcase className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">
              {isEditing
                ? 'Add your work experience'
                : 'No work experience added yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedHistory.map((history, index) => (
            <Card key={history.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-lg font-semibold">
                          {history.title}
                        </h4>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building className="h-4 w-4" />
                          <span className="font-medium">{history.company}</span>
                          {history.company_size && (
                            <>
                              <span>•</span>
                              <span className="capitalize">
                                {COMPANY_SIZES.find(
                                  (s) => s.value === history.company_size
                                )?.label || history.company_size}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {history.is_current && (
                        <Badge
                          variant="default"
                          className="bg-green-100 text-green-800"
                        >
                          Current
                        </Badge>
                      )}
                    </div>

                    {/* Date and Location */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatDate(history.start_date)} -{' '}
                          {history.end_date
                            ? formatDate(history.end_date)
                            : 'Present'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {calculateDuration(
                            history.start_date,
                            history.end_date
                          )}
                        </span>
                      </div>
                      {history.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{history.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {history.description && (
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {history.description}
                      </p>
                    )}

                    {/* Key Achievements */}
                    {history.key_achievements &&
                      history.key_achievements.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium">
                            Key Achievements
                          </h5>
                          <ul className="space-y-1">
                            {history.key_achievements.map(
                              (achievement, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2 text-sm text-muted-foreground"
                                >
                                  <span className="mt-1 text-primary">•</span>
                                  <span>{achievement}</span>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                  </div>

                  {/* Actions */}
                  {isEditing && (
                    <div className="ml-4 flex items-center gap-2">
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

                {/* Timeline connector */}
                {index < sortedHistory.length - 1 && (
                  <div className="relative mt-4">
                    <div className="absolute left-6 top-0 h-4 w-px bg-border"></div>
                  </div>
                )}
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
              {editingHistory ? 'Edit Work Experience' : 'Add Work Experience'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  value={formData.title || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g. Senior Software Engineer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company *</Label>
                <Input
                  id="company"
                  value={formData.company || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                  placeholder="e.g. Google"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company_size">Company Size</Label>
                <Select
                  value={formData.company_size || ''}
                  onValueChange={(value) =>
                    setFormData({ ...formData, company_size: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_SIZES.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <DatePicker
                  value={formData.start_date || ''}
                  onChange={(value) =>
                    setFormData({ ...formData, start_date: value })
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="end_date">End Date</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_current"
                      checked={formData.is_current}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_current: e.target.checked,
                          end_date: e.target.checked ? '' : formData.end_date,
                        })
                      }
                    />
                    <Label htmlFor="is_current" className="text-sm">
                      Current role
                    </Label>
                  </div>
                </div>
                {!formData.is_current && (
                  <DatePicker
                    value={formData.end_date || ''}
                    onChange={(value) =>
                      setFormData({ ...formData, end_date: value })
                    }
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of your role and responsibilities..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="achievements">
                Key Achievements (one per line)
              </Label>
              <Textarea
                id="achievements"
                value={formData.key_achievements?.join('\n') || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    key_achievements: e.target.value
                      .split('\n')
                      .filter(Boolean),
                  })
                }
                placeholder="• Led a team of 10 engineers&#10;• Increased revenue by 25%&#10;• Launched 3 major product features"
                rows={4}
              />
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
                disabled={
                  !formData.company || !formData.title || !formData.start_date
                }
              >
                {editingHistory ? 'Update' : 'Add'} Experience
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
