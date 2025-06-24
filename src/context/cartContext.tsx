'use client';
import { createContext, useContext, useReducer, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import apiService from '@/utils/api/apiService';
import { cartService } from '@/utils/api/cartService';
import { v4 as uuidv4, validate } from 'uuid';

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
  getTotalProductQuantitiesInCart: () => Map<string, number>;
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
          isSynced: false,
        };
        const newItems = [...state.cartItems, newOfferSet];
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
            isSynced: false,
          };
          console.log('Reducer: ADD_NORMAL_ITEM: Updated existing item quantity.');
        } else {
          const newNormalItem: CartNormalItem = {
            ...action.payload,
            id: action.payload.id || uuidv4(),
            isSynced: false,
          };
          newItems = [...state.cartItems, newNormalItem];
          console.log('Reducer: ADD_NORMAL_ITEM: Added new normal item with guaranteed ID.');
        }
        if (!localStorage.getItem('accessToken')) {
            localStorage.setItem('cartItems', JSON.stringify(newItems));
        }
        return { ...state, cartItems: newItems };
      }
    case 'REMOVE_ITEM':
      {
        console.log('Reducer: REMOVE_ITEM action received. Item ID to remove:', action.payload);
        const filteredItems = state.cartItems.filter((item) => item.id !== action.payload);
        // if (!localStorage.getItem('accessToken')) {
            localStorage.setItem('cartItems', JSON.stringify(filteredItems));
            console.log('Reducer: REMOVE_ITEM: localStorage updated for guest user.');
        // } else {
            // console.log('Reducer: REMOVE_ITEM: Optimistically removed item locally for authenticated user.');
        // }
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
              isSynced: false,
            };
          }
          return item;
        });
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
  const isProcessingSync = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [syncRequested, setSyncRequested] = useState(false);
  const [guestCartMergePending, setGuestCartMergePending] = useState(false); // State to manage guest cart merge

  const getTotalProductQuantitiesInCart = useCallback(() => {
    const quantities = new Map<string, number>(); // Map<productId (cleaned UUID), total_quantity_in_cart>

    state.cartItems.forEach(cartItem => {
      if (cartItem.type === 'normal') {
        const productId = cartItem.product_id.replace(/-/g, '');
        quantities.set(productId, (quantities.get(productId) || 0) + cartItem.quantity);
      } else if (cartItem.type === 'offer') {
        // For offer items, sum up quantities of all products within the offer_items array
        cartItem.offer_items.forEach(offerProduct => {
          const productId = offerProduct.id.replace(/-/g, ''); // offerProduct.id is the actual product UUID
          quantities.set(productId, (quantities.get(productId) || 0) + (offerProduct.quantity || 1));
        });
      }
    });
    return quantities;
  }, [state.cartItems]);


  const customDispatch: React.Dispatch<CartAction> = useCallback(async (action) => {
    console.log(`Custom Dispatch: Processing action type: ${action.type}`);

    const currentTokenAtDispatch = localStorage.getItem('accessToken');

    if (currentTokenAtDispatch) {
        try {
            if (action.type === 'REMOVE_ITEM') {
                console.log(`Custom Dispatch: Authenticated REMOVE_ITEM - Sending backend delete for cart item ID: ${action.payload}`);
                // Backend still needs item_id for deletion
                await cartService.addToCart({
                    item_id: action.payload.replace(/-/g, ''),
                    mode: 'delete'
                });
                console.log(`Custom Dispatch: Backend removal sent for ${action.payload}.`);
            } else if (action.type === 'UPDATE_ITEM_QUANTITY') {
                const itemToUpdate = state.cartItems.find(item => item.id === action.payload.id) as CartNormalItem;
                if (itemToUpdate) {
                    const currentQuantity = itemToUpdate.quantity;
                    const newQuantity = action.payload.quantity;
                    const quantityChange = newQuantity - currentQuantity;

                    if (quantityChange > 0) {
                        // Backend only needs product_id for increment, it handles which item
                        // No item_id is sent here based on your backend clarification.
                        await cartService.addToCart({
                            product_id: itemToUpdate.product_id.replace(/-/g, ''),
                            mode: '+'
                        });
                    } else if (quantityChange < 0) {
                        // Backend only needs product_id for decrement, it handles which item
                        // No item_id is sent here based on your backend clarification.
                        await cartService.addToCart({
                            product_id: itemToUpdate.product_id.replace(/-/g, ''),
                            mode: '-'
                        });
                    }
                    console.log(`Custom Dispatch: Backend quantity update sent for ${itemToUpdate.product_id}.`);
                } else {
                    console.warn(`Custom Dispatch: UPDATE_ITEM_QUANTITY: Item ${action.payload.id} not found in state.`);
                }
            } else if (action.type === 'ADD_NORMAL_ITEM') {
                const productToAdd = action.payload.product_id;
                console.log(`Custom Dispatch: Sending backend add for product ID: ${productToAdd}`);
                await cartService.addToCart({ product_id: productToAdd.replace(/-/g, ''), mode: '+' });
                console.log(`Custom Dispatch: Backend add sent for ${productToAdd}.`);
            } else if (action.type === 'ADD_OFFER_SET') {
                const offerItem = action.payload as CartOfferItem;
                const productIdsForBackend: string[] = [];
                offerItem.offer_items.forEach(p => { for (let q = 0; q < p.quantity; q++) { productIdsForBackend.push(p.id.replace(/-/g, '')); } });
                console.log(`Custom Dispatch: Sending backend add offer for offer ID: ${offerItem.offer}`);
                await apiService.addToCartOffer({
                    offer_id: offerItem.offer.replace(/-/g, ''),
                    product_ids: productIdsForBackend,
                });
                console.log(`Custom Dispatch: Backend add offer sent for ${offerItem.offer}.`);
            }
        } catch (error) {
            console.error(`Custom Dispatch: Error during direct backend operation for ${action.type}:`, error);
        }
    }

    dispatch(action);

    if (currentTokenAtDispatch || action.type === 'TRIGGER_SYNC' ||
        action.type === 'ADD_NORMAL_ITEM' || action.type === 'ADD_OFFER_SET' ||
        action.type === 'UPDATE_ITEM_QUANTITY' || action.type === 'REMOVE_ITEM') {
      console.log(`Custom Dispatch: Authenticated or major action (${action.type}) - Requesting general sync.`);
      setSyncRequested(true);
    }
  }, [state.cartItems]);


  // Initial Load Effect (runs once on mount)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('CartProvider Init Effect: Running on mount.');
    const storedCartItemsString = localStorage.getItem('cartItems');
    const currentAccessToken = localStorage.getItem('accessToken');

    if (storedCartItemsString) {
      try {
        const parsedItems: CartItemType[] = JSON.parse(storedCartItemsString);
        // Ensure every item has a unique client-side ID. Backend-assigned IDs should replace these upon sync.
        const itemsWithGuaranteedIds = parsedItems.map(item => ({ ...item, id: item.id || uuidv4() }));
        dispatch({ type: 'SET_CART_ITEMS', payload: itemsWithGuaranteedIds });
        console.log('CartProvider Init Effect: Loaded cart from localStorage.');

        // On initial load, if already authenticated AND local cart has items, trigger merge
        if (currentAccessToken && itemsWithGuaranteedIds.length > 0) {
          setGuestCartMergePending(true); // Flag for merge
          console.log('CartProvider Init Effect: Authenticated on initial load with local cart, setting guestCartMergePending to true.');
        }

      } catch (e) {
        console.error("CartProvider Init Effect: Failed to parse cart items from localStorage:", e);
        localStorage.removeItem('cartItems'); // Clear corrupted local storage
      }
    } else {
      console.log('CartProvider Init Effect: No cart items in localStorage.');
    }

    // Set initial prevAccessTokenRef here only.
    prevAccessTokenRef.current = currentAccessToken;
    isInitialLoadComplete.current = true;
    console.log('CartProvider Init Effect: Initial load complete.');
  }, []); // Empty dependency array means it runs once on mount


  // NEW EFFECT: To explicitly trigger guestCartMergePending on token change (login/register)
  useEffect(() => {
    if (!isInitialLoadComplete.current) return; // Only run after initial cart load
    
    const currentAccessToken = localStorage.getItem('accessToken');
    const hasLocalCartItems = state.cartItems.length > 0;
    
    // Check if token status changed from guest to authenticated
    const wasGuest = !prevAccessTokenRef.current; // Was previously null or empty
    const isNowAuthenticated = !!currentAccessToken; // Is now a non-null token

    if (wasGuest && isNowAuthenticated && hasLocalCartItems) {
      console.log("CartProvider: Detected transition from guest to authenticated with existing local cart. Setting guestCartMergePending to true.");
      setGuestCartMergePending(true);
    }
    
    // Update prevAccessTokenRef.current for the next evaluation
    // This is crucial for correctly detecting token changes on subsequent runs.
    prevAccessTokenRef.current = currentAccessToken;

  }, [localStorage.getItem('accessToken'), state.cartItems.length, isInitialLoadComplete.current]); // Watch relevant values for this specific trigger


  // Effect for handling guest cart merge after login/register
  // This useEffect relies on `guestCartMergePending` changing to true.
  useEffect(() => {
    if (typeof window === 'undefined' || !isInitialLoadComplete.current || !localStorage.getItem('accessToken') || !guestCartMergePending) {
      return;
    }

    const mergeLocalCartWithBackend = async () => {
      console.log("CartProvider: Executing guest cart merge process.");
      setGuestCartMergePending(false); // Reset flag immediately to prevent re-triggering
      dispatch({ type: 'SET_LOADING', payload: true });

      try {
        const localUnsyncedItems = state.cartItems.filter(item => !item.isSynced);
        
        if (localUnsyncedItems.length > 0) {
          console.log("CartProvider: Attempting to push local unsynced items to backend for merge:", localUnsyncedItems);
          // This will re-send all unsynced items (normal and offers) to backend.
          // Backend should handle idempotency: adding existing item increments, not duplicates.
          await cartService.pushLocalCartToBackend(localUnsyncedItems);
          console.log("CartProvider: Successfully pushed local items to backend.");
        } else {
          console.log("CartProvider: No unsynced local items to push for merge.");
        }

        const canonicalCart = await cartService.fetchCartFromBackend();
        dispatch({ type: 'SET_CART_ITEMS', payload: canonicalCart });
        console.log("CartProvider: Guest cart merged and canonical state fetched.");

      } catch (error) {
        console.error("CartProvider: Error during guest cart merge:", error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    mergeLocalCartWithBackend();
  }, [guestCartMergePending, isInitialLoadComplete.current, state.cartItems, dispatch]);

  // Main Sync Effect (runs on state changes, token changes, sync requests)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isInitialLoadComplete.current) {
        console.log("CartProvider Sync Effect: Initial load not complete, skipping sync logic.");
        return;
    }

    const currentAccessToken = localStorage.getItem('accessToken');
    // `tokenChanged` is now primarily detected by the separate useEffect that updates `guestCartMergePending`.
    // We still need to capture the current `prevAccessTokenRef.current` state for `shouldTriggerSync` conditions.
    const tokenChangedDuringThisRenderCycle = currentAccessToken !== prevAccessTokenRef.current;


    const syncCartWithBackend = async () => {
      if (isProcessingSync.current) {
        console.log("CartProvider: Sync already in progress, skipping new request.");
        return;
      }
      isProcessingSync.current = true;
      dispatch({ type: 'SET_LOADING', payload: true });
      console.log('CartProvider: Initiating cart synchronization with backend...');

      try {
        const updatedCartFromSource = await cartService.fetchCartFromBackend();
        console.log("CartProvider: Canonical cart fetched (from backend or enriched localStorage).");

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
            console.warn("CartProvider: Sync failed for guest user. Local state might be inconsistent with localStorage.");
        }
      } finally {
        isProcessingSync.current = false;
        setSyncRequested(false);
        dispatch({ type: 'SET_LOADING', payload: false });
        console.log('CartProvider: Cart synchronization finished.');
      }
    };

    if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
    }

    const shouldTriggerSync = syncRequested ||
                               (currentAccessToken && state.cartItems.length === 0 && !guestCartMergePending) ||
                               (!currentAccessToken && JSON.stringify(state.cartItems) !== localStorage.getItem('cartItems'));


    console.log(`CartProvider Debug: Sync Conditions for scheduling:
      syncRequested: ${syncRequested}
      tokenChanged (for debug, based on immediate ref, dedicated effect handles the primary trigger): ${tokenChangedDuringThisRenderCycle}
      auth && emptyCart && !mergePending: ${currentAccessToken && state.cartItems.length === 0 && !guestCartMergePending}
      guest && localStateMismatch: ${!currentAccessToken && JSON.stringify(state.cartItems) !== localStorage.getItem('cartItems')}
      -> SHOULD TRIGGER SYNC: ${shouldTriggerSync}
    `);


    if (shouldTriggerSync) {
        console.log(`CartProvider: Scheduling sync due to triggering factors.`);
        syncTimeoutRef.current = setTimeout(syncCartWithBackend, 300);
    } else {
      console.log('CartProvider: No sync needed based on current conditions.');
    }

    return () => {
        if (syncTimeoutRef.current) {
            clearTimeout(syncTimeoutRef.current);
        }
    };

  }, [state.cartItems, syncRequested, guestCartMergePending, localStorage.getItem('accessToken')]); // Keeping localStorage.getItem here as a dependency to ensure reactivity to token changes, even if handled by separate effect.


  const contextValue = useMemo(() => ({
    cartItems: state.cartItems,
    loading: state.loading,
    checkoutData: state.checkoutData,
    dispatchCart: customDispatch,
    getTotalProductQuantitiesInCart: getTotalProductQuantitiesInCart,
  }), [state.cartItems, state.loading, state.checkoutData, customDispatch, getTotalProductQuantitiesInCart]);

  return <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === null) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};