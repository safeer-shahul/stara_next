// /src/components/auth/UserDropdown.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, LogOut, Settings } from 'lucide-react';

interface UserDropdownProps {
  userProfile?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

const UserDropdown = ({ userProfile }: UserDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  const handleLogout = () => {
    localStorage.removeItem('accessTokenUser');
    setIsOpen(false);
    router.refresh();
  };

  const defaultName = userProfile?.name || 'User';
  const defaultEmail = userProfile?.email || 'user@example.com';
  const initials = defaultName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-[#175e7a] text-white hover:bg-opacity-90 focus:outline-none"
      >
        {userProfile?.avatar ? (
          <img
            src={userProfile.avatar}
            alt={defaultName}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <span className="text-sm font-medium">{initials}</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{defaultName}</p>
            <p className="text-sm text-gray-500 truncate">{defaultEmail}</p>
          </div>

          <Link 
            href="/account" 
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            onClick={() => setIsOpen(false)}
          >
            <User size={16} className="mr-2" />
            Your Profile
          </Link>

          <Link 
            href="/account/settings" 
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            onClick={() => setIsOpen(false)}
          >
            <Settings size={16} className="mr-2" />
            Account Settings
          </Link>

          <div className="border-t border-gray-100 my-1"></div>

          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
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