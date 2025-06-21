// src/components/CartDrawer.tsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { X, ShoppingCart } from 'lucide-react';
import CartItem from './CartItem';
import OfferCartItem from './OfferCartItem'; // This is the correct component for offers
import CheckoutModal from './CheckoutModal';
import { useCart, CartItemType, CartNormalItem, CartOfferItem, ProductItemDetails } from '@/context/cartContext';
import { cartService } from '@/utils/api/cartService';
import apiService from '@/utils/api/apiService';
import { cartUtils } from '@/utils/cartUtils';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { cartItems, dispatchCart, loading: contextLoading } = useCart();
  console.log('Current cartItems in CartDrawer:', cartItems);

  const [localLoading, setLocalLoading] = useState<boolean>(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);

  const getAndSetCartItems = useCallback(async () => {
    setLocalLoading(true);
    try {
      const items = await cartService.fetchCartFromBackend();
      dispatchCart({ type: 'SET_CART_ITEMS', payload: items });
    } catch (error) {
      console.error('Error fetching/enriching cart:', error);
    } finally {
      setLocalLoading(false);
    }
  }, [dispatchCart]);

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      getAndSetCartItems();
    }
  }, [isOpen, getAndSetCartItems]);

  useEffect(() => {
    if (!showCheckoutModal && isOpen) {
      getAndSetCartItems();
    }
  }, [showCheckoutModal, isOpen, getAndSetCartItems]);

  const handleRemoveItem = async (id: string): Promise<void> => {
    try {
      const itemToRemove = cartItems.find(item => item.id === id);
      if (itemToRemove) {
        if (itemToRemove.type === 'normal') {
          await apiService.addToCart({ product_id: itemToRemove.product_id.replace(/-/g, ''), mode: 'delete' });
        } else if (itemToRemove.type === 'offer') {
          await handleRemoveOfferSet(id);
          return;
        }
      } else {
        console.warn(`Attempted to remove item with ID: ${id}, but it was not found.`);
      }
      await getAndSetCartItems();
    } catch (error) {
      console.error('Error removing item from cart:', error);
      dispatchCart({ type: 'REMOVE_ITEM', payload: id });
    }
  };

  const handleRemoveOfferSet = async (setId: string): Promise<void> => {
    try {
      console.log('Removing offer set with ID:', setId);
      await apiService.addToCart({ item_id: setId.replace(/-/g, ''), mode: 'delete' }); 
      await getAndSetCartItems();
    } catch (error) {
      console.error('Error removing offer set:', error);
      dispatchCart({ type: 'REMOVE_ITEM', payload: setId });
    }
  };

  const handleQuantityChange = async (id: string, change: number): Promise<void> => {
    try {
      const itemToUpdate = cartItems.find(item => item.id === id);
      if (itemToUpdate && itemToUpdate.type === 'normal') {
        const cleanProductId = itemToUpdate.product_id.replace(/-/g, '');
        await apiService.addToCart({ product_id: cleanProductId, mode: change > 0 ? '+' : '-' });
        await getAndSetCartItems();
      } else {
        console.warn(`Attempted to change quantity of non-normal item or item not found with ID: ${id}`);
      }
    } catch (error) {
      console.error('Error updating cart quantity:', error);
    }
  };

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

  const handleProceedToCheckout = async (): Promise<void> => {
    setShowCheckoutModal(true);
  };

  const handleCheckoutClose = (): void => {
    setShowCheckoutModal(false);
    getAndSetCartItems();
  };

  const handleAddressSelected = (addressId: string): void => {
    console.log(`Address ID selected: ${addressId}`);
    setShowCheckoutModal(false);
    getAndSetCartItems();
  };

  const clearCart = async (): Promise<void> => {
    try {
      await apiService.addToCart({ mode: 'delete_cart' });
      dispatchCart({ type: 'SET_CART_ITEMS', payload: [] });
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const hasOutOfStockItems = (): boolean => {
    return cartUtils.hasOutOfStockItems(cartItems);
  };

  const getOutOfStockItems = (): string[] => {
    return cartUtils.getOutOfStockItems(cartItems);
  };

  if (!isOpen) return null;

  const totalNormalItems = cartItems
    .filter((item: CartItemType) => item.type === 'normal')
    .reduce((total: number, item: CartNormalItem) => total + item.quantity, 0);

  const subtotal = cartUtils.calculateSubtotal(cartItems);
  const offerSavings = cartUtils.calculateTotalOfferSavings(cartItems);
  const finalTotal = subtotal - offerSavings;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 bg-black/80" onClick={onClose}></div>
        <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-[#f2f4f7] shadow-xl transform transition-transform rounded-tl-[16px] rounded-bl-[16px]">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between py-3 pl-6 pr-2 border-b">
              <div className="flex items-center">
                <ShoppingCart className="mr-2 text-[#7F7F7F]" size={18} />
                <h3 className="text-[16px] font-medium text-[#7F7F7F]">
                  Your Cart ({totalNormalItems} items)
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
                      {/* Separate mapping for normal items and offer items for clearer type inference */}
                      {cartItems.map((item) => {
                        if (item.type === 'normal') {
                          return (
                            <CartItem
                              key={item.id}
                              product={item} // item is guaranteed CartNormalItem here
                              onRemove={handleRemoveItem}
                              onQuantityChange={handleQuantityChange}
                            />
                          );
                        } else { // item.type === 'offer'
                          return (
                            <OfferCartItem
                              key={item.id}
                              offerSet={item} // item is guaranteed CartOfferItem here
                              onRemove={handleRemoveOfferSet}
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
                      <span className="text-[13px]">Offer Savings</span>
                      <span className="font-bold">−₹{offerSavings.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[#7F7F7F]">
                    <span className="text-[13px]">Estimated Total</span>
                    <span className="font-bold">₹{finalTotal.toFixed(2)}</span>
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
        <CheckoutModal
          isOpen={showCheckoutModal}
          onClose={handleCheckoutClose}
          onProceed={handleAddressSelected}
          cartItems={cartItems}
        />
      </div>
    </>
  );
};

export default CartDrawer;