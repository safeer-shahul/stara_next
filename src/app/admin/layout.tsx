// app/admin/layout.tsx
"use client";

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import apiService from '@/utils/api/apiService';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<{ name: string; username: string; } | null>(null);

  console.log('pathname',pathname)
  useEffect(() => {
    const checkAuth = async () => {
      // If we're on the login page, don't check auth
      if (pathname === '/admin/login') {
        setIsLoading(false);
        return;
      }

      try {
        // Check if token exists
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('No token found');
        }
        
        // Verify if user is admin by fetching profile
        const userProfile = await apiService.getUserProfile();
        
        if (!userProfile.is_superuser) {
          throw new Error('User is not an admin');
        }
        
        // User is authenticated and is an admin
        setAdminUser({
          name: userProfile.name,
          username: userProfile.email || userProfile.username || 'Admin'
        });
      } catch (error) {
        console.error('Auth check failed:', error);
        // Redirect to login page
        router.push('/admin/login');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [router, pathname]);

  const handleLogout = () => {
    // Use the apiService logout method
    apiService.logout();
  };

  // Show loading state
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  // If on login page or not authenticated, just show children (which will be the login form)
  if (pathname === '/admin/login' || !adminUser) {
    return <>{children}</>;
  }

  // Show admin layout with navigation when authenticated
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white">
        <div className="p-4 text-xl font-bold">STARA Admin</div>
        
        <nav className="mt-8">
          <ul>
            <li className="mb-2">
              <Link href="/admin" className={`block py-2 px-4 hover:bg-gray-700 ${pathname === '/admin' ? 'bg-gray-700' : ''}`}>
                Dashboard
              </Link>
            </li>
            <li className="mb-2">
              <Link href="/admin/products" className={`block py-2 px-4 hover:bg-gray-700 ${pathname.startsWith('/admin/products') ? 'bg-gray-700' : ''}`}>
                Products
              </Link>
            </li>
            <li className="mb-2">
              <Link href="/admin/orders" className={`block py-2 px-4 hover:bg-gray-700 ${pathname.startsWith('/admin/orders') ? 'bg-gray-700' : ''}`}>
                Orders
              </Link>
            </li>
            <li className="mb-2">
              <Link href="/admin/users" className={`block py-2 px-4 hover:bg-gray-700 ${pathname.startsWith('/admin/users') ? 'bg-gray-700' : ''}`}>
                Users
              </Link>
            </li>
            <li className="mb-2">
              <Link href="/admin/settings" className={`block py-2 px-4 hover:bg-gray-700 ${pathname.startsWith('/admin/settings') ? 'bg-gray-700' : ''}`}>
                Settings
              </Link>
            </li>
            <li className="mt-8">
              <Link href="/" className="block py-2 px-4 hover:bg-gray-700">
                View Site
              </Link>
            </li>
            <li>
              <button 
                onClick={handleLogout}
                className="block w-full text-left py-2 px-4 hover:bg-gray-700"
              >
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow">
          <div className="p-4 flex justify-between items-center">
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <div>
              <span>{adminUser.username}</span>
            </div>
          </div>
        </header>
        
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}