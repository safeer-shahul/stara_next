// /src/components/header.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, User, Heart, Menu, X, ChevronDown, LogOut, ShoppingCart } from 'lucide-react';
import MegaDropdown from './MegaDropdown';
import MobileDropdown from './MobileDropdown';
import { menuItems } from './menuData';
import CartDrawer from './CartDrawer';
import UserDropdown from './auth/UserDropdown';
import AuthModal from './auth/AuthModal';
import apiService from '@/utils/api/apiService';

type MenuItem = {
  name: string;
  link?: string;
  hasDropdown?: boolean;
  badge?: { text: string; color: string };
  dropdownContent?: { title: string; items: { name: string; link: string; badge?: { text: string; color: string } }[] }[];
};

type Category = {
  id: number;
  category_name: string;
  slug: string;
  category_image: string;
  sub_categories: { id: number; name: string; slug: string }[];
};

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories for header menu
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const categoryData = await apiService.getAllCategoriesPublic();
        console.log(categoryData, 'categoryData');
        
        const formattedCategories: any = categoryData.map(category => ({
          image: `${process.env.NEXT_PUBLIC_API_BASE_URL}${category.category_image}`,
          title: category.category_name.toUpperCase(),
          link: `/shop/collections/${category.slug}?id=${category.sub_categories[0]?.id}`,
          id: category.id
        }));
        
        setCategories(formattedCategories);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        setError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, []);

  // Check authentication status on mount and when local storage changes
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('accessToken');
      
      if (token) {
        console.log('testtttt token')
        setIsLoggedIn(true);
        fetchUserProfile();
      } else {
        console.log('testtttt noooo token')
        setIsLoggedIn(false);
        setUserProfile(null);
      }
    };

    // Initial check
    checkAuthStatus();

    // Setup listener for storage events (for multi-tab support)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken') {
        checkAuthStatus();
      }
    };

    // Add listener for login events from AuthModal
    const handleUserLogin = () => {
      setIsLoggedIn(true);
      const token = localStorage.getItem('accessToken');
      if (token) {
        fetchUserProfile();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userLoggedIn', handleUserLogin);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLoggedIn', handleUserLogin);
    };
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await apiService.getUserProfile();
      
      console.log(response,'getmecustomer')
        setUserProfile(response);
    
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  // Simplified hover handlers
  const handleMouseEnter = (index: number) => {
    setActiveDropdown(index);
  };

  const handleMouseLeave = () => {
    setActiveDropdown(null);
  };

  // For mobile menu
  const toggleDropdown = (index: number) => {
    setActiveDropdown(activeDropdown === index ? null : index);
  };

  const handleCartClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsCartOpen(true);
  };

  const handleUserClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (!isLoggedIn) {
      setIsAuthModalOpen(true);
    }
  };

  const handleLogout = () => {
    console.log('hello')
    setIsLoggedIn(false);
    setUserProfile(null);
    setIsMenuOpen(false);
    apiService.logout()
  };

  return (
    <>
      <div className="bg-[#175e7a] text-white py-2 text-center text-[14px]">
        <p>
          BUY 1 GET 1 FREE &nbsp;&nbsp;| &nbsp;&nbsp;Use Code&nbsp;&nbsp;
          <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">TANK</span>
        </p>
      </div>

      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <Image src="/starablack.webp" alt="Stara Logo" width={150} height={44} priority />
          </Link>

          <div className="hidden md:block w-1/3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for jewelry..."
                className="w-full py-2 px-4 pr-10 text-[14px] rounded-full bg-gray-100 focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="absolute right-3 top-2.5">
                <Search size={18} className='text-[#175e7a]'/>
              </button>
            </div>
          </div>

          <div className="flex  space-x-4">
            <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            {/* User account icon - conditionally render dropdown or open auth modal */}
            <div className="hidden md:block cursor-pointer">
              {isLoggedIn ? (
                <UserDropdown userProfile={userProfile} />
              ) : (
                <a href="#" onClick={handleUserClick}>
                  <User size={22} />
                </a>
              )}
            </div>
            
            <Link href="/account/wishlist" className="hidden md:block relative">
              <Heart size={22} />
              <span className={`absolute ${isLoggedIn ? 'bottom-[-1px]' : 'bottom-[-11px]'} left-1/2 transform -translate-x-1/2 bg-[#F0FBFF] text-[#175e7a] text-[11px]  h-3 w-6 flex items-center justify-center`}>
                0
              </span>
            </Link>

            {/* Shopping Cart Icon */}
            <a href="#" className="relative" onClick={handleCartClick}>
              <ShoppingCart size={22} />
              <span className={`absolute ${isLoggedIn ? 'bottom-[-1px]' : 'bottom-[-11px]'} left-1/2 transform -translate-x-1/2 bg-[#F0FBFF] text-[#175e7a] text-[11px] h-3 w-6 flex items-center justify-center`}>
                0
              </span>
            </a>
          </div>
        </div>

        <nav className="hidden md:block border-t border-gray-100 relative">
          <div className="container mx-auto px-4">
            <ul className="flex justify-center space-x-8 py-3">
              {/* Display dynamically loaded categories */}
              {!loading && categories.map((category, index) => (
                <li 
                  key={index} 
                  className="relative"
                >
                  <Link href={category.link || '#'} className="hover:text-gray-600 flex items-center text-[14px]">
                    {category.title}
                  </Link>
                </li>
              ))}
              
              {/* Keep the commented out original menu items code for reference */}
              {/* {menuItems.map((item: MenuItem, index: number) => (
                <li 
                  key={index} 
                  className="relative"
                  onMouseEnter={() => item.hasDropdown ? handleMouseEnter(index) : null}
                >
                  {item.hasDropdown ? (
                    <button
                      className={`flex items-center hover:text-gray-600 text-[14px] focus:outline-none ${activeDropdown === index ? 'font-medium' : ''}`}
                    >
                      {item.name}
                      {item.badge && <span className={`ml-1 ${item.badge.color} text-xs px-2 py-0.5 rounded-full`}>{item.badge.text}</span>}
                      <ChevronDown className="ml-1" size={16} />
                    </button>
                  ) : (
                    <Link href={item.link || '#'} className="hover:text-gray-600 flex items-center text-[14px]">
                      {item.name}
                      {item.badge && <span className={`ml-1 ${item.badge.color} text-xs px-2 py-0.5 rounded-full`}>{item.badge.text}</span>}
                    </Link>
                  )}
                </li>
              ))} */}
            </ul>
          </div>

          {/* MegaDropdown code kept but commented out */}
          {/* {activeDropdown !== null && menuItems[activeDropdown]?.hasDropdown && (
            <div onMouseLeave={handleMouseLeave}>
              <MegaDropdown isOpen={true} categories={menuItems[activeDropdown].dropdownContent!} />
            </div>
          )} */}
        </nav>

        {isMenuOpen && (
          <div className="md:hidden bg-white absolute w-full z-50 border-t border-gray-200">
            <div className="p-4">
              <input
                type="text"
                placeholder="Search for jewelry..."
                className="w-full py-2 px-4 mb-4 rounded-full bg-gray-100 focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              
              {/* Mobile user account link */}
              {isLoggedIn ? (
                <div className="flex items-center py-2 border-b border-gray-100 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#175e7a] text-white flex items-center justify-center mr-2">
                    {userProfile?.first_name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{userProfile?.first_name || 'User'}</p>
                    <Link href="/account" className="text-xs text-[#175e7a]">View Profile</Link>
                  </div>
                </div>
              ) : (
                <button 
                  className="w-full py-2 px-4 mb-4 rounded-md border border-[#175e7a] text-[#175e7a] flex items-center justify-center"
                  onClick={() => setIsAuthModalOpen(true)}
                >
                  <User size={16} className="mr-2" />
                  Login / Register
                </button>
              )}
              
              <ul className="space-y-2">
                {/* Display dynamically loaded categories for mobile */}
                {!loading && categories.map((category, index) => (
                  <li key={index}>
                    <Link href={category.link || '#'} className="block py-2 hover:text-gray-600 flex items-center">
                      {category.title}
                    </Link>
                  </li>
                ))}
                
                {/* Keep the commented out original mobile menu items code for reference */}
                {/* {menuItems.map((item: MenuItem, index: number) => (
                  <li key={index}>
                    {item.hasDropdown ? (
                      <>
                        <button className="flex items-center w-full py-2 hover:text-gray-600 text-[14px] justify-between" onClick={() => toggleDropdown(index)}>
                          <span className="flex items-center">
                            {item.name}
                            {item.badge && <span className={`ml-1 ${item.badge.color} text-xs px-2 py-0.5 rounded-full`}>{item.badge.text}</span>}
                          </span>
                          <ChevronDown size={16} />
                        </button>
                        {activeDropdown === index && <MobileDropdown isOpen={true} categories={item.dropdownContent!} />}
                      </>
                    ) : (
                      <Link href={item.link || '#'} className="block py-2 hover:text-gray-600 flex items-center">
                        {item.name}
                        {item.badge && <span className={`ml-1 ${item.badge.color} text-xs px-2 py-0.5 rounded-full`}>{item.badge.text}</span>}
                      </Link>
                    )}
                  </li>
                ))} */}
              </ul>
              
              {/* Mobile logout button if logged in */}
              {isLoggedIn && (
                <button 
                  className="w-full py-2 px-4 mt-4 rounded-md border border-red-500 text-red-500 flex items-center justify-center"
                  onClick={handleLogout}
                >
                  <LogOut size={16} className="mr-2" />
                  Sign Out
                </button>
              )}
            </div>
          </div>
        )}
      </header>
      
      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}