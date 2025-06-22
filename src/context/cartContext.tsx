// context/cartContext.tsx
'use client';
import { createContext, useContext, useReducer, useEffect, useState, useRef, useCallback } from 'react';
import apiService from '@/utils/api/apiService';
import { cartService } from '@/utils/api/cartService';
import { v4 as uuidv4 } from 'uuid';

// --- Type Definitions ---

export interface ProductImage {
  id: string;
  product_image: string;
  product: string;
}

export interface ProductItemDetails {
  id: string; // Product UUID
  images: ProductImage[];
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
  id: string; // Temporary UUID or backend ID for this cart item entry
  product_id: string; // The UUID for the actual product
  quantity: number; // Quantity of this product in the cart
  type: 'normal';
  isSynced: boolean; // True if synced with backend, false if local-only
  // Enriched product details
  product_name: string;
  product_price: string;
  strike_price: string;
  images: ProductImage[];
  isInStock: boolean;
  stock_quantity: number; // Actual stock quantity from ProductItemDetails
}

export interface CartOfferItem {
  id: string; // Temporary UUID or backend ID for this offer set cart item
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
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_ITEM_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CHECKOUT_DATA'; payload: {
        items: Array<{ product_id: string; quantity: number }>;
        offer_sets: Array<{
          id: string;
          offer: string;
          offer_products: Array<{ product: string; quantity: number }>;
          buy_count: number;
          get_count: number;
        }>;
    }
  }
  | { type: 'TRIGGER_SYNC' }; // New action to explicitly signal a need for sync

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
        const newOfferSet: CartOfferItem = {
          ...action.payload,
          id: action.payload.id || uuidv4(),
          isSynced: false, // New local items are unsynced by default
        };
        const newItems = [...state.cartItems, newOfferSet];
        // For guest users, these actions MUST update localStorage immediately for persistence.
        if (!localStorage.getItem('accessToken')) {
            localStorage.setItem('cartItems', JSON.stringify(newItems));
        }
        return { ...state, cartItems: newItems };
      }
    case 'ADD_NORMAL_ITEM':
      {
        console.log('Reducer: ADD_NORMAL_ITEM action received. New normal item:', action.payload);
        const existingItemIndex = state.cartItems.findIndex(
          (item) => item.type === 'normal' && item.product_id === action.payload.product_id
        );

        let newItems;
        if (existingItemIndex > -1) {
          newItems = [...state.cartItems];
          const existingItem = newItems[existingItemIndex] as CartNormalItem;
          newItems[existingItemIndex] = {
            ...existingItem,
            quantity: existingItem.quantity + action.payload.quantity,
            isSynced: false, // Mark as unsynced if quantity changed locally
          };
          console.log('Reducer: ADD_NORMAL_ITEM: Updated existing item quantity.');
        } else {
          const newNormalItem: CartNormalItem = {
            ...action.payload,
            id: action.payload.id || uuidv4(),
            isSynced: false, // New local items are unsynced by default
          };
          newItems = [...state.cartItems, newNormalItem];
          console.log('Reducer: ADD_NORMAL_ITEM: Added new normal item with guaranteed ID.');
        }
        // For guest users, these actions MUST update localStorage immediately for persistence.
        if (!localStorage.getItem('accessToken')) {
            localStorage.setItem('cartItems', JSON.stringify(newItems));
        }
        return { ...state, cartItems: newItems };
      }
    case 'REMOVE_ITEM':
      {
        console.log('Reducer: REMOVE_ITEM action received. Item ID to remove:', action.payload);
        const filteredItems = state.cartItems.filter((item) => item.id !== action.payload);
        // For guest users, these actions MUST update localStorage immediately for persistence.
        if (!localStorage.getItem('accessToken')) {
            localStorage.setItem('cartItems', JSON.stringify(filteredItems));
        }
        return { ...state, cartItems: filteredItems };
      }
    case 'UPDATE_ITEM_QUANTITY':
      {
        console.log('Reducer: UPDATE_ITEM_QUANTITY action received. Payload:', action.payload);
        const updatedItems = state.cartItems.map(item => {
          if (item.type === 'normal' && item.id === action.payload.id) {
            return {
              ...item,
              quantity: action.payload.quantity,
              isSynced: false, // Mark as unsynced because it was changed locally
            };
          }
          return item;
        });
        // For guest users, these actions MUST update localStorage immediately for persistence.
        if (!localStorage.getItem('accessToken')) {
            localStorage.setItem('cartItems', JSON.stringify(updatedItems));
        }
        return { ...state, cartItems: updatedItems };
      }
    case 'SET_LOADING':
      console.log('Reducer: SET_LOADING action received. Loading status:', action.payload);
      return { ...state, loading: action.payload };
    case 'SET_CHECKOUT_DATA':
      console.log('Reducer: SET_CHECKOUT_DATA action received. Checkout data:', action.payload);
      return { ...state, checkoutData: action.payload };
    case 'TRIGGER_SYNC':
      console.log('Reducer: TRIGGER_SYNC action received. This will be handled by CartProvider useEffect.');
      return state;
    default:
      console.warn(`Unhandled action type: ${(action as { type: string }).type}`);
      return state;
  }
};

// --- Cart Provider Component ---

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  // We'll read accessToken directly in the useEffect and use a ref for previous value
  const prevAccessTokenRef = useRef<string | null>(null);

  const isInitialLoadComplete = useRef(false);
  const isProcessingSync = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [syncRequested, setSyncRequested] = useState(false);

  const customDispatch: React.Dispatch<CartAction> = useCallback((action) => {
    console.log(`Custom Dispatch: Processing action type: ${action.type}`);
    dispatch(action); // Apply the action immediately

    const currentTokenAtDispatch = localStorage.getItem('accessToken');

    if (
      (action.type === 'ADD_OFFER_SET' ||
        action.type === 'ADD_NORMAL_ITEM' ||
        action.type === 'REMOVE_ITEM' ||
        action.type === 'UPDATE_ITEM_QUANTITY' ||
        action.type === 'TRIGGER_SYNC') &&
      currentTokenAtDispatch // Only trigger backend sync if authenticated
    ) {
      console.log(`Custom Dispatch: Authenticated action (${action.type}) - Requesting sync.`);
      setSyncRequested(true);
    } else if (action.type === 'SET_CART_ITEMS' && !currentTokenAtDispatch) {
        // This is handled by the reducer's SET_CART_ITEMS which writes to localStorage for guests.
        // No explicit sync trigger needed here for guests.
    }
  }, []);

  // Effect 1: Initial load of cart from localStorage on component mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('CartProvider Init Effect: Running on mount.');
    const storedCartItemsString = localStorage.getItem('cartItems');

    if (storedCartItemsString) {
      try {
        const parsedItems: CartItemType[] = JSON.parse(storedCartItemsString);
        const itemsWithGuaranteedIds = parsedItems.map(item => ({ ...item, id: item.id || uuidv4() }));
        // Use direct dispatch for initial load to avoid immediate `setSyncRequested` trigger
        dispatch({ type: 'SET_CART_ITEMS', payload: itemsWithGuaranteedIds });
        console.log('CartProvider Init Effect: Loaded cart from localStorage.');
      } catch (e) {
        console.error("CartProvider Init Effect: Failed to parse cart items from localStorage:", e);
        localStorage.removeItem('cartItems');
      }
    } else {
      console.log('CartProvider Init Effect: No cart items in localStorage.');
    }

    // Set initial accessToken value in the ref for the first sync check
    prevAccessTokenRef.current = localStorage.getItem('accessToken');

    isInitialLoadComplete.current = true;
    console.log('CartProvider Init Effect: Initial load complete.');
  }, []); // Empty dependency array ensures this runs once on mount

  // Effect 2: Handle cart synchronization with backend/localStorage
  useEffect(() => {
    
    if (typeof window === 'undefined') return;
    if (!isInitialLoadComplete.current) {
        console.log("CartProvider Sync Effect: Initial load not complete, skipping sync.");
        return;
    }

    const currentAccessToken = localStorage.getItem('accessToken');
    const tokenChanged = currentAccessToken !== prevAccessTokenRef.current;
    // VERY IMPORTANT: Update the ref *after* evaluating tokenChanged for the current effect run
    // but *before* the next effect run (which will use the updated ref)
    prevAccessTokenRef.current = currentAccessToken;

    const syncCartWithBackend = async () => {
      if (isProcessingSync.current) {
        console.log("CartProvider: Sync already in progress, skipping new request.");
        return;
      }
      isProcessingSync.current = true;
      dispatch({ type: 'SET_LOADING', payload: true });
      console.log('CartProvider: Initiating cart synchronization with backend...');

      try {
        let updatedCartFromSource: CartItemType[];

        if (currentAccessToken) {
          // Authenticated user: Prioritize pushing unsynced items
          const unsyncedLocalItems = state.cartItems.filter(item => !item.isSynced);
          console.log(`CartProvider: Authenticated flow. ${unsyncedLocalItems.length} unsynced local items found.`);

          // PUSHING LOGIC: If there are unsynced items OR the token just changed (login scenario)
          // we need to push local state and then fetch the canonical backend state.
          if (unsyncedLocalItems.length > 0 || tokenChanged) {
            console.log("CartProvider: Syncing unsynced local items to backend OR token changed. Calling pushLocalCartToBackend.");
            updatedCartFromSource = await cartService.pushLocalCartToBackend(unsyncedLocalItems);
            console.log("CartProvider: pushLocalCartToBackend completed. Got backend's canonical cart.");
          } else {
            // Authenticated user, no unsynced items, token didn't change: just fetch current backend state
            console.log("CartProvider: Authenticated user, no unsynced local items, token not changed. Fetching latest cart from backend directly.");
            updatedCartFromSource = await cartService.fetchCartFromBackend();
            console.log("CartProvider: Canonical cart fetched directly from backend.");
          }
        } else {
          // Guest user: Re-enrich data from local storage (localStorage is the source of truth for guests)
          console.log("CartProvider: Guest user flow. Re-fetching local cart details from localStorage (source of truth).");
          updatedCartFromSource = await cartService.fetchCartFromBackend(); // This fetches from localStorage
          console.log("CartProvider: FetchCartFromBackend for guest completed. Result:", updatedCartFromSource);
        }

        // Only update state if the new cart items are different to prevent unnecessary renders
        if (JSON.stringify(state.cartItems) !== JSON.stringify(updatedCartFromSource)) {
          console.log("CartProvider: Cart content changed after sync/fetch. Dispatching SET_CART_ITEMS.");
          dispatch({ type: 'SET_CART_ITEMS', payload: updatedCartFromSource });
        } else {
            console.log("CartProvider: Cart state identical after sync/fetch, no dispatch of SET_CART_ITEMS.");
        }

      } catch (error) {
        console.error('CartProvider: Error during cart synchronization:', error);
        if (currentAccessToken) {
          console.warn("CartProvider: Sync failed for authenticated user. Attempting fallback fetch from backend.");
          try {
            const fallbackCart = await cartService.fetchCartFromBackend();
            dispatch({ type: 'SET_CART_ITEMS', payload: fallbackCart });
          } catch (fallbackError) {
            console.error("CartProvider: Fallback fetch also failed.", fallbackError);
            dispatch({ type: 'SET_CART_ITEMS', payload: [] });
          }
        } else {
            console.warn("CartProvider: Sync failed for guest user. Local state might be inconsistent with localStorage. Clear localStorage if bad data.");
        }
      } finally {
        isProcessingSync.current = false;
        setSyncRequested(false); // Reset the sync request flag
        dispatch({ type: 'SET_LOADING', payload: false });
        console.log('CartProvider: Cart synchronization finished.');
      }
    };

    // Clear any existing timeout to debounce
    if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
    }

    // Determine if a sync is needed based on conditions
    const shouldTriggerSync = syncRequested || tokenChanged ||
                              (currentAccessToken && state.cartItems.length === 0) || // Auth user, empty cart (initial or cleared)
                              (!currentAccessToken && JSON.stringify(state.cartItems) !== localStorage.getItem('cartItems')); // Guest, in-memory state differs from localStorage


    console.log(`CartProvider Debug: Sync Conditions for scheduling:
      syncRequested: ${syncRequested}
      tokenChanged: ${tokenChanged} (from ${prevAccessTokenRef.current} to ${currentAccessToken})
      auth && emptyCart: ${currentAccessToken && state.cartItems.length === 0}
      guest && localStateMismatch: ${!currentAccessToken && JSON.stringify(state.cartItems) !== localStorage.getItem('cartItems')}
      -> SHOULD TRIGGER SYNC: ${shouldTriggerSync}
    `);


    if (shouldTriggerSync) {
        console.log(`CartProvider: Scheduling sync. Triggering factors: syncRequested=${syncRequested}, tokenChanged=${tokenChanged}, isAuthenticatedAndEmpty=${currentAccessToken && state.cartItems.length === 0}, guestLocalStateMismatch=${!currentAccessToken && JSON.stringify(state.cartItems) !== localStorage.getItem('cartItems')}`);
        syncTimeoutRef.current = setTimeout(syncCartWithBackend, 300); // Debounce by 300ms
    } else {
      console.log('CartProvider: No sync needed based on current conditions.');
    }

    // Cleanup: clear timeout if component unmounts or dependencies change
    return () => {
        if (syncTimeoutRef.current) {
            clearTimeout(syncTimeoutRef.current);
        }
    };

  }, [state.cartItems, syncRequested]); // Dependencies: state.cartItems and syncRequested. accessToken is read inside.

  const value = {
    cartItems: state.cartItems,
    loading: state.loading,
    checkoutData: state.checkoutData,
    dispatchCart: customDispatch, // Use the custom dispatch
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