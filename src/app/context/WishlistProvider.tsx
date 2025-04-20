// app/context/WishlistProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import apiService from '@/utils/api/apiService';

interface WishlistContextType {
  wishlistItems: string[];
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<void>;
  isLoading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}

interface WishlistProviderProps {
  children: ReactNode;
}

export function WishlistProvider({ children }: WishlistProviderProps) {
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      if (token) {
        // User is logged in, fetch from API
        const results = await apiService.getWishlist();
        setWishlistItems(results || []);
      } else {
        // User is not logged in, get from localStorage
        const localWishlist = localStorage.getItem('wishlist');
        if (localWishlist) {
          setWishlistItems(JSON.parse(localWishlist));
        } else {
          setWishlistItems([]);
        }
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setWishlistItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const isInWishlist = (productId: string): boolean => {
    return wishlistItems.includes(productId);
  };

  const toggleWishlist = async (productId: string): Promise<void> => {
    try {
      const token = localStorage.getItem('accessToken');
      const cleanProductId = productId.replace(/-/g, '');
      
      if (token) {
        // User is logged in, use API
        await apiService.addToWishlist({
          product: cleanProductId,
        });
      }
      
      // Update local state
      setWishlistItems(prevItems => {
        let newItems: string[];
        
        if (prevItems.includes(productId)) {
          // Remove from wishlist
          newItems = prevItems.filter(id => id !== productId);
        } else {
          // Add to wishlist
          newItems = [...prevItems, productId];
        }
        
        // If not logged in, store in localStorage
        if (!token) {
          localStorage.setItem('wishlist', JSON.stringify(newItems));
        }
        
        return newItems;
      });
      
    } catch (error) {
      console.error('Error updating wishlist:', error);
    }
  };

  const value = {
    wishlistItems,
    isInWishlist,
    toggleWishlist,
    isLoading
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}