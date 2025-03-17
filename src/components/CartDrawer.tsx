'use client';

import { useState, useEffect } from 'react';
import { X, ShoppingBag, Plus, Minus, Trash2, ChevronRight } from 'lucide-react';
import Image from 'next/image';

// Define types
type Product = {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  discount: string;
  image: string;
};

type CartItem = {
  id: string;
  quantity: number;
};

type CouponType = {
  code: string;
  description: string;
  discount: number;
};

type CartDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

// Sample product data for testing
const SAMPLE_PRODUCTS: Record<string, Product> = {
  '1': {
    id: '1',
    name: 'Golden Crossover Kada Bracelet',
    price: 2250,
    originalPrice: 3214,
    discount: '30%',
    image: '/starablack.webp', // placeholder - replace with actual image
  },
  '2': {
    id: '2',
    name: 'Chic Layered Necklace',
    price: 899,
    originalPrice: 3299,
    discount: '73%',
    image: '/starablack.webp', // placeholder - replace with actual image
  },
  '3': {
    id: '3',
    name: 'Gilded Oval Bangle',
    price: 999,
    originalPrice: 2999,
    discount: '66%',
    image: '/starablack.webp', // placeholder - replace with actual image
  }
};

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const [cartProducts, setCartProducts] = useState<Product[]>([]);
  const [showCoupons, setShowCoupons] = useState<boolean>(false);
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponType | null>(null);

  // Load cart items from localStorage on mount
  useEffect(() => {
    if (isOpen) {
      try {
        const storedCartIds = JSON.parse(localStorage.getItem('cartItems') || '[]') as string[];
        const items = storedCartIds.map(id => SAMPLE_PRODUCTS[id]).filter(Boolean);
        setCartProducts(items);
      } catch (error) {
        console.error('Error loading cart items:', error);
        setCartProducts([]);
      }
    }
  }, [isOpen]);

  // Calculate cart totals
  const calculateSubtotal = (): number => {
    return cartProducts.reduce((total, item) => total + item.price, 0);
  };

  const subtotal = calculateSubtotal();
  const total = appliedCoupon ? subtotal - appliedCoupon.discount : subtotal;

  const handleRemoveItem = (id: string): void => {
    const updatedCart = cartProducts.filter(item => item.id !== id);
    setCartProducts(updatedCart);
    
    // Update localStorage
    const cartIds = updatedCart.map(item => item.id);
    localStorage.setItem('cartItems', JSON.stringify(cartIds));
  };

  const handleQuantityChange = (id: string, change: number): void => {
    // In a real app, you would update quantities here
    console.log(`Change quantity of item ${id} by ${change}`);
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
              <h3 className="text-[16px] font-medium text-[#7F7F7F]">Your Cart ({cartProducts.length} items)</h3>
            </div>
            <button onClick={onClose} className="text-black hover:text-gray-700">
              <X size={22} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {showCoupons ? (
              <div className="p-4">
                <button 
                  onClick={() => setShowCoupons(false)}
                  className="flex items-center text-gray-600 mb-4"
                >
                  <X size={16} className="mr-2" /> Back to Cart
                </button>
                
                <h3 className="text-lg font-medium mb-4">Available Coupons</h3>
                
                <div className="border rounded-md p-4 mb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold">B1G1</p>
                      <p className="text-sm text-gray-600">Buy 1 Get 1 Free</p>
                    </div>
                    <button 
                      onClick={() => {
                        setCouponCode('B1G1');
                        handleApplyCoupon();
                      }}
                      className="px-3 py-1 bg-[#175e7a] text-white rounded-full text-sm"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                <div className="border rounded-md p-4 mb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold">TANK</p>
                      <p className="text-sm text-gray-600">10% off on all jewelry</p>
                    </div>
                    <button 
                      className="px-3 py-1 bg-[#175e7a] text-white rounded-full text-sm"
                      onClick={() => {
                        setCouponCode('TANK');
                        handleApplyCoupon();
                      }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-[#175e7a] py-1 text-center">
                  <p className="text-white text-[14px]">BUY 1 GET 1 FREE | USE CODE : B1G1</p>
                </div>
                
                {/* Items */}
                <div className="p-2 space-y-2">
                  {cartProducts.length > 0 ? (
                    cartProducts.map(item => (
                      <div key={item.id} className="flex rounded-md border border-gray-200 p-2 bg-white">
                        <div className="w-20 h-20 relative mr-3 bg-gray-100 rounded">
                          <Image 
                            src={item.image} 
                            alt={item.name}
                            fill
                            className="object-contain p-2"
                          />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h3 className="text-sm font-medium">{item.name}</h3>
                          </div>
                          
                          <div className="flex items-center mt-1">
                            <p className="text-sm font-bold">₹{item.price.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 line-through ml-2">
                              ₹{item.originalPrice.toLocaleString()}
                            </p>
                            <span className="ml-2 bg-black text-white text-xs px-1.5 py-0.5 rounded">
                              {item.discount}
                            </span>
                          </div>
                          
                          <div className="flex items-center mt-2">
                            <button 
                              className="w-5 h-5 rounded-full border flex items-center justify-center"
                              onClick={() => handleQuantityChange(item.id, -1)}
                            >
                              <Minus size={10} />
                            </button>
                            <span className="mx-2 text-sm">1</span>
                            <button 
                              className="w-5 h-5 rounded-full border flex items-center justify-center"
                              onClick={() => handleQuantityChange(item.id, 1)}
                            >
                              <Plus size={10} />
                            </button>
                            <button onClick={() => handleRemoveItem(item.id)} className='ml-2'>
                              <Trash2 size={16} className="text-gray-500" />
                            </button>
                          </div>
                        </div>
                      </div>
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

          {/* Footer */}
          {!showCoupons && cartProducts.length > 0 && (
            <div className="border-t px-4 py-4">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex items-center border-b pb-2">
                  <input 
                    type="text" 
                    placeholder="Enter Coupon Code"
                    className="flex-1 text-sm border-none bg-transparent focus:outline-none"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  />
                  <button 
                    className="text-[#175e7a] font-medium text-sm"
                    onClick={handleApplyCoupon}
                  >
                    Apply
                  </button>
                </div>
                
                <div className="flex justify-between mt-2">
                  <button 
                    className="text-[#175e7a] font-medium text-sm flex items-center"
                    onClick={handleViewCoupons}
                  >
                    View Coupons <ChevronRight size={16} />
                  </button>
                  
                  {appliedCoupon && (
                    <div className="text-green-600 text-sm">
                      {appliedCoupon.code} Applied
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({appliedCoupon.description})</span>
                    <span>-₹{appliedCoupon.discount.toLocaleString()}</span>
                  </div>
                )}
                
                <div className="flex justify-between font-bold">
                  <span>Estimated Total</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>
              
              <button 
                className="w-full bg-pink-200 text-black font-medium py-3 rounded flex items-center justify-center"
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