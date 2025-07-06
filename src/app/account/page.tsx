// AccountPage.tsx
'use client';

import { useState, useRef } from 'react';
import ProfileInfo from './components/ProfileInfo';
import MenuCard from './components/MenuCard';
import OrdersList from './components/OrdersList';
import ChangePassword from './components/ChangePassword';
import Support from './components/Support';
import Wishlist from './components/Wishlist';
import Complaints from './components/Complaints';

// Define ActiveComponentType once, here, to resolve the TypeScript error
export type ActiveComponentType = 'orders' | 'change-password' | 'support' | 'wishlist' | 'complaints' | null;

export default function AccountPage() {
  const [activeComponent, setActiveComponent] = useState<ActiveComponentType>(null);
  const outletRef = useRef<HTMLDivElement>(null);

  // Function to handle menu item click with scroll
  const handleMenuItemClick = (item: ActiveComponentType) => {
    setActiveComponent(item);
    
    // Only scroll on mobile/tablet devices where outlet is underneath menu
    // Check if screen is smaller than lg breakpoint (1024px)
    setTimeout(() => {
      if (outletRef.current && typeof window !== 'undefined' && window.innerWidth < 1024) {
        // Get the element's position and add some offset
        const elementTop = outletRef.current.getBoundingClientRect().top + window.pageYOffset;
        const offsetTop = elementTop - 5; // 20px offset from top
        
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    }, 150);
  };

  // Function to render the active component
  const renderActiveComponent = () => {
    switch (activeComponent) {
      case 'orders':
        return <OrdersList />;
      case 'change-password':
        return <ChangePassword />;
      case 'support':
        return <Support />;
      case 'wishlist':
        return <Wishlist />;
      case 'complaints':
        return <Complaints />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-1/3 space-y-6">
          <ProfileInfo />
          <MenuCard onMenuItemClick={handleMenuItemClick} activeItem={activeComponent} />
        </div>
        <div ref={outletRef} className="w-full lg:w-2/3">
          {activeComponent ? (
            renderActiveComponent()
          ) : (
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
              <p className="text-gray-500">Select an option from the menu to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}