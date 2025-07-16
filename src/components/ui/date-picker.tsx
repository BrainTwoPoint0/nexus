'use client';

import * as React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DatePickerProps {
  id?: string;
  name?: string;
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export function DatePicker({
  id,
  name,
  label,
  value,
  onChange,
  disabled = false,
  placeholder = 'Select date',
  className,
  required = false,
}: DatePickerProps) {
  const [inputValue, setInputValue] = React.useState(value || '');

  // Format date for display (DD/MM/YYYY)
  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';

    // If it's already in YYYY-MM-DD format
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const date = new Date(dateString + 'T00:00:00');
      if (!isNaN(date.getTime())) {
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      }
    }

    return dateString;
  };

  // Convert display date to database format (YYYY-MM-DD)
  const formatDatabaseDate = (displayDate: string) => {
    if (!displayDate) return '';

    // Handle DD/MM/YYYY format
    const ddmmyyyy = displayDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        return `${year}-${String(parseInt(month)).padStart(2, '0')}-${String(parseInt(day)).padStart(2, '0')}`;
      }
    }

    // Handle MM/DD/YYYY format
    const mmddyyyy = displayDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mmddyyyy) {
      const [, month, day, year] = mmddyyyy;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        return `${year}-${String(parseInt(month)).padStart(2, '0')}-${String(parseInt(day)).padStart(2, '0')}`;
      }
    }

    // Handle YYYY-MM-DD format (already correct)
    if (displayDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return displayDate;
    }

    return '';
  };

  // Initialize display value
  React.useEffect(() => {
    setInputValue(formatDisplayDate(value || ''));
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Convert to database format and call onChange
    const dbFormat = formatDatabaseDate(newValue);
    if (onChange) {
      onChange(dbFormat);
    }
  };

  const handleInputBlur = () => {
    // Validate and reformat on blur
    const dbFormat = formatDatabaseDate(inputValue);
    if (dbFormat) {
      const displayFormat = formatDisplayDate(dbFormat);
      setInputValue(displayFormat);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={id}>
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </Label>
      )}
      <div className="relative">
        <Input
          id={id}
          name={name}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          disabled={disabled}
          placeholder={placeholder}
          className="pr-10"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Format: DD/MM/YYYY (e.g., 22/05/2022)
      </p>
    </div>
  );
}

// Alternative native date input component
export function NativeDatePicker({
  id,
  name,
  label,
  value,
  onChange,
  disabled = false,
  className,
  required = false,
}: DatePickerProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={id}>
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </Label>
      )}
      <Input
        id={id}
        name={name}
        type="date"
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className="w-full"
      />
    </div>
  );
}
