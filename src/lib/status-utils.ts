// Shared utilities for status management across the application

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

/**
 * Get consistent badge variant for application/job statuses
 */
export function getStatusBadgeVariant(status: string): BadgeVariant {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'default';
    case 'reviewed':
    case 'under_review':
      return 'secondary';
    case 'interviewing':
    case 'interview_scheduled':
      return 'default';
    case 'offered':
    case 'offer_made':
      return 'default';
    case 'accepted':
    case 'hired':
      return 'default';
    case 'rejected':
    case 'declined':
      return 'destructive';
    case 'withdrawn':
    case 'cancelled':
      return 'outline';
    case 'active':
      return 'default';
    case 'inactive':
    case 'paused':
      return 'secondary';
    case 'draft':
      return 'outline';
    default:
      return 'secondary';
  }
}

/**
 * Get consistent color classes for status indicators
 */
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'text-yellow-600 bg-yellow-50';
    case 'reviewed':
    case 'under_review':
      return 'text-blue-600 bg-blue-50';
    case 'interviewing':
    case 'interview_scheduled':
      return 'text-purple-600 bg-purple-50';
    case 'offered':
    case 'offer_made':
      return 'text-green-600 bg-green-50';
    case 'accepted':
    case 'hired':
      return 'text-green-700 bg-green-100';
    case 'rejected':
    case 'declined':
      return 'text-red-600 bg-red-50';
    case 'withdrawn':
    case 'cancelled':
      return 'text-gray-600 bg-gray-50';
    case 'active':
      return 'text-green-600 bg-green-50';
    case 'inactive':
    case 'paused':
      return 'text-gray-600 bg-gray-50';
    case 'draft':
      return 'text-gray-500 bg-gray-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

/**
 * Get human-readable status labels
 */
export function getStatusLabel(status: string): string {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'Pending Review';
    case 'reviewed':
    case 'under_review':
      return 'Under Review';
    case 'interviewing':
      return 'Interviewing';
    case 'interview_scheduled':
      return 'Interview Scheduled';
    case 'offered':
    case 'offer_made':
      return 'Offer Made';
    case 'accepted':
      return 'Accepted';
    case 'hired':
      return 'Hired';
    case 'rejected':
      return 'Rejected';
    case 'declined':
      return 'Declined';
    case 'withdrawn':
      return 'Withdrawn';
    case 'cancelled':
      return 'Cancelled';
    case 'active':
      return 'Active';
    case 'inactive':
      return 'Inactive';
    case 'paused':
      return 'Paused';
    case 'draft':
      return 'Draft';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

/**
 * Get score-based styling for recommendation/match scores
 */
export function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600';
  if (score >= 75) return 'text-blue-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-gray-600';
}

/**
 * Get score-based labels for recommendation/match scores
 */
export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent Match';
  if (score >= 75) return 'Great Match';
  if (score >= 60) return 'Good Match';
  return 'Fair Match';
}

/**
 * Get progress bar color based on score
 */
export function getScoreProgressColor(score: number): string {
  if (score >= 90) return 'bg-green-500';
  if (score >= 75) return 'bg-blue-500';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-gray-400';
}
