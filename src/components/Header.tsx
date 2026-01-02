'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, User, Heart, Menu, X, LogOut, ShoppingCart, LayoutDashboard } from 'lucide-react';
import CartDrawer from './CartDrawer';
import UserDropdown from './auth/UserDropdown';
import AuthModal from './auth/AuthModal';
import apiService from '@/utils/api/apiService';
import { useCart, CartItemType } from '@/context/cartContext';
import { useWishlist } from '@/app/context/WishlistProvider';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const { cartItems } = useCart();
  const { wishlistItems } = useWishlist();

  // Get wishlist count from context
  const wishlistCount = wishlistItems.length;

  const totalCartUnits = cartItems.reduce((total: number, item: CartItemType) => {
    if (item.type === 'normal') {
      return total + item.quantity;
    } else {
      return total + item.offer_items.reduce((offerTotal, p) => offerTotal + p.quantity, 0);
    }
  }, 0);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const categoryData = await apiService.getAllCategoriesPublic();
        
        const formattedCategories: any = categoryData.map(category => ({
          image: `${process.env.NEXT_PUBLIC_API_BASE_URL}${category.category_image}`,
          title: category.category_name.toUpperCase(),
          link: `/shop/collections/${category.slug}?id=${category.sub_categories[0]?.id}`,
          id: category.id
        }));
        
        setCategories(formattedCategories);
        setCategoryError(null);
      } catch (err) {
        // console.error('Failed to fetch categories:', err);
        setCategoryError('Failed to load categories');
      } finally {
        setLoadingCategories(false);
      }
    };
    
    fetchCategories();
  }, []);
  
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('accessToken');
      
      if (token) {
        setIsLoggedIn(true);
        fetchUserProfile();
      } else {
        setIsLoggedIn(false);
        setUserProfile(null);
      }
    };

    checkAuthStatus();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken') {
        checkAuthStatus();
      }
    };

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
      setUserProfile(response);
    } catch (error) {
      // console.error('Failed to fetch user profile:', error);
      setUserProfile(null);
      setIsLoggedIn(false);
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

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    setUserProfile(null);
    setIsMenuOpen(false);
    apiService.logout();
    window.dispatchEvent(new Event('userLoggedOut')); 
  }, []);

  const isAdminOrStaff = userProfile?.is_superuser || userProfile?.is_staff;
  const accountLink = isAdminOrStaff ? '/admin' : '/account';
  const AccountIcon = isAdminOrStaff ? LayoutDashboard : User;

  return (
    <>
      <div className="bg-[var(--color-primary-950)] text-white py-2 text-center text-[14px]">
        <p>
          Welcome to Stara! Enjoy free shipping on all orders. 
        </p>
      </div>

      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <Image src="/starablack.webp" alt="Stara Logo" width={150} height={44} priority />
          </Link>

          {/* <div className="hidden md:block w-1/3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for jewelry..."
                className="w-full py-2 px-4 pr-10 text-[14px] rounded-full bg-gray-100 focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="absolute right-3 top-2.5">
                <Search size={18} className='text-[var(--color-primary-950)]'/>
              </button>
            </div>
          </div> */}

          <div className="flex space-x-4">
            <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            <div className="hidden md:block cursor-pointer">
              {isLoggedIn ? (
                isAdminOrStaff ? (
                  <Link href={accountLink} className="flex items-center" title="Admin/Staff Dashboard">
                    <AccountIcon size={22} />
                  </Link>
                ) : (
                  <UserDropdown userProfile={userProfile} />
                )
              ) : (
                <a href="#" onClick={handleUserClick} title="Login / Register">
                  <User size={22} />
                </a>
              )}
            </div>
            
            <Link href="/account/wishlist" className="hidden md:block relative" title="Wishlist">
              <Heart size={22} />
              <span className={`absolute ${isLoggedIn ? 'bottom-[-1px]' : 'bottom-[-11px]'} left-1/2 transform -translate-x-1/2 bg-[#F0FBFF] text-[var(--color-primary-950)] text-[11px] h-3 w-6 flex items-center justify-center rounded-full`}>
                {wishlistCount}
              </span>
            </Link>

            <a href="#" className="relative" onClick={handleCartClick} title="Shopping Cart">
              <ShoppingCart size={22} />
              <span className={`absolute ${isLoggedIn ? 'bottom-[-1px]' : 'bottom-[-11px]'} left-1/2 transform -translate-x-1/2 bg-[#F0FBFF] text-[var(--color-primary-950)] text-[11px] h-3 w-6 flex items-center justify-center rounded-full`}>
                {totalCartUnits}
              </span>
            </a>
          </div>
        </div>

        <nav className="hidden md:block border-t border-gray-100 relative">
          <div className="container mx-auto px-4">
            <ul className="flex justify-center space-x-8 py-3">
              {loadingCategories ? (
                <li className="text-gray-500">Loading categories...</li>
              ) : categoryError ? (
                <li className="text-red-500">Error loading categories.</li>
              ) : (
                categories.map((category, index) => (
                  <li 
                    key={index} 
                    className="relative group"
                  >
                    <Link href={category.link || '#'} className="hover:text-gray-600 flex items-center text-[14px]">
                      {category.title}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </nav>

        {isMenuOpen && (
          <div className="md:hidden bg-white absolute w-full z-50 border-t border-gray-200 shadow-lg">
            <div className="p-4">
              {/* <input
                type="text"
                placeholder="Search for jewelry..."
                className="w-full py-2 px-4 mb-4 rounded-full bg-gray-100 focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              /> */}
              
              {isLoggedIn ? (
                <div className="flex items-center py-2 border-b border-gray-100 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-primary-950)] text-white flex items-center justify-center mr-2">
                    {userProfile?.first_name?.charAt(0) || userProfile?.username?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{userProfile?.first_name || userProfile?.username || 'User'}</p>
                    {isAdminOrStaff ? (
                      <Link href={accountLink} className="text-xs text-[var(--color-primary-950)]" onClick={() => setIsMenuOpen(false)}>
                        Go to Admin Dashboard
                      </Link>
                    ) : (
                      <Link href="/account" className="text-xs text-[var(--color-primary-950)]" onClick={() => setIsMenuOpen(false)}>
                        View Profile
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <button 
                  className="w-full py-2 px-4 mb-4 rounded-md border border-[var(--color-primary-950)] text-[var(--color-primary-950)] flex items-center justify-center"
                  onClick={() => { setIsAuthModalOpen(true); setIsMenuOpen(false); }}
                >
                  <User size={16} className="mr-2" />
                  Login / Register
                </button>
              )}

              <Link href="/account/wishlist" className="flex items-center justify-between py-2 border-b border-gray-100" onClick={() => setIsMenuOpen(false)}>
                <span>My Wishlist</span>
                <span className="bg-[#F0FBFF] text-[var(--color-primary-950)] text-xs px-2 py-0.5 rounded-full">
                  {wishlistCount}
                </span>
              </Link>
              
              <ul className="space-y-2 mt-2">
                {loadingCategories ? (
                  <li className="text-gray-500 py-2">Loading categories...</li>
                ) : categoryError ? (
                  <li className="text-red-500 py-2">Error loading categories.</li>
                ) : (
                  categories.map((category, index) => (
                    <li key={index}>
                      <Link href={category.link || '#'} className="block py-2 hover:text-gray-600 flex items-center" onClick={() => setIsMenuOpen(false)}>
                        {category.title}
                      </Link>
                    </li>
                  ))
                )}
              </ul>
              
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
      
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}