// app/admin/layout.tsx
"use client";

import { ReactNode, useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import apiService from '@/utils/api/apiService';

interface AdminUser {
  name: any;
  username: any;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  console.log('pathname', pathname);

  // Memoize navigation items to prevent unnecessary re-renders
  const navigationItems = useMemo(() => [
    { href: '/admin', label: 'Dashboard', exact: true },
    { href: '/admin/products', label: 'Products', startsWith: true },
    { href: '/admin/orders/list', label: 'Orders', startsWith: '/admin/orders' },
    { href: '/admin/offers/list', label: 'Offers', startsWith: '/admin/offers' },
    { href: '/admin/coupons/list', label: 'Coupons', startsWith: '/admin/coupons' },
    { href: '/admin/users', label: 'Users', startsWith: true },
    { href: '/admin/settings', label: 'Settings', startsWith: true },
  ], []);

  // Prefetch routes for better performance
  useEffect(() => {
    // Prefetch commonly accessed admin routes
    router.prefetch('/admin');
    router.prefetch('/admin/products');
    router.prefetch('/admin/orders/list');
    router.prefetch('/admin/offers/list');
    router.prefetch('/admin/coupons/list');
    router.prefetch('/admin/users');
    router.prefetch('/admin/settings');
    router.prefetch('/');
  }, [router]);

  // Memoized auth check function
  const checkAuth = useCallback(async () => {
    // If we're on the login page, don't check auth
    if (pathname === '/admin/login') {
      setIsLoading(false);
      setAuthChecked(true);
      return;
    }

    // If auth was already checked and user exists, don't check again
    if (authChecked && adminUser) {
      setIsLoading(false);
      return;
    }

    try {
      // Check if token exists
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No token found');
      }
      
      // Only fetch user profile if we don't have admin user data
      if (!adminUser) {
        const userProfile = await apiService.getUserProfile();
        
        if (!userProfile.is_superuser) {
          throw new Error('User is not an admin');
        }
        
        // User is authenticated and is an admin
        setAdminUser({
          name: userProfile.name,
          username: userProfile.email || userProfile.username || 'Admin'
        });
      }
      
      setAuthChecked(true);
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear any existing auth data
      setAdminUser(null);
      setAuthChecked(false);
      // Redirect to login page
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }, [pathname, adminUser, authChecked, router]);

  // Run auth check only when necessary
  useEffect(() => {
    // Skip if we're on login page and already checked, or if we have valid admin user
    if ((pathname === '/admin/login' && authChecked) || (adminUser && authChecked)) {
      setIsLoading(false);
      return;
    }
    
    checkAuth();
  }, [pathname, checkAuth]);

  // Memoized logout handler
  const handleLogout = useCallback(() => {
    // Clear local state
    setAdminUser(null);
    setAuthChecked(false);
    // Use the apiService logout method
    apiService.logout();
  }, []);

  // Memoized navigation link renderer
  const renderNavLink = useCallback((item: typeof navigationItems[0]) => {
    const isActive = item.exact 
      ? pathname === item.href
      : item.startsWith === true 
        ? pathname.startsWith(item.href)
        : typeof item.startsWith === 'string'
          ? pathname.startsWith(item.startsWith)
          : pathname === item.href;

    return (
      <li key={item.href} className="mb-2">
        <Link 
          href={item.href} 
          className={`block py-2 px-4 hover:bg-gray-700 transition-colors duration-150 ${
            isActive ? 'bg-gray-700' : ''
          }`}
          prefetch={true}
        >
          {item.label}
        </Link>
      </li>
    );
  }, [pathname]);

  // Show loading state with better UX
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If on login page or not authenticated, just show children
  if (pathname === '/admin/login' || !adminUser) {
    return <>{children}</>;
  }

  // Show admin layout with navigation when authenticated
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white flex-shrink-0">
        <div className="p-4 text-xl font-bold border-b border-gray-700">
          STARA Admin
        </div>
        
        <nav className="mt-4 px-2">
          <ul>
            {navigationItems.map(renderNavLink)}
            
            {/* Separator */}
            <li className="border-t border-gray-700 mt-6 pt-4">
              <Link 
                href="/" 
                className="block py-2 px-4 hover:bg-gray-700 transition-colors duration-150"
                prefetch={true}
              >
                View Site
              </Link>
            </li>
            <li>
              <button 
                onClick={handleLogout}
                className="block w-full text-left py-2 px-4 hover:bg-gray-700 transition-colors duration-150"
              >
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b flex-shrink-0">
          <div className="p-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {adminUser.username}</span>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}