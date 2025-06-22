'use client';
import { createContext, useContext, useReducer, useEffect, useState, useRef } from 'react';
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
  id: string; // FIX: id is now always a string (temporary UUID or backend ID)
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

// UPDATED: Changed main_product and offer_products_extra to a single offer_items array
export interface CartOfferItem {
  id: string; // FIX: id is now always a string (temporary UUID or backend ID)
  offer: string; // The UUID of the original offer
  offer_name: { id: string; offer_name: string; }; // Enriched offer details
  buy_count: number;
  get_count: number;
  isSynced: boolean;
  type: 'offer';
  offer_items: ProductItemDetails[]; // All products in the offer, with quantities combined for display
}

export type CartItemType = CartNormalItem | CartOfferItem;

// --- Reducer Action Types ---

export type CartAction =
  | { type: 'SET_CART_ITEMS'; payload: CartItemType[] }
  | { type: 'ADD_OFFER_SET'; payload: CartOfferItem }
  | { type: 'ADD_NORMAL_ITEM'; payload: CartNormalItem }
  // FIX: REMOVE_ITEM payload now identifies the item by its unique `id` (backend ID or temporary local ID)
  // This allows the reducer to filter correctly.
  | { type: 'REMOVE_ITEM'; payload: string } 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CHECKOUT_DATA'; payload: {
        items: Array<{ product_id: string; quantity: number }>;
        offer_sets: Array<{
          id: string;
          offer: string;
          // This type for offer_products is for the backend payload, not the internal CartOfferItem structure
          offer_products: Array<{ product: string; quantity: number }>;
          buy_count: number;
          get_count: number;
        }>;
    }
  };

// --- Cart State and Context Definitions ---

interface CartState {
  cartItems: CartItemType[];
  loading: boolean;
  checkoutData: {
    items: Array<{ product_id: string; quantity: number }>;
    offer_sets: Array<{
      id: string;
      offer: string;
      offer_products: Array<{ product: string; quantity: number }>;
      buy_count: number;
      get_count: number;
    }>;
  };
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
      {
        console.log('Reducer: SET_CART_ITEMS action received. Payload:', action.payload);
        const serializedPayload = JSON.stringify(action.payload);
        console.log('Reducer: SET_CART_ITEMS: Serializing to localStorage:', serializedPayload);
        // Only update localStorage if there's an actual change to prevent unnecessary writes
        if (JSON.stringify(state.cartItems) !== serializedPayload) {
          localStorage.setItem('cartItems', serializedPayload);
          console.log('Reducer: SET_CART_ITEMS: localStorage updated.');
        } else {
          console.log('Reducer: SET_CART_ITEMS: No change in cart items, localStorage not updated.');
        }
        return { ...state, cartItems: action.payload };
      }
    case 'ADD_OFFER_SET':
      {
        console.log('Reducer: ADD_OFFER_SET action received. New offer set:', action.payload);
        const newItems = [...state.cartItems, action.payload];
        const serializedNewItems = JSON.stringify(newItems);
        console.log('Reducer: ADD_OFFER_SET: Full cart after adding, serializing to localStorage:', serializedNewItems);
        localStorage.setItem('cartItems', serializedNewItems); // Still write to local storage immediately
        console.log('Reducer: ADD_OFFER_SET: localStorage updated.');
        return { ...state, cartItems: newItems };
      }
    case 'ADD_NORMAL_ITEM':
      {
        console.log('Reducer: ADD_NORMAL_ITEM action received. New normal item:', action.payload);
        // Check if item already exists to update quantity, otherwise add new
        const existingItemIndex = state.cartItems.findIndex(
          // Use product_id for finding existing normal items, not id as id might be temporary
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
          console.log('Reducer: ADD_NORMAL_ITEM: Updated existing item quantity.');
        } else {
          newItems = [...state.cartItems, action.payload];
          console.log('Reducer: ADD_NORMAL_ITEM: Added new normal item.');
        }
        const serializedNewItems = JSON.stringify(newItems);
        console.log('Reducer: ADD_NORMAL_ITEM: Full cart after adding, serializing to localStorage:', serializedNewItems);
        localStorage.setItem('cartItems', serializedNewItems);
        console.log('Reducer: ADD_NORMAL_ITEM: localStorage updated.');
        return { ...state, cartItems: newItems };
      }
    case 'REMOVE_ITEM':
      {
        console.log('Reducer: REMOVE_ITEM action received. Item ID to remove:', action.payload);
        // Ensure comparison handles removing by string ID correctly.
        // The payload is now guaranteed to be a string ID (temporary UUID or backend ID).
        const filteredItems = state.cartItems.filter((item) => item.id !== action.payload);
        const serializedFilteredItems = JSON.stringify(filteredItems);
        console.log('Reducer: REMOVE_ITEM: Full cart after removing, serializing to localStorage:', serializedFilteredItems);
        localStorage.setItem('cartItems', serializedFilteredItems);
        console.log('Reducer: REMOVE_ITEM: localStorage updated.');
        return { ...state, cartItems: filteredItems };
      }
    case 'SET_LOADING':
      console.log('Reducer: SET_LOADING action received. Loading status:', action.payload);
      return { ...state, loading: action.payload };
    case 'SET_CHECKOUT_DATA': 
      console.log('Reducer: SET_CHECKOUT_DATA action received. Checkout data:', action.payload);
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
  const prevAccessToken = useRef<string | null>(null); 

  const isInitialLoadComplete = useRef(false);
  const isProcessingSync = useRef(false); 

  // Effect 1: Load cart from localStorage on initial mount (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return; 

    console.log('CartProvider: Initial mount. Attempting to load cart from localStorage.');
    const storedCartItemsString = localStorage.getItem('cartItems'); 
    
    if (storedCartItemsString) { 
      try {
        console.log('CartProvider: Raw stored cart items from localStorage:', storedCartItemsString);
        const parsedItems: CartItemType[] = JSON.parse(storedCartItemsString);
        console.log('CartProvider: Parsed cart items from localStorage:', parsedItems);
        dispatch({ type: 'SET_CART_ITEMS', payload: parsedItems });
      } catch (e) {
        console.error("CartProvider: Failed to parse cart items from localStorage:", e);
        localStorage.removeItem('cartItems');
      }
    } else {
      console.log('CartProvider: No cart items found in localStorage.');
    }
    const currentAccessToken = localStorage.getItem('accessToken');
    setAccessToken(currentAccessToken);
    prevAccessToken.current = currentAccessToken; 
    isInitialLoadComplete.current = true; 
    console.log('CartProvider: Initial load complete.');
  }, []); 

  // Effect 2: Handle cart synchronization with backend
  useEffect(() => {
    if (typeof window === 'undefined') return; 
    if (!isInitialLoadComplete.current) return; 

    const currentAccessToken = localStorage.getItem('accessToken'); 
    const tokenChanged = currentAccessToken !== prevAccessToken.current;
    prevAccessToken.current = currentAccessToken; 

    const syncCartWithBackend = async () => {
      if (isProcessingSync.current) {
        console.log("CartProvider: Sync already in progress, skipping.");
        return;
      }
      isProcessingSync.current = true;
      dispatch({ type: 'SET_LOADING', payload: true });
      console.log('CartProvider: Initiating cart synchronization with backend...');

      try {
        let updatedCartFromBackend: CartItemType[];

        if (currentAccessToken) {
          // FIX: Step 1: Push all unsynced local items to the backend FIRST
          const unsyncedLocalItems = state.cartItems.filter(item => !item.isSynced);
          console.log("CartProvider: Unsynced local items found:", unsyncedLocalItems);

          if (unsyncedLocalItems.length > 0) {
            console.log("CartProvider: Syncing unsynced local items to backend...");
            await cartService.pushLocalCartToBackend(unsyncedLocalItems);
            console.log("CartProvider: Local unsynced items pushed. Now fetching backend's canonical cart.");
          } else if (tokenChanged) {
            console.log("CartProvider: Token changed, but no unsynced local items. Just fetching backend's canonical cart.");
          } else {
            console.log("CartProvider: Authenticated user, no unsynced items, token not changed. Fetching latest cart from backend.");
          }
          
          // FIX: Step 2: Always fetch the latest, canonical state from the backend after pushing/login.
          updatedCartFromBackend = await cartService.fetchCartFromBackend();
          console.log("CartProvider: Final canonical cart fetched after push/fetch process:", updatedCartFromBackend);

        } else {
          // Guest user: Just re-enrich local storage items with latest product details.
          // No backend writes for guests in this sync hook.
          console.log("CartProvider: Guest user, re-fetching local cart details (no backend sync initiated).");
          updatedCartFromBackend = await cartService.fetchCartFromBackend();
          console.log("CartProvider: FetchCartFromBackend for guest completed. Result:", updatedCartFromBackend);
        }

        if (JSON.stringify(state.cartItems) !== JSON.stringify(updatedCartFromBackend)) {
          console.log("CartProvider: Cart content changed after sync/fetch. Dispatching SET_CART_ITEMS.");
          dispatch({ type: 'SET_CART_ITEMS', payload: updatedCartFromBackend });
        } else {
            console.log("CartProvider: Cart state identical after sync/fetch, no dispatch of SET_CART_ITEMS.");
        }

      } catch (error) {
        console.error('CartProvider: Error during cart synchronization:', error);
        // If syncing fails for authenticated user, try to load from backend anyway
        // or clear the unsynced flag if we want to retry on next interaction
        if (currentAccessToken) {
          try {
            console.warn("CartProvider: Sync failed, attempting a direct fetch from backend as fallback.");
            const fallbackCart = await cartService.fetchCartFromBackend();
            dispatch({ type: 'SET_CART_ITEMS', payload: fallbackCart });
          } catch (fallbackError) {
            console.error("CartProvider: Fallback fetch also failed.", fallbackError);
            dispatch({ type: 'SET_CART_ITEMS', payload: [] }); // Clear cart on critical failure
          }
        }
      } finally {
        isProcessingSync.current = false;
        dispatch({ type: 'SET_LOADING', payload: false });
        console.log('CartProvider: Cart synchronization finished.');
      }
    };

    // Trigger conditions:
    // 1. Token *just* changed (login/logout transition)
    // 2. There are unsynced items (local add/remove by guest or authenticated user)
    // 3. Cart is empty (ensures initial fetch or re-fetch after clear/initial load if something's expected)
    // 4. Component just mounted (isInitialLoadComplete)
    const hasUnsyncedItems = state.cartItems.some(item => !item.isSynced);
    
    if (isInitialLoadComplete.current && (tokenChanged || hasUnsyncedItems || state.cartItems.length === 0)) {
        console.log(`CartProvider: Triggering sync. Token changed: ${tokenChanged}, HasUnsynced: ${hasUnsyncedItems}, CartLength: ${state.cartItems.length}`);
        syncCartWithBackend();
    } else {
      console.log('CartProvider: No sync needed based on current conditions.');
    }

  }, [accessToken, state.cartItems]); 


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
