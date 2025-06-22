// context/cartContext.tsx
'use client';
import { createContext, useContext, useReducer, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import apiService from '@/utils/api/apiService'; // Make sure this path is correct
import { cartService } from '@/utils/api/cartService'; // Make sure this path is correct
import { v4 as uuidv4, validate } from 'uuid'; // Ensure validate is imported if used (it is in cartService, so good to have)

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
  | { type: 'REMOVE_ITEM'; payload: string } // Payload is the cart item's unique ID
  | { type: 'UPDATE_ITEM_QUANTITY'; payload: { id: string; quantity: number } } // Quantity is the NEW total quantity for that item
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
  | { type: 'TRIGGER_SYNC' }; // Action to explicitly signal a need for sync

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
            console.log('Reducer: REMOVE_ITEM: localStorage updated for guest user.');
        } else {
            // For authenticated users, local state updates immediately.
            // Backend sync will reconcile localStorage later.
            console.log('Reducer: REMOVE_ITEM: Optimistically removed item locally for authenticated user.');
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
              quantity: action.payload.quantity, // This directly sets the quantity to the payload's quantity
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
  const prevAccessTokenRef = useRef<string | null>(null);

  const isInitialLoadComplete = useRef(false);
  const isProcessingSync = useRef(false); // To prevent multiple concurrent syncs
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null); // For debouncing sync requests

  const [syncRequested, setSyncRequested] = useState(false); // Flag to explicitly request a sync

  // customDispatch is now async to handle direct backend calls for authenticated users
  const customDispatch: React.Dispatch<CartAction> = useCallback(async (action) => {
    console.log(`Custom Dispatch: Processing action type: ${action.type}`);

    const currentTokenAtDispatch = localStorage.getItem('accessToken');

    if (currentTokenAtDispatch) {
        // Authenticated user: Perform immediate backend call for specific actions
        // (add, update quantity, remove) then trigger a general sync to reconcile.
        try {
            if (action.type === 'REMOVE_ITEM') {
                console.log(`Custom Dispatch: Authenticated REMOVE_ITEM - Sending backend delete for cart item ID: ${action.payload}`);
                // Assuming cartService.addToCart can handle item_id for deletion
                await cartService.addToCart({
                    item_id: action.payload.replace(/-/g, ''), // Send cart item ID for deletion
                    mode: 'delete'
                });
                console.log(`Custom Dispatch: Backend removal sent for ${action.payload}.`);
            } else if (action.type === 'UPDATE_ITEM_QUANTITY') {
                // Find the current quantity in the state *before* the reducer updates it.
                // This is crucial to calculate the 'change' for '+' or '-' modes.
                const itemToUpdate = state.cartItems.find(item => item.id === action.payload.id) as CartNormalItem;
                if (itemToUpdate) {
                    const currentQuantity = itemToUpdate.quantity;
                    const newQuantity = action.payload.quantity;
                    const quantityChange = newQuantity - currentQuantity;

                    // Send individual '+' or '-' calls for each unit change
                    if (quantityChange > 0) {
                        for (let i = 0; i < quantityChange; i++) {
                            console.log(`Custom Dispatch: Sending backend increment for product ID: ${itemToUpdate.product_id}`);
                            await cartService.addToCart({ product_id: itemToUpdate.product_id.replace(/-/g, ''), mode: '+' });
                        }
                    } else if (quantityChange < 0) {
                        for (let i = 0; i < Math.abs(quantityChange); i++) {
                            console.log(`Custom Dispatch: Sending backend decrement for product ID: ${itemToUpdate.product_id}`);
                            await cartService.addToCart({ product_id: itemToUpdate.product_id.replace(/-/g, ''), mode: '-' });
                        }
                    }
                    console.log(`Custom Dispatch: Backend quantity update sent for ${itemToUpdate.product_id}.`);
                } else {
                    console.warn(`Custom Dispatch: UPDATE_ITEM_QUANTITY: Item ${action.payload.id} not found in state.`);
                }
            } else if (action.type === 'ADD_NORMAL_ITEM') {
                // When ADD_NORMAL_ITEM is dispatched from an interaction,
                // it usually means a single unit is being added (or the payload explicitly states quantity).
                // For simplicity, assuming a single unit add if it's the `ADD_NORMAL_ITEM` action.
                // If your ADD_NORMAL_ITEM can add multiple units at once from elsewhere,
                // you'd need a loop similar to UPDATE_ITEM_QUANTITY.
                const productToAdd = action.payload.product_id;
                console.log(`Custom Dispatch: Sending backend add for product ID: ${productToAdd}`);
                await cartService.addToCart({ product_id: productToAdd.replace(/-/g, ''), mode: '+' });
                console.log(`Custom Dispatch: Backend add sent for ${productToAdd}.`);
            } else if (action.type === 'ADD_OFFER_SET') {
                // Assuming ADD_OFFER_SET also directly adds to backend here
                const offerItem = action.payload as CartOfferItem;
                const productIdsForBackend: string[] = [];
                // Collect all product IDs within the offer set for the backend payload
                offerItem.offer_items.forEach(p => {
                    for (let q = 0; q < p.quantity; q++) {
                        productIdsForBackend.push(p.id.replace(/-/g, ''));
                    }
                });
                console.log(`Custom Dispatch: Sending backend add offer for offer ID: ${offerItem.offer}`);
                // Assuming apiService.addToCartOffer is the dedicated API for offers
                await apiService.addToCartOffer({
                    offer_id: offerItem.offer.replace(/-/g, ''),
                    product_ids: productIdsForBackend,
                });
                console.log(`Custom Dispatch: Backend add offer sent for ${offerItem.offer}.`);
            }
        } catch (error) {
            console.error(`Custom Dispatch: Error during direct backend operation for ${action.type}:`, error);
            // In case of backend error for a direct operation (add/remove/update),
            // a full sync is still beneficial for reconciliation.
        }
    }

    // Always dispatch the action to update local state immediately (optimistic UI)
    dispatch(action);

    // Trigger a general sync to reconcile state after any direct backend call
    // or if the action itself is a general sync trigger (like login/logout, or explicit TRIGGER_SYNC)
    if (currentTokenAtDispatch || action.type === 'TRIGGER_SYNC' ||
        action.type === 'ADD_NORMAL_ITEM' || action.type === 'ADD_OFFER_SET' ||
        action.type === 'UPDATE_ITEM_QUANTITY' || action.type === 'REMOVE_ITEM') {
      console.log(`Custom Dispatch: Authenticated or major action (${action.type}) - Requesting general sync.`);
      setSyncRequested(true); // Signal the useEffect to perform a full fetch
    }
  }, [state.cartItems]); // state.cartItems is a dependency because we read its current value for UPDATE_ITEM_QUANTITY

  // Effect 1: Initial load of cart from localStorage on component mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('CartProvider Init Effect: Running on mount.');
    const storedCartItemsString = localStorage.getItem('cartItems');

    if (storedCartItemsString) {
      try {
        const parsedItems: CartItemType[] = JSON.parse(storedCartItemsString);
        // Ensure all loaded items have a valid ID (for newly added local items before backend sync)
        const itemsWithGuaranteedIds = parsedItems.map(item => ({ ...item, id: item.id || uuidv4() }));
        // Use direct dispatch for initial load to avoid immediate `setSyncRequested` trigger
        dispatch({ type: 'SET_CART_ITEMS', payload: itemsWithGuaranteedIds });
        console.log('CartProvider Init Effect: Loaded cart from localStorage.');
      } catch (e) {
        console.error("CartProvider Init Effect: Failed to parse cart items from localStorage:", e);
        localStorage.removeItem('cartItems'); // Clear corrupted data
      }
    } else {
      console.log('CartProvider Init Effect: No cart items in localStorage.');
    }

    // Set initial accessToken value in the ref for the first sync check
    prevAccessTokenRef.current = localStorage.getItem('accessToken');

    isInitialLoadComplete.current = true; // Mark initial load as complete
    console.log('CartProvider Init Effect: Initial load complete.');
  }, []); // Empty dependency array ensures this runs once on mount

  // Effect 2: Handle cart synchronization with backend/localStorage
  // This effect runs when `state.cartItems` (local changes), `syncRequested` (explicit request),
  // or `prevAccessTokenRef.current` (login/logout) changes.
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
      dispatch({ type: 'SET_LOADING', payload: true }); // Indicate loading during sync
      console.log('CartProvider: Initiating cart synchronization with backend...');

      try {
        let updatedCartFromSource: CartItemType[];

        if (currentAccessToken) {
            // For authenticated users, we *always* fetch the canonical state from the backend
            // after any potential direct operations or upon sync request/token change.
            console.log("CartProvider: Authenticated user. Fetching latest cart from backend directly for reconciliation.");
            updatedCartFromSource = await cartService.fetchCartFromBackend();
            console.log("CartProvider: Canonical cart fetched directly from backend.");
        } else {
          // Guest user: LocalStorage is the source of truth, so we re-enrich what's there.
          console.log("CartProvider: Guest user flow. Re-fetching local cart details from localStorage (source of truth).");
          updatedCartFromSource = await cartService.fetchCartFromBackend(); // This fetches & enriches from localStorage
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
          // On backend sync failure for authenticated users, try to reload from backend again
          // or gracefully handle (e.g., keep current state and show error).
          try {
            const fallbackCart = await cartService.fetchCartFromBackend();
            dispatch({ type: 'SET_CART_ITEMS', payload: fallbackCart });
          } catch (fallbackError) {
            console.error("CartProvider: Fallback fetch also failed.", fallbackError);
            dispatch({ type: 'SET_CART_ITEMS', payload: [] }); // Clear cart if even fallback fails
          }
        } else {
            // For guest users, if sync (enrichment from localStorage) fails, there's likely bad data.
            console.warn("CartProvider: Sync failed for guest user. Local state might be inconsistent with localStorage. Consider clearing localStorage if bad data.");
        }
      } finally {
        isProcessingSync.current = false; // Release lock
        setSyncRequested(false); // Reset the sync request flag
        dispatch({ type: 'SET_LOADING', payload: false }); // End loading
        console.log('CartProvider: Cart synchronization finished.');
      }
    };

    // Clear any existing timeout to debounce
    if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
    }

    // Determine if a sync is needed based on conditions
    // `syncRequested` is set by `customDispatch` after any relevant action.
    // `tokenChanged` handles login/logout scenarios.
    // `currentAccessToken && state.cartItems.length === 0` handles initial load for authenticated empty cart,
    // or when user logs in with an empty cart.
    // `!currentAccessToken && JSON.stringify(state.cartItems) !== localStorage.getItem('cartItems')`
    // handles guest users where in-memory state might differ from persisted localStorage (e.g., a direct localStorage manipulation, though less common).
    const shouldTriggerSync = syncRequested || tokenChanged ||
                                (currentAccessToken && state.cartItems.length === 0 && isInitialLoadComplete.current) ||
                                (!currentAccessToken && JSON.stringify(state.cartItems) !== localStorage.getItem('cartItems'));


    console.log(`CartProvider Debug: Sync Conditions for scheduling:
      syncRequested: ${syncRequested}
      tokenChanged: ${tokenChanged} (from ${prevAccessTokenRef.current} to ${currentAccessToken})
      auth && emptyCart: ${currentAccessToken && state.cartItems.length === 0} (and initial load complete: ${isInitialLoadComplete.current})
      guest && localStateMismatch: ${!currentAccessToken && JSON.stringify(state.cartItems) !== localStorage.getItem('cartItems')}
      -> SHOULD TRIGGER SYNC: ${shouldTriggerSync}
    `);


    if (shouldTriggerSync) {
        console.log(`CartProvider: Scheduling sync. Triggering factors: syncRequested=${syncRequested}, tokenChanged=${tokenChanged}, isAuthenticatedAndEmpty=${currentAccessToken && state.cartItems.length === 0}, guestLocalStateMismatch=${!currentAccessToken && JSON.stringify(state.cartItems) !== localStorage.getItem('cartItems')}`);
        // Debounce the sync call to group multiple rapid updates
        syncTimeoutRef.current = setTimeout(syncCartWithBackend, 300);
    } else {
      console.log('CartProvider: No sync needed based on current conditions.');
    }

    // Cleanup: clear timeout if component unmounts or dependencies change
    return () => {
        if (syncTimeoutRef.current) {
            clearTimeout(syncTimeoutRef.current);
        }
    };

  }, [state.cartItems, syncRequested]); // Dependencies: state.cartItems (for changes to reconcile) and syncRequested (for explicit syncs)

  // Memoize the context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(() => ({
    cartItems: state.cartItems,
    loading: state.loading,
    checkoutData: state.checkoutData,
    dispatchCart: customDispatch, // Provide the custom dispatch
  }), [state.cartItems, state.loading, state.checkoutData, customDispatch]);

  return <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>;
};

// --- Custom Hook to Consume Cart Context ---

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === null) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};