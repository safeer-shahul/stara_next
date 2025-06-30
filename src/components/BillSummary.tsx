// components/BillSummary.tsx
'use client';

import { useState, useEffect, useRef, memo } from 'react';
import apiService from '@/utils/api/apiService';
import { CartNormalItem, CartOfferItem, ProductItemDetails, ProductVariant } from '@/context/cartContext'; // Import ProductVariant

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

// Keeping this interface for clarity, though it might not be directly used with the new backend flow
interface DetailedOfferSetFromAPI {
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
}


interface APIResponse {
  items: DetailedProductFromAPI[];
  offer_sets?: DetailedOfferSetFromAPI[]; // Backend might still return this for cart mode even if not sent
  shipping_cost: number;
}

interface BillSummaryProps {
  // `normalItems` are passed for display in both modes, and for payload in 'buy_now' mode.
  normalItems: CartNormalItem[];
  // `offerSets` are passed for display and client-side savings calculation ONLY in 'cart' mode.
  offerSets: CartOfferItem[];
  
  destinationPincode: string;
  onPlaceOrder: (paymentMethod: 'Cod' | 'Razorpay', razorpayOrderId: string, staraOrderID: any) => void;
  onError: (errorMessage: string) => void;
  addressID: string | null;
  checkoutMode: 'cart' | 'buy_now'; // To differentiate payload
}

const BillSummary: React.FC<BillSummaryProps> = ({
  normalItems, // Used for displaying and for 'buy_now' payload
  offerSets = [], // Used for displaying (only in 'cart' mode for totals calculation)
  destinationPincode,
  onPlaceOrder,
  onError,
  addressID,
  checkoutMode,
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

  // Helper to "explode" quantities within an offer set into individual product units for client-side calculation.
  // This function now expects ProductItemDetails with optional selectedVariant.
  const _getIndividualOfferProducts = (offerSet: CartOfferItem): (ProductItemDetails & { quantity: number; selectedVariant?: ProductVariant })[] => {
    const allIndividualProducts: (ProductItemDetails & { quantity: number; selectedVariant?: ProductVariant })[] = [];
    offerSet.offer_items.forEach(product => {
      for (let i = 0; i < product.quantity; i++) {
        // Pass all relevant product details including selectedVariant for sorting/calculation
        allIndividualProducts.push({ ...product, quantity: 1, selectedVariant: product.selectedVariant });
      }
    });
    return allIndividualProducts;
  };


  const fetchBillDetails = async () => {
    if (fetchInProgress.current) return;
    
    if (checkoutMode === 'buy_now' && normalItems.length === 0) {
      safeSetState(setLoading, false);
      safeSetState(setError, 'No product selected for direct buy.');
      onError('No product selected for direct buy.');
      fetchInProgress.current = false;
      return;
    }
    if (checkoutMode === 'cart' && normalItems.length === 0 && offerSets.length === 0) {
      safeSetState(setLoading, false);
      safeSetState(setResponseData, null);
      safeSetState(setError, 'Your cart is empty.');
      onError('Your cart is empty.');
      fetchInProgress.current = false;
      return;
    }


    fetchInProgress.current = true;
    safeSetState(setLoading, true);
    safeSetState(setError, null);
    
    try {
      const payload: any = {
        destination_pincode: destinationPincode,
        is_cart: checkoutMode === 'cart' ? 'yes' : 'no',
      };

      if (checkoutMode === 'buy_now') {
        // For 'buy_now', payload must contain the items
        payload.items = normalItems.map((item) => ({
          product_id: item.product_id.replace(/-/g, ''),
          quantity: item.quantity,
          ...(item.selectedVariant && { variant_id: item.selectedVariant.id.replace(/-/g, '') }) // Include variant_id for direct buy
        }));
      }
      // If checkoutMode is 'cart', items and offer_sets are *omitted* from payload
      // as backend is expected to retrieve them from the user's cart on the server.

      console.log('BillSummary: getProductAmountDetailed payload:', payload);

      const response = await apiService.getProductAmountDetailed(payload);

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
    const shouldFetch = (checkoutMode === 'buy_now' && normalItems.length > 0) ||
                        (checkoutMode === 'cart' && (normalItems.length > 0 || offerSets.length > 0));

    if (shouldFetch) {
      fetchBillDetails();
    } else {
      safeSetState(setLoading, false);
      safeSetState(setResponseData, null);
      safeSetState(setError, null);
    }
  }, [normalItems, offerSets, destinationPincode, checkoutMode]);

  const handlePlaceOrder = async () => {
    if (!responseData || !addressID) return;

    safeSetState(setProcessingOrder, true);
    safeSetState(setError, null);

    try {
      const payload: any = {
        payment_mode: paymentMethod,
        address: addressID.replace(/-/g, ''),
        is_cart: checkoutMode === 'cart' ? 'yes' : 'no',
      };

      if (checkoutMode === 'buy_now') {
        payload.items = normalItems.map((item) => ({
          product_id: item.product_id.replace(/-/g, ''),
          quantity: item.quantity,
          ...(item.selectedVariant && { variant_id: item.selectedVariant.id.replace(/-/g, '') }) // Include variant_id for direct buy
        }));
      }

      console.log('BillSummary: Order creation payload:', payload);

      const response = await apiService.createProductsOrder(payload);

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

  // Calculate totals from the response data for display
  const calculateTotals = () => {
    if (!responseData) return null;

    let subtotal = 0;
    let totalDiscount = 0;
    let offerSavings = 0;

    if (responseData.items) {
      subtotal = responseData.items.reduce((sum, item) => sum + item.final_price, 0);

      const totalOriginalPriceOfIndividualItems = responseData.items.reduce((sum, item) => {
        const originalIndividualPrice = parseFloat(item.strike_price || '0') > parseFloat(item.product_price || '0') ?
                                        parseFloat(item.strike_price || '0') : parseFloat(item.product_price || '0');
        return sum + (originalIndividualPrice * item.final_quantity);
      }, 0);
      
      totalDiscount = Math.max(0, totalOriginalPriceOfIndividualItems - subtotal);
    }


    if (checkoutMode === 'cart') {
        offerSets.forEach(offerSet => {
            const allIndividualOfferProducts = _getIndividualOfferProducts(offerSet);

            const sortedProductsDesc = [...allIndividualOfferProducts].sort(
                (a, b) => parseFloat(b.product_price || '0') - parseFloat(a.product_price || '0')
            );
            const itemsToCharge = offerSet.buy_count || 0;
            let payableForThisOffer = 0;
            for (let i = 0; i < Math.min(itemsToCharge, sortedProductsDesc.length); i++) {
                payableForThisOffer += (parseFloat(sortedProductsDesc[i].product_price || '0') || 0);
            }
            
            const totalOriginalPriceOfAllUnitsInOffer = allIndividualOfferProducts.reduce((sum, p) => sum + parseFloat(p.product_price || '0'), 0);
            offerSavings += (totalOriginalPriceOfAllUnitsInOffer - payableForThisOffer);
        });
    }

    const shippingCost = responseData.shipping_cost;
    const tax = 0;

    const finalCalculatedTotal = subtotal + shippingCost + tax;

    return {
      subtotal: subtotal,
      discount: totalDiscount,
      offerSavings: offerSavings,
      shippingCost,
      tax,
      total: finalCalculatedTotal
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
            className="px-4 py-2 bg-[var(--color-primary-950)] text-white rounded hover:bg-[#0f4c67] cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : responseData && totals ? (
        <>
          <div className="bg-white rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3 pb-2">
              <h4 className="font-medium text-[15px] text-[#494949]">Price Details</h4>
              <div></div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[13px]">
                <span className='text-gray-500'>Product Subtotal</span>
                <span className='font-semibold'>₹{totals.subtotal.toFixed(2)}</span>
              </div>

              {totals.discount > 0 && (
                <div className="flex justify-between text-green-600 text-[13px]">
                  <span>Product Discounts</span>
                  <span>-₹{totals.discount.toFixed(2)}</span>
                </div>
              )}
              
              {checkoutMode === 'cart' && totals.offerSavings > 0 && (
                <div className="flex justify-between text-green-600 text-[13px]">
                  <span>Offer Savings</span>
                  <span>-₹{totals.offerSavings.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-[13px]">
                <span className='text-gray-500'>Shipping</span>
                {totals.shippingCost > 0 ? (
                  <span className='font-semibold'>₹{totals.shippingCost.toFixed(2)}</span>
                ) : (
                  <span className="text-green-600 font-semibold">Free</span>
                )}
              </div>

              {totals.tax > 0 && (
                <div className="flex justify-between text-[13px]">
                  <span className='text-gray-500'>Estimated Tax</span>
                  <span className="text-green-600 font-semibold">₹{totals.tax.toFixed(2)}</span>
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
                  paymentMethod === 'Razorpay' ? 'border-[var(--color-primary-950)] bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setPaymentMethod('Razorpay')}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  paymentMethod === 'Razorpay' ? 'border-[var(--color-primary-950)]' : 'border-gray-300'
                }`}>
                  {paymentMethod === 'Razorpay' && (
                    <div className="w-3 h-3 rounded-full bg-[var(--color-primary-950)]"></div>
                  )}
                </div>
                <div className="ml-3">
                  <p className="font-medium text-[15px]">Pay Now</p>
                  <p className="text-[11px] text-gray-500">Pay online with UPI, cards, or netbanking</p>
                </div>
              </div>

              <div
                className={`flex items-center p-3 border rounded-md cursor-pointer ${
                  paymentMethod === 'Cod' ? 'border-[var(--color-primary-950)] bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setPaymentMethod('Cod')}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  paymentMethod === 'Cod' ? 'border-[var(--color-primary-950)]' : 'border-gray-300'
                }`}>
                  {paymentMethod === 'Cod' && (
                    <div className="w-3 h-3 rounded-full bg-[var(--color-primary-950)]"></div>
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
              className="w-full bg-[var(--color-primary-950)] text-[14px] text-white font-medium py-3 rounded-md hover:bg-[#0f4c67] cursor-pointer transition-colors shadow-sm"
              onClick={handlePlaceOrder}
              disabled={processingOrder}
            >
              {processingOrder ? 'Processing...' : paymentMethod === 'Cod' ? 'Place Order (COD)' : 'Proceed to Payment'}
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

export default memo(BillSummary);