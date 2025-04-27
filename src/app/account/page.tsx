'use client';

import { useState } from 'react';
import ProfileInfo from './components/ProfileInfo';
import MenuCard from './components/MenuCard';
import OrdersList from './components/OrdersList';
import ChangePassword from './components/ChangePassword';
import Support from './components/Support';
import Wishlist from './components/Wishlist';

type ActiveComponentType = 'orders' | 'change-password' | 'support' | 'wishlist' |  null;

export default function AccountPage() {
  const [activeComponent, setActiveComponent] = useState<ActiveComponentType>(null);

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
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-1/3 space-y-6">
          <ProfileInfo />
          <MenuCard onMenuItemClick={setActiveComponent} activeItem={activeComponent} />
        </div>
        <div className="w-full lg:w-2/3">
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