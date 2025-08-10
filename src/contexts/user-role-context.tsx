'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useUserRole as useUserRoleHook } from '@/hooks/use-user-role';

// Create context for user role data
const UserRoleContext = createContext<ReturnType<typeof useUserRoleHook> | null>(null);

// Provider component
export function UserRoleProvider({ children }: { children: ReactNode }) {
  const userRoleData = useUserRoleHook();
  
  return (
    <UserRoleContext.Provider value={userRoleData}>
      {children}
    </UserRoleContext.Provider>
  );
}

// Custom hook to use the context
export function useUserRole() {
  const context = useContext(UserRoleContext);
  
  // If no context, fall back to direct hook usage (for backwards compatibility)
  if (!context) {
    console.warn('[useUserRole] Used outside of UserRoleProvider, falling back to direct hook');
    // This import will cause issues, so we should throw an error instead
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }
  
  return context;
}