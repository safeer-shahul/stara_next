'use client';

import { useState, useEffect } from 'react';
import { X, ShoppingBag } from 'lucide-react';
import { CartDrawerProps, CouponType } from './type';
import CartItem from './CartItem';
import FrequentlyBoughtTogether from './FrequentlyBoughtTogether';
import CouponSection from './CouponSection';
import CouponsList from './CouponsList';
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


const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const [cartProducts, setCartProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showCoupons, setShowCoupons] = useState<boolean>(false);
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponType | null>(null);

  // Load cart items from localStorage and fetch from API on mount
  useEffect(() => {
  if (isOpen) {
    try {
      const fetchCartProducts = async () => {
        setLoading(true);
        
        // Get cart items from localStorage
        const storedCartRaw = localStorage.getItem('cartItems') || '[]';
        console.log(storedCartRaw,'storedCartRaw')
        let storedCartItems;
        
        try {
          storedCartItems = JSON.parse(storedCartRaw);
          
          // Check if we're using the old format (array of strings)
          if (storedCartItems.length > 0 && typeof storedCartItems[0] === 'string') {
            // Remove hyphens from each ID in old format
            const formattedCartIds = storedCartItems.map((id:any) => id.replace(/-/g, ''));
            
            // Count occurrences and convert to new format
            const productCounts:any = {};
            formattedCartIds.forEach((id:any) => {
              productCounts[id] = (productCounts[id] || 0) + 1;
            });
            
            // Convert to new format with quantities
            storedCartItems = Object.keys(productCounts).map(id => ({
              id,
              quantity: productCounts[id]
            }));
            
            // Update localStorage with new format
            localStorage.setItem('cartItems', JSON.stringify(storedCartItems));
          } else {
            // Already using new format, but still need to remove hyphens
            storedCartItems = storedCartItems.map((item:any) => ({
              ...item,
              id: item.id.replace(/-/g, '')
            }));
          }
        } catch (error) {
          console.error('Error parsing cart items:', error);
          storedCartItems = [];
        }
        
        if (storedCartItems.length === 0) {
          setCartProducts([]);
          setLoading(false);
          return;
        }
        
        // Get unique product IDs (already without hyphens)
        const uniqueProductIds = storedCartItems.map((item:any) => item.id);
        
        console.log(uniqueProductIds, 'uniqueProductIds', storedCartItems, 'storedCartItems');
        
        try {
          const response = await apiService.getPaginatedProducts(1, 30, uniqueProductIds);
          
          // Convert API response to your Product type with quantities
          if (response && response.products && Array.isArray(response.products)) {
            const formattedProducts: any[] = response.products.map((item: ApiProduct) => {
              // Find quantity from stored cart items - match IDs without hyphens
              const itemIdWithoutHyphens = item.id.replace(/-/g, '');
              const cartItem = storedCartItems.find((cartItem:any) => cartItem.id === itemIdWithoutHyphens);
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
      
      fetchCartProducts();
    } catch (error) {
      console.error('Error loading cart items:', error);
      setCartProducts([]);
      setLoading(false);
    }
  }
}, [isOpen]);

  // Calculate cart totals
  const calculateSubtotal = (): number => {
    return cartProducts.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const subtotal = calculateSubtotal();
  const total = appliedCoupon ? subtotal - appliedCoupon.discount : subtotal;

  const handleRemoveItem = (id: string): void => {
    // Remove item from cart
    const updatedCart = cartProducts.filter(item => item.id !== id);
    setCartProducts(updatedCart);
    
    // Update localStorage - now storing items with quantities
    const cartItems = updatedCart.map(item => ({
      id: item.id,
      quantity: item.quantity
    }));
    
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  };

  const handleQuantityChange = (id: string, change: number): void => {
    // Update quantity in the cart state
    const updatedCart = cartProducts.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + change); // Ensure minimum quantity is 1
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    
    setCartProducts(updatedCart);
    
    // Update localStorage with new quantities
    // Important: Remove hyphens from IDs when storing in localStorage
    const cartItems = updatedCart.map(item => ({
      id: item.id.replace(/-/g, ''),
      quantity: item.quantity
    }));
    
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  };

  const handleApplyCoupon = (): void => {
    if (couponCode.toUpperCase() === 'B1G1') {
      setAppliedCoupon({
        code: 'B1G1',
        description: 'Buy 1 Get 1 Free',
        discount: calculateSubtotal() * 0.5 // 50% discount as an example
      });
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
        discount: calculateSubtotal() * 0.5 // 50% discount as an example
      });
    } else if (code === 'TANK') {
      setAppliedCoupon({
        code: 'TANK',
        description: '10% off on all jewelry',
        discount: calculateSubtotal() * 0.1 // 10% discount
      });
    }
    setShowCoupons(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/80" onClick={onClose}></div>
      
      <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-[#f2f4f7] shadow-xl transform transition-transform rounded-tl-[16px] rounded-bl-[16px]">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between py-3 pl-6 pr-2 border-b">
            <div className="flex items-center">
              <ShoppingBag className="mr-2 text-[#7F7F7F]" size={18} />
              <h3 className="text-[16px] font-medium text-[#7F7F7F]">Your Cart ({cartProducts.reduce((total, item) => total + item.quantity, 0)} items)</h3>
            </div>
            <button onClick={onClose} className="text-black hover:text-gray-700">
              <X size={22} />
            </button>
          </div>
          
          {!showCoupons && (
            <div className="bg-[#175e7a] py-1 text-center">
              <p className="text-white text-[14px]">BUY 1 GET 1 FREE | USE CODE : B1G1</p>
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center h-40">
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
                <div className="p-2 space-y-2">
                  {cartProducts.length > 0 ? (
                    cartProducts.map(item => (
                      <CartItem 
                        key={item.id}
                        product={item}
                        onRemove={handleRemoveItem}
                        onQuantityChange={handleQuantityChange}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <ShoppingBag size={40} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500">Your cart is empty</p>
                    </div>
                  )}
                </div>
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
              
              <button 
                className="w-full bg-[#175e7a] text-white font-medium py-3 rounded flex items-center justify-center"
              >
                Proceed To Checkout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;