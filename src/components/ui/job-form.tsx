'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
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
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  X,
  Save,
  Eye,
  Users,
  MapPin,
  DollarSign,
  Briefcase,
  Globe,
} from 'lucide-react';

export type RoleType =
  | 'board_director'
  | 'non_executive'
  | 'chair'
  | 'committee_chair'
  | 'advisory';
export type EngagementLevel =
  | 'full_time'
  | 'part_time'
  | 'project_based'
  | 'consulting';
export type CompensationType = 'annual' | 'daily' | 'hourly' | 'retainer';
export type CompensationCurrency =
  | 'GBP'
  | 'USD'
  | 'EUR'
  | 'CAD'
  | 'AUD'
  | 'CHF'
  | 'SGD';
export type JobStatus = 'draft' | 'active' | 'paused' | 'closed' | 'filled';

export interface JobFormData {
  title: string;
  description: string;
  responsibilities: string;
  requirements: string;
  role_type: RoleType;
  engagement_level: EngagementLevel;
  compensation_min: number | null;
  compensation_max: number | null;
  compensation_currency: CompensationCurrency;
  compensation_type: CompensationType;
  equity_offered: boolean;
  location: string | null;
  remote_work_allowed: boolean;
  travel_required: string | null;
  application_deadline: string | null;
  start_date: string | null;
  contract_duration: string | null;
  required_skills: string[];
  preferred_qualifications: string[];
  status: JobStatus;
}

interface JobFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: JobFormData) => Promise<void>;
  initialData?: Partial<JobFormData>;
  isEditing?: boolean;
  isLoading?: boolean;
}

const ROLE_TYPES: { value: RoleType; label: string }[] = [
  { value: 'board_director', label: 'Board Director' },
  { value: 'non_executive', label: 'Non-Executive Director' },
  { value: 'chair', label: 'Chair/Chairman' },
  { value: 'committee_chair', label: 'Committee Chair' },
  { value: 'advisory', label: 'Advisory Role' },
];

const ENGAGEMENT_LEVELS: { value: EngagementLevel; label: string }[] = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'project_based', label: 'Project-based' },
  { value: 'consulting', label: 'Consulting' },
];

const COMPENSATION_TYPES: { value: CompensationType; label: string }[] = [
  { value: 'annual', label: 'Annual' },
  { value: 'daily', label: 'Daily Rate' },
  { value: 'hourly', label: 'Hourly Rate' },
  { value: 'retainer', label: 'Retainer' },
];

const CURRENCIES: { value: CompensationCurrency; label: string }[] = [
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'CAD', label: 'CAD ($)' },
  { value: 'AUD', label: 'AUD ($)' },
  { value: 'CHF', label: 'CHF' },
  { value: 'SGD', label: 'SGD ($)' },
];

const TRAVEL_OPTIONS = [
  'No travel required',
  'Occasional travel (up to 10%)',
  'Regular travel (10-25%)',
  'Frequent travel (25-50%)',
  'Extensive travel (50%+)',
];

const defaultFormData: JobFormData = {
  title: '',
  description: '',
  responsibilities: '',
  requirements: '',
  role_type: 'board_director',
  engagement_level: 'part_time',
  compensation_min: null,
  compensation_max: null,
  compensation_currency: 'GBP',
  compensation_type: 'annual',
  equity_offered: false,
  location: null,
  remote_work_allowed: false,
  travel_required: null,
  application_deadline: null,
  start_date: null,
  contract_duration: null,
  required_skills: [],
  preferred_qualifications: [],
  status: 'draft',
};

export function JobForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
  isLoading = false,
}: JobFormProps) {
  const [formData, setFormData] = useState<JobFormData>({
    ...defaultFormData,
    ...initialData,
  });
  const [newSkill, setNewSkill] = useState('');
  const [newQualification, setNewQualification] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  const updateField = (field: keyof JobFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addSkill = () => {
    if (
      newSkill.trim() &&
      !formData.required_skills.includes(newSkill.trim())
    ) {
      updateField('required_skills', [
        ...formData.required_skills,
        newSkill.trim(),
      ]);
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    updateField(
      'required_skills',
      formData.required_skills.filter((s) => s !== skill)
    );
  };

  const addQualification = () => {
    if (
      newQualification.trim() &&
      !formData.preferred_qualifications.includes(newQualification.trim())
    ) {
      updateField('preferred_qualifications', [
        ...formData.preferred_qualifications,
        newQualification.trim(),
      ]);
      setNewQualification('');
    }
  };

  const removeQualification = (qualification: string) => {
    updateField(
      'preferred_qualifications',
      formData.preferred_qualifications.filter((q) => q !== qualification)
    );
  };

  const handleSubmit = async (status: JobStatus = 'draft') => {
    const submitData = { ...formData, status };
    await onSubmit(submitData);
  };

  const isFormValid = () => {
    return (
      formData.title.trim() &&
      formData.description.trim() &&
      formData.responsibilities.trim()
    );
  };

  const steps = [
    { id: 1, title: 'Basic Information', icon: Briefcase },
    { id: 2, title: 'Role Details', icon: Users },
    { id: 3, title: 'Compensation', icon: DollarSign },
    { id: 4, title: 'Location & Timeline', icon: MapPin },
    { id: 5, title: 'Requirements', icon: Eye },
  ];

  const renderStepIndicator = () => (
    <div className="mb-6 flex items-center justify-center space-x-2">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = step.id === currentStep;
        const isCompleted = step.id < currentStep;

        return (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => setCurrentStep(step.id)}
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                isActive
                  ? 'border-primary bg-primary text-primary-foreground'
                  : isCompleted
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-muted text-muted-foreground hover:border-primary'
              }`}
            >
              <Icon className="h-4 w-4" />
            </button>
            {index < steps.length - 1 && (
              <div
                className={`mx-1 h-0.5 w-8 ${isCompleted ? 'bg-green-500' : 'bg-muted'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="e.g., Non-Executive Director"
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Provide a comprehensive overview of the role and its importance to the organization..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="role_type">Role Type</Label>
                <Select
                  value={formData.role_type}
                  onValueChange={(value: RoleType) =>
                    updateField('role_type', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="engagement_level">Engagement Level</Label>
                <Select
                  value={formData.engagement_level}
                  onValueChange={(value: EngagementLevel) =>
                    updateField('engagement_level', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENGAGEMENT_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="responsibilities">Key Responsibilities *</Label>
              <Textarea
                id="responsibilities"
                value={formData.responsibilities}
                onChange={(e) =>
                  updateField('responsibilities', e.target.value)
                }
                placeholder="• Provide strategic oversight and governance&#10;• Review and approve major business decisions&#10;• Monitor company performance and risk management..."
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea
                id="requirements"
                value={formData.requirements}
                onChange={(e) => updateField('requirements', e.target.value)}
                placeholder="• Extensive board experience in similar industry&#10;• Strong financial acumen and governance expertise&#10;• Relevant professional qualifications..."
                rows={4}
              />
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="compensation_currency">Currency</Label>
                <Select
                  value={formData.compensation_currency}
                  onValueChange={(value: CompensationCurrency) =>
                    updateField('compensation_currency', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="compensation_type">Compensation Type</Label>
                <Select
                  value={formData.compensation_type}
                  onValueChange={(value: CompensationType) =>
                    updateField('compensation_type', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPENSATION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="compensation_min">Minimum Compensation</Label>
                <Input
                  id="compensation_min"
                  type="number"
                  value={formData.compensation_min || ''}
                  onChange={(e) =>
                    updateField(
                      'compensation_min',
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  placeholder="50000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="compensation_max">Maximum Compensation</Label>
                <Input
                  id="compensation_max"
                  type="number"
                  value={formData.compensation_max || ''}
                  onChange={(e) =>
                    updateField(
                      'compensation_max',
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  placeholder="80000"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="equity_offered"
                checked={formData.equity_offered}
                onChange={(e) =>
                  updateField('equity_offered', e.target.checked)
                }
              />
              <Label htmlFor="equity_offered" className="text-sm font-normal">
                Equity/shareholding offered
              </Label>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location || ''}
                onChange={(e) => updateField('location', e.target.value)}
                placeholder="e.g., London, UK"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remote_work_allowed"
                  checked={formData.remote_work_allowed}
                  onChange={(e) =>
                    updateField('remote_work_allowed', e.target.checked)
                  }
                />
                <Label
                  htmlFor="remote_work_allowed"
                  className="text-sm font-normal"
                >
                  Remote work allowed
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="travel_required">Travel Requirements</Label>
                <Select
                  value={formData.travel_required || ''}
                  onValueChange={(value) =>
                    updateField('travel_required', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select travel requirement" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRAVEL_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <DatePicker
                id="application_deadline"
                label="Application Deadline"
                value={formData.application_deadline || ''}
                onChange={(value) => updateField('application_deadline', value)}
                placeholder="Select deadline"
              />

              <DatePicker
                id="start_date"
                label="Expected Start Date"
                value={formData.start_date || ''}
                onChange={(value) => updateField('start_date', value)}
                placeholder="Select start date"
              />

              <div className="space-y-2">
                <Label htmlFor="contract_duration">Contract Duration</Label>
                <Input
                  id="contract_duration"
                  value={formData.contract_duration || ''}
                  onChange={(e) =>
                    updateField('contract_duration', e.target.value)
                  }
                  placeholder="e.g., 3 years, Ongoing"
                />
              </div>
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Required Skills</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.required_skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="ml-2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="mt-3 flex space-x-2">
                  <Input
                    placeholder="Add required skill..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                  />
                  <Button onClick={addSkill} variant="outline" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">
                  Preferred Qualifications
                </Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.preferred_qualifications.map(
                    (qualification, index) => (
                      <Badge key={index} variant="outline" className="text-sm">
                        {qualification}
                        <button
                          onClick={() => removeQualification(qualification)}
                          className="ml-2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )
                  )}
                </div>
                <div className="mt-3 flex space-x-2">
                  <Input
                    placeholder="Add preferred qualification..."
                    value={newQualification}
                    onChange={(e) => setNewQualification(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addQualification()}
                  />
                  <Button
                    onClick={addQualification}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditing ? 'Edit Job Posting' : 'Create New Job Posting'}
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          {renderStepIndicator()}
          {renderStep()}
        </div>

        <div className="flex items-center justify-between border-t pt-6">
          <div className="flex space-x-2">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                disabled={isLoading}
              >
                Previous
              </Button>
            )}
          </div>

          <div className="flex space-x-2">
            {currentStep < steps.length ? (
              <Button
                onClick={() => setCurrentStep((prev) => prev + 1)}
                disabled={isLoading}
              >
                Next
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleSubmit('draft')}
                  disabled={!isFormValid() || isLoading}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save as Draft
                </Button>
                <Button
                  onClick={() => handleSubmit('active')}
                  disabled={!isFormValid() || isLoading}
                >
                  <Globe className="mr-2 h-4 w-4" />
                  Publish Job
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
