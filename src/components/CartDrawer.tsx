'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ShoppingCart } from 'lucide-react';
import { CouponType } from './type';
import CartItem from './CartItem';
import OfferCartItem from './OfferCartItem';
import CouponSection from './CouponSection';
import CouponsList from './CouponsList';
import CheckoutModal from './CheckoutModal';
import { cartService } from '@/utils/api/cartService';
import { useCart } from '@/context/cartContext';
import { cartUtils } from '@/utils/cartUtils';
import apiService from '@/utils/api/apiService';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: string;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, productId }) => {
  const { cartItems, dispatchCart, loading: contextLoading } = useCart();
  const [localLoading, setLocalLoading] = useState<boolean>(false);
  const [showCoupons, setShowCoupons] = useState<boolean>(false);
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponType | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [checkoutData, setCheckoutData] = useState<{
    coupon_code_id?: string;
    items: Array<{ product_id: string; quantity: number }>;
    offer_sets: Array<{
      id: string;
      offer_id: string;
      offer_products: string[];
      buy_count: number;
      get_count: number;
    }>;
  }>({ items: [], offer_sets: [] });

  const fetchCartFromBackend = useCallback(async () => {
    try {
      setLocalLoading(true);
      const fetchedItems = await cartService.fetchCartFromBackend();
      dispatchCart({ type: 'SET_CART_ITEMS', payload: fetchedItems });
    } catch (error) {
      console.error('Error fetching cart from backend:', error);
    } finally {
      setLocalLoading(false);
    }
  }, [dispatchCart]);

  useEffect(() => {
    const handleProductIdAddToCart = async () => {
      if (isOpen && productId) {
        try {
          const cleanProductId = productId.replace(/-/g, '');
          await cartService.addToCart(cleanProductId, '+');
          await fetchCartFromBackend();
        } catch (error) {
          console.error('Error adding product to cart:', error);
        }
      }
    };
    handleProductIdAddToCart();
  }, [isOpen, productId, fetchCartFromBackend]);

  useEffect(() => {
    if (isOpen) {
      fetchCartFromBackend();
    }
  }, [isOpen, fetchCartFromBackend]);

  useEffect(() => {
    if (!showCheckoutModal && isOpen) {
      fetchCartFromBackend();
    }
  }, [showCheckoutModal, isOpen, fetchCartFromBackend]);

  const calculateSubtotal = (): number => {
    return cartUtils.calculateSubtotal(cartItems, appliedCoupon);
  };

  const handleRemoveItem = async (id: string): Promise<void> => {
    try {
      // Assuming apiService or cartService needs a remove method; adjust if different
      await apiService.addToCart({ product_id: id.replace(/-/g, ''), mode: 'delete' });
      dispatchCart({ type: 'REMOVE_ITEM', payload: id });
    } catch (error) {
      console.error('Error removing item from cart:', error);
      dispatchCart({ type: 'REMOVE_ITEM', payload: id }); // Fallback
    }
  };

  const handleRemoveOfferSet = async (setId: string): Promise<void> => {
    try {
      // Assuming a removeOfferSet endpoint; implement in cartService if needed
      await apiService.addToCart({ item_id: setId.replace(/-/g, ''), mode: 'delete' }); // Placeholder; adjust endpoint
      dispatchCart({ type: 'REMOVE_ITEM', payload: setId });
    } catch (error) {
      console.error('Error removing offer set:', error);
      dispatchCart({ type: 'REMOVE_ITEM', payload: setId }); // Fallback
    }
  };

  const handleQuantityChange = async (id: string, change: number): Promise<void> => {
    try {
      const product = cartItems.find((item: any) => item.id === id);
      const availableQuantity = product?.quantity || 0; // Adjust based on your data
      if (change > 0 && product && product.quantity + change > availableQuantity) {
        console.log(`Cannot add more. Only ${availableQuantity} items available in stock.`);
        return;
      }
      const cleanProductId = id.replace(/-/g, '');
      await apiService.addToCart({ product_id: cleanProductId, mode: change > 0 ? '+' : '-' });
      await fetchCartFromBackend();
    } catch (error) {
      console.error('Error updating cart quantity:', error);
      // No direct dispatch for quantity update; rely on fetch to sync
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

  const handleApplyCoupon = (): void => {
    if (couponCode.toUpperCase() === 'B1G1') {
      setAppliedCoupon({
        code: 'B1G1',
        description: 'Buy 1 Get 1 Free',
        discount: calculateSubtotal() * 0.5,
      });
    } else if (couponCode.toUpperCase() === 'TANK') {
      setAppliedCoupon({
        code: 'TANK',
        description: '10% off on all jewelry',
        discount: calculateSubtotal() * 0.1,
      });
    } else {
      setAppliedCoupon(null);
    }
    setShowCoupons(false);
    dispatchCart({ type: 'APPLY_COUPON', payload: appliedCoupon }); // Sync with context
  };

  const handleViewCoupons = (): void => {
    setShowCoupons(true);
  };

  const handleApplyCouponFromList = (code: string): void => {
    setCouponCode(code);
    if (code === 'B1G1') {
      setAppliedCoupon({
        code: 'B1G1',
        description: 'Buy 1 Get 1 Free',
        discount: calculateSubtotal() * 0.5,
      });
    } else if (code === 'TANK') {
      setAppliedCoupon({
        code: 'TANK',
        description: '10% off on all jewelry',
        discount: calculateSubtotal() * 0.1,
      });
    }
    setShowCoupons(false);
    dispatchCart({ type: 'APPLY_COUPON', payload: appliedCoupon }); // Sync with context
  };

  const handleProceedToCheckout = (): void => {
    const items = cartItems
      .filter((item: any) => item.type === 'normal')
      .map((item: any) => ({
        product_id: item.id.replace(/-/g, ''),
        quantity: item.quantity,
      }));
    
    const offer_sets = cartItems
      .filter((item: any) => item.type === 'offer')
      .map((item: any) => ({
        id: item.id,
        offer_id: item.offer_id,
        offer_products: item.offer_products.map((p: any) => p.id || p.product),
        buy_count: item.buy_count,
        get_count: item.get_count,
      }));
    
    setCheckoutData({
      items,
      offer_sets,
      coupon_code_id: appliedCoupon?.code,
    });
    dispatchCart({ type: 'SET_CHECKOUT_DATA', payload: { items, offer_sets } }); // Sync checkout data
    setShowCheckoutModal(true);
  };

  const handleCheckoutClose = (): void => {
    setShowCheckoutModal(false);
    fetchCartFromBackend();
  };

  const handleAddressSelected = (addressId: string): void => {
    console.log(`Proceeding with address ID: ${addressId}`);
    setShowCheckoutModal(false);
    fetchCartFromBackend();
  };

  const clearCart = async (): Promise<void> => {
    try {
      await apiService.addToCart({ mode: 'delete_cart' }); // Adjust if cartService has clearCart
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
                  Your Cart ({cartItems.filter((item: any) => item.type === 'normal').reduce((total: number, item: any) => total + item.quantity, 0)} items)
                </h3>
              </div>
              <button onClick={onClose} className="text-black hover:text-gray-700">
                <X size={22} />
              </button>
            </div>
            {!showCoupons && (
              <div className="bg-[#175e7a] py-1 text-center">
                <p className="text-white text-[12px]">BUY 1 GET 1 FREE | USE CODE : B1G1</p>
              </div>
            )}
            <div className="flex-1 overflow-y-auto">
              {(localLoading || contextLoading) ? (
                <div className="flex justify-center items-center h-40">
                  <div className="w-8 h-8 border-4 border-gray-200 border-t-[#175e7a] rounded-full animate-spin mr-2"></div>
                  <p>Loading cart items...</p>
                </div>
              ) : showCoupons ? (
                <CouponsList
                  onBack={() => setShowCoupons(false)}
                  onApplyCoupon={handleApplyCouponFromList}
                />
              ) : (
                <>
                  {cartItems.length > 0 ? (
                    <>
                      {cartItems.map((item: any) =>
                        item.type === 'normal' ? (
                          <CartItem
                            key={item.id}
                            product={item}
                            onRemove={handleRemoveItem}
                            onQuantityChange={handleQuantityChange}
                            maxQuantity={item.quantity} // Adjust based on your data structure
                          />
                        ) : (
                          <OfferCartItem
                            key={item.id}
                            offerSet={item}
                            onRemove={handleRemoveOfferSet}
                          />
                        )
                      )}
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
            {!showCoupons && cartItems.length > 0 && (
              <div className="px-4 pb-6">
                {/* <CouponSection
                  couponCode={couponCode}
                  setCouponCode={setCouponCode}
                  appliedCoupon={appliedCoupon}
                  onApply={handleApplyCoupon}
                  onViewCoupons={handleViewCoupons}
                /> */}
                <div className="mb-4">
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span className="text-[13px]">Discount ({appliedCoupon.description})</span>
                      <span className="font-bold">−₹{appliedCoupon.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[#7F7F7F]">
                    <span className="text-[13px]">Estimated Total</span>
                    <span className="font-bold">₹{calculateSubtotal().toFixed(2)}</span>
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
          orderItems={checkoutData.items}
          coupon_code_id={checkoutData.coupon_code_id}
          offer_sets={checkoutData.offer_sets}
        />
      </div>
    </>
  );
};

export default CartDrawer;