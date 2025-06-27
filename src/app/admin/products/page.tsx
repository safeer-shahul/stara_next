// app/admin/products/page.tsx
"use client";

import Link from 'next/link';
// Renamed 'Image' to 'ImageIcon' to avoid conflict with potential HTML <img> elements or browser APIs
import { Folder, Package, Home, Image as ImageIcon } from 'lucide-react';
import { useEffect, useMemo, useCallback } from 'react'; // Added useMemo and useCallback
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

  // Admin cards data for better maintainability (memoized for performance)
  const adminCards = useMemo(() => [
    {
      href: '/admin/products/categories',
      icon: Folder,
      title: 'Categories',
      description: 'Organize and manage product categories',
      color: 'blue'
    },
    {
      href: '/admin/products/list',
      icon: Package,
      title: 'Products',
      description: 'Add, edit, and view your product inventory',
      color: 'blue'
    },
    {
      href: '/admin/products/home-category',
      icon: Home,
      title: 'Home Categories',
      description: 'Curate categories featured on the homepage',
      color: 'green'
    },
    {
      href: '/admin/hero/list',
      icon: ImageIcon, // Using the renamed import
      title: 'Hero Section',
      description: 'Manage banners and sliders for the main page',
      color: 'purple'
    }
  ], []); // Dependencies array is empty as data is static

  // Memoized function for color classes to enhance performance
  const getColorClasses = useCallback((color: string) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        hoverBg: 'hover:bg-blue-100',
        hoverBorder: 'hover:border-blue-300', // For card border on hover
        ring: 'focus-visible:ring-blue-500' // For accessibility focus rings
      },
      green: {
        bg: 'bg-green-50',
        text: 'text-green-600',
        hoverBg: 'hover:bg-green-100',
        hoverBorder: 'hover:border-green-300',
        ring: 'focus-visible:ring-green-500'
      },
      purple: {
        bg: 'bg-purple-50',
        text: 'text-purple-600',
        hoverBg: 'hover:bg-purple-100',
        hoverBorder: 'hover:border-purple-300',
        ring: 'focus-visible:ring-purple-500'
      }
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue; // Default to blue
  }, []); // Dependencies array is empty as data is static

  return (
    <div className="space-y-10"> {/* Increased vertical spacing between sections */}
      <h2 className="text-3xl font-extrabold text-[var(--color-primary-950)]">
        Product & Content Management
      </h2>

      {/* Admin Action Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"> {/* More responsive grid */}
        {adminCards.map((card) => {
          const Icon = card.icon;
          const colors = getColorClasses(card.color);

          return (
            <Link
              key={card.href}
              href={card.href}
              prefetch={true}
              // Added 'group' class to allow styling of child elements on parent hover
              className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              tabIndex={0} // Ensure the link is tabbable for accessibility
            >
              <div className={`
                bg-white rounded-xl shadow-lg p-6 flex flex-col items-center justify-center text-center h-60 min-h-[240px]
                cursor-pointer transition-all duration-300 ease-in-out
                border border-gray-200
                hover:shadow-xl hover:scale-[1.02] ${colors.hoverBorder}
                ${colors.ring}
              `}>
                {/* Icon container with rounded-full for a softer look */}
                <div className={`${colors.bg} p-4 rounded-full mb-5 transition-colors duration-200 group-hover:scale-110 group-hover:shadow-md`}>
                  <Icon className={`w-14 h-14 ${colors.text} group-hover:scale-110 transition-transform duration-300`} />
                </div>
                <h3 className={`text-xl font-semibold text-gray-800 mb-2 group-hover:text-[var(--color-primary-950)] transition-colors duration-200`}>
                  {card.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">{card.description}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Inventory Summary Section */}
      <div className="bg-white rounded-xl shadow-lg p-7"> {/* Consistent card-like styling */}
        <h3 className="text-2xl font-semibold text-gray-800 mb-6">Inventory Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 flex flex-col items-start transition-all duration-200 hover:border-[var(--color-primary-950)]">
            <p className="text-gray-600 text-sm mb-1">Total Products</p>
            <p className="text-4xl font-bold text-[var(--color-primary-950)]">125</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 flex flex-col items-start transition-all duration-200 hover:border-[var(--color-primary-950)]">
            <p className="text-gray-600 text-sm mb-1">Total Categories</p>
            <p className="text-4xl font-bold text-[var(--color-primary-950)]">18</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 flex flex-col items-start transition-all duration-200 hover:border-orange-400">
            <p className="text-gray-600 text-sm mb-1">Low Stock Items</p>
            <p className="text-4xl font-bold text-orange-500">7</p>
          </div>
        </div>
      </div>
    </div>
  );
}