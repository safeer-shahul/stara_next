'use client';
import { createContext, useContext, useReducer, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import apiService from '@/utils/api/apiService';
import { cartService } from '@/utils/api/cartService';
import { v4 as uuidv4 } from 'uuid';

// Keep all existing type definitions
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

// Reducer Action Types
export type CartAction =
  | { type: 'SET_CART_ITEMS'; payload: CartItemType[] }
  | { type: 'ADD_OFFER_SET'; payload: CartOfferItem }
  | { type: 'ADD_NORMAL_ITEM'; payload: CartNormalItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_ITEM_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'UPDATE_OFFER_ID'; payload: { tempId: string; actualId: string } } // NEW ACTION
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_CART' }
  | { type: 'FORCE_REFRESH' };

// Cart State and Context
interface CartState {
  cartItems: CartItemType[];
  loading: boolean;
}

interface CartContextType extends CartState {
  authMode: 'guest' | 'authenticated';
  dispatchCart: React.Dispatch<CartAction>;
  getTotalProductQuantitiesInCart: () => Map<string, number>;
  getEffectiveProductStock: (productDetails: ProductItemDetails, variantId?: string) => number;
  forceRefreshCart: () => Promise<void>;
  clearCart: () => Promise<void>;
  checkBackendCartEmpty: () => Promise<boolean>;
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

// Local Storage Management
const CART_STORAGE_KEY = 'cartItems';

const saveToLocalStorage = (items: CartItemType[]) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      console.log('💾 Cart saved to localStorage:', items.length, 'items');
    } catch (error) {
      console.error('❌ Error saving to localStorage:', error);
    }
  }
};

const loadFromLocalStorage = (): CartItemType[] => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log('📂 Cart loaded from localStorage:', parsed.length, 'items');
      return parsed.map((item: any) => ({
        ...item,
        id: item.id || uuidv4(),
        isSynced: false,
      }));
    }
  } catch (error) {
    console.error('❌ Error loading from localStorage:', error);
    localStorage.removeItem(CART_STORAGE_KEY);
  }
  return [];
};

const clearLocalStorage = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CART_STORAGE_KEY);
    console.log('🗑️ Cart localStorage cleared');
  }
};

// Cart Reducer
const cartReducer = (state: CartState, action: CartAction): CartState => {
  let newItems: CartItemType[];

  switch (action.type) {
    case 'SET_CART_ITEMS':
      console.log('🔄 Reducer: SET_CART_ITEMS', action.payload.length, 'items');
      return { ...state, cartItems: action.payload };

    case 'ADD_NORMAL_ITEM':
      console.log('➕ Reducer: ADD_NORMAL_ITEM', action.payload.product_name);

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

      return { ...state, cartItems: newItems };

    case 'ADD_OFFER_SET':
      console.log('🎁 Reducer: ADD_OFFER_SET', action.payload.offer_name.offer_name);

      const newOfferSet: CartOfferItem = {
        ...action.payload,
        id: action.payload.id || uuidv4(),
        isSynced: false,
        created_at: action.payload.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      newItems = [...state.cartItems, newOfferSet];
      return { ...state, cartItems: newItems };

    case 'UPDATE_OFFER_ID':
      console.log('🔄 Reducer: UPDATE_OFFER_ID', `${action.payload.tempId} → ${action.payload.actualId}`);
      newItems = state.cartItems.map((item) => {
        if (item.type === 'offer' && item.id === action.payload.tempId) {
          return {
            ...item,
            id: action.payload.actualId,
            isSynced: true, // Mark as synced since it now has backend ID
            updated_at: new Date().toISOString(),
          };
        }
        return item;
      });
      return { ...state, cartItems: newItems };

    case 'REMOVE_ITEM':
      console.log('🗑️ Reducer: REMOVE_ITEM', action.payload);
      newItems = state.cartItems.filter((item) => item.id !== action.payload);
      return { ...state, cartItems: newItems };

    case 'UPDATE_ITEM_QUANTITY':
      console.log('📊 Reducer: UPDATE_ITEM_QUANTITY', action.payload);
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
      return { ...state, cartItems: newItems };

    case 'CLEAR_CART':
      console.log('🧹 Reducer: CLEAR_CART');
      return { ...state, cartItems: [] };

    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    default:
      console.warn(`❓ Unhandled action type: ${(action as { type: string }).type}`);
      return state;
  }
};

// Cart Provider Component
export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [authMode, setAuthMode] = useState<'guest' | 'authenticated'>('guest');
  const isInitialized = useRef(false);
  const isSyncing = useRef(false);
  const prevAccessTokenRef = useRef<string | null>(null);
  const pendingOperations = useRef(new Set<string>());

  // Track component mount status
  useEffect(() => {
    return () => {
      // Cleanup pending operations on unmount
      pendingOperations.current.clear();
    };
  }, []);

  // Listen for beforeLogout event to save cart
  useEffect(() => {
    const handleBeforeLogout = () => {
      console.log('💾 Saving cart before logout...');
      saveToLocalStorage(state.cartItems);
    };

    window.addEventListener('beforeLogout', handleBeforeLogout);
    return () => window.removeEventListener('beforeLogout', handleBeforeLogout);
  }, [state.cartItems]);

  // Track authentication state changes
  useEffect(() => {
    const checkAuthChange = () => {
      const currentAccessToken = localStorage.getItem('accessToken');
      const previousToken = prevAccessTokenRef.current;

      // LOGIN DETECTED: Clear localStorage and switch to API mode
      if (!previousToken && currentAccessToken) {
        console.log('🔑 Login detected - switching to API-first mode');
        setAuthMode('authenticated');
        handleLoginTransition();
      }
      
      // LOGOUT DETECTED: Switch back to localStorage mode
      else if (previousToken && !currentAccessToken) {
        console.log('🚪 Logout detected - switching to localStorage mode');
        setAuthMode('guest');
        handleLogoutTransition();
      }

      prevAccessTokenRef.current = currentAccessToken;
    };

    checkAuthChange();
    const interval = setInterval(checkAuthChange, 500);
    return () => clearInterval(interval);
  }, []);

  // Handle login transition: localStorage → API
  const handleLoginTransition = useCallback(async () => {
    try {
      console.log('📤 Transferring localStorage cart to backend...');
      
      // Get current localStorage items
      const localItems = loadFromLocalStorage();
      
      // Push all local items to backend first
      if (localItems.length > 0) {
        await cartService.pushLocalCartToBackend(localItems);
        console.log('✅ Local cart transferred to backend');
      }
      
      // Clear localStorage completely
      clearLocalStorage();
      console.log('🗑️ localStorage cleared');
      
      // Fetch fresh cart from backend (now authoritative)
      await loadCartFromAPI();
      
    } catch (error) {
      console.error('❌ Error during login transition:', error);
      // Fallback: load from localStorage if backend fails
      const fallbackItems = loadFromLocalStorage();
      dispatch({ type: 'SET_CART_ITEMS', payload: fallbackItems });
    }
  }, []);

  // Handle logout transition: API → localStorage
  const handleLogoutTransition = useCallback(async () => {
    try {
      console.log('💾 Cart preserved for guest mode');
      // Cart is already saved by beforeLogout event listener
      
      // Load from localStorage for guest mode
      const storedItems = loadFromLocalStorage();
      const processedItems = await cartService.processGuestOffers(storedItems);
      dispatch({ type: 'SET_CART_ITEMS', payload: processedItems });
      
    } catch (error) {
      console.error('❌ Error during logout transition:', error);
      const fallbackItems = loadFromLocalStorage();
      dispatch({ type: 'SET_CART_ITEMS', payload: fallbackItems });
    }
  }, []);

  // Load cart from API (for authenticated users)
  const loadCartFromAPI = useCallback(async () => {
    if (authMode !== 'authenticated') return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      console.log('🔄 Loading cart from API...');
      
      const cartItems = await cartService.fetchCartFromBackend();
      dispatch({ type: 'SET_CART_ITEMS', payload: cartItems });
      
      console.log(`✅ Cart loaded from API: ${cartItems.length} items`);
    } catch (error) {
      console.error('❌ Error loading cart from API:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [authMode]);

  // Check if backend cart is empty (for multi-device sync)
  const checkBackendCartEmpty = useCallback(async (): Promise<boolean> => {
  if (authMode !== 'authenticated') return false;
  
  try {
    console.log('🔍 Performing lightweight backend cart check...');
    
    // OPTION 1: Use a lightweight cart summary API (if available)
    // const cartSummary = await apiService.getCartSummary();
    // return cartSummary.total_items === 0;
    
    // OPTION 2: Use existing getUserCart but just check length
    const backendCartResponse = await apiService.getUserCart();
    const normalItems = backendCartResponse?.shopping_cart?.items || [];
    const offerItems = backendCartResponse?.offer_cart?.items || [];
    const isEmpty = normalItems.length === 0 && offerItems.length === 0;
    
    console.log(`📊 Backend cart check: ${isEmpty ? 'empty' : 'has items'} (${normalItems.length + offerItems.length} total)`);
    return isEmpty;
    
  } catch (error) {
    console.error('❌ Error checking backend cart:', error);
    return false;
  }
}, [authMode]);

  // Initialize cart based on auth mode
  useEffect(() => {
    if (!isInitialized.current) {
      const currentAccessToken = localStorage.getItem('accessToken');
      
      if (currentAccessToken) {
        console.log('🔑 Authenticated user detected - API mode');
        setAuthMode('authenticated');
        loadCartFromAPI();
      } else {
        console.log('👤 Guest user detected - localStorage mode');
        setAuthMode('guest');
        const storedItems = loadFromLocalStorage();
        
        // Process guest offers if any
        if (storedItems.length > 0) {
          cartService.processGuestOffers(storedItems).then(processedItems => {
            dispatch({ type: 'SET_CART_ITEMS', payload: processedItems });
          }).catch(error => {
            console.error('❌ Error processing guest offers:', error);
            dispatch({ type: 'SET_CART_ITEMS', payload: storedItems });
          });
        } else {
          dispatch({ type: 'SET_CART_ITEMS', payload: storedItems });
        }
      }
      
      isInitialized.current = true;
      prevAccessTokenRef.current = currentAccessToken;
    }
  }, [loadCartFromAPI]);

  // OPTIMIZED dispatch function - minimal API calls
  const customDispatch: React.Dispatch<CartAction> = useCallback(
    async (action: CartAction) => {
      // For guest users, use localStorage
      if (authMode === 'guest') {
        dispatch(action);
        // Save to localStorage for guest users
        if (action.type !== 'SET_LOADING') {
          setTimeout(() => {
            saveToLocalStorage(state.cartItems);
          }, 0);
        }
        return;
      }

      // For authenticated users, use API-first approach
      if (authMode === 'authenticated') {
        try {
          if (action.type === 'REMOVE_ITEM') {
            const operationKey = `remove-${action.payload}`;
            if (pendingOperations.current.has(operationKey)) {
              console.log('⏳ Remove operation already pending for:', action.payload);
              return;
            }
            
            pendingOperations.current.add(operationKey);

            try {
              const itemToRemove = state.cartItems.find(item => item.id === action.payload);
              
              console.log('🗑️ Removing item from backend:', action.payload);
              
              // OPTIMIZED: Single API call for removal
              if (itemToRemove?.type === 'offer') {
                await cartService.removeOfferItem(action.payload);
              } else {
                await cartService.removeNormalItem(action.payload);
              }
              
              // OPTIMIZED: Update local state immediately
              dispatch(action);
              
              console.log('✅ Item removed from backend and local state');
            } finally {
              pendingOperations.current.delete(operationKey);
            }
          }
          
          else if (action.type === 'UPDATE_ITEM_QUANTITY') {
            const operationKey = `update-${action.payload.id}`;
            if (pendingOperations.current.has(operationKey)) {
              console.log('⏳ Update operation already pending for:', action.payload.id);
              return;
            }
            
            pendingOperations.current.add(operationKey);

            try {
              const itemToUpdate = state.cartItems.find(item => item.id === action.payload.id);
              if (!itemToUpdate || itemToUpdate.type !== 'normal') {
                dispatch(action);
                return;
              }

              const normalItem = itemToUpdate as CartNormalItem;
              const currentQty = normalItem.quantity;
              const newQty = action.payload.quantity;
              const difference = newQty - currentQty;

              if (difference !== 0) {
                console.log(`📊 Updating quantity: ${currentQty} → ${newQty} (diff: ${difference})`);
                
                // OPTIMIZED: Single API call for quantity change
                const mode = difference > 0 ? '+' : '-';
                const absoluteDiff = Math.abs(difference);
                
                // Make multiple calls only if needed (for your backend's design)
                for (let i = 0; i < absoluteDiff; i++) {
                  await cartService.addToCart({
                    product_id: normalItem.product_id.replace(/-/g, ''),
                    mode: mode,
                    ...(normalItem.selectedVariant && {
                      variant_id: normalItem.selectedVariant.id.replace(/-/g, ''),
                    }),
                  });
                }
                
                // OPTIMIZED: Update local state immediately
                dispatch(action);
                
                console.log(`✅ Quantity updated: ${currentQty} → ${newQty}`);
              }
            } finally {
              pendingOperations.current.delete(operationKey);
            }
          }
          
          else if (action.type === 'ADD_NORMAL_ITEM') {
            const operationKey = `add-${action.payload.product_id}-${action.payload.selectedVariant?.id || 'no-variant'}`;
            if (pendingOperations.current.has(operationKey)) {
              console.log('⏳ Add operation already pending for:', action.payload.product_id);
              return;
            }
            
            pendingOperations.current.add(operationKey);

            try {
              console.log('➕ Adding item to backend:', action.payload.product_id, 'quantity:', action.payload.quantity);
              
              // OPTIMIZED: Add to backend first
              for (let i = 0; i < action.payload.quantity; i++) {
                await cartService.addToCart({
                  product_id: action.payload.product_id.replace(/-/g, ''),
                  mode: '+',
                  ...(action.payload.selectedVariant && {
                    variant_id: action.payload.selectedVariant.id.replace(/-/g, ''),
                  }),
                });
              }
              
              // OPTIMIZED: Update local state immediately
              dispatch(action);
              
              console.log('✅ Item added to backend and local state');
            } finally {
              pendingOperations.current.delete(operationKey);
            }
          }
          
          else if (action.type === 'ADD_OFFER_SET') {
            const operationKey = `add-offer-${action.payload.offer}`;
            if (pendingOperations.current.has(operationKey)) {
              console.log('⏳ Add offer operation already pending for:', action.payload.offer);
              return;
            }
            
            pendingOperations.current.add(operationKey);

            try {
              const offerItem = action.payload as CartOfferItem;
              console.log('🎁 Adding offer to backend:', offerItem.offer);
              
              // Store temporary ID for updating later
              const tempId = offerItem.id;
              
              const productsPayload: { product_id: string; variant_id?: string }[] = [];
              offerItem.offer_items.forEach((p) => {
                for (let q = 0; q < p.quantity; q++) {
                  productsPayload.push({
                    product_id: p.id.replace(/-/g, ''),
                    ...(p.selectedVariant?.id && {
                      variant_id: p.selectedVariant.id.replace(/-/g, ''),
                    }),
                  });
                }
              });

              // FIXED: Call backend API and get the actual ID
              const backendResponse = await apiService.addToCartOffer({
                offer_id: offerItem.offer.replace(/-/g, ''),
                products: productsPayload,
              });
              
              // Add offer to local state with temporary ID first
              dispatch(action);
              
              // CRITICAL FIX: Update the temporary ID with actual backend ID
              if (backendResponse && backendResponse.id) {
                console.log('🔄 Updating offer ID from temp to backend:', tempId, '→', backendResponse.id);
                dispatch({ 
                  type: 'UPDATE_OFFER_ID', 
                  payload: { 
                    tempId: tempId, 
                    actualId: backendResponse.id 
                  } 
                });
              }
              
              console.log('✅ Offer added to backend and local state with correct ID');
            } finally {
              pendingOperations.current.delete(operationKey);
            }
          }
          
          else if (action.type === 'CLEAR_CART') {
            console.log('🧹 Clearing cart on backend and local state...');
            await apiService.addToCart({ mode: 'delete_cart' });
            dispatch(action);
            console.log('✅ Cart cleared on backend and local state');
          }
          
          else if (action.type === 'FORCE_REFRESH') {
            await loadCartFromAPI();
            return;
          }
          
          else {
            // For other actions, just update local state
            dispatch(action);
          }
          
        } catch (error) {
          console.error(`❌ Error in ${action.type}:`, error);
          // Always update local state even if backend fails
          dispatch(action);
        }
      }
    },
    [authMode, state.cartItems, loadCartFromAPI]
  );

  // Force refresh from API (for multi-device sync)
  const forceRefreshCart = useCallback(async () => {
    if (authMode === 'authenticated') {
      await loadCartFromAPI();
    } else {
      // For guests, process localStorage items
      const storedItems = loadFromLocalStorage();
      const processedItems = await cartService.processGuestOffers(storedItems);
      dispatch({ type: 'SET_CART_ITEMS', payload: processedItems });
    }
  }, [authMode, loadCartFromAPI]);

  // Clear cart with proper handling
  const clearCart = useCallback(async () => {
    if (authMode === 'authenticated') {
      try {
        await apiService.addToCart({ mode: 'delete_cart' });
        dispatch({ type: 'CLEAR_CART' });
      } catch (error) {
        console.error('❌ Error clearing cart on backend:', error);
        dispatch({ type: 'CLEAR_CART' });
      }
    } else {
      dispatch({ type: 'CLEAR_CART' });
      clearLocalStorage();
    }
  }, [authMode]);

  // Helper functions (keep existing implementations)
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

  // Context value
  const contextValue = useMemo(
    () => ({
      cartItems: state.cartItems,
      loading: state.loading,
      authMode,
      dispatchCart: customDispatch,
      forceRefreshCart,
      clearCart,
      checkBackendCartEmpty,
      getTotalProductQuantitiesInCart,
      getEffectiveProductStock,
      calculateTotals,
    }),
    [
      state.cartItems, 
      state.loading, 
      authMode,
      customDispatch, 
      forceRefreshCart, 
      clearCart, 
      checkBackendCartEmpty,
      getTotalProductQuantitiesInCart, 
      getEffectiveProductStock, 
      calculateTotals
    ]
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