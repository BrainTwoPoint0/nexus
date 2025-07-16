'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Calendar,
  Clock,
  Plane,
  Home,
  Settings,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface AvailabilityData {
  availability_start_date: string | null;
  time_commitment_preference: string | null;
  travel_willingness: string | null;
  remote_work_preference: string | null;
}

interface AvailabilityManagerProps {
  availability: AvailabilityData;
  onUpdate: (availability: AvailabilityData) => void;
  isEditing: boolean;
}

const TIME_COMMITMENT_OPTIONS = [
  {
    value: 'full-time',
    label: 'Full-time Board Role',
    description:
      'Executive or chair positions requiring significant time commitment',
    icon: Clock,
  },
  {
    value: 'part-time',
    label: 'Part-time Board Role',
    description: 'Standard board member positions with regular meetings',
    icon: Clock,
  },
  {
    value: 'project-based',
    label: 'Project-based',
    description: 'Specific projects or interim roles with defined timelines',
    icon: CheckCircle,
  },
  {
    value: 'consulting',
    label: 'Consulting/Advisory',
    description: 'Advisory roles with flexible engagement',
    icon: AlertCircle,
  },
];

const TRAVEL_OPTIONS = [
  {
    value: 'none',
    label: 'No Travel',
    description: 'Prefer local or virtual meetings only',
    icon: Home,
    color: 'text-red-600',
  },
  {
    value: 'domestic_only',
    label: 'Domestic Only',
    description: 'Willing to travel within country',
    icon: Plane,
    color: 'text-yellow-600',
  },
  {
    value: 'european',
    label: 'European Travel',
    description: 'Open to travel within Europe',
    icon: Plane,
    color: 'text-orange-600',
  },
  {
    value: 'international',
    label: 'International Travel',
    description: 'Open to international board positions',
    icon: Plane,
    color: 'text-green-600',
  },
  {
    value: 'global',
    label: 'Global Travel',
    description: 'Comfortable with worldwide travel requirements',
    icon: Plane,
    color: 'text-blue-600',
  },
];

const REMOTE_WORK_OPTIONS = [
  {
    value: 'no',
    label: 'In-person Only',
    description: 'Prefer all meetings and activities to be in-person',
    icon: Home,
  },
  {
    value: 'occasional',
    label: 'Occasional Remote',
    description: 'Some virtual meetings acceptable',
    icon: Home,
  },
  {
    value: 'hybrid',
    label: 'Hybrid Approach',
    description: 'Comfortable with mix of in-person and virtual',
    icon: Home,
  },
  {
    value: 'full',
    label: 'Fully Remote',
    description: 'Open to completely virtual board positions',
    icon: Home,
  },
];

export function AvailabilityManager({
  availability,
  onUpdate,
  isEditing,
}: AvailabilityManagerProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState<AvailabilityData>(availability);

  const handleEdit = () => {
    setFormData(availability);
    setIsEditModalOpen(true);
  };

  const handleSave = () => {
    onUpdate(formData);
    setIsEditModalOpen(false);
  };

  const handleCancel = () => {
    setFormData(availability);
    setIsEditModalOpen(false);
  };

  const formatStartDate = (dateString: string | null) => {
    if (!dateString) return 'Immediately available';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getOptionLabel = (
    options: { value: string; label: string }[],
    value: string | null
  ) => {
    return options.find((opt) => opt.value === value)?.label || 'Not specified';
  };

  const getOptionDescription = (
    options: { value: string; description: string }[],
    value: string | null
  ) => {
    return options.find((opt) => opt.value === value)?.description || '';
  };

  const getOptionIcon = (
    options: {
      value: string;
      icon: React.ComponentType<{ className?: string }>;
    }[],
    value: string | null
  ) => {
    const option = options.find((opt) => opt.value === value);
    return option?.icon || Calendar;
  };

  const getOptionColor = (
    options: { value: string; color?: string }[],
    value: string | null
  ) => {
    return options.find((opt) => opt.value === value)?.color || 'text-gray-600';
  };

  const hasAvailabilityData =
    availability.availability_start_date ||
    availability.time_commitment_preference ||
    availability.travel_willingness ||
    availability.remote_work_preference;

  const isAvailableNow =
    !availability.availability_start_date ||
    new Date(availability.availability_start_date) <= new Date();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Availability & Preferences</h3>
        {isEditing && (
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Settings className="mr-2 h-4 w-4" />
            Edit Availability
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Start Date Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Start Date</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {availability.availability_start_date ? (
              <div>
                <div className="text-lg font-semibold">
                  {formatStartDate(availability.availability_start_date)}
                </div>
                <div
                  className={`mt-1 text-sm ${isAvailableNow ? 'text-green-600' : 'text-orange-600'}`}
                >
                  {isAvailableNow ? (
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4" />
                      <span>Available now</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <AlertCircle className="h-4 w-4" />
                      <span>Future availability</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-muted-foreground">
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-green-600">
                    Available immediately
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Time Commitment Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Time Commitment</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {availability.time_commitment_preference ? (
              <div>
                <div className="text-lg font-semibold">
                  {getOptionLabel(
                    TIME_COMMITMENT_OPTIONS,
                    availability.time_commitment_preference
                  )}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {getOptionDescription(
                    TIME_COMMITMENT_OPTIONS,
                    availability.time_commitment_preference
                  )}
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-muted-foreground">
                <Clock className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p className="text-sm">Time commitment not specified</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Travel Willingness Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plane className="h-5 w-5" />
              <span>Travel Willingness</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {availability.travel_willingness ? (
              <div>
                <div
                  className={`flex items-center space-x-2 text-lg font-semibold`}
                >
                  {(() => {
                    const IconComponent = getOptionIcon(
                      TRAVEL_OPTIONS,
                      availability.travel_willingness
                    );
                    const colorClass = getOptionColor(
                      TRAVEL_OPTIONS,
                      availability.travel_willingness
                    );
                    return (
                      <>
                        <IconComponent className={`h-5 w-5 ${colorClass}`} />
                        <span>
                          {getOptionLabel(
                            TRAVEL_OPTIONS,
                            availability.travel_willingness
                          )}
                        </span>
                      </>
                    );
                  })()}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {getOptionDescription(
                    TRAVEL_OPTIONS,
                    availability.travel_willingness
                  )}
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-muted-foreground">
                <Plane className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p className="text-sm">Travel preferences not specified</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Remote Work Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Home className="h-5 w-5" />
              <span>Remote Work</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {availability.remote_work_preference ? (
              <div>
                <div className="flex items-center space-x-2 text-lg font-semibold">
                  <Home className="h-5 w-5" />
                  <span>
                    {getOptionLabel(
                      REMOTE_WORK_OPTIONS,
                      availability.remote_work_preference
                    )}
                  </span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {getOptionDescription(
                    REMOTE_WORK_OPTIONS,
                    availability.remote_work_preference
                  )}
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-muted-foreground">
                <Home className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p className="text-sm">Remote work preferences not specified</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Availability Summary */}
      {hasAvailabilityData && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="mb-2 flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">
                Availability Summary
              </span>
            </div>
            <div className="text-sm text-green-700">
              {isAvailableNow
                ? 'Currently available'
                : `Available from ${formatStartDate(availability.availability_start_date)}`}
              {availability.time_commitment_preference &&
                ` for ${getOptionLabel(TIME_COMMITMENT_OPTIONS, availability.time_commitment_preference).toLowerCase()}`}
              {availability.travel_willingness &&
                `, ${getOptionLabel(TRAVEL_OPTIONS, availability.travel_willingness).toLowerCase()}`}
              {availability.remote_work_preference &&
                `, open to ${getOptionLabel(REMOTE_WORK_OPTIONS, availability.remote_work_preference).toLowerCase()}`}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Availability & Preferences</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Available Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.availability_start_date || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    availability_start_date: e.target.value || null,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Leave blank if you&apos;re available immediately
              </p>
            </div>

            {/* Time Commitment */}
            <div className="space-y-2">
              <Label>Time Commitment Preference</Label>
              <Select
                value={formData.time_commitment_preference || ''}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    time_commitment_preference: value || null,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time commitment preference" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  {TIME_COMMITMENT_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="py-3"
                    >
                      <div className="flex w-full items-start space-x-3">
                        <option.icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium">
                            {option.label}
                          </div>
                          <div className="mt-0.5 text-xs leading-tight text-muted-foreground">
                            {option.description}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Travel Willingness */}
            <div className="space-y-2">
              <Label>Travel Willingness</Label>
              <Select
                value={formData.travel_willingness || ''}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    travel_willingness: value || null,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select travel willingness" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  {TRAVEL_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="py-3"
                    >
                      <div className="flex w-full items-start space-x-3">
                        <option.icon
                          className={`mt-0.5 h-5 w-5 flex-shrink-0 ${option.color}`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium">
                            {option.label}
                          </div>
                          <div className="mt-0.5 text-xs leading-tight text-muted-foreground">
                            {option.description}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Remote Work Preference */}
            <div className="space-y-2">
              <Label>Remote Work Preference</Label>
              <Select
                value={formData.remote_work_preference || ''}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    remote_work_preference: value || null,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select remote work preference" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  {REMOTE_WORK_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="py-3"
                    >
                      <div className="flex w-full items-start space-x-3">
                        <option.icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium">
                            {option.label}
                          </div>
                          <div className="mt-0.5 text-xs leading-tight text-muted-foreground">
                            {option.description}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
