'use client';

import { Lock, HelpCircle, ChevronRight, ShoppingCart, Heart } from 'lucide-react';

type ActiveComponentType = 'orders' | 'change-password' | 'support' | null;

interface MenuCardProps {
  onMenuItemClick: (item: ActiveComponentType) => void;
  activeItem: ActiveComponentType;
}

export default function MenuCard({ onMenuItemClick, activeItem }: MenuCardProps) {
  // Define menu items
  const menuItems = [
    {
      id: 'orders',
      label: 'Orders',
      icon: <ShoppingCart size={18} />,
      description: 'View your order history'
    },
    {
      id: 'change-password',
      label: 'Change Password',
      icon: <Lock size={18} />,
      description: 'Update your password'
    },
    {
      id: 'wishlist',
      label: 'Wishlist',
      icon: <Heart size={18} />,
      description: 'Your wishlist products'
    },
    {
      id: 'support',
      label: 'Support',
      icon: <HelpCircle size={18} />,
      description: 'Get help with your account'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow">
      <h3 className="font-medium text-[16px] px-6 pt-4 pb-2">Account Settings</h3>
      <div className="divide-y divide-gray-100">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onMenuItemClick(item.id as ActiveComponentType)}
            className={`w-full px-6 py-4 cursor-pointer flex items-center justify-between text-left hover:bg-gray-50 ${
              activeItem === item.id ? 'bg-gray-50' : ''
            }`}
          >
            <div className="flex items-center">
              <span className={`mr-3 text-gray-600 ${
                activeItem === item.id ? 'text-[var(--color-primary-950)]' : ''
              }`}>
                {item.icon}
              </span>
              <div>
                <p className={`font-medium text-[14px] ${
                  activeItem === item.id ? 'text-[var(--color-primary-950)]' : 'text-gray-700'
                }`}>
                  {item.label}
                </p>
                <p className="text-sm text-gray-500  text-[14px]">{item.description}</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
        ))}
      </div>
    </div>
  );
}