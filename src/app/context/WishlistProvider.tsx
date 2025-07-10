// app/context/WishlistProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { wishlistService } from '@/utils/api/wishlistService';
import { showToast } from '@/utils/toast';

interface WishlistContextType {
  wishlistItems: string[];
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<void>;
  refreshWishlist: () => Promise<void>;
  syncWishlistAfterLogin: () => Promise<void>;
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

  const fetchWishlist = useCallback(async () => {
    setIsLoading(true);
    try {
      // console.log('WishlistProvider: Fetching wishlist...');
      const items = await wishlistService.getUnifiedWishlist();
      // console.log('WishlistProvider: Raw wishlist items:', items);
      
      // Remove duplicates and get unique product IDs
      const uniqueProductIds = Array.from(new Set(
        items.map(id => id.replace(/-/g, ''))
      )).map(cleanId => {
        // Find the original ID format from the items array
        const originalId = items.find(id => id.replace(/-/g, '') === cleanId);
        return originalId || cleanId;
      });
      
      // console.log('WishlistProvider: Unique product IDs:', uniqueProductIds);
      setWishlistItems(uniqueProductIds);
    } catch (error) {
      // console.error('WishlistProvider: Error fetching wishlist:', error);
      setWishlistItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  // Listen for auth state changes to refresh wishlist and sync
  useEffect(() => {
    const handleUserLogin = async () => {
      // console.log('WishlistProvider: User logged in, syncing wishlist...');
      try {
        // Sync localStorage wishlist to backend
        await wishlistService.syncLocalWishlistToBackend();
        // Refresh wishlist from backend
        await fetchWishlist();
        showToast.success('Wishlist synced successfully!');
      } catch (error) {
        // console.error('WishlistProvider: Error syncing wishlist after login:', error);
        showToast.error('Failed to sync wishlist');
        // Still refresh to get backend wishlist
        await fetchWishlist();
      }
    };

    const handleUserLogout = () => {
      // console.log('WishlistProvider: User logged out, refreshing wishlist...');
      fetchWishlist();
    };

    window.addEventListener('userLoggedIn', handleUserLogin);
    window.addEventListener('userLoggedOut', handleUserLogout);

    return () => {
      window.removeEventListener('userLoggedIn', handleUserLogin);
      window.removeEventListener('userLoggedOut', handleUserLogout);
    };
  }, [fetchWishlist]);

  const isInWishlist = useCallback((productId: string): boolean => {
    const cleanProductId = productId.replace(/-/g, '');
    return wishlistItems.some(id => id.replace(/-/g, '') === cleanProductId);
  }, [wishlistItems]);

  const toggleWishlist = useCallback(async (productId: string): Promise<void> => {
    try {
      // console.log('WishlistProvider: Toggling wishlist for product:', productId);
      
      const result = await wishlistService.toggleWishlistItem(productId);
      // console.log('WishlistProvider: Toggle result:', result);
      
      // Update local state immediately for responsive UI
      setWishlistItems(prevItems => {
        const cleanProductId = productId.replace(/-/g, '');
        
        if (result.isInWishlist) {
          // Add to wishlist (avoid duplicates)
          const alreadyExists = prevItems.some(id => id.replace(/-/g, '') === cleanProductId);
          if (!alreadyExists) {
            return [...prevItems, productId];
          }
          return prevItems;
        } else {
          // Remove from wishlist
          return prevItems.filter(id => id.replace(/-/g, '') !== cleanProductId);
        }
      });

      // Show success toast
      if (result.action === 'added') {
        showToast.success('Added to wishlist');
      } else {
        showToast.success('Removed from wishlist');
      }
      
    } catch (error) {
      // console.error('WishlistProvider: Error updating wishlist:', error);
      showToast.error('Failed to update wishlist. Please try again.');
    }
  }, []);

  const refreshWishlist = useCallback(async (): Promise<void> => {
    // console.log('WishlistProvider: Manually refreshing wishlist...');
    await fetchWishlist();
  }, [fetchWishlist]);

  const syncWishlistAfterLogin = useCallback(async (): Promise<void> => {
    // console.log('WishlistProvider: Manual sync after login...');
    try {
      await wishlistService.syncLocalWishlistToBackend();
      await fetchWishlist();
      showToast.success('Wishlist synced successfully!');
    } catch (error) {
      // console.error('WishlistProvider: Error during manual sync:', error);
      showToast.error('Failed to sync wishlist');
      // Still refresh to get current state
      await fetchWishlist();
    }
  }, [fetchWishlist]);

  const value = {
    wishlistItems,
    isInWishlist,
    toggleWishlist,
    refreshWishlist,
    syncWishlistAfterLogin,
    isLoading
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}