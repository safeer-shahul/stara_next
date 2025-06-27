// app/admin/page.tsx
"use client";

import { useCallback, useEffect, useState } from 'react';
import { LayoutDashboard, Package, ShoppingCart, Users, DollarSign, Activity, Bell, UserCircle } from 'lucide-react'; // Import relevant icons

// Define a more specific type for adminUser
interface AdminUser {
  username?: string; // Optional as it might not always be there
  role?: string;     // Optional
  name?: string;     // Assuming 'name' might also exist
}

export default function AdminDashboard() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    // Get admin user from localStorage
    const storedUser = localStorage.getItem('adminUser');
    if (storedUser) {
      // Parse the stored user and set it
      const parsedUser = JSON.parse(storedUser);
      setAdminUser({
        username: parsedUser.username || parsedUser.email || 'Admin', // Use email or a default
        role: parsedUser.is_superuser ? 'Super Admin' : (parsedUser.role || 'Admin User'),
        name: parsedUser.name || parsedUser.username // Use name if available
      });
    }
  }, []);

  // Dashboard Summary Cards data for better maintainability
  const summaryCards = [
    {
      title: 'Total Products',
      value: '24', // These would typically be fetched from an API
      icon: Package,
      color: 'blue',
      description: 'Items in your inventory'
    },
    {
      title: 'New Orders',
      value: '12', // These would typically be fetched from an API
      icon: ShoppingCart,
      color: 'green',
      description: 'Orders received recently'
    },
    {
      title: 'Total Users',
      value: '156', // These would typically be fetched from an API
      icon: Users,
      color: 'purple',
      description: 'Registered accounts'
    },
    {
      title: 'Total Revenue',
      value: '₹3,240', // These would typically be fetched from an API
      icon: DollarSign,
      color: 'yellow',
      description: 'Gross earnings this month'
    }
  ];

  // Helper for card colors (reused from ProductsPage where applicable)
  const getColorClasses = useCallback((color: string) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        hoverBorder: 'hover:border-blue-300'
      },
      green: {
        bg: 'bg-green-50',
        text: 'text-green-600',
        hoverBorder: 'hover:border-green-300'
      },
      purple: {
        bg: 'bg-purple-50',
        text: 'text-purple-600',
        hoverBorder: 'hover:border-purple-300'
      },
      yellow: { // Added for Revenue card
        bg: 'bg-yellow-50',
        text: 'text-yellow-600',
        hoverBorder: 'hover:border-yellow-300'
      }
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <h2 className="text-3xl font-extrabold text-gray-800">
        <LayoutDashboard className="inline-block w-8 h-8 mr-3 text-[var(--color-primary-950)]" />
        Welcome to your Dashboard
      </h2>

      {/* Admin User Information Card (Improved) */}
      {adminUser && (
        <div className="bg-white rounded-xl shadow-lg p-6 flex items-center border border-gray-200">
          <UserCircle className="w-16 h-16 text-gray-400 mr-5 flex-shrink-0" />
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Hello, {adminUser.name || adminUser.username}!</h3>
            <p className="text-gray-600">
              You are logged in as <span className="font-medium text-[var(--color-primary-950)]">{adminUser.role}</span>.
            </p>
            <p className="text-gray-500 text-sm">Your quick overview of the system performance.</p>
          </div>
        </div>
      )}

      {/* Dashboard Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const colors = getColorClasses(card.color);
          return (
            <div key={card.title} className={`
              bg-white p-6 rounded-xl shadow-lg border border-gray-200
              flex flex-col items-start transition-all duration-300
              hover:shadow-xl hover:scale-[1.02] ${colors.hoverBorder}
            `}>
              <div className={`${colors.bg} p-3 rounded-full mb-4`}>
                <Icon className={`w-8 h-8 ${colors.text}`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">{card.title}</h3>
              <p className={`text-4xl font-bold ${colors.text}`}>{card.value}</p>
              <p className="text-sm text-gray-500 mt-1">{card.description}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Card */}
      <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
          <Activity className="w-6 h-6 mr-3 text-[var(--color-primary-950)]" />
          Recent Activity
        </h3>
        <ul className="divide-y divide-gray-200">
          <li className="py-3 flex items-center justify-between text-gray-700">
            <span><Bell className="inline-block w-4 h-4 mr-2 text-blue-500" /> New order (#1234) received - <span className="font-medium">₹128.50</span></span>
            <span className="text-xs text-gray-500">5 min ago</span>
          </li>
          <li className="py-3 flex items-center justify-between text-gray-700">
            <span><UserCircle className="inline-block w-4 h-4 mr-2 text-green-500" /> User <span className="font-medium">John Smith</span> registered</span>
            <span className="text-xs text-gray-500">30 min ago</span>
          </li>
          <li className="py-3 flex items-center justify-between text-gray-700">
            <span><Package className="inline-block w-4 h-4 mr-2 text-purple-500" /> Product <span className="font-medium">&quot;Premium Widget&quot;</span> updated</span>
            <span className="text-xs text-gray-500">1 hour ago</span>
          </li>
          <li className="py-3 flex items-center justify-between text-gray-700">
            <span><ShoppingCart className="inline-block w-4 h-4 mr-2 text-orange-500" /> Order #1233 marked as delivered</span>
            <span className="text-xs text-gray-500">Yesterday</span>
          </li>
          <li className="py-3 flex items-center justify-between text-gray-700">
            <span><Bell className="inline-block w-4 h-4 mr-2 text-red-500" /> New review posted for <span className="font-medium">&quot;Basic Widget&quot;</span></span>
            <span className="text-xs text-gray-500">2 days ago</span>
          </li>
        </ul>
      </div>
    </div>
  );
}