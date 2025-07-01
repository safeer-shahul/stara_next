'use client';
import { createContext, useContext, useReducer, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import apiService from '@/utils/api/apiService';
import { cartService } from '@/utils/api/cartService';
import { v4 as uuidv4 } from 'uuid';

// ... [Keep all existing type definitions from original cartContext.tsx] ...
export interface ProductImage {
  id: string;
  product_image: string;
  product: string;
}

export interface ProductVariant {
  id: string;
  variant_name: string;
  quantity: number;
  weight: string;
  product: string;
}

export interface ProductItemDetails {
  id: string;
  images: ProductImage[];
  product_code: string;
  product_name: string;
  product_description: string;
  product_price: string;
  strike_price: string;
  quantity: number;
  product_weight: string;
  product_box_weight: string;
  product_status: boolean;
  created_at: string;
  updated_at: string;
  sub_category: string;
  isInStock: boolean;
  have_variants: boolean;
  product_variant: ProductVariant[];
  selectedVariant?: ProductVariant;
}

export interface CartNormalItem {
  id: string;
  product_id: string;
  quantity: number;
  type: 'normal';
  isSynced: boolean;
  product_name: string;
  product_price: string;
  strike_price: string;
  images: ProductImage[];
  isInStock: boolean;
  stock_quantity: number;
  selectedVariant?: ProductVariant;
  productDetails?: ProductItemDetails;
  created_at: string;
  updated_at: string;
}

export interface CartOfferItem {
  id: string;
  offer: string;
  offer_name: { id: string; offer_name: string };
  buy_count: number;
  get_count: number;
  isSynced: boolean;
  type: 'offer';
  offer_items: (ProductItemDetails & {
    quantity: number;
    selectedVariant?: ProductVariant;
    isPaid?: boolean;
  })[];
  created_at: string;
  updated_at: string;
}

export type CartItemType = CartNormalItem | CartOfferItem;

// --- Reducer Action Types ---
export type CartAction =
  | { type: 'SET_CART_ITEMS'; payload: CartItemType[] }
  | { type: 'ADD_OFFER_SET'; payload: CartOfferItem }
  | { type: 'ADD_NORMAL_ITEM'; payload: CartNormalItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_ITEM_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_CART' }
  | { type: 'TRIGGER_SYNC' }
  | { type: 'FORCE_REFRESH' }; // New action for forced refresh

// --- Cart State and Context ---
interface CartState {
  cartItems: CartItemType[];
  loading: boolean;
}

interface CartContextType extends CartState {
  dispatchCart: React.Dispatch<CartAction>;
  getTotalProductQuantitiesInCart: () => Map<string, number>;
  getEffectiveProductStock: (productDetails: ProductItemDetails, variantId?: string) => number;
  syncCart: () => Promise<void>;
  forceRefreshCart: () => Promise<void>; // New method for forced refresh
  clearCart: () => Promise<void>;
  calculateTotals: () => {
    normalSubtotal: number;
    offerSubtotal: number;
    offerSavings: number;
    totalItems: number;
    grandTotal: number;
  };
}

const CartContext = createContext<CartContextType | null>(null);

const initialState: CartState = {
  cartItems: [],
  loading: false,
};

// --- Local Storage Management ---
const CART_STORAGE_KEY = 'cartItems';

const saveToLocalStorage = (items: CartItemType[]) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      console.log('Cart saved to localStorage:', items.length, 'items');
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }
};

const loadFromLocalStorage = (): CartItemType[] => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log('Cart loaded from localStorage:', parsed.length, 'items');
      return parsed.map((item: any) => ({
        ...item,
        id: item.id || uuidv4(),
        isSynced: false,
      }));
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    localStorage.removeItem(CART_STORAGE_KEY);
  }
  return [];
};

const clearLocalStorage = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CART_STORAGE_KEY);
    console.log('Cart localStorage cleared');
  }
};

// --- Cart Reducer ---
const cartReducer = (state: CartState, action: CartAction): CartState => {
  let newItems: CartItemType[];

  switch (action.type) {
    case 'SET_CART_ITEMS':
      console.log('Reducer: SET_CART_ITEMS', action.payload.length, 'items');
      saveToLocalStorage(action.payload);
      return { ...state, cartItems: action.payload };

    case 'ADD_NORMAL_ITEM':
      console.log('Reducer: ADD_NORMAL_ITEM', action.payload.product_name);

      const incomingHasVariant = !!action.payload.selectedVariant;
      const incomingVariantId = action.payload.selectedVariant?.id;

      const existingItemIndex = state.cartItems.findIndex(
        (item) =>
          item.type === 'normal' &&
          (item as CartNormalItem).product_id === action.payload.product_id &&
          (incomingHasVariant
            ? (item as CartNormalItem).selectedVariant?.id === incomingVariantId
            : !(item as CartNormalItem).selectedVariant)
      );

      if (existingItemIndex > -1) {
        newItems = [...state.cartItems];
        const existingItem = newItems[existingItemIndex] as CartNormalItem;
        newItems[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + action.payload.quantity,
          isSynced: false,
          updated_at: new Date().toISOString(),
        };
      } else {
        const newNormalItem: CartNormalItem = {
          ...action.payload,
          id: action.payload.id || uuidv4(),
          isSynced: false,
          created_at: action.payload.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        newItems = [...state.cartItems, newNormalItem];
      }

      saveToLocalStorage(newItems);
      return { ...state, cartItems: newItems };

    case 'ADD_OFFER_SET':
      console.log('Reducer: ADD_OFFER_SET', action.payload.offer_name.offer_name);

      const newOfferSet: CartOfferItem = {
        ...action.payload,
        id: action.payload.id || uuidv4(),
        isSynced: false,
        created_at: action.payload.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      newItems = [...state.cartItems, newOfferSet];
      saveToLocalStorage(newItems);
      return { ...state, cartItems: newItems };

    case 'REMOVE_ITEM':
      console.log('Reducer: REMOVE_ITEM', action.payload);
      newItems = state.cartItems.filter((item) => item.id !== action.payload);
      saveToLocalStorage(newItems);
      return { ...state, cartItems: newItems };

    case 'UPDATE_ITEM_QUANTITY':
      console.log('Reducer: UPDATE_ITEM_QUANTITY', action.payload);
      newItems = state.cartItems.map((item) => {
        if (item.type === 'normal' && item.id === action.payload.id) {
          return {
            ...item,
            quantity: action.payload.quantity,
            isSynced: false,
            updated_at: new Date().toISOString(),
          };
        }
        return item;
      });
      saveToLocalStorage(newItems);
      return { ...state, cartItems: newItems };

    case 'CLEAR_CART':
      console.log('Reducer: CLEAR_CART');
      clearLocalStorage();
      return { ...state, cartItems: [] };

    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'TRIGGER_SYNC':
      console.log('Reducer: TRIGGER_SYNC - will trigger sync in useEffect');
      return state;

    case 'FORCE_REFRESH':
      console.log('Reducer: FORCE_REFRESH - will trigger force refresh in useEffect');
      return state;

    default:
      console.warn(`Unhandled action type: ${(action as { type: string }).type}`);
      return state;
  }
};

// --- Debounce utility ---
const useDebounce = (callback: Function, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
};

// --- Cart Provider Component ---
export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [syncRequested, setSyncRequested] = useState(false);
  const [forceRefreshRequested, setForceRefreshRequested] = useState(false);
  const isInitialized = useRef(false);
  const isSyncing = useRef(false);
  const isMounted = useRef(true);
  const prevAccessTokenRef = useRef<string | null>(null);

  // Track pending operations to prevent duplicates
  const pendingOperations = useRef(new Set<string>());
  const lastRemovalTime = useRef<number>(0);

  // Track component mount status
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Track authentication state changes
  useEffect(() => {
    const checkAuthChange = () => {
      const currentAccessToken = localStorage.getItem('accessToken');
      const previousToken = prevAccessTokenRef.current;

      // Detect login (no token -> has token)
      if (!previousToken && currentAccessToken && isInitialized.current) {
        console.log('Login detected - triggering sync');
        setSyncRequested(true);
      }

      prevAccessTokenRef.current = currentAccessToken;
    };

    // Check immediately
    checkAuthChange();

    // Set up a small interval to catch auth changes
    const interval = setInterval(checkAuthChange, 500);

    return () => clearInterval(interval);
  }, []);

  // Initialize cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized.current) {
      const currentAccessToken = localStorage.getItem('accessToken');
      const storedItems = loadFromLocalStorage();

      prevAccessTokenRef.current = currentAccessToken;
      isInitialized.current = true;

      if (currentAccessToken) {
        // For authenticated users, load local items first, then sync
        if (storedItems.length > 0) {
          console.log('Setting local items before sync (including offers):', storedItems.length);
          dispatch({ type: 'SET_CART_ITEMS', payload: storedItems });
        }
        
        // Always sync to merge local items with backend
        console.log('Authenticated user detected - syncing with backend (preserving local offers)');
        setSyncRequested(true);
      } else {
        // For guest users, load from localStorage and process offers immediately
        if (storedItems.length > 0) {
          console.log('Guest user - processing cart items including offers');
          
          // Check if there are unsynced offers that need processing
          const hasUnsyncedOffers = storedItems.some(item => 
            item.type === 'offer' && !item.isSynced
          );
          
          if (hasUnsyncedOffers) {
            console.log('Found unsynced guest offers - processing for paid/free assignment');
            // Process guest offers immediately
            cartService.processGuestOffers(storedItems).then(processedItems => {
              console.log('Guest offers processed on initialization');
              dispatch({ type: 'SET_CART_ITEMS', payload: processedItems });
            }).catch(error => {
              console.error('Error processing guest offers on init:', error);
              dispatch({ type: 'SET_CART_ITEMS', payload: storedItems });
            });
          } else {
            dispatch({ type: 'SET_CART_ITEMS', payload: storedItems });
          }
        }
        console.log('Guest user - cart loaded from localStorage');
      }
    }
  }, []);

  // Force refresh cart from backend
  const forceRefreshCart = useCallback(async () => {
    if (isSyncing.current) {
      console.log('Sync already in progress, skipping force refresh');
      return;
    }

    // Prevent rapid successive refreshes after removal operations
    const now = Date.now();
    if (now - lastRemovalTime.current < 2000) {
      console.log('Recent removal operation, skipping rapid refresh');
      return;
    }

    isSyncing.current = true;
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      console.log('Force refreshing cart from backend...');
      const freshCartItems = await cartService.refreshCartFromBackend();
      
      // For guest users, also process offers for paid/free assignment
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        console.log('Guest user detected - processing offers for paid/free assignment');
        const processedCartItems = await cartService.processGuestOffers(freshCartItems);
        console.log('Force refresh completed with guest offer processing. Items:', processedCartItems.length);
        dispatch({ type: 'SET_CART_ITEMS', payload: processedCartItems });
      } else {
        console.log('Force refresh completed. Items:', freshCartItems.length);
        dispatch({ type: 'SET_CART_ITEMS', payload: freshCartItems });
      }
    } catch (error) {
      console.error('Force refresh failed:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      isSyncing.current = false;
      setForceRefreshRequested(false);
    }
  }, []);

  // Sync with backend - INTELLIGENT SYNC WITH STOCK VALIDATION
  const syncCart = useCallback(async () => {
    if (isSyncing.current) {
      console.log('Sync already in progress, skipping');
      return;
    }

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      console.log('No access token, skipping sync');
      return;
    }

    isSyncing.current = true;
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      console.log('Starting intelligent cart sync with stock validation...');

      // Get both local and backend carts
      const localCart = state.cartItems;
      const backendCart = await cartService.fetchCartFromBackend();
      
      console.log('Local cart items:', localCart.length);
      console.log('Backend cart items:', backendCart.length);

      // For offers, we need a different strategy since they're complex
      // 1. Always trust backend for synced offers
      // 2. Only push local offers that don't exist on backend
      // 3. Don't do intelligent merge for offers - too complex

      const finalCart: CartItemType[] = [];
      
      // Get all offer items from backend (always trust backend for synced offers)
      const backendOfferItems = backendCart.filter(item => item.type === 'offer') as CartOfferItem[];
      console.log('Backend offer items:', backendOfferItems.length);
      
      // Get local offer items that might need to be pushed to backend
      const localOfferItems = localCart.filter(item => item.type === 'offer' && !item.isSynced) as CartOfferItem[];
      console.log('Local unsynced offer items:', localOfferItems.length);
      
      // Add all backend offers to final cart first
      finalCart.push(...backendOfferItems);
      
      // Check which local offers actually need to be pushed (don't exist on backend)
      const offersToActuallyPush: CartOfferItem[] = [];
      
      for (const localOffer of localOfferItems) {
        // Check if this offer already exists on backend by comparing offer ID and products
        const existsOnBackend = backendOfferItems.some(backendOffer => {
          // Same offer ID
          if (backendOffer.offer.replace(/-/g, '') !== localOffer.offer.replace(/-/g, '')) {
            return false;
          }
          
          // Check if products match (simple comparison by product IDs and quantities)
          const backendProductSignature = backendOffer.offer_items
            .map(item => `${item.id.replace(/-/g, '')}-${item.selectedVariant?.id?.replace(/-/g, '') || 'novariant'}-${item.quantity}`)
            .sort()
            .join('|');
            
          const localProductSignature = localOffer.offer_items
            .map(item => `${item.id.replace(/-/g, '')}-${item.selectedVariant?.id?.replace(/-/g, '') || 'novariant'}-${item.quantity}`)
            .sort()
            .join('|');
            
          return backendProductSignature === localProductSignature;
        });
        
        if (!existsOnBackend) {
          console.log('Local offer not found on backend, will push:', localOffer.offer_name.offer_name);
          offersToActuallyPush.push(localOffer);
        } else {
          console.log('Local offer already exists on backend, skipping push:', localOffer.offer_name.offer_name);
        }
      }
      
      console.log('Offers that actually need to be pushed:', offersToActuallyPush.length);
      
      // Push only the offers that don't exist on backend
      for (const localOffer of offersToActuallyPush) {
        try {
          console.log('Pushing unique local offer to backend:', localOffer.offer_name.offer_name);
          
          const productsPayloadForBackend: { product_id: string; variant_id?: string }[] = [];
          localOffer.offer_items.forEach((p) => {
            const productIdClean = p.id.replace(/-/g, '');
            const variantIdClean = p.selectedVariant?.id?.replace(/-/g, '');

            for (let q = 0; q < p.quantity; q++) {
              productsPayloadForBackend.push({
                product_id: productIdClean,
                ...(variantIdClean && { variant_id: variantIdClean }),
              });
            }
          });

          await apiService.addToCartOffer({
            offer_id: localOffer.offer.replace(/-/g, ''),
            products: productsPayloadForBackend,
          });
          
          console.log('Successfully pushed unique local offer to backend');
        } catch (error) {
          console.error('Error pushing unique local offer to backend:', error);
          // If push fails, keep the local offer in cart
          finalCart.push(localOffer);
        }
      }
      
      // After pushing unique offers, fetch fresh backend data to get the complete state
      if (offersToActuallyPush.length > 0) {
        try {
          console.log('Fetching fresh cart after pushing unique local offers...');
          const freshBackendCart = await cartService.fetchCartFromBackend();
          const freshBackendOffers = freshBackendCart.filter(item => item.type === 'offer') as CartOfferItem[];
          
          // Replace backend offers with fresh data
          const cartWithoutOffers = finalCart.filter(item => item.type !== 'offer');
          finalCart.length = 0; // Clear array
          finalCart.push(...cartWithoutOffers, ...freshBackendOffers);
          
          console.log('Updated cart with fresh backend offers after unique push:', freshBackendOffers.length);
        } catch (error) {
          console.error('Error fetching fresh backend data after unique push:', error);
        }
      }

      // For normal items, do intelligent merge
      const localNormalItems = localCart.filter(item => item.type === 'normal') as CartNormalItem[];
      const backendNormalItems = backendCart.filter(item => item.type === 'normal') as CartNormalItem[];

      // Collect all unique product IDs to fetch fresh stock data
      const allProductIds = new Set<string>();
      [...localNormalItems, ...backendNormalItems].forEach(item => {
        allProductIds.add(item.product_id.replace(/-/g, ''));
      });

      // Fetch fresh product data with current stock
      let stockMap = new Map<string, ProductItemDetails>();
      if (allProductIds.size > 0) {
        try {
          const productsResponse = await apiService.getPaginatedProducts(1, 100, undefined, Array.from(allProductIds));
          productsResponse.products.forEach((p: any) => {
            stockMap.set(p.id.replace(/-/g, ''), {
              id: p.id,
              images: p.images || [],
              product_code: p.product_code,
              product_name: p.product_name,
              product_description: p.product_description,
              product_price: p.product_price,
              strike_price: p.strike_price,
              quantity: p.quantity,
              product_weight: p.product_weight,
              product_box_weight: p.product_box_weight,
              product_status: p.product_status,
              created_at: p.created_at,
              updated_at: p.updated_at,
              sub_category: p.sub_category,
              isInStock: p.product_status && p.quantity > 0,
              have_variants: p.have_variants || false,
              product_variant: p.product_variant || [],
            });
          });
          console.log('Fresh stock data fetched for', stockMap.size, 'products');
        } catch (error) {
          console.error('Failed to fetch fresh stock data:', error);
        }
      }

      // Helper function to get available stock for an item
      const getAvailableStock = (item: CartNormalItem): number => {
        const productData = stockMap.get(item.product_id.replace(/-/g, ''));
        if (!productData) return 0;

        if (item.selectedVariant && productData.have_variants) {
          const variant = productData.product_variant.find(v => 
            v.id.replace(/-/g, '') === item.selectedVariant!.id.replace(/-/g, '')
          );
          return variant?.quantity || 0;
        }
        return productData.quantity || 0;
      };

      // Create maps for easier comparison (product_id + variant_id as key)
      const createItemKey = (item: CartNormalItem) => {
        const variantId = item.selectedVariant?.id || 'no-variant';
        return `${item.product_id}-${variantId}`;
      };

      const localMap = new Map<string, CartNormalItem>();
      const backendMap = new Map<string, CartNormalItem>();

      localNormalItems.forEach(item => {
        const key = createItemKey(item);
        localMap.set(key, item);
      });

      backendNormalItems.forEach(item => {
        const key = createItemKey(item);
        backendMap.set(key, item);
      });

      const itemsToAddToBackend: CartNormalItem[] = [];
      const itemsToUpdateInBackend: { item: CartNormalItem; newQuantity: number }[] = [];
      const stockWarnings: string[] = [];

      // Process all unique keys (from both local and backend)
      const allKeys = new Set([...localMap.keys(), ...backendMap.keys()]);

      for (const key of allKeys) {
        const localItem = localMap.get(key);
        const backendItem = backendMap.get(key);

        if (localItem && backendItem) {
          // Item exists in both - compare quantities with stock validation
          const localQty = localItem.quantity;
          const backendQty = backendItem.quantity;
          const availableStock = getAvailableStock(localItem);

          // Determine the desired quantity (higher of the two)
          const desiredQty = Math.max(localQty, backendQty);
          
          // Apply stock limit
          const finalQty = Math.min(desiredQty, availableStock);

          if (finalQty < desiredQty) {
            const productName = localItem.product_name;
            const variantInfo = localItem.selectedVariant ? ` (${localItem.selectedVariant.variant_name})` : '';
            stockWarnings.push(`${productName}${variantInfo}: Reduced quantity from ${desiredQty} to ${finalQty} due to stock limit`);
            console.log(`Stock limit applied for ${key}: desired ${desiredQty}, available ${availableStock}, final ${finalQty}`);
          }

          if (finalQty === 0) {
            // Remove item completely if no stock
            const productName = localItem.product_name;
            const variantInfo = localItem.selectedVariant ? ` (${localItem.selectedVariant.variant_name})` : '';
            stockWarnings.push(`${productName}${variantInfo}: Removed from cart - out of stock`);
            console.log(`Removing item ${key} - no stock available`);
            continue; // Skip adding to final cart
          }

          // Create the final item with validated quantity
          const finalItem = { ...localItem, quantity: finalQty };

          if (localQty > backendQty && finalQty !== backendQty) {
            // Need to update backend
            console.log(`Updating backend quantity for ${key}: ${backendQty} -> ${finalQty}`);
            itemsToUpdateInBackend.push({ item: finalItem, newQuantity: finalQty });
          }

          finalCart.push(finalItem);
        } else if (localItem && !backendItem) {
          // Item exists only in local - validate stock before adding to backend
          const availableStock = getAvailableStock(localItem);
          const finalQty = Math.min(localItem.quantity, availableStock);

          if (finalQty < localItem.quantity) {
            const productName = localItem.product_name;
            const variantInfo = localItem.selectedVariant ? ` (${localItem.selectedVariant.variant_name})` : '';
            stockWarnings.push(`${productName}${variantInfo}: Reduced quantity from ${localItem.quantity} to ${finalQty} due to stock limit`);
          }

          if (finalQty > 0) {
            const finalItem = { ...localItem, quantity: finalQty };
            console.log(`Adding local item to backend with stock validation: ${key} (qty: ${finalQty})`);
            itemsToAddToBackend.push(finalItem);
            finalCart.push(finalItem);
          } else {
            const productName = localItem.product_name;
            const variantInfo = localItem.selectedVariant ? ` (${localItem.selectedVariant.variant_name})` : '';
            stockWarnings.push(`${productName}${variantInfo}: Removed from cart - out of stock`);
          }
        } else if (!localItem && backendItem) {
          // Item exists only in backend - validate stock before adding to local
          const availableStock = getAvailableStock(backendItem);
          const finalQty = Math.min(backendItem.quantity, availableStock);

          if (finalQty < backendItem.quantity) {
            const productName = backendItem.product_name;
            const variantInfo = backendItem.selectedVariant ? ` (${backendItem.selectedVariant.variant_name})` : '';
            stockWarnings.push(`${productName}${variantInfo}: Reduced quantity from ${backendItem.quantity} to ${finalQty} due to stock limit`);
          }

          if (finalQty > 0) {
            const finalItem = { ...backendItem, quantity: finalQty };
            console.log(`Adding backend item to local with stock validation: ${key} (qty: ${finalQty})`);
            finalCart.push(finalItem);
          } else {
            const productName = backendItem.product_name;
            const variantInfo = backendItem.selectedVariant ? ` (${backendItem.selectedVariant.variant_name})` : '';
            stockWarnings.push(`${productName}${variantInfo}: Removed from cart - out of stock`);
          }
        }
      }

      // Execute backend updates
      for (const { item, newQuantity } of itemsToUpdateInBackend) {
        try {
          const backendItem = backendMap.get(createItemKey(item));
          const currentQty = backendItem ? backendItem.quantity : 0;
          const difference = newQuantity - currentQty;
          
          if (difference > 0) {
            // Need to add more
            for (let i = 0; i < difference; i++) {
              await cartService.addToCart({
                product_id: item.product_id.replace(/-/g, ''),
                mode: '+',
                ...(item.selectedVariant && {
                  variant_id: item.selectedVariant.id.replace(/-/g, ''),
                }),
              });
            }
          }
        } catch (error) {
          console.error('Error updating backend quantity:', error);
          // Continue with other items
        }
      }

      // Execute backend additions
      for (const item of itemsToAddToBackend) {
        try {
          for (let i = 0; i < item.quantity; i++) {
            await cartService.addToCart({
              product_id: item.product_id.replace(/-/g, ''),
              mode: '+',
              ...(item.selectedVariant && {
                variant_id: item.selectedVariant.id.replace(/-/g, ''),
              }),
            });
          }
        } catch (error) {
          console.error('Error adding item to backend:', error);
          // Continue with other items
        }
      }

      // Update local storage with final cart
      console.log('Final synced cart items:', finalCart.length);
      dispatch({ type: 'SET_CART_ITEMS', payload: finalCart });

      // Show stock warnings to user if any
      if (stockWarnings.length > 0) {
        console.warn('Stock validation warnings:', stockWarnings);
        const warningMessage = `Cart updated due to stock limitations:\n${stockWarnings.join('\n')}`;
        if (typeof window !== 'undefined') {
          setTimeout(() => alert(warningMessage), 100);
        }
      }

    } catch (error) {
      console.error('Cart sync failed:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      isSyncing.current = false;
      setSyncRequested(false);
    }
  }, [state.cartItems]);

  // Debounced sync function
  const debouncedSync = useDebounce(() => {
    setSyncRequested(true);
  }, 1000);

  // Auto-sync when requested
  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');

    if (accessToken && syncRequested && isInitialized.current) {
      console.log('Sync requested for authenticated user');
      syncCart();
    } else if (syncRequested && !accessToken) {
      // Reset sync request for guest users
      setSyncRequested(false);
      console.log('Sync requested but no access token - skipping');
    }
  }, [syncRequested, syncCart]);

  // Auto force refresh when requested
  useEffect(() => {
    if (forceRefreshRequested && isInitialized.current) {
      console.log('Force refresh requested');
      forceRefreshCart();
    }
  }, [forceRefreshRequested, forceRefreshCart]);

  // Clear cart function
  const clearCart = useCallback(async () => {
    const accessToken = localStorage.getItem('accessToken');

    if (accessToken) {
      try {
        await apiService.addToCart({ mode: 'delete_cart' });
        console.log('Cart cleared on backend');
      } catch (error) {
        console.error('Error clearing cart on backend:', error);
      }
    }

    dispatch({ type: 'CLEAR_CART' });
  }, []);

  // Enhanced dispatch function with better backend sync
  const customDispatch: React.Dispatch<CartAction> = useCallback(
    async (action: CartAction) => {
      const accessToken = localStorage.getItem('accessToken');

      if (action.type === 'TRIGGER_SYNC') {
        setSyncRequested(true);
        return;
      }

      if (action.type === 'FORCE_REFRESH') {
        setForceRefreshRequested(true);
        return;
      }

      // Handle backend operations for authenticated users
      if (accessToken && isInitialized.current) {
        console.log('Processing backend operation for:', action.type, 'accessToken:', !!accessToken, 'initialized:', isInitialized.current);
        try {
          if (action.type === 'REMOVE_ITEM') {
            const operationKey = `remove-${action.payload}`;
            if (pendingOperations.current.has(operationKey)) {
              console.log('Remove operation already pending for:', action.payload);
              return;
            }

            pendingOperations.current.add(operationKey);

            try {
              console.log('Removing item from backend:', action.payload);
              
              // Find the item to determine if it's an offer or normal item
              const itemToRemove = state.cartItems.find(item => item.id === action.payload);
              
              if (itemToRemove) {
                if (itemToRemove.type === 'offer') {
                  console.log('Removing offer item using removeOfferItem method');
                  
                  // Track removal time to prevent rapid refreshes
                  lastRemovalTime.current = Date.now();
                  
                  await cartService.removeOfferItem(action.payload);
                  
                  // For offer removal, wait a bit longer before refresh to ensure backend processing
                  console.log('Offer removed, waiting before refresh to ensure backend sync...');
                  setTimeout(() => {
                    if (isMounted.current && !pendingOperations.current.has(operationKey)) {
                      setForceRefreshRequested(true);
                    }
                  }, 1500); // Longer delay for offers
                } else {
                  console.log('Removing normal item using removeNormalItem method');
                  await cartService.removeNormalItem(action.payload);
                  
                  // Normal refresh timing for normal items
                  setTimeout(() => {
                    if (isMounted.current && !pendingOperations.current.has(operationKey)) {
                      setForceRefreshRequested(true);
                    }
                  }, 500);
                }
              } else {
                console.warn('Item not found in cart, using fallback removal method');
                await cartService.addToCart({
                  item_id: action.payload.replace(/-/g, ''),
                  mode: 'delete',
                });
                
                setTimeout(() => {
                  if (isMounted.current) {
                    setForceRefreshRequested(true);
                  }
                }, 500);
              }
              
              console.log('Item removed from backend successfully');
            } finally {
              pendingOperations.current.delete(operationKey);
            }
          } else if (action.type === 'UPDATE_ITEM_QUANTITY') {
            const itemToUpdate = state.cartItems.find((item) => item.id === action.payload.id);
            if (!itemToUpdate || itemToUpdate.type !== 'normal') {
              console.warn('Item not found or not normal type for quantity update');
              dispatch(action);
              return;
            }

            const operationKey = `update-${action.payload.id}`;
            if (pendingOperations.current.has(operationKey)) {
              console.log('Update operation already pending for:', action.payload.id);
              return;
            }

            pendingOperations.current.add(operationKey);

            try {
              const currentQuantity = itemToUpdate.quantity;
              const newQuantity = action.payload.quantity;
              const quantityDifference = newQuantity - currentQuantity;

              if (quantityDifference !== 0) {
                console.log(`Updating quantity: ${currentQuantity} -> ${newQuantity} (diff: ${quantityDifference})`);

                const normalItem = itemToUpdate as CartNormalItem;
                const mode = quantityDifference > 0 ? '+' : '-';

                // Make single API call with proper product_id and variant_id matching
                await cartService.addToCart({
                  product_id: normalItem.product_id.replace(/-/g, ''),
                  mode: mode,
                  ...(normalItem.selectedVariant && {
                    variant_id: normalItem.selectedVariant.id.replace(/-/g, ''),
                  }),
                });
                console.log('Quantity updated on backend successfully with variant matching');
                
                // Force refresh to get updated cart state
                setTimeout(() => {
                  setForceRefreshRequested(true);
                }, 500);
              }
            } finally {
              pendingOperations.current.delete(operationKey);
            }
          } else if (action.type === 'ADD_NORMAL_ITEM') {
            const operationKey = `add-${action.payload.product_id}-${action.payload.selectedVariant?.id || 'no-variant'}`;
            if (pendingOperations.current.has(operationKey)) {
              console.log('Add operation already pending for:', action.payload.product_id);
              return;
            }

            pendingOperations.current.add(operationKey);

            try {
              console.log('Adding item to backend:', action.payload.product_id, 'quantity:', action.payload.quantity);
              
              // For new items, add each unit individually (this is correct for your backend)
              for (let i = 0; i < action.payload.quantity; i++) {
                await cartService.addToCart({
                  product_id: action.payload.product_id.replace(/-/g, ''),
                  mode: '+',
                  ...(action.payload.selectedVariant && {
                    variant_id: action.payload.selectedVariant.id.replace(/-/g, ''),
                  }),
                });
              }
              console.log('Item added to backend successfully');
              
              // Force refresh to get updated cart state
              setTimeout(() => {
                setForceRefreshRequested(true);
              }, 500);
            } finally {
              pendingOperations.current.delete(operationKey);
            }
          } else if (action.type === 'ADD_OFFER_SET') {
            const operationKey = `add-offer-${action.payload.offer}`;
            if (pendingOperations.current.has(operationKey)) {
              console.log('Add offer operation already pending for:', action.payload.offer);
              return;
            }

            pendingOperations.current.add(operationKey);

            try {
              const offerItem = action.payload as CartOfferItem;
              console.log('Adding offer to backend:', offerItem.offer);

              const productsPayloadForBackend: { product_id: string; variant_id?: string }[] = [];
              offerItem.offer_items.forEach((p) => {
                const productIdClean = p.id.replace(/-/g, '');
                const variantIdClean = p.selectedVariant?.id?.replace(/-/g, '');

                for (let q = 0; q < p.quantity; q++) {
                  productsPayloadForBackend.push({
                    product_id: productIdClean,
                    ...(variantIdClean && { variant_id: variantIdClean }),
                  });
                }
              });

              await apiService.addToCartOffer({
                offer_id: offerItem.offer.replace(/-/g, ''),
                products: productsPayloadForBackend,
              });
              console.log('Offer added to backend successfully');
              
              // Force refresh to get updated cart state
              setTimeout(() => {
                setForceRefreshRequested(true);
              }, 1000);
            } finally {
              pendingOperations.current.delete(operationKey);
            }
          }
        } catch (error) {
          console.error(`Error in backend operation for ${action.type}:`, error);
        }
      } else {
        console.log('Skipping backend operation for:', action.type, 'accessToken:', !!accessToken, 'initialized:', isInitialized.current);
      }

      // Always dispatch to local state first
      dispatch(action);
    },
    [state.cartItems, debouncedSync]
  );

  // Helper functions
  const getTotalProductQuantitiesInCart = useCallback(() => {
    const quantities = new Map<string, number>();

    state.cartItems.forEach((cartItem) => {
      if (cartItem.type === 'normal') {
        const productId = cartItem.product_id.replace(/-/g, '');
        const variantId = cartItem.selectedVariant?.id?.replace(/-/g, '');
        const key = variantId ? `${productId}-${variantId}` : productId;
        quantities.set(key, (quantities.get(key) || 0) + cartItem.quantity);
      } else if (cartItem.type === 'offer') {
        cartItem.offer_items.forEach((offerProduct) => {
          const productId = offerProduct.id.replace(/-/g, '');
          const variantId = offerProduct.selectedVariant?.id?.replace(/-/g, '');
          const key = variantId ? `${productId}-${variantId}` : productId;
          quantities.set(key, (quantities.get(key) || 0) + (offerProduct.quantity || 1));
        });
      }
    });
    return quantities;
  }, [state.cartItems]);

  const getEffectiveProductStock = useCallback(
    (productDetails: ProductItemDetails, variantId?: string): number => {
      let totalInCart = 0;

      const normalizedProductId = productDetails.id.replace(/-/g, '');
      const normalizedVariantId = variantId?.replace(/-/g, '');

      state.cartItems.forEach((item) => {
        if (item.type === 'normal') {
          const currentItemId = item.product_id.replace(/-/g, '');
          const currentItemVariantId = item.selectedVariant?.id?.replace(/-/g, '');

          if (currentItemId === normalizedProductId) {
            if (normalizedVariantId) {
              if (currentItemVariantId === normalizedVariantId) {
                totalInCart += item.quantity;
              }
            } else {
              if (!currentItemVariantId) {
                totalInCart += item.quantity;
              }
            }
          }
        } else if (item.type === 'offer') {
          item.offer_items.forEach((offerProduct) => {
            const currentOfferProductId = offerProduct.id.replace(/-/g, '');
            const currentOfferVariantId = offerProduct.selectedVariant?.id?.replace(/-/g, '');

            if (currentOfferProductId === normalizedProductId) {
              if (normalizedVariantId) {
                if (currentOfferVariantId === normalizedVariantId) {
                  totalInCart += offerProduct.quantity;
                }
              } else {
                if (!currentOfferVariantId) {
                  totalInCart += offerProduct.quantity;
                }
              }
            }
          });
        }
      });

      let actualStock = 0;
      if (productDetails.have_variants) {
        if (normalizedVariantId) {
          const variant = productDetails.product_variant.find((v) => v.id.replace(/-/g, '') === normalizedVariantId);
          actualStock = variant?.quantity ?? 0;
        } else {
          actualStock = productDetails.quantity ?? 0;
        }
      } else {
        actualStock = productDetails.quantity ?? 0;
      }

      return Math.max(0, actualStock - totalInCart);
    },
    [state.cartItems]
  );

  const calculateTotals = useCallback(() => {
    let normalSubtotal = 0;
    let offerSubtotal = 0;
    let offerSavings = 0;
    let totalItems = 0;

    state.cartItems.forEach((item) => {
      if (item.type === 'normal') {
        const itemTotal = parseFloat(item.product_price) * item.quantity;
        normalSubtotal += itemTotal;
        totalItems += item.quantity;
      } else if (item.type === 'offer') {
        let offerPaidTotal = 0;
        let offerFreeTotal = 0;

        item.offer_items.forEach((product) => {
          const productPrice = parseFloat(product.product_price);
          const productTotal = productPrice * product.quantity;

          if (product.isPaid) {
            offerPaidTotal += productTotal;
          } else {
            offerFreeTotal += productTotal;
          }

          totalItems += product.quantity;
        });

        offerSubtotal += offerPaidTotal;
        offerSavings += offerFreeTotal;
      }
    });

    const grandTotal = normalSubtotal + offerSubtotal;

    return {
      normalSubtotal,
      offerSubtotal,
      offerSavings,
      totalItems,
      grandTotal,
    };
  }, [state.cartItems]);

  const contextValue = useMemo(
    () => ({
      cartItems: state.cartItems,
      loading: state.loading,
      dispatchCart: customDispatch,
      getTotalProductQuantitiesInCart,
      getEffectiveProductStock,
      syncCart,
      forceRefreshCart,
      clearCart,
      calculateTotals,
    }),
    [state.cartItems, state.loading, customDispatch, getTotalProductQuantitiesInCart, getEffectiveProductStock, syncCart, forceRefreshCart, clearCart, calculateTotals]
  );

  return <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === null) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};