// app/admin/layout.tsx
"use client";

import { ReactNode, useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import apiService from '@/utils/api/apiService';
import { Menu, X, LogOut, LayoutDashboard, Package, ShoppingCart, Percent, Tag, Users, Settings, Eye } from 'lucide-react';

interface AdminUser {
  name: string;
  username: string;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigationItems = useMemo(() => [
    { href: '/admin', label: 'Dashboard', exact: true, icon: LayoutDashboard },
    { href: '/admin/products', label: 'Products', startsWith: true, icon: Package },
    { href: '/admin/orders/list', label: 'Orders', startsWith: '/admin/orders', icon: ShoppingCart },
    { href: '/admin/offers/list', label: 'Offers', startsWith: '/admin/offers', icon: Percent },
    { href: '/admin/coupons/list', label: 'Coupons', startsWith: '/admin/coupons', icon: Tag },
    { href: '/admin/staff/list', label: 'Staffs', startsWith: true, icon: Users },
    // { href: '/admin/settings', label: 'Settings', startsWith: true, icon: Settings },
  ], []);

  useEffect(() => {
    navigationItems.forEach(item => router.prefetch(item.href));
    router.prefetch('/');
  }, [router, navigationItems]);

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

        if (!userProfile.is_superuser) {
          throw new Error('User is not an admin');
        }

        setAdminUser({
          name: userProfile.name || 'Admin User',
          username: userProfile.email || userProfile.username || 'Admin'
        });
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
  }, [pathname, adminUser, authChecked, router]);

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

  const renderNavLink = useCallback((item: typeof navigationItems[0]) => {
    const isActive = item.exact
      ? pathname === item.href
      : typeof item.startsWith === 'string'
        ? pathname.startsWith(item.startsWith)
        : pathname.startsWith(item.href);

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
  }, [pathname]);

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

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-40
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0 lg:flex-shrink-0 lg:shadow-none lg:border-r border-gray-200
        `}
      >
        <div className="p-5 text-2xl font-extrabold text-primary-950 border-b border-[var(--color-primary-950)] flex justify-between items-center">
          STARA Admin
          <button
            className="lg:hidden text-gray-600 hover:text-gray-800"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-6 px-4">
          <ul>
            {navigationItems.map(renderNavLink)}

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
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
          <div className="p-4 flex justify-between items-center">
            <button
              className="lg:hidden text-gray-600 hover:text-gray-800"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-primary-950 ml-4 lg:ml-0">
              Admin Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 font-medium">
                Welcome, {adminUser.name || adminUser.username}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
          <div className="bg-white rounded-lg shadow p-6 min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}