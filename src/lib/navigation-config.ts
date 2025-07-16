// Unified Navigation Configuration
// Site-wide navigation that works for all users

export interface NavigationItem {
  title: string;
  href: string;
  description: string;
  items?: NavigationSubItem[];
}

export interface NavigationSubItem {
  title: string;
  href: string;
  description: string;
  requiresAuth?: boolean;
  roles?: string[];
}

/**
 * Core site-wide navigation - visible to everyone
 * Role-specific content is handled at the page level, not navigation level
 */
export const coreNavigation: NavigationItem[] = [
  {
    title: 'Opportunities',
    href: '/opportunities',
    description: 'Discover board positions and career opportunities',
    items: [
      {
        title: 'Browse All',
        href: '/opportunities',
        description: 'View all available board positions',
      },
      {
        title: 'Recommended for You',
        href: '/opportunities?filter=recommended',
        description: 'AI-powered personalized recommendations',
        requiresAuth: true,
      },
      {
        title: 'Recently Added',
        href: '/opportunities?filter=recent',
        description: 'Latest opportunities posted',
      },
      {
        title: 'By Sector',
        href: '/opportunities/sectors',
        description: 'Browse by industry sector',
      },
    ],
  },
  {
    title: 'Learning',
    href: '/learning',
    description: 'Professional development and governance resources',
    items: [
      {
        title: 'Course Catalog',
        href: '/learning',
        description: 'Professional development courses',
      },
      {
        title: 'Governance Guides',
        href: '/learning/guides',
        description: 'Best practices and templates',
      },
      {
        title: 'Industry Insights',
        href: '/learning/insights',
        description: 'Market trends and analysis',
      },
      {
        title: 'Webinars',
        href: '/learning/webinars',
        description: 'Live and recorded sessions',
      },
    ],
  },
  {
    title: 'Platform',
    href: '/about',
    description: 'Learn about Nexus and our community',
    items: [
      {
        title: 'How It Works',
        href: '/about',
        description: 'Learn about our platform',
      },
      {
        title: 'For Organizations',
        href: '/organizations',
        description: 'Solutions for hiring board talent',
      },
      {
        title: 'Success Stories',
        href: '/success-stories',
        description: 'Real placement outcomes',
      },
      {
        title: 'Pricing',
        href: '/pricing',
        description: 'Plans and pricing options',
      },
    ],
  },
];

/**
 * Additional navigation items for authenticated users
 * These appear alongside core navigation when logged in
 * Note: Personal dashboard items are handled via user menu dropdown to avoid redundancy
 */
export const authenticatedNavigation: NavigationItem[] = [
  // Personal dashboard items moved to user menu dropdown
  // to avoid duplication and reduce navbar clutter
];

/**
 * Quick actions for the user menu dropdown
 * Role-specific actions that don't clutter the main navigation
 */
export const getUserQuickActions = (role?: string) => {
  const baseActions = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'My Profile', href: '/profile' },
    { title: 'Settings', href: '/settings' },
  ];

  switch (role) {
    case 'candidate':
      return [
        ...baseActions,
        { title: 'My Applications', href: '/applications' },
        { title: 'Saved Opportunities', href: '/opportunities/saved' },
      ];

    case 'organization_admin':
    case 'organization_employee':
      return [
        ...baseActions,
        { title: 'Post a Role', href: '/post-role' },
        { title: 'Manage Jobs', href: '/jobs' },
        { title: 'Find Talent', href: '/talent' },
      ];

    case 'consultant':
      return [
        ...baseActions,
        { title: 'My Clients', href: '/clients' },
        { title: 'Active Searches', href: '/searches' },
        { title: 'Candidate Network', href: '/talent' },
      ];

    default:
      return baseActions;
  }
};

/**
 * Get the complete navigation structure for the current user
 */
export const getNavigationForUser = (
  isAuthenticated: boolean,
  role?: string
) => {
  // role parameter is currently unused but may be used for role-based navigation in the future
  void role;
  if (isAuthenticated) {
    return [...coreNavigation, ...authenticatedNavigation];
  }

  return coreNavigation;
};

/**
 * Check if a user can access a specific navigation item
 */
export const canAccessNavItem = (
  item: NavigationSubItem,
  isAuthenticated: boolean,
  userRole?: string
): boolean => {
  if (item.requiresAuth && !isAuthenticated) {
    return false;
  }

  if (item.roles && userRole && !item.roles.includes(userRole)) {
    return false;
  }

  return true;
};
