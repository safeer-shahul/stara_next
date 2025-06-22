'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import apiService from '@/utils/api/apiService';
import OfferCartItem from './OfferCartItem'; 
import { CartNormalItem, CartOfferItem, ProductItemDetails } from '@/context/cartContext'; 
import { v4 as uuidv4 } from 'uuid';

interface CouponType {
  code: string;
  description: string;
  discount: number;
}

interface ProductSummaryProps {
  normalItems: CartNormalItem[]; 
  offerSets: CartOfferItem[]; 
  coupon_code_id?: string;
}

const ProductSummary: React.FC<ProductSummaryProps> = ({ normalItems, offerSets = [], coupon_code_id }) => {
  const [productsForDisplay, setProductsForDisplay] = useState<any[]>([]); 
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
  }, [normalItems, offerSets]); 

  useEffect(() => {
    if (coupon_code_id && !loading) {
      setCouponCode(coupon_code_id);
      handleApplyCoupon();
    }
  }, [coupon_code_id, loading]);

  const _getIndividualOfferProducts = (offerSet: CartOfferItem): ProductItemDetails[] => {
    const allIndividualProducts: ProductItemDetails[] = [];
    offerSet.offer_items.forEach(product => {
      for (let i = 0; i < product.quantity; i++) {
        allIndividualProducts.push({ ...product, quantity: 1 }); 
      }
    });
    return allIndividualProducts;
  };

  const calculateSubtotal = (): number => {
    let total = productsForDisplay.reduce((sum, item) => sum + item.price * item.quantity, 0);

    offerSets.forEach((offerSet) => {
      const allIndividualOfferProducts = _getIndividualOfferProducts(offerSet);

      const sortedProductsDesc = [...allIndividualOfferProducts].sort((a, b) => 
        parseFloat(b.product_price) - parseFloat(a.product_price)
      );
      
      const itemsToCharge = Math.min(offerSet.buy_count || 0, sortedProductsDesc.length);
      for (let i = 0; i < itemsToCharge; i++) {
          total += parseFloat(sortedProductsDesc[i].product_price);
      }
    });

    return total;
  };

  const calculateOfferSavings = (): number => {
    let totalSavings = 0;
    offerSets.forEach((offerSet) => {
      const allIndividualOfferProducts = _getIndividualOfferProducts(offerSet);

      const totalOriginalPriceOfAllUnits = allIndividualOfferProducts.reduce((sum, p) => sum + parseFloat(p.product_price || '0'), 0);

      const sortedProductsDesc = [...allIndividualOfferProducts].sort(
        (a: ProductItemDetails, b: ProductItemDetails) => (parseFloat(b.product_price || '0') || 0) - (parseFloat(a.product_price || '0') || 0)
      );
      const itemsToCharge = offerSet.buy_count || 0;
      let payableForThisOffer = 0;
      for (let i = 0; i < Math.min(itemsToCharge, sortedProductsDesc.length); i++) {
        payableForThisOffer += (parseFloat(sortedProductsDesc[i].product_price || '0') || 0);
      }
      
      totalSavings += (totalOriginalPriceOfAllUnits - payableForThisOffer);
    });
    return totalSavings;
  };

  const handleApplyCoupon = (): void => {
    const currentSubtotal = calculateSubtotal(); 

    const coupon = couponCode.toUpperCase();
    
    if (coupon === 'B1G1') {
      setAppliedCoupon({
        code: 'B1G1',
        description: 'Buy 1 Get 1 Free',
        discount: currentSubtotal * 0.5, 
      });
    } else if (coupon === 'TANK') {
      setAppliedCoupon({
        code: 'TANK',
        description: '10% off on all jewelry',
        discount: currentSubtotal * 0.1,
      });
    } else {
      setAppliedCoupon(null);
    }
    setShowCoupons(false);
  };

  const subtotal = calculateSubtotal();
  const offerSavings = calculateOfferSavings();
  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  const finalTotal = subtotal - offerSavings - couponDiscount; 

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
            {offerSets.map((offerSet) => (
              <OfferCartItem
                key={offerSet.id ?? `offer-${uuidv4()}`} // Use offerSet.id for key, fallback to uuidv4
                offerSet={offerSet} 
                onRemove={undefined} 
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
                <span className="font-semibold">₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProductSummary;