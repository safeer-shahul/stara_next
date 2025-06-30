'use client';
import { createContext, useContext, useReducer, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import apiService from '@/utils/api/apiService';
import { cartService } from '@/utils/api/cartService';
import { v4 as uuidv4 } from 'uuid';

// --- Type Definitions ---
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
  | { type: 'TRIGGER_SYNC' };

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
  const isInitialized = useRef(false);
  const isSyncing = useRef(false);
  const prevAccessTokenRef = useRef<string | null>(null);

  // Track pending operations to prevent duplicates
  const pendingOperations = useRef(new Set<string>());

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

  // Debounced sync function
  const debouncedSync = useDebounce(() => {
    setSyncRequested(true);
  }, 1000); // Consolidated to a single declaration with 1000ms delay

  // Initialize cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized.current) {
      const currentAccessToken = localStorage.getItem('accessToken');
      const storedItems = loadFromLocalStorage();

      prevAccessTokenRef.current = currentAccessToken;
      isInitialized.current = true;

      if (currentAccessToken) {
        // For authenticated users, always sync first to get backend cart
        console.log('Authenticated user detected - syncing with backend');
        setSyncRequested(true);

        // Only set stored items temporarily if they exist, but sync will replace them
        if (storedItems.length > 0) {
          console.log('Setting temporary local items, will be replaced by backend sync');
          dispatch({ type: 'SET_CART_ITEMS', payload: storedItems });
        }
      } else {
        // For guest users, load from localStorage
        if (storedItems.length > 0) {
          dispatch({ type: 'SET_CART_ITEMS', payload: storedItems });
        }
        console.log('Guest user - cart loaded from localStorage');
      }
    }
  }, []);

  // Sync with backend
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
      console.log('Starting cart sync...');

      // For authenticated gebruikers, fetch backend cart first
      const backendCart = await cartService.fetchCartFromBackend();
      console.log('Fetched cart from backend:', backendCart.length, 'items');

      // Check if we have unsynced local items to merge
      const unsyncedItems = state.cartItems.filter((item) => !item.isSynced);

      if (unsyncedItems.length > 0) {
        console.log('Found unsynced local items, pushing to backend:', unsyncedItems.length);
        await cartService.pushLocalCartToBackend(unsyncedItems);

        // Fetch updated cart after pushing local items
        const updatedBackendCart = await cartService.fetchCartFromBackend();
        console.log('Fetched updated cart after merge:', updatedBackendCart.length, 'items');
        dispatch({ type: 'SET_CART_ITEMS', payload: updatedBackendCart });
      } else {
        // No local items to merge, use backend cart as-is
        dispatch({ type: 'SET_CART_ITEMS', payload: backendCart });
      }
    } catch (error) {
      console.error('Cart sync failed:', error);
      // On sync failure, don't clear the cart, just log the error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      isSyncing.current = false;
      setSyncRequested(false);
    }
  }, [state.cartItems]);

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
    async (action) => {
      const accessToken = localStorage.getItem('accessToken');

      if (action.type === 'TRIGGER_SYNC') {
        setSyncRequested(true);
        return;
      }

      // Handle backend operations for authenticated users
      if (accessToken && isInitialized.current) {
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
              await cartService.addToCart({
                item_id: action.payload.replace(/-/g, ''),
                mode: 'delete',
              });
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
                const absQuantityDiff = Math.abs(quantityDifference);
                const mode = quantityDifference > 0 ? '+' : '-';

                // Make single API calls for each unit change (matching old logic)
                for (let i = 0; i < absQuantityDiff; i++) {
                  await cartService.addToCart({
                    product_id: normalItem.product_id.replace(/-/g, ''),
                    mode: mode,
                    ...(normalItem.selectedVariant && {
                      variant_id: normalItem.selectedVariant.id.replace(/-/g, ''),
                    }),
                  });
                }
                console.log('Quantity updated on backend successfully');
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
              console.log('Adding item to backend:', action.payload.product_id);
              // Add each quantity unit separately (matching old logic)
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
            } finally {
              pendingOperations.current.delete(operationKey);
            }
          }
        } catch (error) {
          console.error(`Error in backend operation for ${action.type}:`, error);
        }
      }

      // Always dispatch to local state
      dispatch(action);

      // Schedule sync for authenticated users (but not immediately to prevent duplication)
      if (accessToken && ['ADD_NORMAL_ITEM', 'ADD_OFFER_SET', 'REMOVE_ITEM', 'UPDATE_ITEM_QUANTITY'].includes(action.type)) {
        console.log('Scheduling debounced sync for action:', action.type);
        debouncedSync();
      }
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
      clearCart,
      calculateTotals,
    }),
    [state.cartItems, state.loading, customDispatch, getTotalProductQuantitiesInCart, getEffectiveProductStock, syncCart, clearCart, calculateTotals]
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