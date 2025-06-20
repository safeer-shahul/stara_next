'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import apiService from '@/utils/api/apiService';
import OfferCartItem from './OfferCartItem';

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
  offer_sets?: Array<{
    id: string;
    offer: string;
    offer_products: string[];
    buy_count: number;
    get_count: number;
  }>;
}

const ProductSummary: React.FC<ProductSummaryProps> = ({ items, coupon_code_id, offer_sets = [] }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [offerSetsWithOffer, setOfferSetsWithOffer] = useState<any[]>([]);
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
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Starting fetchData with items:', items, 'offer_sets:', offer_sets);
        
        // 1. Fetch regular products
        const productIds = items.map(item => item.product_id);
        console.log('Product IDs to fetch:', productIds);
        
        if (productIds.length > 0) {
          console.log('Fetching regular products...');
          const response = await apiService.getPaginatedProducts(1, 30, productIds);
          console.log('Products response:', response);
          
          if (response?.products) {
            const mappedProducts = response.products.map((product: { id: string; product_name: any; product_price: string; strike_price: string; images: { product_image: any; }[]; }) => ({
              id: product.id,
              name: product.product_name,
              price: parseFloat(product.product_price),
              originalPrice: product.strike_price !== '0.00' ? parseFloat(product.strike_price) : undefined,
              discount: product.strike_price !== '0.00' 
                ? `${Math.round(((parseFloat(product.strike_price) - parseFloat(product.product_price)) / 
                  parseFloat(product.strike_price)) * 100)}%`
                : undefined,
              image: product.images?.[0]?.product_image 
                ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${product.images[0].product_image}`
                : '/placeholder.jpg',
              quantity: items.find(i => i.product_id === product.id)?.quantity || 1
            }));
            console.log('Mapped products:', mappedProducts);
            setProducts(mappedProducts);
          }
        }

        // 2. Process offer sets
        if (offer_sets.length > 0) {
          console.log('Processing offer sets...');
          // Get all unique product IDs from offers
          const offerProductIds = [...new Set(offer_sets.flatMap(set => set.offer_products))];
          console.log('Offer product IDs:', offerProductIds);
          
          // Fetch all offer products
          const productsResponse = await apiService.getPaginatedProducts(1, 30, offerProductIds);
          const validProducts = productsResponse?.products || [];
          console.log('Offer products response:', validProducts);

          // Fetch offer details
          const offersResponse = await apiService.getValidOffers();
          const validOffers = offersResponse?.data || [];
          console.log('Offers response:', validOffers);

          const formattedOfferSets = offer_sets.map(set => {
            const offer = validOffers.find((o: { id: string; }) => o.id === set.offer);
            const offerProducts = set.offer_products
              .map(productId => {
                const product = validProducts.find((p: { id: string; }) => p.id === productId);
                return product ? {
                  id: product.id,
                  product_name: product.product_name,
                  product_price: product.product_price,
                  images: product.images || []
                } : null;
              })
              .filter(Boolean);

            return {
              id: set.id,
              offer: set.offer,
              offer_name: offer || { id: set.offer, offer_name: 'Special Offer' },
              offer_products: offerProducts,
              buy_count: set.buy_count,
              get_count: set.get_count
            };
          });

          console.log('Formatted offer sets:', formattedOfferSets);
          setOfferSetsWithOffer(formattedOfferSets);
        }
        
        console.log('fetchData completed successfully');
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load product details');
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    };

    fetchData();
  }, [items, offer_sets]);

  // Apply initial coupon if provided
  useEffect(() => {
    if (coupon_code_id && !loading) {
      setCouponCode(coupon_code_id);
      handleApplyCoupon();
    }
  }, [coupon_code_id, loading]);

  const calculateSubtotal = (): number => {
    let total = products.reduce((sum, item) => sum + item.price * item.quantity, 0);

    offerSetsWithOffer.forEach((offerSet) => {
      const sortedProducts = [...offerSet.offer_products].sort((a, b) => 
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
    offerSetsWithOffer.forEach((offerSet) => {
      const sortedProducts = [...offerSet.offer_products].sort((a, b) => 
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

  const handleRemoveOfferSet = async (setId: string) => {
    try {
      await apiService.addToCart({
        item_id: setId.replace(/-/g, ''),
        mode: 'delete'
      });
      // Update local state
      setOfferSetsWithOffer(prev => prev.filter(set => set.id !== setId));
      // Update local storage
      const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]')
        .filter((item: any) => item.id !== setId || item.type !== 'offer');
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error removing offer set:', error);
    }
  };

  const subtotal = calculateSubtotal();
  const offerSavings = calculateOfferSavings();
  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  const total = subtotal - couponDiscount;

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
            {/* <div className="border rounded-lg p-3 cursor-pointer hover:border-blue-500" onClick={() => handleApplyCouponFromList('B1G1')}>
              <div className="flex justify-between">
                <div className="font-medium">B1G1</div>
                <button className="text-blue-600 text-sm">Apply</button>
              </div>
              <p className="text-sm text-gray-600">Buy 1 Get 1 Free</</p>
            </div> */}
            {/* <div className="border rounded-lg p-3 cursor-pointer hover:border-blue-500" onClick={() => handleApplyCouponFromList('TANK')}>
              <div className="flex justify-between">
                <div className="font-medium">TANK</div>
                <button className="text-blue-600 text-sm">Apply</button>
              </div>
              <p className="text-sm text-gray-600">10% off on all jewelry</p>
            </div> */}
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
            {offerSetsWithOffer.map((offerSet) => (
              <OfferCartItem
                key={offerSet.id}
                offerSet={offerSet}
                onRemove={handleRemoveOfferSet}
                fromProductSummary={true}
              />
            ))}
            {/* <div className="bg-gray-50 p-2 rounded-lg mt-4">
              {appliedCoupon ? (
                <div className="flex flex-col">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <div className="flex items-center">
                      <span className="text-sm mr-2">Coupon applied:</span>
                      <span className="font-medium text-green-600">{appliedCoupon.code}</span>
                    </div>
                    <span className="text-green-600 font-medium text-sm">
                      -₹{appliedCoupon.discount.toFixed(2)}
                    </span>
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
                      onClick={() => setShowCoupons(true)}
                    >
                      View Coupons <ChevronRight size={16} />
                    </button>
                  </div>
                </>
              )}
            </div> */}
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