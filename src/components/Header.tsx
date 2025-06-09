'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, User, Heart, Menu, X, LogOut, ShoppingCart } from 'lucide-react';
import CartDrawer from './CartDrawer';
import UserDropdown from './auth/UserDropdown';
import AuthModal from './auth/AuthModal';
import apiService from '@/utils/api/apiService';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [wishlistCount, setWishlistCount] = useState<number>(0);
  const [cartCount, setCartCount] = useState<number>(0);

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
        console.log(error)
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, []);
  

  // Function to get cart count from localStorage
  const getCartCountFromLocalStorage = () => {
    try {
      const cartItems = localStorage.getItem('cartItems');
      if (cartItems) {
        const parsedCartItems = JSON.parse(cartItems);
        return Array.isArray(parsedCartItems) ? parsedCartItems.length : 0;
      }
      return 0;
    } catch (error) {
      console.error('Error reading cart from localStorage:', error);
      return 0;
    }
  };

  // Function to get wishlist count from localStorage
  const getWishlistCountFromLocalStorage = () => {
    try {
      const wishList = localStorage.getItem('wishlist');
      if (wishList) {
        const parsedWishlist = JSON.parse(wishList);
        return Array.isArray(parsedWishlist) ? parsedWishlist.length : 0;
      }
      return 0;
    } catch (error) {
      console.error('Error reading wishlist from localStorage:', error);
      return 0;
    }
  };

  // Check authentication status and update counts
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('accessToken');
      
      if (token) {
        console.log('testtttt token')
        setIsLoggedIn(true);
        fetchUserProfile();
        // For logged-in users, we'll fetch counts from API in fetchUserProfile
      } else {
        console.log('testtttt noooo token')
        setIsLoggedIn(false);
        setUserProfile(null);
        // For non-logged-in users, get counts from localStorage
        setCartCount(getCartCountFromLocalStorage());
        setWishlistCount(getWishlistCountFromLocalStorage());
      }
    };

    // Initial check
    checkAuthStatus();

    // Setup listener for storage events (for multi-tab support)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken') {
        checkAuthStatus();
      } else if (e.key === 'cartItems') {
        if (!isLoggedIn) {
          setCartCount(getCartCountFromLocalStorage());
        }
      } else if (e.key === 'wishList') {
        if (!isLoggedIn) {
          setWishlistCount(getWishlistCountFromLocalStorage());
        }
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
  }, [isLoggedIn]);

  // Also listen for local changes to cart and wishlist when not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      const interval = setInterval(() => {
        setCartCount(getCartCountFromLocalStorage());
        setWishlistCount(getWishlistCountFromLocalStorage());
      }, 1000); // Check every second for local changes
      
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const fetchUserProfile = async () => {
    try {
      const response = await apiService.getUserProfile();
      console.log(response, 'getmecustomer');
      setUserProfile(response);
      
      // For logged in users, get counts from API
      if (response?.cart_items_count !== undefined) {
        setCartCount(response.cart_items_count);
      } else {
        setCartCount(getCartCountFromLocalStorage());
      }
      
      if (response?.wishlist_item_count !== undefined) {
        setWishlistCount(response.wishlist_item_count);
      } else {
        setWishlistCount(getWishlistCountFromLocalStorage());
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // Fallback to localStorage if API fails
      setCartCount(getCartCountFromLocalStorage());
      setWishlistCount(getWishlistCountFromLocalStorage());
    }
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

          <div className="flex space-x-4">
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
              <span className={`absolute ${isLoggedIn ? 'bottom-[-1px]' : 'bottom-[-11px]'} left-1/2 transform -translate-x-1/2 bg-[#F0FBFF] text-[#175e7a] text-[11px] h-3 w-6 flex items-center justify-center`}>
                {wishlistCount}
              </span>
            </Link>

            {/* Shopping Cart Icon */}
            <a href="#" className="relative" onClick={handleCartClick}>
              <ShoppingCart size={22} />
              <span className={`absolute ${isLoggedIn ? 'bottom-[-1px]' : 'bottom-[-11px]'} left-1/2 transform -translate-x-1/2 bg-[#F0FBFF] text-[#175e7a] text-[11px] h-3 w-6 flex items-center justify-center`}>
                {cartCount}
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
            </ul>
          </div>
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

              <Link href="/account/wishlist" className="flex items-center justify-between py-2 border-b border-gray-100">
                <span>My Wishlist</span>
                <span className="bg-[#F0FBFF] text-[#175e7a] text-xs px-2 py-0.5 rounded-full">
                  {wishlistCount}
                </span>
              </Link>
              
              <ul className="space-y-2">
                {/* Display dynamically loaded categories for mobile */}
                {!loading && categories.map((category, index) => (
                  <li key={index}>
                    <Link href={category.link || '#'} className="block py-2 hover:text-gray-600 flex items-center">
                      {category.title}
                    </Link>
                  </li>
                ))}
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