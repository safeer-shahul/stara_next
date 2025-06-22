// components/CartDrawer.tsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { X, ShoppingCart } from 'lucide-react';
import CartItem from './CartItem';
import OfferCartItem from './OfferCartItem';
import CheckoutModal from './CheckoutModal';
import { useCart, CartItemType, CartNormalItem, CartOfferItem, ProductItemDetails } from '@/context/cartContext';
import { cartService } from '@/utils/api/cartService';
import apiService from '@/utils/api/apiService'; // Keep apiService for clearCart (if it's a specific endpoint)
import { cartUtils } from '@/utils/cartUtils';
import { v4 as uuidv4 } from 'uuid';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { cartItems, dispatchCart, loading: contextLoading } = useCart();
  const [localLoading, setLocalLoading] = useState<boolean>(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);

  // This function is for explicitly forcing a refresh of the cart state
  // from the backend/local storage. It's called after actions that *definitely*
  // need to reflect the server's current state (e.g., successful backend mutation
  // that was NOT initiated by the CartProvider's sync cycle, like checkout).
  const getAndSetCartItems = useCallback(async () => {
    setLocalLoading(true);
    try {
      const items = await cartService.fetchCartFromBackend();
      dispatchCart({ type: 'SET_CART_ITEMS', payload: items });
    } catch (error) {
      console.error('CartDrawer: Error fetching/enriching cart:', error);
    } finally {
      setLocalLoading(false);
    }
  }, [dispatchCart]);

  // Effect for controlling body overflow when drawer is open/closed
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleRemoveItem = async (id: string): Promise<void> => {
    const itemToRemove = cartItems.find(item => item.id === id);

    if (!itemToRemove) {
      console.warn(`CartDrawer: Attempted to remove item with ID: ${id}, but it was not found in current cart state.`);
      return;
    }

    try {
      // Optimistically remove from UI
      dispatchCart({ type: 'REMOVE_ITEM', payload: id });

      // Trigger sync in CartProvider for authenticated users.
      // The CartProvider will detect the REMOVE_ITEM (isSynced: false implicitly for local removals)
      // and handle the backend call.
      if (localStorage.getItem('accessToken')) {
        console.log(`CartDrawer: Item removed locally. Triggering sync for authenticated user.`);
        dispatchCart({ type: 'TRIGGER_SYNC' });
      } else {
        console.log(`CartDrawer: Item removed locally for guest user.`);
        // For guest users, the reducer already updated localStorage.
      }

    } catch (error) {
      console.error(`CartDrawer: Error handling local remove dispatch for item (ID: ${id}):`, error);
    }
  };

  const handleQuantityChange = async (id: string, change: number): Promise<void> => {
    console.log('CartDrawer: handleQuantityChange called for item ID:', id);
    const itemToUpdate = cartItems.find(item => item.id === id);

    if (!itemToUpdate || itemToUpdate.type !== 'normal') {
      console.warn(`CartDrawer: Attempted to change quantity of non-normal item or item not found with ID: ${id}`);
      return;
    }

    const newQuantity = itemToUpdate.quantity + change;

    if (newQuantity <= 0) {
      await handleRemoveItem(id); // Remove if quantity goes to zero or less
      return;
    }

    if (newQuantity > itemToUpdate.stock_quantity) {
      console.warn(`CartDrawer: Cannot increase quantity for item ${id} beyond available stock (${itemToUpdate.stock_quantity}).`);
      return;
    }

    try {
        // Optimistically update quantity locally
        dispatchCart({ type: 'UPDATE_ITEM_QUANTITY', payload: { id, quantity: newQuantity } });
        console.log(`CartDrawer: Item quantity updated locally to ${newQuantity}.`);

        // Trigger sync in CartProvider for authenticated users
        if (localStorage.getItem('accessToken')) {
            console.log(`CartDrawer: Quantity updated locally. Triggering sync for authenticated user.`);
            dispatchCart({ type: 'TRIGGER_SYNC' });
        } else {
            console.log(`CartDrawer: Quantity updated locally for guest user.`);
        }
    } catch (error) {
        console.error(`CartDrawer: Error handling local quantity update dispatch for item (ID: ${id}):`, error);
    }
  };

  const handleProceedToCheckout = (): void => {
    setShowCheckoutModal(true);
  };

  const handleCheckoutClose = (): void => {
    setShowCheckoutModal(false);
    // After the checkout modal closes (e.g., order placed or cancelled),
    // it's a good idea to re-fetch the definitive cart state.
    getAndSetCartItems();
  };

  const handleAddressSelected = (addressId: string): void => {
    console.log(`CartDrawer: Proceeding with address ID: ${addressId}`);
    setShowCheckoutModal(false);
    // After address selection (often implies order placement), re-fetch cart.
    getAndSetCartItems();
  };

  const clearCart = async (): Promise<void> => {
    try {
      // Optimistically clear local state immediately
      dispatchCart({ type: 'SET_CART_ITEMS', payload: [] });
      console.log('CartDrawer: Cart cleared locally.');

      // For authenticated users, explicitly call the backend's clear cart endpoint
      // and then trigger a sync to confirm.
      if (localStorage.getItem('accessToken')) {
        console.log(`CartDrawer: Attempting to clear cart on backend for authenticated user.`);
        // Assuming apiService.addToCart({ mode: 'delete_cart' }) is your specific endpoint to clear ALL cart items
        await apiService.addToCart({ mode: 'delete_cart' });
        dispatchCart({ type: 'TRIGGER_SYNC' }); // Trigger a re-fetch to confirm backend state
      } else {
        console.log(`CartDrawer: Cart cleared locally for guest user.`);
        // For guest users, the SET_CART_ITEMS dispatch already updated localStorage.
      }
    } catch (error) {
      console.error('CartDrawer: Error clearing cart:', error);
      getAndSetCartItems(); // Re-fetch on error to reconcile
    }
  };

  const hasOutOfStockItems = (): boolean => {
    return cartUtils.hasOutOfStockItems(cartItems);
  };

  const getOutOfStockItems = (): string[] => {
    return cartUtils.getOutOfStockItems(cartItems);
  };

  if (!isOpen) return null; // Render nothing if drawer is closed

  const totalCartUnits = cartItems.reduce((total: number, item: CartItemType) => {
    if (item.type === 'normal') {
      return total + item.quantity;
    } else {
      return total + item.offer_items.reduce((offerTotal, p) => offerTotal + p.quantity, 0);
    }
  }, 0);

  const subtotal = cartUtils.calculateSubtotal(cartItems);
  const offerSavings = cartUtils.calculateTotalOfferSavings(cartItems);

  const finalTotal = subtotal;

  return (
    <>
      <div className="fixed inset-0 z-51 overflow-hidden">
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/80" onClick={onClose}></div>

        {/* Drawer content */}
        <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-[#f2f4f7] shadow-xl transform transition-transform rounded-tl-[16px] rounded-bl-[16px]">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between py-3 pl-6 pr-2 border-b">
              <div className="flex items-center">
                <ShoppingCart className="mr-2 text-[#7F7F7F]" size={18} />
                <h3 className="text-[16px] font-medium text-[#7F7F7F]">
                  Your Cart ({totalCartUnits} items)
                </h3>
              </div>
              <button onClick={onClose} className="text-black hover:text-gray-700">
                <X size={22} />
              </button>
            </div>
            {/* Promotional banner */}
            <div className="bg-[#175e7a] py-1 text-center">
              <p className="text-white text-[12px]">BUY 1 GET 1 FREE | USE CODE : B1G1</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {(localLoading || contextLoading) ? (
                <div className="flex justify-center items-center h-40">
                  <div className="w-8 h-8 border-4 border-gray-200 border-t-[#175e7a] rounded-full animate-spin mr-2"></div>
                  <p>Loading cart items...</p>
                </div>
              ) : (
                <>
                  {cartItems.length > 0 ? (
                    <>
                      {cartItems.map((item) => {
                        if (item.type === 'normal') {
                          return (
                            <CartItem
                              key={item.id ?? uuidv4()}
                              product={item}
                              onRemove={handleRemoveItem}
                              onQuantityChange={handleQuantityChange}
                            />
                          );
                        } else { // item.type === 'offer'
                          return (
                            <OfferCartItem
                              key={item.id ?? uuidv4()}
                              offerSet={item}
                              onRemove={handleRemoveItem}
                            />
                          );
                        }
                      })}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <ShoppingCart size={40} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500">Your cart is empty</p>
                    </div>
                  )}
                </>
              )}
            </div>
            {cartItems.length > 0 && (
              <div className="px-4 pb-6">
                <div className="mb-4">
                  {offerSavings > 0 && (
                    <div className="flex justify-between text-green-600 mb-1">
                      <span className="text-sm">Offer Savings</span>
                      <span className="text-base font-bold">₹{offerSavings.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[#7F7F7F]">
                    <span className="text-sm">Estimated Total</span>
                    <span className="text-base font-bold">₹{finalTotal.toFixed(2)}</span>
                  </div>
                </div>
                {hasOutOfStockItems() && (
                  <div className="bg-red-50 border border-red-200 text-red-600 p-3 mb-4 rounded text-sm">
                    Please remove out of stock item(s) to continue:
                    <ul className="mt-1 list-disc pl-5">
                      {getOutOfStockItems().map((name, index) => (
                        <li key={index}>{name}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex gap-2">
                  {cartItems.length > 0 && (
                    <button
                      className="px-3 py-3 border border-[#175e7a] text-[14px] text-[#175e7a] font-medium hover:bg-gray-100 cursor-pointer transition-colors rounded"
                      onClick={clearCart}
                    >
                      Clear Cart
                    </button>
                  )}
                  <button
                    className={`flex-1 text-[14px] text-white font-medium py-3 cursor-pointer transition-colors shadow-sm rounded flex items-center justify-center ${
                      hasOutOfStockItems() ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#175e7a] hover:bg-[#0f4c67]'
                    }`}
                    onClick={hasOutOfStockItems() ? undefined : handleProceedToCheckout}
                    disabled={hasOutOfStockItems()}
                  >
                    Proceed To Checkout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Conditionally render CheckoutModal to prevent unnecessary rendering and logging */}
        {showCheckoutModal && (
          <CheckoutModal
            isOpen={showCheckoutModal}
            onClose={handleCheckoutClose}
            onProceed={handleAddressSelected}
            cartItems={cartItems}
          />
        )}
      </div>
    </>
  );
};

export default CartDrawer;