'use client';

import { useState, useEffect, useRef } from 'react';
import apiService from '@/utils/api/apiService';

interface Product {
  id: string;
  product_name: string;
  product_price: string;
  strike_price: string;
  final_price: number;
  final_quantity: number;
  images: Array<{
    id: string;
    product_image: string;
    product: string;
  }>;
}

interface OfferSet {
  id: string;
  offer: string;
  offer_products: string[];
  buy_count: number;
  get_count: number;
}

interface APIResponse {
  items: Product[];
  offer_sets?: Array<{
    id: string;
    offer: string;
    offer_products: Array<{
      id: string;
      product_name: string;
      product_price: string;
      final_price: number;
      images: { product_image: string }[];
    }>;
    buy_count: number;
    get_count: number;
  }>;
  shipping_cost: number;
}

interface BillSummaryProps {
  orderItems: Array<{
    product_id: string;
    quantity: number;
  }>;
  couponCode?: string;
  destinationPincode: string;
  onPlaceOrder: (paymentMethod: 'Cod' | 'Razorpay', razorpayOrderId: string, staraOrderID: any) => void;
  onError: (errorMessage: string) => void;
  addressID: string | null;
  offer_sets?: OfferSet[];
}

const BillSummary: React.FC<BillSummaryProps> = ({
  orderItems,
  couponCode,
  destinationPincode,
  onPlaceOrder,
  onError,
  addressID,
  offer_sets = [],
}) => {
  const [loading, setLoading] = useState(true);
  const [responseData, setResponseData] = useState<APIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cod' | 'Razorpay'>('Razorpay');
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

  const fetchBillDetails = async () => {
    if (fetchInProgress.current) return;

    fetchInProgress.current = true;
    safeSetState(setLoading, true);
    safeSetState(setError, null);

    try {
      console.log(offer_sets, "offer_sets formattedOfferSets");
      const formattedOfferSets = offer_sets.map((set) => ({
        id: set.id.replace(/-/g, ''),
        offer: set.offer.replace(/-/g, ''),
        offer_products: set.offer_products.map((product) => product.replace(/-/g, '')), // Fix here
        buy_count: set.buy_count,
        get_count: set.get_count,
      }));

      const response = await apiService.getProductAmountDetailed({
        coupon_code_id: couponCode,
        items: orderItems.map((item) => ({
          product_id: item.product_id.replace(/-/g, ''),
          quantity: item.quantity,
        })),
        offer_sets: formattedOfferSets,
        destination_pincode: destinationPincode,
      });

      if (!isMounted.current) return;

      console.log('Bill details:', response);
      if (response) {
        safeSetState(setResponseData, response);
      } else {
        const errorMsg = 'Failed to retrieve billing details';
        safeSetState(setError, errorMsg);
        onError(errorMsg);
      }
    } catch (error) {
      console.error('Error fetching bill details:', error);
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

  // Fetch bill details when component mounts or inputs change
  useEffect(() => {
    fetchBillDetails();
  }, [orderItems, couponCode, destinationPincode, offer_sets]);

  const handlePlaceOrder = async () => {
    if (!responseData || !addressID) return;

    safeSetState(setProcessingOrder, true);
    safeSetState(setError, null);

    try {
      const formattedOfferSets = offer_sets.map((set) => ({
        id: set.id.replace(/-/g, ''),
        offer: set.offer.replace(/-/g, ''),
        offer_products: set.offer_products.map((product) => product.replace(/-/g, '')), // Fix here
        buy_count: set.buy_count,
        get_count: set.get_count,
      }));

      const response = await apiService.createProductsOrder({
        items: orderItems.map((item) => ({
          product_id: item.product_id.replace(/-/g, ''),
          quantity: item.quantity,
        })),
        offer_sets: formattedOfferSets,
        payment_mode: paymentMethod,
        address: addressID.replace(/-/g, ''),
      });

      console.log('Order creation response:', response);

      if (response && response.razorpay_order_id) {
        onPlaceOrder(paymentMethod, response.razorpay_order_id, response.order_details.order_id);
      } else {
        throw new Error('Invalid order response');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      const errorMsg = 'Failed to place your order. Please try again.';
      safeSetState(setError, errorMsg);
      onError(errorMsg);
    } finally {
      safeSetState(setProcessingOrder, false);
    }
  };

  // Calculate totals from the response data
  const calculateTotals = () => {
    if (!responseData) return null;

    // Subtotal for normal products
    const subtotalNormal = responseData.items.reduce((sum, item) => sum + item.final_price, 0);

    // Subtotal and savings for offer sets
    let subtotalOffers = 0;
    let offerSavings = 0;
    if (responseData.offer_sets) {
      responseData.offer_sets.forEach((offerSet) => {
        const sortedProducts = offerSet.offer_products.sort(
          (a, b) => parseFloat(b.product_price) - parseFloat(a.product_price)
        );
        const itemsToCharge = Math.min(offerSet.buy_count, sortedProducts.length);
        subtotalOffers += sortedProducts
          .slice(0, itemsToCharge)
          .reduce((sum, product) => sum + product.final_price, 0);
        offerSavings += sortedProducts
          .slice(itemsToCharge)
          .reduce((sum, product) => sum + parseFloat(product.product_price), 0);
      });
    }

    const subtotal = subtotalNormal + subtotalOffers;
    const shippingCost = responseData.shipping_cost;
    const total = subtotal + shippingCost;

    // Calculate total discount (difference between original price and final price for normal products)
    const totalOriginalPriceNormal = responseData.items.reduce((sum, item) => {
      const itemPrice = parseFloat(item.product_price) * item.final_quantity;
      return sum + itemPrice;
    }, 0);

    const discountNormal = Math.max(0, totalOriginalPriceNormal - subtotalNormal);
    const totalDiscount = discountNormal + offerSavings;

    return {
      subtotal,
      discount: totalDiscount,
      offerSavings,
      shippingCost,
      tax: 0, // If tax is not provided in the API response
      total,
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

              {totals.discount > 0 && (
                <div className="flex justify-between text-green-600 text-[13px]">
                  <span>Discount{couponCode ? ` (${couponCode})` : ''}</span>
                  <span>-₹{(totals.discount - totals.offerSavings).toFixed(2)}</span>
                </div>
              )}

              {totals.offerSavings > 0 && (
                <div className="flex justify-between text-green-600 text-[13px]">
                  <span>Offer Savings</span>
                  <span>-₹{totals.offerSavings.toFixed(2)}</span>
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