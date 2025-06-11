// app/admin/products/page.tsx
"use client";

import Link from 'next/link';
import { Folder, Package, Home, Image } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProductsPage() {
  const router = useRouter();

  // Prefetch routes on component mount
  useEffect(() => {
    // Prefetch all the routes that users are likely to visit
    router.prefetch('/admin/products/categories');
    router.prefetch('/admin/products/list');
    router.prefetch('/admin/products/home-category');
    router.prefetch('/admin/hero/list');
  }, [router]);

  // Admin cards data for better maintainability
  const adminCards = [
    {
      href: '/admin/products/categories',
      icon: Folder,
      title: 'Categories',
      description: 'Manage product categories',
      color: 'blue'
    },
    {
      href: '/admin/products/list',
      icon: Package,
      title: 'Products',
      description: 'Manage product inventory',
      color: 'blue'
    },
    {
      href: '/admin/products/home-category',
      icon: Home,
      title: 'Home Categories',
      description: 'Manage Home Categories',
      color: 'green'
    },
    {
      href: '/admin/hero/list',
      icon: Image,
      title: 'Hero Section',
      description: 'Manage Hero Section',
      color: 'purple'
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        hover: 'hover:bg-blue-100'
      },
      green: {
        bg: 'bg-green-50',
        text: 'text-green-600',
        hover: 'hover:bg-green-100'
      },
      purple: {
        bg: 'bg-purple-50',
        text: 'text-purple-600',
        hover: 'hover:bg-purple-100'
      }
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Products Management</h2>

      {/* Admin Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
        {adminCards.map((card) => {
          const Icon = card.icon;
          const colors = getColorClasses(card.color);
          
          return (
            <Link 
              key={card.href}
              href={card.href}
              prefetch={true} // Enable prefetching for this specific link
            >
              <div className={`bg-white rounded-lg shadow-md p-6 flex flex-col items-center justify-center h-48 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 ${colors.hover}`}>
                <div className={`${colors.bg} p-4 rounded-lg mb-4 transition-colors duration-200`}>
                  <Icon className={`w-12 h-12 ${colors.text}`} />
                </div>
                <h3 className={`text-lg font-medium ${colors.text}`}>{card.title}</h3>
                <p className="text-gray-500 text-center mt-2">{card.description}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Dashboard Summary */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Inventory Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4 hover:border-blue-300 transition-colors">
            <p className="text-gray-500">Total Products</p>
            <p className="text-2xl font-bold">125</p>
          </div>
          <div className="border rounded-lg p-4 hover:border-blue-300 transition-colors">
            <p className="text-gray-500">Total Categories</p>
            <p className="text-2xl font-bold">18</p>
          </div>
          <div className="border rounded-lg p-4 hover:border-orange-300 transition-colors">
            <p className="text-gray-500">Low Stock Items</p>
            <p className="text-2xl font-bold text-orange-500">7</p>
          </div>
        </div>
      </div>
    </div>
  );
}