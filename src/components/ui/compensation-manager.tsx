'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DollarSign,
  TrendingUp,
  Award,
  Heart,
  Settings,
  Plus,
  X,
} from 'lucide-react';

interface CompensationData {
  compensation_expectation_min: number | null;
  compensation_expectation_max: number | null;
  compensation_currency: string;
  compensation_type: string;
  equity_interest: boolean;
  benefits_important: string[];
}

interface CompensationManagerProps {
  compensation: CompensationData;
  onUpdate: (compensation: CompensationData) => void;
  isEditing: boolean;
}

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
];

const COMPENSATION_TYPES = [
  { value: 'annual', label: 'Annual Salary', icon: DollarSign },
  { value: 'daily', label: 'Daily Rate', icon: TrendingUp },
  { value: 'hourly', label: 'Hourly Rate', icon: TrendingUp },
  { value: 'retainer', label: 'Monthly Retainer', icon: Award },
];

const BENEFITS_OPTIONS = [
  'Health Insurance',
  'Dental Insurance',
  'Vision Insurance',
  'Life Insurance',
  'Disability Insurance',
  'Retirement/Pension',
  '401(k) Match',
  'Stock Options',
  'Professional Development',
  'Flexible Hours',
  'Remote Work',
  'Paid Time Off',
  'Parental Leave',
  'Gym/Wellness',
  'Company Car',
  'Expense Account',
  'Executive Coaching',
  'Board Training',
];

export function CompensationManager({
  compensation,
  onUpdate,
  isEditing,
}: CompensationManagerProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState<CompensationData>({
    ...compensation,
    benefits_important: compensation.benefits_important || [],
  });
  const [newBenefit, setNewBenefit] = useState('');

  const handleEdit = () => {
    setFormData({
      ...compensation,
      benefits_important: compensation.benefits_important || [],
    });
    setIsEditModalOpen(true);
  };

  const handleSave = () => {
    onUpdate(formData);
    setIsEditModalOpen(false);
  };

  const handleCancel = () => {
    setFormData({
      ...compensation,
      benefits_important: compensation.benefits_important || [],
    });
    setIsEditModalOpen(false);
  };

  const addBenefit = (benefit: string) => {
    if (benefit && !(formData.benefits_important || []).includes(benefit)) {
      setFormData({
        ...formData,
        benefits_important: [...(formData.benefits_important || []), benefit],
      });
    }
    setNewBenefit('');
  };

  const removeBenefit = (benefit: string) => {
    setFormData({
      ...formData,
      benefits_important: (formData.benefits_important || []).filter(
        (b) => b !== benefit
      ),
    });
  };

  const getCurrencySymbol = (code: string) => {
    return CURRENCIES.find((c) => c.code === code)?.symbol || code;
  };

  const formatCompensation = (
    min: number | null,
    max: number | null,
    currency: string
  ) => {
    const symbol = getCurrencySymbol(currency);

    if (!min && !max) return 'Not specified';

    if (min && max && min !== max) {
      return `${symbol}${min.toLocaleString()} - ${symbol}${max.toLocaleString()}`;
    } else {
      const amount = min || max;
      return `${symbol}${amount?.toLocaleString()}`;
    }
  };

  const getTypeLabel = (type: string) => {
    return COMPENSATION_TYPES.find((t) => t.value === type)?.label || type;
  };

  const hasCompensationData =
    compensation.compensation_expectation_min || compensation.compensation_expectation_max;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Compensation Expectations</h3>
        {isEditing && (
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Settings className="mr-2 h-4 w-4" />
            Edit Compensation
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Compensation Range</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasCompensationData ? (
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCompensation(
                    compensation.compensation_expectation_min,
                    compensation.compensation_expectation_max,
                    compensation.compensation_currency
                  )}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {getTypeLabel(compensation.compensation_type)}
                  {compensation.compensation_currency !== 'USD' && (
                    <span className="ml-2">
                      (
                      {
                        CURRENCIES.find(
                          (c) => c.code === compensation.compensation_currency
                        )?.name
                      }
                      )
                    </span>
                  )}
                </div>
              </div>

              {compensation.equity_interest && (
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <Badge variant="secondary">Open to Equity</Badge>
                </div>
              )}

              {(compensation.benefits_important || []).length > 0 && (
                <div>
                  <h4 className="mb-2 flex items-center space-x-2 font-medium">
                    <Heart className="h-4 w-4" />
                    <span>Important Benefits</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(compensation.benefits_important || []).map((benefit) => (
                      <Badge key={benefit} variant="outline">
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <DollarSign className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p className="text-sm">
                {isEditing
                  ? 'Set your compensation expectations to help organizations understand your requirements'
                  : 'Compensation expectations not specified'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Compensation Expectations</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Compensation Type */}
            <div className="space-y-2">
              <Label>Compensation Type</Label>
              <Select
                value={formData.compensation_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, compensation_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select compensation type" />
                </SelectTrigger>
                <SelectContent>
                  {COMPENSATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center space-x-2">
                        <type.icon className="h-4 w-4" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select
                value={formData.compensation_currency}
                onValueChange={(value) =>
                  setFormData({ ...formData, compensation_currency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name} ({currency.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Compensation Range */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="minComp">Minimum</Label>
                <Input
                  id="minComp"
                  type="number"
                  min="0"
                  value={formData.compensation_expectation_min || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      compensation_expectation_min: e.target.value
                        ? parseInt(e.target.value)
                        : null,
                    })
                  }
                  placeholder="e.g. 150000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxComp">Maximum</Label>
                <Input
                  id="maxComp"
                  type="number"
                  min="0"
                  value={formData.compensation_expectation_max || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      compensation_expectation_max: e.target.value
                        ? parseInt(e.target.value)
                        : null,
                    })
                  }
                  placeholder="e.g. 250000"
                />
              </div>
            </div>

            {/* Equity Interest */}
            <div className="flex items-center space-x-2">
              <input
                id="equity"
                type="checkbox"
                checked={formData.equity_interest}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    equity_interest: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="equity">
                I&apos;m open to equity compensation
              </Label>
            </div>

            {/* Important Benefits */}
            <div className="space-y-4">
              <Label>Important Benefits</Label>

              {/* Add benefit input */}
              <div className="flex space-x-2">
                <Select value={newBenefit} onValueChange={setNewBenefit}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a benefit" />
                  </SelectTrigger>
                  <SelectContent>
                    {BENEFITS_OPTIONS.filter(
                      (benefit) =>
                        !(formData.benefits_important || []).includes(benefit)
                    ).map((benefit) => (
                      <SelectItem key={benefit} value={benefit}>
                        {benefit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addBenefit(newBenefit)}
                  disabled={!newBenefit}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Selected benefits */}
              {(formData.benefits_important || []).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(formData.benefits_important || []).map((benefit) => (
                    <Badge
                      key={benefit}
                      variant="secondary"
                      className="flex items-center space-x-1"
                    >
                      <span>{benefit}</span>
                      <button
                        type="button"
                        onClick={() => removeBenefit(benefit)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
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
