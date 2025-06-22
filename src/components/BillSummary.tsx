// src/components/BillSummary.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import apiService from '@/utils/api/apiService';
// Import the specific cart item types from your context
import { CartNormalItem, CartOfferItem, ProductItemDetails } from '@/context/cartContext'; 

// Define the expected structure from the getProductAmountDetailed API response
interface DetailedProductFromAPI {
  id: string;
  product_name: string;
  product_price: string;
  strike_price: string;
  final_price: number; // Final price after all applicable discounts (per item)
  final_quantity: number; // Quantity the backend is calculating for this item
  images: Array<{
    id: string;
    product_image: string;
    product: string;
  }>;
}

interface DetailedOfferSetFromAPI {
  id: string; // The cart item ID for the offer set
  offer: string; // The offer UUID
  offer_products: Array<{ // This is a flattened list of products within the offer from API after calculation
    id: string; // Product UUID
    product_name: string;
    product_price: string;
    final_price: number; // Final price of this specific product in the offer
    images: { product_image: string }[];
  }>;
  buy_count: number;
  get_count: number;
}

interface APIResponse {
  items: DetailedProductFromAPI[]; // Normal products
  offer_sets?: DetailedOfferSetFromAPI[]; // Offer sets
  shipping_cost: number;
  // If your API returns total discounts, final total etc., include them here
  // Otherwise, these values are calculated client-side based on the items and shipping_cost.
}

interface BillSummaryProps {
  normalItems: CartNormalItem[]; // FIX: Now receives CartNormalItem[]
  offerSets: CartOfferItem[]; // FIX: Now receives CartOfferItem[] (already structured and enriched)
  couponCode?: string;
  destinationPincode: string;
  onPlaceOrder: (paymentMethod: 'Cod' | 'Razorpay', razorpayOrderId: string, staraOrderID: any) => void;
  onError: (errorMessage: string) => void;
  addressID: string | null;
}

const BillSummary: React.FC<BillSummaryProps> = ({
  normalItems,
  offerSets = [],
  couponCode,
  destinationPincode,
  onPlaceOrder,
  onError,
  addressID,
}) => {
  const [loading, setLoading] = useState(true);
  const [responseData, setResponseData] = useState<APIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cod' | 'Razorpay'>('Razorpay');
  const isMounted = useRef(true);
  const fetchInProgress = useRef(false);

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

  // Helper to format structured CartOfferItem into backend's expected flat format
  const formatOfferSetsForBackend = (sets: CartOfferItem[]) => {
    return sets.map((set) => {
      const flattenedProducts: { product: string; quantity: number }[] = [];
      // Iterate over the consolidated offer_items to reconstruct the backend's expected flat list
      set.offer_items.forEach(p => {
        flattenedProducts.push({ product: p.id.replace(/-/g, ''), quantity: p.quantity || 1 });
      });

      return {
        id: set?.id?.replace(/-/g, ''), // Cart item ID for the offer set
        offer: set.offer.replace(/-/g, ''), // Original offer ID
        offer_products: flattenedProducts, // Array of { product_id, quantity }
        buy_count: set.buy_count, // Still pass buy_count from frontend for backend validation/logic
        get_count: set.get_count, // Still pass get_count from frontend for backend validation/logic
      };
    });
  };

  const fetchBillDetails = async () => {
    if (fetchInProgress.current) return;

    fetchInProgress.current = true;
    safeSetState(setLoading, true);
    safeSetState(setError, null);

    try {
      // FIX: Format offer sets from the new structured format to backend's expected format
      const formattedOfferSets = formatOfferSetsForBackend(offerSets);
      console.log('BillSummary: Formatted offer sets for API:', formattedOfferSets);

      const response = await apiService.getProductAmountDetailed({
        coupon_code_id: couponCode,
        items: normalItems.map((item) => ({
          product_id: item.product_id.replace(/-/g, ''),
          quantity: item.quantity,
        })),
        offer_sets: formattedOfferSets, // Pass the flattened format
        destination_pincode: destinationPincode,
      });

      if (!isMounted.current) return;

      console.log('BillSummary: Bill details response:', response);
      if (response) {
        safeSetState(setResponseData, response);
      } else {
        const errorMsg = 'Failed to retrieve billing details';
        safeSetState(setError, errorMsg);
        onError(errorMsg);
      }
    } catch (error) {
      console.error('BillSummary: Error fetching bill details:', error);
      const errorMsg = 'An error occurred while calculating your order total';
      if (isMounted.current) {
        safeSetState(setError, errorMsg);
        onError(errorMsg);
      }
    } finally {
      if (isMounted.current) {
        safeSetState(setLoading, false);
      }
      fetchInProgress.current = false;
    }
  };

  useEffect(() => {
    // Only fetch if cart items are present or if a coupon code is applied (for re-calculation)
    if (normalItems.length > 0 || offerSets.length > 0 || couponCode) {
      fetchBillDetails();
    } else {
        // If cart is empty, set loading to false and clear any previous data/errors
        safeSetState(setLoading, false);
        safeSetState(setResponseData, null);
        safeSetState(setError, null);
    }
  }, [normalItems, offerSets, couponCode, destinationPincode]); // Depend on normalItems and offerSets

  const handlePlaceOrder = async () => {
    if (!responseData || !addressID) return;

    safeSetState(setProcessingOrder, true);
    safeSetState(setError, null);

    try {
      // FIX: Format offer sets from the new structured format to backend's expected format
      const formattedOfferSets = formatOfferSetsForBackend(offerSets);

      const response = await apiService.createProductsOrder({
        items: normalItems.map((item) => ({
          product_id: item.product_id.replace(/-/g, ''),
          quantity: item.quantity,
        })),
        offer_sets: formattedOfferSets, // Pass the flattened format
        payment_mode: paymentMethod,
        address: addressID.replace(/-/g, ''),
      });

      console.log('BillSummary: Order creation response:', response);

      if (response && response.razorpay_order_id) {
        onPlaceOrder(paymentMethod, response.razorpay_order_id, response.order_details.order_id);
      } else {
        throw new Error('Invalid order response');
      }
    } catch (error) {
      console.error('BillSummary: Error placing order:', error);
      const errorMsg = 'Failed to place your order. Please try again.';
      safeSetState(setError, errorMsg);
      onError(errorMsg);
    } finally {
      safeSetState(setProcessingOrder, false);
    }
  };

  // Helper to "explode" quantities within an offer set into individual product units for calculation (client-side)
  const _getIndividualOfferProducts = (offerSet: CartOfferItem): ProductItemDetails[] => {
    const allIndividualProducts: ProductItemDetails[] = [];
    offerSet.offer_items.forEach(product => {
      for (let i = 0; i < product.quantity; i++) {
        allIndividualProducts.push({ ...product, quantity: 1 }); // Create a new object for each individual unit
      }
    });
    return allIndividualProducts;
  };

  const calculateTotals = () => {
    if (!responseData) return null;

    // Calculate sum of original prices for all items (normal and offers)
    let totalOriginalPrice = 0;
    responseData.items.forEach(item => {
        totalOriginalPrice += parseFloat(item.product_price) * item.final_quantity;
    });

    // Calculate savings from offer sets based on the refined logic
    let offerSavings = 0;
    offerSets.forEach(offerSet => {
        const allIndividualOfferProducts = _getIndividualOfferProducts(offerSet);

        // Sort products by price in descending order to identify paid items
        const sortedProductsDesc = [...allIndividualOfferProducts].sort(
            (a, b) => parseFloat(b.product_price) - parseFloat(a.product_price)
        );
        const itemsToCharge = Math.min(offerSet.buy_count || 0, sortedProductsDesc.length);
        let payableForThisOffer = 0;
        for (let i = 0; i < itemsToCharge; i++) {
            payableForThisOffer += parseFloat(sortedProductsDesc[i].product_price);
        }

        const totalOriginalPriceOfAllUnitsInOffer = allIndividualOfferProducts.reduce((sum, p) => sum + parseFloat(p.product_price), 0);
        offerSavings += (totalOriginalPriceOfAllUnitsInOffer - payableForThisOffer);

        // Add original price of all items in this offer set to totalOriginalPrice
        allIndividualOfferProducts.forEach(p => {
            totalOriginalPrice += parseFloat(p.product_price) * (p.quantity || 1); // Add original price * quantity
        });
    });

    // Recalculate total discount (normal item discounts + offer savings)
    let totalDiscount = 0;
    responseData.items.forEach(item => {
        totalDiscount += (parseFloat(item.product_price) * item.final_quantity) - item.final_price;
    });
    totalDiscount += offerSavings; // Add offer savings from our `calculateOfferSavings`

    const shippingCost = responseData.shipping_cost;
    const tax = 0; // Assuming no tax returned from backend yet or always zero

    // Final Total = (Sum of original prices) - (Total discounts from normal items + total offer savings) + Shipping + Tax
    const finalTotal = totalOriginalPrice - totalDiscount + shippingCost + tax;


    return {
      subtotal: totalOriginalPrice, // This is now total original price before any discounts
      discount: totalDiscount,     // Total discount from product markdowns and offers
      offerSavings: offerSavings,  // Separate display for offer savings
      shippingCost,
      tax,
      total: finalTotal,
    };
  };

  const totals = calculateTotals();

  return (
    <div>
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-[#175e7a] rounded-full animate-spin mb-4"></div>
          <p className="ml-3">Calculating order total...</p>
        </div>
      ) : error ? (
        <div className="text-center py-6">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchBillDetails}
            className="px-4 py-2 bg-[#175e7a] text-white rounded hover:bg-[#0f4c67] cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : responseData && totals ? (
        <>
          <div className="bg-white rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3 pb-2">
              <h4 className="font-medium text-[15px] text-[#494949]">Price Details</h4>
              <div></div> {/* Empty div for flex alignment */}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[13px]">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-semibold">₹{totals.subtotal.toFixed(2)}</span>
              </div>

              {/* Display total discount including offer savings, now accurately calculated */}
              {totals.discount > 0 && ( 
                <div className="flex justify-between text-green-600 text-[13px]">
                  <span>Discount{couponCode ? ` (${couponCode})` : ''}</span>
                  <span>-₹{(totals.discount).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-[13px]">
                <span className="text-gray-500">Shipping</span>
                {totals.shippingCost > 0 ? (
                  <span className="font-semibold">₹{totals.shippingCost.toFixed(2)}</span>
                ) : (
                  <span className="text-green-600 font-semibold">Free</span>
                )}
              </div>

              {totals.tax > 0 && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-gray-500">Estimated Tax</span>
                  <span className="font-semibold">₹{totals.tax.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between font-medium pt-2 mt-2 border-t border-gray-300">
                <span className="text-gray-500">Order Total</span>
                <span className="font-semibold">₹{totals.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 mb-4">
            <h4 className="font-medium mb-3 text-[15px] text-[#494949] pb-2">Payment Method</h4>

            <div className="space-y-3">
              <div
                className={`flex items-center p-3 border rounded-md cursor-pointer ${
                  paymentMethod === 'Razorpay' ? 'border-[#175e7a] bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setPaymentMethod('Razorpay')}
              >
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    paymentMethod === 'Razorpay' ? 'border-[#175e7a]' : 'border-gray-300'
                  }`}
                >
                  {paymentMethod === 'Razorpay' && (
                    <div className="w-3 h-3 rounded-full bg-[#175e7a]"></div>
                  )}
                </div>
                <div className="ml-3">
                  <p className="font-medium text-[15px]">Pay Now</p>
                  <p className="text-[11px] text-gray-500">Pay online with UPI, cards, or netbanking</p>
                </div>
              </div>

              <div
                className={`flex items-center p-3 border rounded-md cursor-pointer ${
                  paymentMethod === 'Cod' ? 'border-[#175e7a] bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setPaymentMethod('Cod')}
              >
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    paymentMethod === 'Cod' ? 'border-[#175e7a]' : 'border-gray-300'
                  }`}
                >
                  {paymentMethod === 'Cod' && (
                    <div className="w-3 h-3 rounded-full bg-[#175e7a]"></div>
                  )}
                </div>
                <div className="ml-3">
                  <p className="font-medium text-[15px]">Cash on Delivery</p>
                  <p className="text-[11px] text-gray-500">Pay with cash when your order arrives</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              className="w-full bg-[#175e7a] text-[14px] text-white font-medium py-3 rounded-md hover:bg-[#0f4c67] cursor-pointer transition-colors shadow-sm"
              onClick={handlePlaceOrder}
              disabled={processingOrder}
            >
              {processingOrder
                ? 'Processing...'
                : paymentMethod === 'Cod'
                ? 'Place Order (COD)'
                : 'Proceed to Payment'}
            </button>
            <p className="text-center text-[11px] text-gray-500 mt-2">
              By placing your order, you agree to our terms and conditions.
            </p>
          </div>
        </>
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-500">No order details available</p>
        </div>
      )}
    </div>
  );
};

export default BillSummary;
