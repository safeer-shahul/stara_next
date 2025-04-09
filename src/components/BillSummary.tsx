'use client';

import { useState, useEffect } from 'react';
import apiService from '@/utils/api/apiService';
import { ArrowLeft } from 'lucide-react';

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

interface APIResponse {
  items: Product[];
  shipping_cost: number;
}

const BillSummary: React.FC<any> = ({
  orderItems,
  couponCode,
  destinationPincode,
  onPlaceOrder,
  onError,
  onBack
}) => {
  const [loading, setLoading] = useState(true);
  const [responseData, setResponseData] = useState<APIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('online');

  useEffect(() => {
    fetchBillDetails();
  }, [orderItems, couponCode, destinationPincode]);

  const fetchBillDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getProductAmountDetailed({
        coupon_code_id: couponCode,
        items: orderItems,
        destination_pincode: destinationPincode
      });
      
      console.log(response, 'bill details');
      if (response) {
        setResponseData(response);
      } else {
        setError('Failed to retrieve billing details');
        onError('Failed to retrieve billing details');
      }
    } catch (error) {
      console.error('Error fetching bill details:', error);
      setError('An error occurred while calculating your order total');
      onError('An error occurred while calculating your order total');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!responseData) return;
    
    setProcessingOrder(true);
    setError(null);
    
    try {
      // Notify parent component to handle the order placement
      onPlaceOrder(paymentMethod);
    } catch (error) {
      console.error('Error placing order:', error);
      setError('Failed to place your order. Please try again.');
      onError('Failed to place your order. Please try again.');
    } finally {
      setProcessingOrder(false);
    }
  };

  // Calculate totals from the response data
  const calculateTotals = () => {
    if (!responseData) return null;

    const subtotal = responseData.items.reduce((sum, item) => sum + item.final_price, 0);
    const shippingCost = responseData.shipping_cost;
    const total = subtotal + shippingCost;

    // Calculate total discount (difference between original price and final price)
    const totalOriginalPrice = responseData.items.reduce((sum, item) => {
      const itemPrice = parseFloat(item.product_price) * item.final_quantity;
      return sum + itemPrice;
    }, 0);
    
    const discount = Math.max(0, totalOriginalPrice - subtotal);

    return {
      subtotal,
      discount,
      shippingCost,
      tax: 0, // If tax is not provided in the API response
      total
    };
  };

  const totals = calculateTotals();

  return (
    <div>
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p>Calculating order total...</p>
        </div>
      ) : error ? (
        <div className="text-center py-6">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={fetchBillDetails}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      ) : responseData && totals ? (
        <>
          <div className="border rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3 pb-2 border-b">
              <button 
                onClick={onBack}
                className="text-gray-500 hover:text-gray-700 mr-2"
              >
                <ArrowLeft size={20} />
              </button>
              <h4 className="font-medium">Price Details</h4>
              <div></div> {/* Empty div for flex alignment */}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{totals.subtotal.toFixed(2)}</span>
              </div>
              
              {totals.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{totals.discount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span>Shipping</span>
                {totals.shippingCost > 0 ? (
                  <span>₹{totals.shippingCost.toFixed(2)}</span>
                ) : (
                  <span className="text-green-600">Free</span>
                )}
              </div>
              
              {totals.tax > 0 && (
                <div className="flex justify-between">
                  <span>Estimated Tax</span>
                  <span>₹{totals.tax.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between font-medium pt-2 mt-2 border-t">
                <span>Order Total</span>
                <span>₹{totals.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 mb-4">
            <h4 className="font-medium mb-3 pb-2 border-b">Payment Method</h4>
            
            <div className="space-y-3">
              <div 
                className={`flex items-center p-3 border rounded-md cursor-pointer ${
                  paymentMethod === 'online' ? 'border-[#175e7a] bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setPaymentMethod('online')}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  paymentMethod === 'online' ? 'border-[#175e7a]' : 'border-gray-300'
                }`}>
                  {paymentMethod === 'online' && (
                    <div className="w-3 h-3 rounded-full bg-[#175e7a]"></div>
                  )}
                </div>
                <div className="ml-3">
                  <p className="font-medium">Pay Now</p>
                  <p className="text-sm text-gray-500">Pay online with UPI, cards, or netbanking</p>
                </div>
              </div>
              
              <div 
                className={`flex items-center p-3 border rounded-md cursor-pointer ${
                  paymentMethod === 'cod' ? 'border-[#175e7a] bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setPaymentMethod('cod')}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  paymentMethod === 'cod' ? 'border-[#175e7a]' : 'border-gray-300'
                }`}>
                  {paymentMethod === 'cod' && (
                    <div className="w-3 h-3 rounded-full bg-[#175e7a]"></div>
                  )}
                </div>
                <div className="ml-3">
                  <p className="font-medium">Cash on Delivery</p>
                  <p className="text-sm text-gray-500">Pay with cash when your order arrives</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button 
              className="w-full bg-[#175e7a] text-white font-medium py-3 rounded flex items-center justify-center"
              onClick={handlePlaceOrder}
              disabled={processingOrder}
            >
              {processingOrder ? 'Processing...' : paymentMethod === 'cod' ? 'Place Order (COD)' : 'Proceed to Payment'}
            </button>
            <p className="text-center text-sm text-gray-500 mt-2">
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