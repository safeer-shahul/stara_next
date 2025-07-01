'use client';
import { useState, useEffect, useCallback } from 'react';
import { X, ShoppingCart } from 'lucide-react';
import CartItem from './CartItem';
import OfferCartItem from './OfferCartItem';
import CheckoutModal from './CheckoutModal';
import { useCart, CartItemType, CartNormalItem, CartOfferItem } from '@/context/cartContext';
import { cartUtils } from '@/utils/cartUtils';
import { v4 as uuidv4 } from 'uuid';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { 
    cartItems, 
    dispatchCart, 
    loading: contextLoading, 
    getEffectiveProductStock,
    clearCart,
    forceRefreshCart // New method for forcing refresh
  } = useCart();
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);

  // Force refresh cart when drawer opens for authenticated users
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      // Force refresh cart data when drawer opens (for authenticated users)
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        console.log('CartDrawer: Forcing cart refresh on open');
        forceRefreshCart();
      }
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, forceRefreshCart]);

  const handleRemoveItem = useCallback(async (id: string): Promise<void> => {
    console.log(`CartDrawer: Removing item with ID: ${id}`);
    
    // Find the item to log details for debugging
    const itemToRemove = cartItems.find(item => item.id === id);
    if (itemToRemove) {
      // console.log(`CartDrawer: Removing ${itemToRemove.type} item:`, {
      //   id: itemToRemove.id,
      //   type: itemToRemove.type,
      //   name: itemToRemove.type === 'normal' 
      //     ? (itemToRemove as CartNormalItem).product_name 
      //     : (itemToRemove as CartOfferItem).offer_name.offer_name
      // });
    }
    
    dispatchCart({ type: 'REMOVE_ITEM', payload: id });
  }, [dispatchCart, cartItems]);

  const handleQuantityChange = useCallback(async (id: string, change: number): Promise<void> => {
    console.log('CartDrawer: handleQuantityChange called for item ID:', id, 'change:', change);
    const itemToUpdate = cartItems.find(item => item.id === id);

    if (!itemToUpdate || itemToUpdate.type !== 'normal') {
      console.warn(`CartDrawer: Cannot update quantity - item not found or not normal type`);
      return;
    }

    if (!itemToUpdate.productDetails) {
      console.error(`CartDrawer: Cannot update quantity - missing productDetails`);
      alert('Cannot update quantity: product data incomplete. Please refresh your cart.');
      return;
    }

    const newQuantity = itemToUpdate.quantity + change;

    if (newQuantity <= 0) {
      await handleRemoveItem(id);
      return;
    }

    const currentEffectiveStock = getEffectiveProductStock(itemToUpdate.productDetails, itemToUpdate.selectedVariant?.id);

    if (newQuantity > currentEffectiveStock + itemToUpdate.quantity) {
      const maxAllowed = currentEffectiveStock + itemToUpdate.quantity;
      console.warn(`CartDrawer: Cannot increase quantity beyond stock limit`);
      alert(`Cannot add more: Maximum available stock is ${maxAllowed} units.`);
      return;
    }

    console.log(`CartDrawer: Updating quantity for item ${id} to ${newQuantity}`);
    dispatchCart({ type: 'UPDATE_ITEM_QUANTITY', payload: { id, quantity: newQuantity } });
  }, [cartItems, dispatchCart, getEffectiveProductStock, handleRemoveItem]);

  const handleProceedToCheckout = useCallback((): void => {
    setShowCheckoutModal(true);
  }, []);

  const handleCheckoutClose = useCallback((): void => {
    setShowCheckoutModal(false);
  }, []);

  const handleAddressSelected = useCallback((addressId: string): void => {
    console.log(`CartDrawer: Proceeding with address ID: ${addressId}`);
    setShowCheckoutModal(false);
  }, []);

  const handleClearCart = useCallback(async (): Promise<void> => {
    try {
      console.log('CartDrawer: Clearing cart');
      await clearCart();
      
      // Force refresh after clearing cart to ensure sync
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        setTimeout(() => {
          forceRefreshCart();
        }, 500);
      }
    } catch (error) {
      console.error('CartDrawer: Error clearing cart:', error);
      dispatchCart({ type: 'CLEAR_CART' });
    }
  }, [clearCart, dispatchCart, forceRefreshCart]);

  // Calculate totals using cartUtils
  const calculateTotals = useCallback(() => {
    if (!cartItems || cartItems.length === 0) {
      return {
        normalSubtotal: 0,
        offerSubtotal: 0,
        offerSavings: 0,
        totalItems: 0,
        grandTotal: 0,
      };
    }

    try {
      return cartUtils.calculateDetailedTotals(cartItems);
    } catch (error) {
      console.error('Error calculating totals:', error);
      return {
        normalSubtotal: 0,
        offerSubtotal: 0,
        offerSavings: 0,
        totalItems: 0,
        grandTotal: 0,
      };
    }
  }, [cartItems]);

  const hasOutOfStockItems = useCallback((): boolean => {
    return cartUtils.hasOutOfStockItems(cartItems);
  }, [cartItems]);

  const getOutOfStockItems = useCallback((): string[] => {
    return cartUtils.getOutOfStockItems(cartItems);
  }, [cartItems]);

  // Group normal items by product and variant for display
  const groupedNormalItems = useCallback(() => {
    const normalItems = cartItems.filter(item => item.type === 'normal') as CartNormalItem[];
    return normalItems;
  }, [cartItems]);

  if (!isOpen) return null;

  const totals = calculateTotals();
  const normalItems = groupedNormalItems();
  const offerItems = cartItems.filter(item => item.type === 'offer') as CartOfferItem[];

  console.log('CartDrawer: Rendering with items:', {
    total: cartItems.length,
    normal: normalItems.length,
    offers: offerItems.length,
    totals
  });

  return (
    <>
      <div className="fixed inset-0 z-51 overflow-hidden">
        <div className="absolute inset-0 bg-black/80" onClick={onClose}></div>

        <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-[#f2f4f7] shadow-xl transform transition-transform rounded-tl-[16px] rounded-bl-[16px]">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between py-3 pl-6 pr-2 border-b">
              <div className="flex items-center">
                <ShoppingCart className="mr-2 text-[#7F7F7F]" size={18} />
                <h3 className="text-[16px] font-medium text-[#7F7F7F]">
                  Your Cart ({totals.totalItems} items)
                </h3>
              </div>
              <button onClick={onClose} className="text-black hover:text-gray-700">
                <X size={22} />
              </button>
            </div>

            {/* Promo Banner */}
            <div className="bg-[var(--color-primary-950)] py-1 text-center">
              <p className="text-white text-[12px]">BUY 1 GET 1 FREE | USE CODE : B1G1</p>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto">
              {contextLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="w-8 h-8 border-4 border-gray-200 border-t-[#175e7a] rounded-full animate-spin mr-2"></div>
                  <p>Loading cart items...</p>
                </div>
              ) : (
                <>
                  {cartItems.length > 0 ? (
                    <div className="space-y-2">
                      {/* Normal Items Section */}
                      {normalItems.length > 0 && (
                        <div>
                          <div className="px-4 py-2 bg-gray-100">
                            <h4 className="text-sm font-medium text-gray-700">Regular Items ({normalItems.length})</h4>
                          </div>
                          {normalItems.map((item) => {
                            const effectiveMaxForThisItem = item.selectedVariant?.quantity ?? item.stock_quantity;

                            return (
                              <CartItem
                                key={`${item.id}-${item.selectedVariant?.id || 'no-variant'}`}
                                product={item}
                                onRemove={handleRemoveItem}
                                onQuantityChange={handleQuantityChange}
                                maxAllowedQuantity={effectiveMaxForThisItem}
                              />
                            );
                          })}
                        </div>
                      )}

                      {/* Offer Items Section */}
                      {offerItems.length > 0 && (
                        <div>
                          <div className="px-4 py-2 bg-green-50">
                            <h4 className="text-sm font-medium text-green-700">Special Offers ({offerItems.length})</h4>
                          </div>
                          {offerItems.map((item) => (
                            <OfferCartItem
                              key={item.id}
                              offerSet={item}
                              onRemove={handleRemoveItem}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ShoppingCart size={40} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500">Your cart is empty</p>
                      <button
                        onClick={() => forceRefreshCart()}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        Refresh Cart
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Cart Summary */}
            {cartItems.length > 0 && (
              <div className="px-4 pb-6">
                <div className="mb-4 space-y-1">
                  {/* Normal Items Subtotal */}
                  {totals.normalSubtotal > 0 && (
                    <div className="flex justify-between text-gray-600 text-sm">
                      <span>Regular Items</span>
                      <span>₹{totals.normalSubtotal.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Offer Items Subtotal */}
                  {totals.offerSubtotal > 0 && (
                    <div className="flex justify-between text-gray-600 text-sm">
                      <span>Offer Items (Paid)</span>
                      <span>₹{totals.offerSubtotal.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Offer Savings */}
                  {totals.offerSavings > 0 && (
                    <div className="flex justify-between text-green-600 mb-1">
                      <span className="text-sm">You Save (Free Items)</span>
                      <span className="text-base font-bold">₹{totals.offerSavings.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Total */}
                  <div className="flex items-center justify-between text-[#7F7F7F] pt-2 border-t">
                    <span className="text-sm font-medium">Total</span>
                    <span className="text-base font-bold">₹{totals.grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Debug Info (remove in production) */}
                {/* {process.env.NODE_ENV === 'development' && (
                  <div className="mb-2 p-2 bg-yellow-50 rounded text-xs">
                    <div>Debug: Total Items: {cartItems.length}</div>
                    <div>Normal: {normalItems.length}, Offers: {offerItems.length}</div>
                    <div>Subtotal: ₹{totals.normalSubtotal + totals.offerSubtotal}</div>
                    <div>Savings: ₹{totals.offerSavings}</div>
                  </div>
                )} */}

                {/* Out of Stock Warning */}
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

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {cartItems.length > 0 && (
                    <button
                      className="px-3 py-3 border border-[var(--color-primary-950)] text-[14px] text-[var(--color-primary-950)] font-medium hover:bg-gray-100 cursor-pointer transition-colors rounded"
                      onClick={handleClearCart}
                    >
                      Clear Cart
                    </button>
                  )}
                  <button
                    className={`flex-1 text-[14px] text-white font-medium py-3 cursor-pointer transition-colors shadow-sm rounded flex items-center justify-center ${
                      hasOutOfStockItems() ? 'bg-gray-400 cursor-not-allowed' : 'bg-[var(--color-primary-950)] hover:bg-[#0f4c67]'
                    }`}
                    onClick={hasOutOfStockItems() ? undefined : handleProceedToCheckout}
                    disabled={hasOutOfStockItems()}
                  >
                    Proceed To Checkout
                  </button>
                </div>

                {/* Refresh Button for Development */}
                {/* {process.env.NODE_ENV === 'development' && (
                  <button
                    onClick={() => forceRefreshCart()}
                    className="w-full mt-2 text-xs text-gray-500 hover:text-gray-700 py-1 border border-gray-300 rounded"
                  >
                    Force Refresh Cart (Dev)
                  </button>
                )} */}
              </div>
            )}
          </div>
        </div>

        {/* Checkout Modal */}
        {showCheckoutModal && (
          <CheckoutModal
            isOpen={showCheckoutModal}
            onClose={handleCheckoutClose}
            onProceed={handleAddressSelected}
            normalItemsForCheckout={normalItems}
            offerSetsForCheckout={offerItems}
            checkoutMode={'cart'}
          />
        )}
      </div>
    </>
  );
};

export default CartDrawer;