// utils/api/wishlistService.ts
import apiService from './apiService';
import { ProductItemDetails } from '@/context/cartContext';

// Define the type for wishlist items from backend
export interface WishlistItemFromBackend {
  id: string;
  products: ProductItemDetails & {
    product_variant: any[];
    have_variants: boolean;
  };
  created_at: string;
  updated_at: string;
  product: string;
  user: number;
}

export const wishlistService = {
  // Fetch wishlist for authenticated users
  fetchWishlistFromBackend: async (): Promise<string[]> => {
    // console.log("wishlistService: Fetching wishlist from backend");
    try {
      const response = await apiService.getWishlist();
      // console.log("wishlistService: Raw backend wishlist response:", response);
      
      if (!response || !Array.isArray(response)) {
        // console.log("wishlistService: Invalid response format, returning empty array");
        return [];
      }
      
      // Remove duplicates by comparing clean product IDs
      const uniqueProductIds = Array.from(new Set(
        response.map((id: string) => id.replace(/-/g, ''))
      ));
      
      // console.log("wishlistService: Unique product IDs after deduplication:", uniqueProductIds);
      // console.log("wishlistService: Original count:", response.length, "-> Deduplicated count:", uniqueProductIds.length);
      
      // Return with original format (add hyphens back if needed)
      const result = uniqueProductIds.map(cleanId => {
        // Find the original ID format from the response array
        const originalId = response.find((id: string) => id.replace(/-/g, '') === cleanId);
        return originalId || cleanId;
      });
      
      // console.log("wishlistService: Final result:", result);
      return result;
    } catch (error) {
      // console.error('wishlistService: Error fetching wishlist from backend:', error);
      return [];
    }
  },

  // Fetch detailed wishlist with product details for authenticated users
  fetchDetailedWishlistFromBackend: async (): Promise<WishlistItemFromBackend[]> => {
    // console.log("wishlistService: Fetching detailed wishlist from backend");
    try {
      const response = await apiService.getMyWishlist();
      // console.log("wishlistService: Backend detailed wishlist response:", response);
      // console.log("wishlistService: Number of items returned:", response?.length || 0);
      
      if (!response || !Array.isArray(response)) {
        // console.log("wishlistService: Invalid detailed response format, returning empty array");
        return [];
      }
      
      // Add isInStock property to each product
      const processedItems = response.map((item: WishlistItemFromBackend, index: number) => {
        // console.log(`wishlistService: Processing item ${index + 1}:`, {
        //   id: item.id,
        //   productId: item.products?.id,
        //   productName: item.products?.product_name,
        //   hasVariants: item.products?.have_variants,
        //   variants: item.products?.product_variant?.length || 0
        // });
        
        return {
          ...item,
          products: {
            ...item.products,
            isInStock: item.products.have_variants 
              ? item.products.product_variant?.some(v => v.quantity > 0) && item.products.product_status
              : item.products.product_status && item.products.quantity > 0
          }
        };
      });
      
      // console.log("wishlistService: Processed items count:", processedItems.length);
      return processedItems;
    } catch (error) {
      // console.error('wishlistService: Error fetching detailed wishlist from backend:', error);
      return [];
    }
  },

  // Fetch wishlist from localStorage
  fetchWishlistFromLocalStorage: (): string[] => {
    // console.log("wishlistService: Fetching wishlist from localStorage");
    try {
      const localWishlist = localStorage.getItem('wishlist');
      if (localWishlist) {
        const parsed = JSON.parse(localWishlist);
        // console.log("wishlistService: LocalStorage wishlist:", parsed);
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch (error) {
      // console.error('wishlistService: Error parsing localStorage wishlist:', error);
      localStorage.removeItem('wishlist');
      return [];
    }
  },

  // Fetch product details for localStorage wishlist IDs
  fetchProductDetailsForLocalWishlist: async (productIds: string[]): Promise<WishlistItemFromBackend[]> => {
    // console.log("wishlistService: Fetching product details for", productIds.length, "products");
    
    if (productIds.length === 0) {
      return [];
    }

    try {
      // Clean product IDs (remove hyphens)
      const cleanProductIds = productIds.map(id => id.replace(/-/g, ''));
      
      // Fetch products using paginated API (similar to cartService)
      const productsResponse = await apiService.getPaginatedProducts(
        1, 
        100, 
        undefined, 
        cleanProductIds
      );
      
      // console.log("wishlistService: Products fetched:", productsResponse.products?.length || 0);
      
      // Transform to wishlist item format
      const wishlistItems: WishlistItemFromBackend[] = productsResponse.products?.map((product: any) => {
        const productDetails: ProductItemDetails & {
          product_variant: any[];
          have_variants: boolean;
        } = {
          id: product.id,
          images: product.images || [],
          product_code: product.product_code,
          product_name: product.product_name,
          product_description: product.product_description,
          product_price: product.product_price,
          strike_price: product.strike_price,
          quantity: product.quantity,
          product_weight: product.product_weight,
          product_box_weight: product.product_box_weight,
          product_status: product.product_status,
          created_at: product.created_at,
          updated_at: product.updated_at,
          sub_category: product.sub_category,
          isInStock: product.have_variants 
            ? product.product_variant?.some((v: any) => v.quantity > 0) && product.product_status
            : product.product_status && product.quantity > 0,
          have_variants: product.have_variants || false,
          product_variant: product.product_variant || [],
        };

        return {
          id: `local-${product.id}`, // Use local prefix for localStorage items
          products: productDetails,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          product: product.id,
          user: 0, // Guest user
        };
      }) || [];

      // console.log("wishlistService: Transformed wishlist items:", wishlistItems.length);
      return wishlistItems;
    } catch (error) {
      // console.error('wishlistService: Error fetching product details:', error);
      return [];
    }
  },

  // Save wishlist to localStorage
  saveWishlistToLocalStorage: (productIds: string[]): void => {
    // console.log("wishlistService: Saving wishlist to localStorage:", productIds);
    try {
      localStorage.setItem('wishlist', JSON.stringify(productIds));
    } catch (error) {
      // console.error('wishlistService: Error saving wishlist to localStorage:', error);
    }
  },

  // Add/remove item from wishlist
  toggleWishlistItem: async (productId: string): Promise<{ isInWishlist: boolean; action: 'added' | 'removed' }> => {
    // console.log("wishlistService: Toggling wishlist item:", productId);
    const accessToken = localStorage.getItem('accessToken');
    const cleanProductId = productId.replace(/-/g, '');

    try {
      if (accessToken) {
        // User is logged in, use API
        // console.log("wishlistService: User logged in, using API");
        const response = await apiService.addToWishlist({
          product: cleanProductId,
        });
        
        // console.log("wishlistService: API response:", response);
        
        // Determine action based on response
        const action = response?.status === 'removed' ? 'removed' : 'added';
        const isInWishlist = action === 'added';
        
        return { isInWishlist, action };
      } else {
        // User not logged in, use localStorage
        // console.log("wishlistService: User not logged in, using localStorage");
        const currentWishlist = wishlistService.fetchWishlistFromLocalStorage();
        const isCurrentlyInWishlist = currentWishlist.includes(productId);
        
        let newWishlist: string[];
        let action: 'added' | 'removed';
        
        if (isCurrentlyInWishlist) {
          // Remove from wishlist
          newWishlist = currentWishlist.filter(id => id !== productId);
          action = 'removed';
        } else {
          // Add to wishlist
          newWishlist = [...currentWishlist, productId];
          action = 'added';
        }
        
        wishlistService.saveWishlistToLocalStorage(newWishlist);
        
        return { isInWishlist: action === 'added', action };
      }
    } catch (error) {
      // console.error('wishlistService: Error toggling wishlist item:', error);
      throw error;
    }
  },

  // Sync localStorage wishlist to backend after login
  syncLocalWishlistToBackend: async (): Promise<void> => {
    // console.log("wishlistService: Syncing localStorage wishlist to backend");
    const accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
      // console.log("wishlistService: No access token, skipping sync");
      return;
    }

    try {
      const localWishlist = wishlistService.fetchWishlistFromLocalStorage();
      // console.log("wishlistService: Local wishlist to sync:", localWishlist);
      
      if (localWishlist.length === 0) {
        // console.log("wishlistService: No local wishlist items to sync");
        return;
      }

      // Get current backend wishlist
      const backendWishlist = await wishlistService.fetchWishlistFromBackend();
      // console.log("wishlistService: Current backend wishlist:", backendWishlist);

      // Find items that are in localStorage but not in backend
      const itemsToSync = localWishlist.filter(localId => {
        const cleanLocalId = localId.replace(/-/g, '');
        return !backendWishlist.some(backendId => backendId.replace(/-/g, '') === cleanLocalId);
      });

      // console.log("wishlistService: Items to sync to backend:", itemsToSync);

      // Sync each item to backend
      for (const productId of itemsToSync) {
        try {
          // console.log("wishlistService: Syncing product to backend:", productId);
          await apiService.addToWishlist({
            product: productId.replace(/-/g, ''),
          });
          // console.log("wishlistService: Successfully synced product:", productId);
        } catch (error) {
          // console.error('wishlistService: Error syncing product to backend:', productId, error);
        }
      }

      // Clear localStorage after successful sync
      localStorage.removeItem('wishlist');
      // console.log("wishlistService: Cleared localStorage wishlist after sync");

    } catch (error) {
      // console.error('wishlistService: Error during sync:', error);
      throw error;
    }
  },

  // Get unified wishlist (from backend if logged in, localStorage if not)
  getUnifiedWishlist: async (): Promise<string[]> => {
    const accessToken = localStorage.getItem('accessToken');
    
    if (accessToken) {
      return await wishlistService.fetchWishlistFromBackend();
    } else {
      return wishlistService.fetchWishlistFromLocalStorage();
    }
  },

  // Get detailed wishlist items (for wishlist page)
  getDetailedWishlist: async (): Promise<WishlistItemFromBackend[]> => {
    const accessToken = localStorage.getItem('accessToken');
    
    if (accessToken) {
      return await wishlistService.fetchDetailedWishlistFromBackend();
    } else {
      const localWishlist = wishlistService.fetchWishlistFromLocalStorage();
      return await wishlistService.fetchProductDetailsForLocalWishlist(localWishlist);
    }
  },
};