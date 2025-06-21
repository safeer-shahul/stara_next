// src/context/cartContext.tsx
'use client';
import { createContext, useContext, useReducer, useEffect, useState, useRef } from 'react'; // Import useRef
import apiService from '@/utils/api/apiService';
import { cartService } from '@/utils/api/cartService';

// --- Type Definitions (Exported for use across components) ---

export interface ProductImage {
  id: string;
  product_image: string;
  product: string;
}

export interface ProductItemDetails {
  id: string; // Product UUID
  images: ProductImage[]; // Array of product image objects
  product_code: string;
  product_name: string;
  product_description: string;
  product_price: string;
  strike_price: string;
  quantity: number; // This is product stock quantity from the API
  product_weight: string;
  product_box_weight: string;
  product_status: boolean;
  created_at: string;
  updated_at: string;
  sub_category: string;
  isInStock: boolean; // Derived property
}

export interface CartNormalItem {
  id: string; // Cart item ID from backend, or local UUID
  product_id: string; // The UUID for the product itself
  quantity: number; // This is the QUANTITY IN CART
  type: 'normal';
  isSynced: boolean;
  // Enriched product details directly integrated (subset of ProductItemDetails)
  product_name: string;
  product_price: string;
  strike_price: string;
  images: ProductImage[];
  isInStock: boolean;
  stock_quantity: number; // Actual stock quantity from ProductItemDetails
}

export interface CartOfferItem {
  id: string; // Unique ID for this specific offer instance in the cart
  offer: string; // The UUID of the original offer
  offer_name: { id: string; offer_name: string; }; // Enriched offer details
  buy_count: number;
  get_count: number;
  isSynced: boolean;
  type: 'offer';
  main_product: ProductItemDetails; // The designated 'main' product (enriched)
  offer_products_extra: ProductItemDetails[]; // The remaining products in the offer (enriched)
}

export type CartItemType = CartNormalItem | CartOfferItem;

// --- Reducer Action Types ---

export type CartAction =
  | { type: 'SET_CART_ITEMS'; payload: CartItemType[] }
  | { type: 'ADD_OFFER_SET'; payload: CartOfferItem }
  | { type: 'ADD_NORMAL_ITEM'; payload: CartNormalItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CHECKOUT_DATA'; payload: {
        items: Array<{ product_id: string; quantity: number }>;
        offer_sets: Array<{
          id: string;
          offer: string;
          offer_products: Array<{ product: string; quantity: number }>; // This is flattened for backend checkout
          buy_count: number;
          get_count: number;
        }>;
    }
  };

// --- Cart State and Context Definitions ---

interface CartState {
  cartItems: CartItemType[];
  loading: boolean;
  checkoutData: CartAction['payload'];
}

interface CartContextType extends CartState {
  dispatchCart: React.Dispatch<CartAction>;
}

const CartContext = createContext<CartContextType | null>(null);

const initialState: CartState = {
  cartItems: [],
  loading: false,
  checkoutData: { items: [], offer_sets: [] },
};

// --- Cart Reducer ---

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'SET_CART_ITEMS':
      // Only update localStorage if there's an actual change to prevent unnecessary writes
      if (JSON.stringify(state.cartItems) !== JSON.stringify(action.payload)) {
        localStorage.setItem('cartItems', JSON.stringify(action.payload));
      }
      return { ...state, cartItems: action.payload };
    case 'ADD_OFFER_SET':
      {
        const newItems = [...state.cartItems, action.payload];
        localStorage.setItem('cartItems', JSON.stringify(newItems)); // Still write to local storage immediately
        return { ...state, cartItems: newItems };
      }
    case 'ADD_NORMAL_ITEM':
      {
        // Check if item already exists to update quantity, otherwise add new
        const existingItemIndex = state.cartItems.findIndex(
          (item) => item.type === 'normal' && item.product_id === action.payload.product_id
        );

        let newItems;
        if (existingItemIndex > -1) {
          newItems = [...state.cartItems];
          const existingItem = newItems[existingItemIndex] as CartNormalItem;
          newItems[existingItemIndex] = {
            ...existingItem,
            quantity: existingItem.quantity + action.payload.quantity, // Add quantities
            isSynced: false, // Mark as unsynced if quantity changed locally
          };
        } else {
          newItems = [...state.cartItems, action.payload];
        }
        localStorage.setItem('cartItems', JSON.stringify(newItems));
        return { ...state, cartItems: newItems };
      }
    case 'REMOVE_ITEM':
      {
        const filteredItems = state.cartItems.filter((item) => item.id !== action.payload);
        localStorage.setItem('cartItems', JSON.stringify(filteredItems));
        return { ...state, cartItems: filteredItems };
      }
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_CHECKOUT_DATA': // This action might be removed if CheckoutModal reads cart directly
      return { ...state, checkoutData: action.payload };
    default:
      console.warn(`Unhandled action type: ${(action as { type: string }).type}`);
      return state;
  }
};

// --- Cart Provider Component ---

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Use a ref to prevent initial useEffect runs from immediately triggering sync
  // and also to track if the initial load is complete.
  const isInitialLoadComplete = useRef(false);
  const isProcessingSync = useRef(false); // To prevent multiple concurrent sync calls

  // Effect 1: Load cart from localStorage on initial mount (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return; // Ensure running only on client

    const storedCartItems = localStorage.getItem('cartItems');
    if (storedCartItems) {
      try {
        const parsedItems: CartItemType[] = JSON.parse(storedCartItems);
        dispatch({ type: 'SET_CART_ITEMS', payload: parsedItems });
      } catch (e) {
        console.error("Failed to parse cart items from localStorage:", e);
        localStorage.removeItem('cartItems');
      }
    }
    setAccessToken(localStorage.getItem('accessToken'));
    isInitialLoadComplete.current = true; // Mark initial load as done
  }, []); // Run only once on initial mount

  // Effect 2: Handle cart synchronization with backend
  // Triggers when:
  // 1. Initial load is complete (after localStorage has been processed)
  // 2. AccessToken changes (user logs in/out)
  // 3. `cartItems` array reference changes AND there are unsynced items
  useEffect(() => {
    if (typeof window === 'undefined') return; // Ensure running only on client
    if (!isInitialLoadComplete.current) return; // Wait for initial localStorage load

    const syncCartWithBackend = async () => {
      // Prevent multiple concurrent sync operations
      if (isProcessingSync.current) {
        console.log("CartProvider: Sync already in progress, skipping.");
        return;
      }
      isProcessingSync.current = true;
      dispatch({ type: 'SET_LOADING', payload: true });

      try {
        let updatedCartAfterSync: CartItemType[];

        // Check for unsynced items if authenticated, then perform full fetch
        const hasUnsyncedItems = state.cartItems.some(item => !item.isSynced);
        
        if (accessToken) {
          if (hasUnsyncedItems) {
            console.log("CartProvider: Authenticated user with unsynced items. Syncing local cart to backend...");
            updatedCartAfterSync = await cartService.syncGuestCart(state.cartItems);
          } else {
            console.log("CartProvider: Authenticated user, fetching latest cart from backend.");
            updatedCartAfterSync = await cartService.fetchCartFromBackend();
          }
        } else {
          // Guest user: just re-enrich local storage items with latest product details
          // This will not send data to backend, but ensures product details are fresh.
          console.log("CartProvider: Guest user, re-fetching local cart details (no backend sync).");
          updatedCartAfterSync = await cartService.fetchCartFromBackend();
        }

        // Only dispatch SET_CART_ITEMS if the cart content has actually changed
        // This prevents infinite loops if the fetched/synced cart is identical to current state
        if (JSON.stringify(state.cartItems) !== JSON.stringify(updatedCartAfterSync)) {
          dispatch({ type: 'SET_CART_ITEMS', payload: updatedCartAfterSync });
        } else {
            console.log("CartProvider: Cart state identical after sync/fetch, no dispatch.");
        }

      } catch (error) {
        console.error('CartProvider: Error during cart synchronization:', error);
      } finally {
        isProcessingSync.current = false;
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    // Trigger conditions:
    // 1. AccessToken changes (login/logout, primary trigger for full sync)
    // 2. `state.cartItems` changes AND there are unsynced items (local add/remove by guest)
    //    OR `state.cartItems` length is 0 (to ensure fresh fetch if cart was cleared or just initialized empty)
    // This refined condition aims to trigger only when necessary.
    const hasUnsyncedItems = state.cartItems.some(item => !item.isSynced);
    if (accessToken !== null || hasUnsyncedItems || state.cartItems.length === 0) {
        // Run immediately if authenticated (token presence changed), or if there are unsynced items,
        // or if the cart just became empty (e.g., clear cart action).
        syncCartWithBackend();
    }


  }, [accessToken, state.cartItems, dispatch]); // Keep state.cartItems here, but the `if (JSON.stringify...` check is key.
                                                // The `isProcessingSync` ref also helps prevent rapid re-triggers.
                                                // useCallback for dispatch also prevents re-triggers if it's the only changing dependency.

  const value = {
    cartItems: state.cartItems,
    loading: state.loading,
    checkoutData: state.checkoutData,
    dispatchCart: dispatch,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// --- Custom Hook to Consume Cart Context ---

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === null) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};