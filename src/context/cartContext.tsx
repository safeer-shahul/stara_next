'use client';

import { createContext, useContext, useReducer, useEffect, useState } from 'react';
import apiService from '@/utils/api/apiService';
import { cartService } from '@/utils/api/cartService';

const CartContext = createContext<any>(null);

const initialState = {
  cartItems: [],
  loading: false,
  appliedCoupon: null,
  checkoutData: { items: [], offer_sets: [] },
};

const cartReducer = (state: any, action: any) => {
  switch (action.type) {
    case 'SET_CART_ITEMS':
      localStorage.setItem('cartItems', JSON.stringify(action.payload));
      return { ...state, cartItems: action.payload };
    case 'ADD_OFFER_SET':
      const newItems = [...state.cartItems, action.payload];
      localStorage.setItem('cartItems', JSON.stringify(newItems));
      return { ...state, cartItems: newItems };
    case 'REMOVE_ITEM':
      const filteredItems = state.cartItems.filter((item: any) => item.id !== action.payload);
      localStorage.setItem('cartItems', JSON.stringify(filteredItems));
      return { ...state, cartItems: filteredItems };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'APPLY_COUPON':
      return { ...state, appliedCoupon: action.payload };
    case 'SET_CHECKOUT_DATA':
      return { ...state, checkoutData: action.payload };
    default:
      return state;
  }
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Load initial cart and detect authentication status
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedCartItems = localStorage.getItem('cartItems');
      if (storedCartItems) {
        const parsedItems = JSON.parse(storedCartItems);
        // Only dispatch if different to avoid unnecessary updates
        if (JSON.stringify(parsedItems) !== JSON.stringify(state.cartItems)) {
          dispatch({ type: 'SET_CART_ITEMS', payload: parsedItems });
        }
      }
      // Update accessToken state
      const token = localStorage.getItem('accessToken');
      setAccessToken(token);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && accessToken) {
      const syncGuestCart = async () => {
        const unsyncedItems = state.cartItems.filter(
          (item: any) => item.type === 'offer' && !item.isSynced
        );
        if (unsyncedItems.length > 0) {
          dispatch({ type: 'SET_LOADING', payload: true });
          try {
            const updatedItems = await cartService.syncGuestCart(unsyncedItems);
            dispatch({ type: 'SET_CART_ITEMS', payload: updatedItems });
          } catch (error) {
            console.error('Error syncing guest cart:', error);
          } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
          }
        }
      };
      syncGuestCart();
    }
  }, [accessToken]);

  const value = {
    cartItems: state.cartItems,
    loading: state.loading,
    appliedCoupon: state.appliedCoupon,
    checkoutData: state.checkoutData,
    dispatchCart: dispatch,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);