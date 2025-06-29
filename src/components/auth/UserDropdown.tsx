// src/components/auth/UserDropdown.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, LogOut, LayoutDashboard } from 'lucide-react';
import apiService from '@/utils/api/apiService';

interface UserDropdownProps {
  userProfile?: {
    first_name?: string;
    email: string;
    is_superuser?: boolean;
    is_staff?: boolean;
  };
}

const UserDropdown = ({ userProfile }: UserDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Determine if the user is an admin or staff
  const isAdminOrStaff = userProfile?.is_superuser || userProfile?.is_staff;
  const adminDashboardLink = '/admin'; // Admin dashboard route

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle logout
  const handleLogout = useCallback(() => {
    setIsOpen(false);
    apiService.logout();
    window.dispatchEvent(new Event('userLoggedOut'));
    router.push('/'); 
  }, [router]);
  
  // Display name and initials
  const displayName = userProfile?.first_name || userProfile?.email || 'User';
  const displayEmail = userProfile?.email || '';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-8 h-8 cursor-pointer rounded-full bg-[var(--color-primary-950)] text-white hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:ring-opacity-50 transition duration-150"
        aria-label="Open user menu"
      >
        <span className="text-sm font-medium">{initials}</span>
      </button>
      
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200 animate-fade-in-down"
          role="menu" 
          aria-orientation="vertical" 
          aria-labelledby="user-menu-button"
        >
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{displayName}</p>
            <p className="text-sm text-gray-500 truncate">{displayEmail}</p>
          </div>
          
          {/* Conditional link: Admin Dashboard for admin/staff, Your Profile for others */}
          {isAdminOrStaff ? (
            <Link
              href={adminDashboardLink}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition duration-150"
              onClick={() => setIsOpen(false)}
              role="menuitem"
            >
              <LayoutDashboard size={16} className="mr-2" />
              Admin Dashboard
            </Link>
          ) : (
            <Link
              href="/account"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition duration-150"
              onClick={() => setIsOpen(false)}
              role="menuitem"
            >
              <User size={16} className="mr-2" />
              Your Profile
            </Link>
          )}
          
          <div className="border-t border-gray-100 my-1"></div>
          
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center cursor-pointer transition duration-150"
            role="menuitem"
          >
            <LogOut size={16} className="mr-2" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;