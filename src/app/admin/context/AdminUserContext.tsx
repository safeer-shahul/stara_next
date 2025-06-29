// app/admin/context/AdminUserContext.tsx
"use client";

import { createContext, useContext, ReactNode } from 'react';

// Define the structure for an admin user, including staff-specific properties
interface AdminUser {
  name: string;
  username: string | undefined;
  isStaff: boolean;
  allowedRoutes?: string[];
  is_superuser?: boolean;
}

// Create the context with a default null value
const AdminUserContext = createContext<AdminUser | null>(null);

// Custom hook to use the AdminUserContext
export function useAdminUser() {
  const context = useContext(AdminUserContext);
  if (context === undefined) {
    throw new Error('useAdminUser must be used within an AdminUserProvider');
  }
  return context;
}

// Provider component
export function AdminUserProvider({ children, adminUser }: { children: ReactNode; adminUser: AdminUser | null }) {
  return (
    <AdminUserContext.Provider value={adminUser}>
      {children}
    </AdminUserContext.Provider>
  );
}