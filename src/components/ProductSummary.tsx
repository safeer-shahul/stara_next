'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        if (items.length === 0) {
          setProducts([]);
          return;
        }

        const productIds = items.map(item => item.product_id);
        const response = await apiService.getPaginatedProducts(1, 30, productIds);
        
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
          
          setProducts(formattedProducts);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Failed to load product details');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [items]);

  // Apply initial coupon if provided
  useEffect(() => {
    if (coupon_code_id) {
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
    <div className="mb-6">
      <h4 className="font-medium mb-3">Order Summary</h4>
      
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
          <div className="border rounded-lg p-4 mb-4">
            {products.map((product) => (
              <div key={product.id} className="flex items-center gap-3 py-2 border-b last:border-b-0">
                <div className="relative w-16 h-16 bg-gray-100 rounded overflow-hidden">
                  <Image 
                    src={product.image} 
                    alt={product.name}
                    width={64}
                    height={64}
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{product.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">₹{product.price}</p>
                    {product.originalPrice && (
                      <p className="text-xs text-gray-500 line-through">₹{product.originalPrice}</p>
                    )}
                    {product.discount && (
                      <span className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded">
                        {product.discount} OFF
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">Quantity: {product.quantity}</p>
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
          
          <div className="border rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              
              {appliedCoupon && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({appliedCoupon.description})</span>
                  <span>-₹{appliedCoupon.discount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="font-medium">Total</span>
                <span className="font-medium">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProductSummary;