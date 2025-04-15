'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import apiService from '@/utils/api/apiService';

interface CouponType {
  code: string;
  description: string;
  discount: number;
}

interface ProductSummaryProps {
  items: Array<{
    product_id: string;
    quantity: number;
  }>;
  coupon_code_id?: string;
}

const ProductSummary: React.FC<ProductSummaryProps> = ({ items, coupon_code_id }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState<string>(coupon_code_id || '');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponType | null>(null);
  const [showCoupons, setShowCoupons] = useState<boolean>(false);
  const isMounted = useRef(true);
  const fetchInProgress = useRef(false);

  // Helper to safely update state only if component is still mounted
  const safeSetState = (setter: any, value: any) => {
    if (isMounted.current) {
      setter(value);
    }
  };

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      if (fetchInProgress.current) return;
      if (items.length === 0) {
        safeSetState(setProducts, []);
        safeSetState(setLoading, false);
        return;
      }

      fetchInProgress.current = true;
      safeSetState(setLoading, true);
      
      try {
        const productIds = items.map(item => item.product_id);
        const response = await apiService.getPaginatedProducts(1, 30, productIds);
        
        if (!isMounted.current) return;
        
        if (response && response.products && Array.isArray(response.products)) {
          const formattedProducts = response.products.map((item: any) => {
            const itemIdWithoutHyphens = item.id.replace(/-/g, '');
            const cartItem = items.find(i => i.product_id === itemIdWithoutHyphens);
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
              image: item.images.length > 0 ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${item.images[0].product_image}` : '/placeholder.jpg',
              quantity: quantity,
            };
          });
          
          safeSetState(setProducts, formattedProducts);
        } else {
          safeSetState(setProducts, []);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        safeSetState(setError, 'Failed to load product details');
        safeSetState(setProducts, []);
      } finally {
        safeSetState(setLoading, false);
        fetchInProgress.current = false;
      }
    };

    fetchProducts();
  }, [items]); // Only re-fetch when items array changes

  // Apply initial coupon if provided
  useEffect(() => {
    if (coupon_code_id) {
      setCouponCode(coupon_code_id);
      handleApplyCoupon();
    }
  }, [coupon_code_id]);

  const calculateSubtotal = (): number => {
    return products.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

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

  const subtotal = calculateSubtotal();
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const total = subtotal - discount;

  if (loading) {
    return <div className="py-4 text-center">Loading product details...</div>;
  }

  if (error) {
    return <div className="py-4 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="mb-6 bg-white p-4 rounded-[12px]">
      <h4 className="font-medium text-[15px] text-[#494949] mb-2">Order Summary</h4>
      
      {showCoupons ? (
        <div className="border rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h5 className="font-medium">Available Coupons</h5>
            <button 
              onClick={() => setShowCoupons(false)}
              className="text-sm text-gray-500"
            >
              Back
            </button>
          </div>
          
          <div className="space-y-3">
            <div 
              className="border rounded-lg p-3 cursor-pointer hover:border-blue-500"
              onClick={() => handleApplyCouponFromList('B1G1')}
            >
              <div className="flex justify-between">
                <div className="font-medium">B1G1</div>
                <button className="text-blue-600 text-sm">Apply</button>
              </div>
              <p className="text-sm text-gray-600">Buy 1 Get 1 Free</p>
            </div>
            
            <div 
              className="border rounded-lg p-3 cursor-pointer hover:border-blue-500"
              onClick={() => handleApplyCouponFromList('TANK')}
            >
              <div className="flex justify-between">
                <div className="font-medium">TANK</div>
                <button className="text-blue-600 text-sm">Apply</button>
              </div>
              <p className="text-sm text-gray-600">10% off on all jewelry</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-lg mb-4">
            {products.map((product) => (
              <div key={product.id} className="flex items-center gap-3 py-1">
                <div className="relative w-12 h-12 bg-gray-100 rounded-sm overflow-hidden">
                  <Image 
                    src={product.image} 
                    alt={product.name}
                    width={54}
                    height={54}
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-medium">{product.name}</p>
                    <p className="text-[11px] text-gray-500">Quantity: {product.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-medium">₹{product.price}</p>
                    {product.originalPrice && (
                      <p className="text-[11px] text-gray-500 line-through">₹{product.originalPrice}</p>
                    )}
                    {product.discount && (
                      <span className="bg-green-100 text-green-800 text-[11px] px-1.5 py-0.5 rounded">
                        {product.discount} OFF
                      </span>
                    )}
                     
                  </div>
                 
                </div>
              </div>
            ))}
            
            <div className="bg-gray-50 p-2 rounded-lg mt-4">
              {appliedCoupon ? (
                <div className="flex flex-col">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <div className="flex items-center">
                      <span className="text-sm mr-2">Coupon applied:</span>
                      <span className="font-medium text-green-600">{appliedCoupon.code}</span>
                    </div>
                    <span className="text-green-600 font-medium text-sm">-₹{appliedCoupon.discount.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{appliedCoupon.description}</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center border-b border-gray-200 pb-2">
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
                  
                  <div className="flex justify-between mt-1">
                    <button
                      className="text-[#175e7a] font-medium text-[12px] flex items-center"
                      onClick={handleViewCoupons}
                    >
                      View Coupons <ChevronRight size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="py-4 px-2">
            <div className="space-y-2">
              <div className="flex justify-between text-[13px]">
                <span className='text-gray-500'>Subtotal</span>
                <span className='font-semibold'>₹{subtotal.toFixed(2)}</span>
              </div>
              
              {appliedCoupon && (
                <div className="flex justify-between text-[13px] text-green-600">
                  <span>Discount ({appliedCoupon.description})</span>
                  <span className='font-semibold'>-₹{appliedCoupon.discount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-[16px] pt-2 border-t border-gray-300">
                <span className="text-gray-500">Total</span>
                <span className="font-semibold">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProductSummary;