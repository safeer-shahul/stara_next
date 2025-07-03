// app/admin/layout.tsx
"use client";

import { ReactNode, useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import apiService from '@/utils/api/apiService';
import { Menu, X, LogOut, LayoutDashboard, Package, ShoppingCart, Percent, Tag, Users, Eye } from 'lucide-react';
import { AdminUserProvider } from './context/AdminUserContext';

interface AdminUser {
  name: string;
  username: string | undefined;
  isStaff: boolean;
  allowedRoutes?: string[];
  is_superuser?: boolean;
}

interface NavigationItem {
  href: string;
  label: string;
  exact?: boolean;
  startsWith?: boolean | string;
  icon: any;
  requiredPermissions?: string[];
  staffOnly?: boolean;
  superuserOnly?: boolean;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [isLoading, setIsLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigationItems = useMemo<NavigationItem[]>(() => [
    {
      href: '/admin',
      label: 'Dashboard',
      exact: true,
      icon: LayoutDashboard,
    },
    {
      href: '/admin/products',
      label: 'Products',
      startsWith: true,
      icon: Package,
      superuserOnly: true,
    },
    {
      href: '/admin/orders/list',
      label: 'Orders',
      startsWith: '/admin/orders',
      icon: ShoppingCart,
      requiredPermissions: ['/admin/orders'],
    },
    {
      href: '/admin/offers/list',
      label: 'Offers',
      startsWith: '/admin/offers',
      icon: Percent,
      superuserOnly: true,
    },
    {
      href: '/admin/coupons/list',
      label: 'Coupons',
      startsWith: true,
      icon: Tag,
      superuserOnly: true,
    },
    {
      href: '/admin/staff/list',
      label: 'Staffs',
      startsWith: true,
      icon: Users,
      superuserOnly: true,
    },
  ], []);

  useEffect(() => {
    navigationItems.forEach(item => router.prefetch(item.href));
    router.prefetch('/');
  }, [router, navigationItems]);

  const getStaffPermissions = useCallback((userProfile: any): string[] => {
    const staffPermissions: string[] = [
      '/admin',
      '/admin/orders',
    ];

    if (userProfile.staff_role === 'order_manager') {
      staffPermissions.push('/admin/orders');
    }

    return staffPermissions;
  }, []);

  const checkAuth = useCallback(async () => {
    if (pathname === '/admin/login') {
      setIsLoading(false);
      setAuthChecked(true);
      return;
    }

    if (authChecked && adminUser) {
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No token found');
      }

      if (!adminUser) {
        const userProfile = await apiService.getUserProfile();
        let currentUser: AdminUser | null = null;

        if (userProfile.is_superuser) {
          currentUser = {
            name: userProfile.first_name || userProfile.email || userProfile.username || 'Admin User',
            username: userProfile.username,
            isStaff: false,
            is_superuser: true,
          };
        } else if (userProfile.is_staff) {
          const staffPermissions = getStaffPermissions(userProfile);

          currentUser = {
            name: userProfile.first_name || userProfile.email || userProfile.username || 'Staff User',
            username: userProfile.username,
            isStaff: true,
            is_superuser: false,
            allowedRoutes: staffPermissions,
          };
        } else {
          throw new Error('User is not authorized to access admin panel');
        }

        setAdminUser(currentUser);
      }

      setAuthChecked(true);
    } catch (error) {
      console.error('Auth check failed:', error);
      setAdminUser(null);
      setAuthChecked(false);
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }, [pathname, adminUser, authChecked, router, getStaffPermissions]);

  useEffect(() => {
    if ((pathname === '/admin/login' && authChecked) || (adminUser && authChecked)) {
      setIsLoading(false);
      return;
    }
    checkAuth();
  }, [pathname, checkAuth, adminUser, authChecked]);

  const handleLogout = useCallback(() => {
    setAdminUser(null);
    setAuthChecked(false);
    apiService.logout();
    router.push('/admin/login');
  }, [router]);

  const filteredNavigationItems = useMemo(() => {
    if (!adminUser) return [];

    return navigationItems.filter(item => {
      if (adminUser.is_superuser) {
        return !item.staffOnly;
      }

      if (adminUser.isStaff) {
        if (item.superuserOnly) {
          return false;
        }

        if (item.requiredPermissions && item.requiredPermissions.length > 0) {
          return item.requiredPermissions.some(permission =>
            adminUser.allowedRoutes?.some(allowedPath => {
              return allowedPath === permission || allowedPath.startsWith(permission + '/') || permission.startsWith(allowedPath + '/');
            })
          );
        }

        if (adminUser.allowedRoutes) {
          return adminUser.allowedRoutes.some(allowedPath => {
            if (item.exact && item.href === allowedPath) return true;
            return item.href === allowedPath ||
                   item.href.startsWith(allowedPath + '/') ||
                   allowedPath.startsWith(item.href.split('/').slice(0, -1).join('/'));
          });
        }
      }

      return false;
    });
  }, [adminUser, navigationItems]);

  const isNavItemActive = useCallback((item: NavigationItem): boolean => {
    if (item.exact) {
      return pathname === item.href;
    }

    if (typeof item.startsWith === 'string') {
      return pathname.startsWith(item.startsWith);
    }

    if (item.startsWith === true) {
      return pathname.startsWith(item.href);
    }

    return pathname.startsWith(item.href);
  }, [pathname]);

  const renderNavLink = useCallback((item: NavigationItem) => {
    const isActive = isNavItemActive(item);
    const Icon = item.icon;

    return (
      <li key={item.href} className="mb-1">
        <Link
          href={item.href}
          className={`flex items-center py-2 px-4 rounded-lg transition-colors duration-150
            ${isActive ? 'bg-[var(--color-primary-950)] text-white' : 'text-gray-700 hover:bg-gray-200'}
          `}
          prefetch={true}
          onClick={() => setIsSidebarOpen(false)}
        >
          {Icon && <Icon className="w-5 h-5 mr-3" />}
          <span>{item.label}</span>
        </Link>
      </li>
    );
  }, [isNavItemActive]);

  // Add useEffect to handle body overflow
  useEffect(() => {
    // Prevent body scroll when admin layout is mounted
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      // Restore body scroll when component unmounts
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--color-primary-950)] mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (pathname === '/admin/login' || !adminUser) {
    return <>{children}</>;
  }

  if (adminUser.isStaff) {
    const isCurrentPathAllowed = adminUser.allowedRoutes?.some(allowedPath => {
      if (pathname === allowedPath) return true;
      if (pathname.startsWith(allowedPath) &&
          (pathname.length === allowedPath.length || pathname[allowedPath.length] === '/')) {
        return true;
      }
      return false;
    });

    if (!isCurrentPathAllowed) {
      console.warn(`Staff user '${adminUser.username}' attempted to access unauthorized path: '${pathname}'. Redirecting to dashboard.`);
      router.push('/admin');
      return null;
    }
  }

  return (
    <AdminUserProvider adminUser={adminUser}>
      {/* Prevent body scroll and ensure full height */}
      <div className="fixed inset-0 flex bg-gray-50 text-gray-800">
        {/* Mobile sidebar overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black opacity-50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Sidebar - always fixed to left */}
        <aside
          className={`fixed inset-y-0 left-0 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-40 flex flex-col
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0 lg:shadow-none lg:border-r border-gray-200
          `}
        >
          {/* Sidebar header - fixed */}
          <div className="p-5 text-2xl font-extrabold text-primary-950 border-b border-[var(--color-primary-950)] flex justify-between items-center flex-shrink-0">
            STARA Admin
            <button
              className="lg:hidden text-gray-600 hover:text-gray-800"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Sidebar navigation - scrollable */}
          <div className="flex-1 overflow-y-auto">
            <nav className="mt-6 px-4">
              <ul>
                {filteredNavigationItems.map(renderNavLink)}

                {adminUser && adminUser.is_superuser && (
                  <li className="mt-8 pt-4 border-t border-gray-200">
                    <Link
                      href="/"
                      className="flex items-center py-2 px-4 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors duration-150"
                      prefetch={true}
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <Eye className="w-5 h-5 mr-3" />
                      <span>View Site</span>
                    </Link>
                  </li>
                )}

                <li>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full text-left py-2 px-4 rounded-lg text-red-600 hover:bg-red-100 transition-colors duration-150 mt-2"
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    <span>Logout</span>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </aside>

        {/* Main content area - offset by sidebar width */}
        <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
          {/* Header - fixed */}
          <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
            <div className="p-4 flex justify-between items-center">
              <button
                className="lg:hidden text-gray-600 hover:text-gray-800"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-bold text-primary-950 ml-4 lg:ml-0">
                Admin Dashboard
              </h1>
              <div className="flex items-center space-x-4">
                <span className="text-gray-700 font-medium">
                  Welcome, {adminUser.name || adminUser.username}
                  {adminUser.isStaff && (
                    <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      Staff
                    </span>
                  )}
                  {adminUser.is_superuser && (
                    <span className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                      Super Admin
                    </span>
                  )}
                </span>
              </div>
            </div>
          </header>

          {/* Main content - only this area scrolls */}
          <main className="flex-1 overflow-y-auto bg-gray-100">
            <div className="p-6">
              <div className="bg-white rounded-lg shadow p-6">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </AdminUserProvider>
  );
}