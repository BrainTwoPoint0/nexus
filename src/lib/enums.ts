/**
 * Database Enum Definitions and Validation
 * Provides type-safe enum handling with user-friendly labels and natural language mapping
 */

// Database enum type definitions
export type AvailabilityStatus =
  | 'immediately_available'
  | 'available_3_months'
  | 'available_6_months'
  | 'not_available'
  | 'by_arrangement';

export type RemoteWorkPreference = 'no' | 'hybrid' | 'full' | 'occasional';

export type UserRole = 'candidate' | 'platform_admin';

// User-friendly enum labels for UI display
export const AVAILABILITY_STATUS_LABELS: Record<AvailabilityStatus, string> = {
  immediately_available: 'Immediately Available',
  available_3_months: 'Available in 3 Months',
  available_6_months: 'Available in 6 Months',
  not_available: 'Not Available',
  by_arrangement: 'By Arrangement',
};

export const REMOTE_WORK_LABELS: Record<RemoteWorkPreference, string> = {
  no: 'No Remote Work',
  hybrid: 'Hybrid (Remote + Office)',
  full: 'Fully Remote',
  occasional: 'Occasionally Remote',
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  candidate: 'Candidate',
  platform_admin: 'Platform Admin',
};

// Natural language keyword mapping for voice AI response parsing
export const AVAILABILITY_KEYWORDS: Record<string, AvailabilityStatus> = {
  // Immediately available variations
  immediately: 'immediately_available',
  'right now': 'immediately_available',
  now: 'immediately_available',
  asap: 'immediately_available',
  'as soon as possible': 'immediately_available',
  'straight away': 'immediately_available',
  'right away': 'immediately_available',
  today: 'immediately_available',
  'this week': 'immediately_available',
  'next week': 'immediately_available',

  // 3 months variations
  '3 months': 'available_3_months',
  'three months': 'available_3_months',
  quarter: 'available_3_months',
  'few months': 'available_3_months',
  'couple months': 'available_3_months',
  spring: 'available_3_months',
  '90 days': 'available_3_months',

  // 6 months variations
  '6 months': 'available_6_months',
  'six months': 'available_6_months',
  'half year': 'available_6_months',
  summer: 'available_6_months',
  'later this year': 'available_6_months',
  'end of year': 'available_6_months',

  // Not available variations
  'not available': 'not_available',
  unavailable: 'not_available',
  busy: 'not_available',
  committed: 'not_available',
  'under contract': 'not_available',
  'locked in': 'not_available',

  // By arrangement variations
  flexible: 'by_arrangement',
  depends: 'by_arrangement',
  negotiate: 'by_arrangement',
  discuss: 'by_arrangement',
  arrangement: 'by_arrangement',
  'case by case': 'by_arrangement',
  varies: 'by_arrangement',
};

export const REMOTE_WORK_KEYWORDS: Record<string, RemoteWorkPreference> = {
  // No remote work
  'office only': 'no',
  'in person': 'no',
  onsite: 'no',
  'on-site': 'no',
  'no remote': 'no',
  'prefer office': 'no',
  'office based': 'no',
  'traditional office': 'no',

  // Hybrid work
  hybrid: 'hybrid',
  mix: 'hybrid',
  combination: 'hybrid',
  flexible: 'hybrid',
  'some remote': 'hybrid',
  'part remote': 'hybrid',
  'few days office': 'hybrid',
  'few days remote': 'hybrid',
  split: 'hybrid',

  // Full remote
  'fully remote': 'full',
  'completely remote': 'full',
  'remote only': 'full',
  'work from home': 'full',
  wfh: 'full',
  'home office': 'full',
  distributed: 'full',
  'location independent': 'full',
  'digital nomad': 'full',

  // Occasional remote
  occasionally: 'occasional',
  sometimes: 'occasional',
  'when needed': 'occasional',
  'as needed': 'occasional',
  'minimal remote': 'occasional',
  'rare remote': 'occasional',
};

// Voice AI context strings for enum-aware questions
export const VOICE_AI_CONTEXTS = {
  availability_status: `
When asking about availability, use these specific options:
- "Immediately available" (can start right now or very soon)
- "Available in 3 months" (can start in about 3 months)
- "Available in 6 months" (can start in about 6 months)  
- "Not available" (not looking to change roles currently)
- "By arrangement" (flexible timing depending on opportunity)

Ask clearly: "When would you be available to start a new role? Are you immediately available, available in 3 months, 6 months, not available, or would it be by arrangement?"
`,

  remote_work_preference: `
When asking about remote work preferences, use these specific options:
- "No remote work" (prefer office-based work only)
- "Hybrid" (mix of remote and office work)
- "Fully remote" (work from home/anywhere)
- "Occasionally remote" (mostly office but some remote flexibility)

Ask clearly: "What are your remote work preferences? Do you prefer no remote work, hybrid (mix of office and remote), fully remote, or occasionally remote?"
`,

  role_context: `
The user's role in our platform:
- "Candidate" (default - individual professional looking for opportunities)
- "Platform Admin" (system administrator - internal use only)

All users are "Candidate" by default. They can create and join organizations through separate permissions, but their base role remains "Candidate".
Organization-specific roles (admin, employee, etc.) are handled through organization membership, not the user's base role.
`,
};

// Validation functions
export function isValidAvailabilityStatus(
  value: string
): value is AvailabilityStatus {
  return Object.keys(AVAILABILITY_STATUS_LABELS).includes(
    value as AvailabilityStatus
  );
}

export function isValidRemoteWorkPreference(
  value: string
): value is RemoteWorkPreference {
  return Object.keys(REMOTE_WORK_LABELS).includes(
    value as RemoteWorkPreference
  );
}

export function isValidUserRole(value: string): value is UserRole {
  return Object.keys(USER_ROLE_LABELS).includes(value as UserRole);
}

// Smart enum parsing from natural language responses
export function parseAvailabilityFromText(
  text: string
): AvailabilityStatus | null {
  const lowercaseText = text.toLowerCase();

  // Direct keyword matching
  for (const [keyword, status] of Object.entries(AVAILABILITY_KEYWORDS)) {
    if (lowercaseText.includes(keyword)) {
      return status;
    }
  }

  // Pattern matching for common phrases
  if (/in.*3.*month/i.test(text) || /3.*month/i.test(text)) {
    return 'available_3_months';
  }

  if (/in.*6.*month/i.test(text) || /6.*month/i.test(text)) {
    return 'available_6_months';
  }

  if (/immediately|asap|right now|now/i.test(text)) {
    return 'immediately_available';
  }

  if (/not.*available|unavailable|busy/i.test(text)) {
    return 'not_available';
  }

  if (/flexible|depends|negotiate|arrangement/i.test(text)) {
    return 'by_arrangement';
  }

  return null;
}

export function parseRemoteWorkFromText(
  text: string
): RemoteWorkPreference | null {
  const lowercaseText = text.toLowerCase();

  // Direct keyword matching
  for (const [keyword, preference] of Object.entries(REMOTE_WORK_KEYWORDS)) {
    if (lowercaseText.includes(keyword)) {
      return preference;
    }
  }

  // Pattern matching
  if (
    /fully.*remote|completely.*remote|remote.*only|work.*from.*home/i.test(text)
  ) {
    return 'full';
  }

  if (/hybrid|mix|combination|some.*remote|part.*remote/i.test(text)) {
    return 'hybrid';
  }

  if (/office.*only|in.*person|onsite|on-site|no.*remote/i.test(text)) {
    return 'no';
  }

  if (/occasionally|sometimes|when.*needed|minimal.*remote/i.test(text)) {
    return 'occasional';
  }

  return null;
}

// Get all enum values as arrays (useful for validation)
export const AVAILABILITY_STATUS_VALUES: AvailabilityStatus[] = Object.keys(
  AVAILABILITY_STATUS_LABELS
) as AvailabilityStatus[];
export const REMOTE_WORK_VALUES: RemoteWorkPreference[] = Object.keys(
  REMOTE_WORK_LABELS
) as RemoteWorkPreference[];
export const USER_ROLE_VALUES: UserRole[] = Object.keys(
  USER_ROLE_LABELS
) as UserRole[];

// Validation utility that provides helpful error messages
export function validateEnumValue<T extends string>(
  value: string,
  enumValues: T[],
  enumName: string
): { isValid: boolean; value?: T; error?: string } {
  if (enumValues.includes(value as T)) {
    return { isValid: true, value: value as T };
  }

  return {
    isValid: false,
    error: `Invalid ${enumName} value: "${value}". Valid options are: ${enumValues.join(', ')}`,
  };
}

// Helper to convert enum values to user-friendly options list for AI context
export function getEnumOptionsForAI(
  enumType: 'availability' | 'remote_work' | 'user_role'
): string {
  switch (enumType) {
    case 'availability':
      return Object.entries(AVAILABILITY_STATUS_LABELS)
        .map(([value, label]) => `"${value}" (${label})`)
        .join(', ');

    case 'remote_work':
      return Object.entries(REMOTE_WORK_LABELS)
        .map(([value, label]) => `"${value}" (${label})`)
        .join(', ');

    case 'user_role':
      return Object.entries(USER_ROLE_LABELS)
        .map(([value, label]) => `"${value}" (${label})`)
        .join(', ');

    default:
      return '';
  }
}
