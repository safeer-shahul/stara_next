// app/admin/page.tsx
"use client";

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingCart, Users, DollarSign, UserCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import apiService from '@/utils/api/apiService';

// Define a more specific type for adminUser
interface AdminUser {
  username?: string;
  role?: string;
  name?: string;
}

// Define types for dashboard data
interface DashboardData {
  total_products: {
    count: number;
    label: string;
  };
  new_orders: {
    count: number;
    label: string;
  };
  total_users: {
    count: number;
    label: string;
  };
  total_revenue: {
    amount: number;
    label: string;
    currency: string;
  };
  low_stock_items: {
    count: number;
    label: string;
    threshold: number;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get admin user from localStorage
    const storedUser = localStorage.getItem('adminUser');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setAdminUser({
        username: parsedUser.username || parsedUser.email || 'Admin',
        role: parsedUser.is_superuser ? 'Super Admin' : (parsedUser.role || 'Admin User'),
        name: parsedUser.name || parsedUser.username
      });
    }
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiService.adminDashboardData();
        setDashboardData(response);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
        setDashboardData(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Special cards with gradients and routes
  const specialCards = dashboardData ? [
    {
      title: 'Total Products',
      value: dashboardData.total_products.count.toString(),
      icon: Package,
      color: 'blue',
      iconColor: 'text-blue-700',
      description: dashboardData.total_products.label,
      patternId: 'products-pattern',
      route: '/admin/products/list'
    },
    {
      title: 'New Orders',
      value: dashboardData.new_orders.count.toString(),
      icon: ShoppingCart,
      color: 'green',
      iconColor: 'text-green-700',
      description: dashboardData.new_orders.label,
      patternId: 'orders-pattern',
      route: '/admin/orders/list'
    }
  ] : [];

  // Regular cards (keep original design)
  const regularCards = dashboardData ? [
    {
      title: 'Total Users',
      value: dashboardData.total_users.count.toString(),
      icon: Users,
      color: 'purple',
      description: dashboardData.total_users.label
    },
    {
      title: 'Total Revenue',
      value: `${dashboardData.total_revenue.currency}${dashboardData.total_revenue.amount.toLocaleString()}`,
      icon: DollarSign,
      color: 'yellow',
      description: dashboardData.total_revenue.label
    }
  ] : [];

  // Special low stock card
  const lowStockCard = dashboardData ? {
    title: 'Low Stock Alert',
    value: dashboardData.low_stock_items.count.toString(),
    icon: AlertTriangle,
    description: dashboardData.low_stock_items.label,
    threshold: dashboardData.low_stock_items.threshold,
    route: '/admin/low-stock',
    patternId: 'warning-pattern'
  } : null;

  const handleCardClick = (route: string) => {
    router.push(route);
  };

  const handleLowStockClick = () => {
    if (lowStockCard) {
      router.push(lowStockCard.route);
    }
  };

  // Helper for regular card colors
  const getColorClasses = useCallback((color: string) => {
    const colorMap = {
      purple: {
        bg: 'bg-purple-50',
        text: 'text-purple-600',
        hoverBorder: 'hover:border-purple-300'
      },
      yellow: {
        bg: 'bg-yellow-50',
        text: 'text-yellow-600',
        hoverBorder: 'hover:border-yellow-300'
      }
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.purple;
  }, []);

  // Helper for card gradient colors
  const getGradientClasses = useCallback((color: string) => {
    const colorMap = {
      blue: {
        gradient: 'from-blue-600 via-blue-700 to-blue-800',
        hover: 'hover:from-blue-700 hover:via-blue-800 hover:to-blue-900',
      },
      green: {
        gradient: 'from-green-600 via-green-700 to-green-800',
        hover: 'hover:from-green-700 hover:via-green-800 hover:to-green-900',
      }
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  }, []);

  // Helper for SVG patterns
  const getSVGPattern = (patternId: string) => {
    const patterns = {
      'products-pattern': (
        <pattern id={patternId} x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <rect x="8" y="8" width="8" height="8" fill="white" opacity="0.2"/>
          <circle cx="12" cy="12" r="3" fill="white" opacity="0.1"/>
          <path d="M6,6 L18,18 M18,6 L6,18" stroke="white" strokeWidth="0.5" opacity="0.15"/>
        </pattern>
      ),
      'orders-pattern': (
        <pattern id={patternId} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="4" fill="white" opacity="0.15"/>
          <rect x="6" y="6" width="8" height="8" fill="none" stroke="white" strokeWidth="0.5" opacity="0.2"/>
          <path d="M2,2 L18,18 M18,2 L2,18" stroke="white" strokeWidth="0.3" opacity="0.1"/>
        </pattern>
      ),
      'warning-pattern': (
        <pattern id={patternId} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="2" fill="white" opacity="0.3"/>
          <path d="M5,5 L15,15 M15,5 L5,15" stroke="white" strokeWidth="0.5" opacity="0.2"/>
        </pattern>
      )
    };
    return patterns[patternId as keyof typeof patterns] || patterns['products-pattern'];
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-8">
        <h2 className="text-3xl font-extrabold text-gray-800">
          <LayoutDashboard className="inline-block w-8 h-8 mr-3 text-[var(--color-primary-950)]" />
          Welcome to your Dashboard
        </h2>
        
        {/* Loading skeleton for summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div className="animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Loading skeleton for low stock card */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 h-40">
          <div className="animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded-full mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-8">
        <h2 className="text-3xl font-extrabold text-gray-800">
          <LayoutDashboard className="inline-block w-8 h-8 mr-3 text-[var(--color-primary-950)]" />
          Welcome to your Dashboard
        </h2>
        
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="text-red-800 font-semibold mb-2">Error Loading Dashboard</div>
          <div className="text-red-600">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <h2 className="text-3xl font-extrabold text-gray-800">
        <LayoutDashboard className="inline-block w-8 h-8 mr-3 text-[var(--color-primary-950)]" />
        Welcome to your Dashboard
      </h2>

      {/* Admin User Information Card */}
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

      {/* Dashboard Cards Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Special Cards with Gradients - Products and Orders */}
        {specialCards.map((card) => {
          const Icon = card.icon;
          const colors = getGradientClasses(card.color);
          return (
            <div 
              key={card.title}
              onClick={() => handleCardClick(card.route)}
              className={`
                relative overflow-hidden bg-gradient-to-br ${colors.gradient}
                rounded-xl shadow-xl cursor-pointer
                transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] 
                ${colors.hover}
                group p-6 flex flex-col items-start
              `}
            >
              {/* SVG Pattern Background */}
              <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    {getSVGPattern(card.patternId)}
                  </defs>
                  <rect width="100%" height="100%" fill={`url(#${card.patternId})`} />
                </svg>
              </div>

              {/* Content */}
              <div className="relative z-10 w-full">
                <div className="bg-white bg-opacity-20 p-3 rounded-full mb-4 w-fit
                               group-hover:bg-opacity-30 transition-all duration-300">
                  <Icon className={`w-8 h-8 ${card.iconColor}` } />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{card.title}</h3>
                <p className="text-4xl font-bold text-white mb-1">{card.value}</p>
                <p className="text-sm text-white opacity-90 mb-2">{card.description}</p>
                
                {/* Action hint */}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-white text-xs font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                    Click to view →
                  </p>
                  <ExternalLink className="w-4 h-4 text-white opacity-70 group-hover:opacity-100 
                                         transition-opacity duration-300" />
                </div>
              </div>

              {/* Shine effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent 
                             opacity-0 group-hover:opacity-10 transform translate-x-[-100%] 
                             group-hover:translate-x-[100%] transition-all duration-1000 ease-in-out"></div>
            </div>
          );
        })}

        {/* Regular Cards - Users and Revenue */}
        {regularCards.map((card) => {
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

      {/* Special Low Stock Alert Card */}
      {lowStockCard && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div 
            onClick={handleLowStockClick}
            className="relative overflow-hidden bg-gradient-to-br from-red-500 via-red-600 to-red-700 
                       rounded-xl shadow-xl cursor-pointer
                       transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] 
                       hover:from-red-600 hover:via-red-700 hover:to-red-800
                       group p-6 flex flex-col items-start"
          >
            {/* SVG Pattern Background */}
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  {getSVGPattern(lowStockCard.patternId)}
                </defs>
                <rect width="100%" height="100%" fill={`url(#${lowStockCard.patternId})`} />
              </svg>
            </div>

            {/* Content */}
            <div className="relative z-10 w-full">
              <div className="bg-white bg-opacity-20 p-3 rounded-full mb-4 w-fit
                             group-hover:bg-opacity-30 transition-all duration-300">
                <AlertTriangle className="w-8 h-8 text-red-700" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{lowStockCard.title}</h3>
              <p className="text-4xl font-bold text-white mb-1">{lowStockCard.value}</p>
              <p className="text-sm text-red-100 opacity-90 mb-2">{lowStockCard.description}</p>
              
              {/* Action hint */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-red-100 text-xs font-medium group-hover:text-white transition-colors">
                  Click to view items →
                </p>
                <ExternalLink className="w-4 h-4 text-white opacity-70 group-hover:opacity-100 
                                       transition-opacity duration-300" />
              </div>
            </div>

            {/* Shine effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent 
                           opacity-0 group-hover:opacity-10 transform translate-x-[-100%] 
                           group-hover:translate-x-[100%] transition-all duration-1000 ease-in-out"></div>
          </div>
        </div>
      )}
    </div>
  );
}