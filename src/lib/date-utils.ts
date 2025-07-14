// Shared utilities for date formatting and manipulation

/**
 * Format a date string to a human-readable relative time
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  // Future dates
  if (diffInMs < 0) {
    const absDiffInDays = Math.abs(diffInDays);
    if (absDiffInDays === 0) return 'Today';
    if (absDiffInDays === 1) return 'Tomorrow';
    if (absDiffInDays < 7) return `In ${absDiffInDays} days`;
    if (absDiffInDays < 30) return `In ${Math.floor(absDiffInDays / 7)} weeks`;
    return date.toLocaleDateString();
  }

  // Past dates
  if (diffInSeconds < 60) return 'Just now';
  if (diffInMinutes === 1) return '1 minute ago';
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  if (diffInHours === 1) return '1 hour ago';
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInWeeks === 1) return '1 week ago';
  if (diffInWeeks < 4) return `${diffInWeeks} weeks ago`;
  if (diffInMonths === 1) return '1 month ago';
  if (diffInMonths < 12) return `${diffInMonths} months ago`;
  if (diffInYears === 1) return '1 year ago';
  if (diffInYears < 5) return `${diffInYears} years ago`;

  return date.toLocaleDateString();
}

/**
 * Format a date string to a short format (e.g., "Jan 15, 2024")
 */
export function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date string to include time (e.g., "Jan 15, 2024 at 3:30 PM")
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Check if a date is within the last N days
 */
export function isWithinDays(dateString: string, days: number): boolean {
  const date = new Date(dateString);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return date > cutoff;
}

/**
 * Check if a date is today
 */
export function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is within the current week
 */
export function isThisWeek(dateString: string): boolean {
  return isWithinDays(dateString, 7);
}

/**
 * Get the start and end of the current week
 */
export function getCurrentWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  // Get Monday (start of week)
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);

  // Get Sunday (end of week)
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Format duration between two dates
 */
export function formatDuration(startDate: string, endDate?: string): string {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();

  const diffInMs = end.getTime() - start.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInMonths = Math.floor(diffInDays / 30);

  if (diffInDays < 30) {
    return diffInDays === 1 ? '1 day' : `${diffInDays} days`;
  }

  if (diffInMonths < 12) {
    return diffInMonths === 1 ? '1 month' : `${diffInMonths} months`;
  }

  const years = Math.floor(diffInMonths / 12);
  const remainingMonths = diffInMonths % 12;

  if (remainingMonths === 0) {
    return years === 1 ? '1 year' : `${years} years`;
  }

  return `${years} year${years !== 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
}
