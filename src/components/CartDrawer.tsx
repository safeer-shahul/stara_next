// components/CartDrawer.tsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { X, ShoppingCart } from 'lucide-react';
import CartItem from './CartItem';
import OfferCartItem from './OfferCartItem';
import CheckoutModal from './CheckoutModal';
import { useCart, CartItemType, CartNormalItem, CartOfferItem } from '@/context/cartContext';
import { cartService } from '@/utils/api/cartService';
import apiService from '@/utils/api/apiService';
import { cartUtils } from '@/utils/cartUtils';
import { v4 as uuidv4 } from 'uuid';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { cartItems, dispatchCart, loading: contextLoading, getTotalProductQuantitiesInCart } = useCart();
  // `localLoading` state is not strictly needed here as `contextLoading` from `useCart` covers it.
  // const [localLoading, setLocalLoading] = useState<boolean>(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);

  // `getAndSetCartItems` is also no longer needed as CartProvider's internal sync handles fetching.
  // const getAndSetCartItems = useCallback(async () => {
  //   setLocalLoading(true);
  //   try {
  //     const items = await cartService.fetchCartFromBackend();
  //     dispatchCart({ type: 'SET_CART_ITEMS', payload: items });
  //   } catch (error) {
  //     console.error('CartDrawer: Error fetching/enriching cart:', error);
  //   } finally {
  //     setLocalLoading(false);
  //   }
  // }, [dispatchCart]);

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
    console.log(`CartDrawer: Dispatching REMOVE_ITEM for ID: ${id}`);
    dispatchCart({ type: 'REMOVE_ITEM', payload: id });
  };

  const handleQuantityChange = async (id: string, change: number): Promise<void> => {
    console.log('CartDrawer: handleQuantityChange called for item ID:', id, 'change:', change);
    const itemToUpdate = cartItems.find(item => item.id === id);

    if (!itemToUpdate || itemToUpdate.type !== 'normal') {
      console.warn(`CartDrawer: Attempted to change quantity of non-normal item or item not found with ID: ${id}`);
      return;
    }

    const newQuantity = itemToUpdate.quantity + change;

    if (newQuantity <= 0) {
      await handleRemoveItem(id);
      return;
    }

    const totalProductQuantitiesMap = getTotalProductQuantitiesInCart();
    const productIdBeingUpdated = (itemToUpdate as CartNormalItem).product_id.replace(/-/g, '');

    const currentTotalQuantityOfThisProductInCart = totalProductQuantitiesMap.get(productIdBeingUpdated) || 0;

    const effectiveAvailableStockForThisNormalItem = itemToUpdate.stock_quantity - (currentTotalQuantityOfThisProductInCart - itemToUpdate.quantity);


    if (newQuantity > effectiveAvailableStockForThisNormalItem) {
      console.warn(`CartDrawer: Cannot increase quantity for item ${id} beyond effective available stock (${effectiveAvailableStockForThisNormalItem}).`);
      // Optionally show a toast notification here to inform the user
      // Example: alert(`Cannot add more. Only ${effectiveAvailableStockForThisNormalItem} available.`);
      return;
    }

    console.log(`CartDrawer: Dispatching UPDATE_ITEM_QUANTITY for item ${id} to new quantity: ${newQuantity}.`);
    dispatchCart({ type: 'UPDATE_ITEM_QUANTITY', payload: { id, quantity: newQuantity } });
  };

  const handleProceedToCheckout = (): void => {
    setShowCheckoutModal(true);
  };

  const handleCheckoutClose = (): void => {
    setShowCheckoutModal(false);
    // Trigger sync to ensure cart context reflects latest state after checkout modal
    // (e.g., if cart was cleared by the checkout process)
    dispatchCart({ type: 'TRIGGER_SYNC' });
  };

  const handleAddressSelected = (addressId: string): void => {
    console.log(`CartDrawer: Proceeding with address ID: ${addressId}`);
    setShowCheckoutModal(false);
    // Trigger sync to ensure cart context reflects latest state after address selection
    dispatchCart({ type: 'TRIGGER_SYNC' });
  };

  const clearCart = async (): Promise<void> => {
    try {
      // Optimistically clear local cart in UI
      dispatchCart({ type: 'SET_CART_ITEMS', payload: [] });
      console.log('CartDrawer: Cart cleared locally.');

      if (localStorage.getItem('accessToken')) {
        // For authenticated users, attempt to clear on backend
        console.log(`CartDrawer: Attempting to clear cart on backend for authenticated user.`);
        await apiService.addToCart({ mode: 'delete_cart' });
        // After successful backend delete, trigger a sync to confirm
        dispatchCart({ type: 'TRIGGER_SYNC' });
      } else {
        // For guest users, local storage is the source of truth for unsynced items.
        // It's already cleared by `SET_CART_ITEMS` dispatch above.
        console.log(`CartDrawer: Cart cleared locally for guest user (no backend interaction).`);
      }
    } catch (error) {
      console.error('CartDrawer: Error clearing cart:', error);
      // If there's a network error during backend clear for authenticated user,
      // the local state is already cleared. The next sync might re-fetch from backend if not cleared.
      // For guest, this catch block is less relevant as no API call is made.
      // A TRIGGER_SYNC here would attempt to re-fetch/reconcile, which might bring back items
      // if the backend deletion failed for an auth user.
      dispatchCart({ type: 'TRIGGER_SYNC' });
    }
  };

  const hasOutOfStockItems = (): boolean => {
    return cartUtils.hasOutOfStockItems(cartItems);
  };

  const getOutOfStockItems = (): string[] => {
    return cartUtils.getOutOfStockItems(cartItems);
  };

  if (!isOpen) return null;

  const totalCartUnits = cartItems.reduce((total: number, item: CartItemType) => {
    if (item.type === 'normal') {
      return total + item.quantity;
    } else {
      return total + item.offer_items.reduce((offerTotal, p) => offerTotal + p.quantity, 0);
    }
  }, 0);

  const subtotal = cartUtils.calculateSubtotal(cartItems);
  const offerSavings = cartUtils.calculateTotalOfferSavings(cartItems);

  const finalTotal = subtotal; // Assuming finalTotal = subtotal - offerSavings in cart summary

  // Prepare items for CheckoutModal (normal items from cart, and offer sets from cart)
  const normalItemsForCheckout = cartItems.filter(item => item.type === 'normal') as CartNormalItem[];
  const offerSetsForCheckout = cartItems.filter(item => item.type === 'offer') as CartOfferItem[];


  return (
    <>
      <div className="fixed inset-0 z-51 overflow-hidden">
        <div className="absolute inset-0 bg-black/80" onClick={onClose}></div>

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
            <div className="bg-[#175e7a] py-1 text-center">
              <p className="text-white text-[12px]">BUY 1 GET 1 FREE | USE CODE : B1G1</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {contextLoading ? (
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
                          const totalProductQuantitiesMap = getTotalProductQuantitiesInCart();
                          const productIdForThisItem = item.product_id.replace(/-/g, '');
                          const currentTotalQuantityOfThisProductInCart = totalProductQuantitiesMap.get(productIdForThisItem) || 0;
                          const effectiveMaxForThisNormalItem = item.stock_quantity - (currentTotalQuantityOfThisProductInCart - item.quantity);

                          return (
                            <CartItem
                              key={item.id ?? uuidv4()}
                              product={item}
                              onRemove={handleRemoveItem}
                              onQuantityChange={handleQuantityChange}
                              maxAllowedQuantity={effectiveMaxForThisNormalItem}
                            />
                          );
                        } else {
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
        {showCheckoutModal && (
          <CheckoutModal
            isOpen={showCheckoutModal}
            onClose={handleCheckoutClose}
            onProceed={handleAddressSelected}
            // Pass the explicitly prepared items for cart checkout
            normalItemsForCheckout={normalItemsForCheckout}
            offerSetsForCheckout={offerSetsForCheckout}
            checkoutMode={'cart'}
          />
        )}
      </div>
    </>
  );
};

export default CartDrawer;