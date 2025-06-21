// src/components/ProductSummary.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import apiService from '@/utils/api/apiService';
import OfferCartItem from './OfferCartItem'; 
// Import the specific cart item types from your context
import { CartNormalItem, CartOfferItem, ProductItemDetails } from '@/context/cartContext'; 

interface CouponType {
  code: string;
  description: string;
  discount: number;
}

interface ProductSummaryProps {
  normalItems: CartNormalItem[]; // Now receives CartNormalItem[]
  offerSets: CartOfferItem[]; // Now receives CartOfferItem[] (already structured and enriched)
  coupon_code_id?: string;
}

const ProductSummary: React.FC<ProductSummaryProps> = ({ normalItems, offerSets = [], coupon_code_id }) => {
  const [productsForDisplay, setProductsForDisplay] = useState<any[]>([]); // For normal items summary
  // offerSets is already enriched, so no need for offerSetsWithOffer state here
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState(coupon_code_id || '');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponType | null>(null);
  const [showCoupons, setShowCoupons] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const formatItemsForDisplay = () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('ProductSummary: Starting formatting with normalItems:', normalItems, 'offerSets:', offerSets);
        
        // Normal items are already enriched from CartDrawer/cartService, just map for display
        const mappedNormalProducts = normalItems.map(item => ({
          id: item.id,
          name: item.product_name,
          price: parseFloat(item.product_price),
          originalPrice: item.strike_price !== '0.00' ? parseFloat(item.strike_price) : undefined,
          discount: item.strike_price !== '0.00' 
            ? `${Math.round(((parseFloat(item.strike_price) - parseFloat(item.product_price)) / 
              parseFloat(item.strike_price)) * 100)}%`
            : undefined,
          image: item.images?.[0]?.product_image 
            ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${item.images[0].product_image}`
            : '/placeholder.jpg',
          quantity: item.quantity
        }));
        
        setProductsForDisplay(mappedNormalProducts);
        
        console.log('ProductSummary: Formatted normal products:', mappedNormalProducts);
      } catch (error) {
        console.error('ProductSummary: Error formatting data:', error);
        setError('Failed to display product details');
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    formatItemsForDisplay();
  }, [normalItems, offerSets]); // Depend on both normalItems and offerSets

  // Apply initial coupon if provided
  useEffect(() => {
    if (coupon_code_id && !loading) {
      setCouponCode(coupon_code_id);
      handleApplyCoupon();
    }
  }, [coupon_code_id, loading]);

  // Helper to flatten products from an offer set for calculations
  const _getFlattenedOfferProducts = (offerSet: CartOfferItem) => {
    const allProducts: ProductItemDetails[] = [];
    if (offerSet.main_product) {
      allProducts.push(offerSet.main_product);
    }
    if (offerSet.offer_products_extra) {
      allProducts.push(...offerSet.offer_products_extra);
    }
    return allProducts;
  };

  const calculateSubtotal = (): number => {
    let total = productsForDisplay.reduce((sum, item) => sum + item.price * item.quantity, 0);

    offerSets.forEach((offerSet) => {
      const allOfferProducts = _getFlattenedOfferProducts(offerSet);

      const sortedProducts = [...allOfferProducts].sort((a, b) => 
        parseFloat(b.product_price) - parseFloat(a.product_price)
      );
      const itemsToCharge = Math.min(offerSet.buy_count || 1, sortedProducts.length);
      total += sortedProducts
        .slice(0, itemsToCharge)
        .reduce((sum, product) => sum + parseFloat(product.product_price), 0);
    });

    return total;
  };

  const calculateOfferSavings = (): number => {
    let savings = 0;
    offerSets.forEach((offerSet) => {
      const allOfferProducts = _getFlattenedOfferProducts(offerSet);

      const sortedProducts = [...allOfferProducts].sort((a, b) => 
        parseFloat(b.product_price) - parseFloat(a.product_price)
      );
      const itemsToCharge = Math.min(offerSet.buy_count || 1, sortedProducts.length);
      savings += sortedProducts
        .slice(itemsToCharge)
        .reduce((sum, product) => sum + parseFloat(product.product_price), 0);
    });
    return savings;
  };

  const handleApplyCoupon = (): void => {
    const subtotal = calculateSubtotal();
    const coupon = couponCode.toUpperCase();
    
    if (coupon === 'B1G1') {
      setAppliedCoupon({
        code: 'B1G1',
        description: 'Buy 1 Get 1 Free',
        discount: subtotal * 0.5,
      });
    } else if (coupon === 'TANK') {
      setAppliedCoupon({
        code: 'TANK',
        description: '10% off on all jewelry',
        discount: subtotal * 0.1,
      });
    } else {
      setAppliedCoupon(null);
    }
    setShowCoupons(false);
  };

  // This handleRemoveOfferSet is for local UI update only, CartDrawer handles API call
  const handleRemoveOfferSet = async (setId: string) => {
    // This component does not directly remove from cart, it just displays summary.
    // The actual removal logic is in CartDrawer.
    console.warn("ProductSummary: handleRemoveOfferSet called, but actual removal should be done by CartDrawer's dispatch.");
    // To update the display locally if needed, one might filter `offerSets` prop,
    // but typically the parent `CartDrawer` would re-render.
  };

  const subtotal = calculateSubtotal();
  const offerSavings = calculateOfferSavings();
  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  const total = subtotal - couponDiscount; // Assuming coupon applies after offer savings

  if (loading) return <div className="py-4 text-center">Loading product details...</div>;
  if (error) return <div className="py-4 text-center text-red-500">{error}</div>;

  return (
    <div className="mb-6 bg-white p-4 rounded-[12px]">
      <h4 className="font-medium text-[15px] text-[#494949] mb-2">Order Summary</h4>

      {showCoupons ? (
        <div className="border rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h5 className="font-medium">Available Coupons</h5>
            <button onClick={() => setShowCoupons(false)} className="text-sm text-gray-500">
              Back
            </button>
          </div>
          <div className="space-y-3">
            {/* Coupon list goes here */}
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-lg mb-4">
            {productsForDisplay.map((product) => (
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
                    <p className="text-[11px] font-medium">₹{product.price.toLocaleString()}</p>
                    {product.originalPrice && (
                      <p className="text-[11px] text-gray-500 line-through">
                        ₹{product.originalPrice.toLocaleString()}
                      </p>
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
            {/* Render OfferCartItem for each structured offer set */}
            {offerSets.map((offerSet) => (
              <OfferCartItem
                key={offerSet.id}
                offerSet={offerSet} // Pass the structured offer set
                onRemove={undefined} // ProductSummary does not allow removal directly
                fromProductSummary={true}
              />
            ))}
          </div>
          <div className="py-4 px-2">
            <div className="space-y-2">
              <div className="flex justify-between text-[13px]">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>
              {offerSavings > 0 && (
                <div className="flex justify-between text-[13px] text-green-600">
                  <span>Offer Savings</span>
                  <span className="font-semibold">−₹{offerSavings.toFixed(2)}</span>
                </div>
              )}
              {appliedCoupon && (
                <div className="flex justify-between text-[13px] text-green-600">
                  <span>Discount ({appliedCoupon.description})</span>
                  <span className="font-semibold">−₹{couponDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-[16px] pt-2 border-t border-gray-200">
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