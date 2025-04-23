'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ShoppingCart } from 'lucide-react';
import { CouponType } from './type';
import CartItem from './CartItem';
// import FrequentlyBoughtTogether from './FrequentlyBoughtTogether';
import CouponSection from './CouponSection';
import CouponsList from './CouponsList';
import CheckoutModal from './CheckoutModal';
import apiService from '@/utils/api/apiService';

interface ApiProduct {
  id: string;
  product_name: string;
  product_price: string;
  strike_price: string;
  images: {
    id: string;
    product_image: string;
    product: string;
  }[];
  product_description: string;
  product_code: string;
  quantity: number;
  product_status: boolean;
  created_at: string;
  updated_at: string;
  sub_category: string;
}

const CartDrawer: React.FC<any> = ({ isOpen, onClose, productId }) => {
  const [cartProducts, setCartProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showCoupons, setShowCoupons] = useState<boolean>(false);
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponType | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [checkoutData, setCheckoutData] = useState<{
    coupon_code_id?: string;
    items: Array<{
      product_id: string;
      quantity: number;
    }>;
  }>({ items: [] });

  const fetchCartFromBackend = useCallback(async () => {
    try {
      setLoading(true);
      const userCartResponse = await apiService.getUserCart();
      console.log('userCartResponse', userCartResponse);
      if (userCartResponse && userCartResponse.items && Array.isArray(userCartResponse.items)) {
        const cartItems = userCartResponse.items.map((item: any) => ({
          id: item.product.replace(/-/g, ''),
          quantity: item.quantity
        }));
        console.log(cartItems, 'cartItems');
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        
        await fetchCartProducts(cartItems);
      } else {
        setCartProducts([]);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching cart from backend:', error);
      await loadCartFromLocalStorage();
    }
  }, []);

  useEffect(() => {
    const handleProductIdAddToCart = async () => {
      if (isOpen && productId) {
        try {
          const cleanProductId = productId.replace(/-/g, '');
          
          await apiService.addToCart({
            product_id: cleanProductId,
            mode: '+' 
          });
          
          await fetchCartFromBackend();
          
        } catch (error) {
          console.error('Error adding product to cart:', error);
        }
      }
    };
    
    handleProductIdAddToCart();
  }, [isOpen, productId, fetchCartFromBackend]);

  const loadCartFromLocalStorage = async () => {
    try {
      setLoading(true);
      
      const storedCartRaw = localStorage.getItem('cartItems') || '[]';
      let storedCartItems;
      
      try {
        storedCartItems = JSON.parse(storedCartRaw);
        
        if (storedCartItems.length > 0 && typeof storedCartItems[0] === 'string') {
          const formattedCartIds = storedCartItems.map((id: any) => id.replace(/-/g, ''));
          
          const productCounts: any = {};
          formattedCartIds.forEach((id: any) => {
            productCounts[id] = (productCounts[id] || 0) + 1;
          });
          
          storedCartItems = Object.keys(productCounts).map(id => ({
            id,
            quantity: productCounts[id]
          }));
          
          localStorage.setItem('cartItems', JSON.stringify(storedCartItems));
        } else {
          storedCartItems = storedCartItems.map((item: any) => ({
            ...item,
            id: item.id.replace(/-/g, '')
          }));
        }
      } catch (error) {
        console.error('Error parsing cart items:', error);
        storedCartItems = [];
      }
      
      await fetchCartProducts(storedCartItems);
      
    } catch (error) {
      console.error('Error loading cart items from localStorage:', error);
      setCartProducts([]);
      setLoading(false);
    }
  };

  const fetchCartProducts = async (cartItems: any[]) => {
    if (cartItems.length === 0) {
      setCartProducts([]);
      setLoading(false);
      return;
    }
    
    const uniqueProductIds = cartItems.map((item: any) => item.id);
    
    try {
      const response = await apiService.getPaginatedProducts(1, 30, uniqueProductIds);
      
      if (response && response.products && Array.isArray(response.products)) {
        const formattedProducts: any[] = response.products.map((item: ApiProduct) => {
          const itemIdWithoutHyphens = item.id.replace(/-/g, '');
          const cartItem = cartItems.find((cartItem: any) => cartItem.id === itemIdWithoutHyphens);
          const quantity = cartItem ? cartItem.quantity : 1;
          
          return {
            id: item.id,
            name: item.product_name,
            price: parseFloat(item.product_price),
            originalPrice: item.strike_price !== "0.00" ? parseFloat(item.strike_price) : undefined,
            discount: item.strike_price !== "0.00" ? 
              Math.round(((parseFloat(item.strike_price) - parseFloat(item.product_price)) / parseFloat(item.strike_price)) * 100) + "%" : 
              undefined,
            description: item.product_description,
            image: item.images.length > 0 ? item.images[0].product_image : '/placeholder.jpg',
            quantity: quantity,
            availableQuantity: item.quantity, // Store the actual inventory quantity from API
            isInStock: item.quantity > 0 && item.product_status, // Track if item is in stock
          };
        });
        
        setCartProducts(formattedProducts);
      } else {
        setCartProducts([]);
      }
    } catch (apiError) {
      console.error('Error fetching cart products from API:', apiError);
      setCartProducts([]);
    }
    
    setLoading(false);
  };

  // Fetch cart when cart drawer is opened
  useEffect(() => {
    if (isOpen) {
      fetchCartFromBackend();
    }
  }, [isOpen, fetchCartFromBackend]);

  // Fetch cart again when checkout modal is closed (to update cart if it was cleared)
  useEffect(() => {
    if (!showCheckoutModal && isOpen) {
      fetchCartFromBackend();
    }
  }, [showCheckoutModal, isOpen, fetchCartFromBackend]);

  const calculateSubtotal = (): number => {
    return cartProducts.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const subtotal = calculateSubtotal();
  const total = appliedCoupon ? subtotal - appliedCoupon.discount : subtotal;

  const handleRemoveItem = async (id: string): Promise<void> => {
    try {
      const cleanProductId = id.replace(/-/g, '');
      await apiService.addToCart({
        product_id: cleanProductId,
        mode: 'delete' 
      });
      
      await fetchCartFromBackend();
      
    } catch (error) {
      console.error('Error removing item from cart:', error);
      
      const updatedCart = cartProducts.filter(item => item.id !== id);
      setCartProducts(updatedCart);
      
      const cartItems = updatedCart.map(item => ({
        id: item.id.replace(/-/g, ''),
        quantity: item.quantity
      }));
      
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }
  };

  const handleQuantityChange = async (id: string, change: number): Promise<void> => {
    try {
      // First check if the change would exceed available inventory
      if (change > 0) {
        const product = cartProducts.find(item => item.id === id);
        const availableQuantity = product?.availableQuantity || 0; // This assumes your API returns this field
        
        // If product exists and has an available quantity limit
        if (product && typeof availableQuantity === 'number') {
          // If current quantity plus change would exceed available quantity, prevent the update
          if (product.quantity + change > availableQuantity) {
            // Show toast or some notification
            console.log(`Cannot add more. Only ${availableQuantity} items available in stock.`);
            // You could add a toast notification here
            return; // Exit early without making the API call
          }
        }
      }
      
      // Proceed with the API call if validation passes
      const cleanProductId = id.replace(/-/g, '');
      await apiService.addToCart({
        product_id: cleanProductId,
        mode: change > 0 ? '+' : '-' 
      });
      
      await fetchCartFromBackend();
      
    } catch (error) {
      console.error('Error updating cart quantity:', error);
      
      const updatedCart = cartProducts.map(item => {
        if (item.id === id) {
          const newQuantity = Math.max(1, item.quantity + change); 
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
      
      setCartProducts(updatedCart);
      
      const cartItems = updatedCart.map(item => ({
        id: item.id.replace(/-/g, ''),
        quantity: item.quantity
      }));
      
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
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
        discount: calculateSubtotal() * 0.5 
      });
    } else if (couponCode.toUpperCase() === 'TANK') {
      setAppliedCoupon({
        code: 'TANK',
        description: '10% off on all jewelry',
        discount: calculateSubtotal() * 0.1
      });
    } else {
      setAppliedCoupon(null);
    }
    setShowCoupons(false);
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
        discount: calculateSubtotal() * 0.5 
      });
    } else if (code === 'TANK') {
      setAppliedCoupon({
        code: 'TANK',
        description: '10% off on all jewelry',
        discount: calculateSubtotal() * 0.1
      });
    }
    setShowCoupons(false);
  };
  
  const handleProceedToCheckout = (): void => {
    // Prepare checkout data
    const items = cartProducts.map(item => ({
      product_id: item.id.replace(/-/g, ''),
      quantity: item.quantity
    }));
    
    setCheckoutData({
      items,
      coupon_code_id: appliedCoupon?.code
    });
    
    setShowCheckoutModal(true);
  };
  
  const handleCheckoutClose = (): void => {
    setShowCheckoutModal(false);
    // Refresh cart data after checkout modal is closed
    fetchCartFromBackend();
  };
  
  const handleAddressSelected = (addressId: string): void => {
    console.log(`Proceeding with address ID: ${addressId}`);
    setShowCheckoutModal(false);
    // Refresh cart data after checkout is completed
    fetchCartFromBackend();
  };

  const clearCart = async (): Promise<void> => {
    try {
      await apiService.addToCart({
        mode: 'delete_cart'
      });
      
      // Clear local storage cart as well
      localStorage.setItem('cartItems', JSON.stringify([]));
      setCartProducts([]);
      console.log('Cart cleared successfully');
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const hasOutOfStockItems = (): boolean => {
    return cartProducts.some(item => !item.isInStock);
  };
  
  const getOutOfStockItems = (): string[] => {
    return cartProducts
      .filter(item => !item.isInStock)
      .map(item => item.name);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 bg-black/80" onClick={onClose}></div>
        
        <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-[#f2f4f7] shadow-xl transform transition-transform rounded-tl-[16px] rounded-bl-[16px]">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between py-3 pl-6 pr-2 border-b">
              <div className="flex items-center">
                <ShoppingCart className="mr-2 text-[#7F7F7F]" size={18} />
                <h3 className="text-[16px] font-medium text-[#7F7F7F]">Your Cart ({cartProducts.reduce((total, item) => total + item.quantity, 0)} items)</h3>
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
              {loading ? (
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
                  {/* Items */}
                  {cartProducts.length > 0 ? (
                  cartProducts.map(item => (
                    <CartItem 
                      key={item.id}
                      product={item}
                      onRemove={handleRemoveItem}
                      onQuantityChange={handleQuantityChange}
                      maxQuantity={item.availableQuantity} // Pass this new prop if your CartItem component supports it
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <ShoppingCart size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">Your cart is empty</p>
                  </div>
                )}
                </>
              )}
            </div>
            
            {/*{!showCoupons && cartProducts.length > 0 && <FrequentlyBoughtTogether />}*/}

            {/* Footer */}
            {!showCoupons && cartProducts.length > 0 && (
              <div className="px-4 pb-6">
                <CouponSection 
                  couponCode={couponCode}
                  setCouponCode={setCouponCode}
                  appliedCoupon={appliedCoupon}
                  onApply={handleApplyCoupon}
                  onViewCoupons={handleViewCoupons}
                />
                
                <div className="mb-4">
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span className='text-[13px]'>Discount ({appliedCoupon.description})</span>
                      <span className='font-bold'>-₹{appliedCoupon.discount}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-[#7F7F7F]">
                    <span className='text-[13px]'>Estimated Total</span>
                    <span className='font-bold'>₹{total}</span>
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
                  {cartProducts.length > 0 && (
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
      </div>
      
      {/* Checkout Modal */}
      <CheckoutModal 
        isOpen={showCheckoutModal}
        onClose={handleCheckoutClose}
        onProceed={handleAddressSelected}
        orderItems={checkoutData.items}
        coupon_code_id={checkoutData.coupon_code_id}
      />
    </>
  );
};

export default CartDrawer;