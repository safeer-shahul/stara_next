'use client';

import { useState, useEffect } from 'react';
import { X, Check, ArrowLeft } from 'lucide-react';
import apiService from '@/utils/api/apiService';

interface BillSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onComplete: () => void;
  orderItems: Array<{
    product_id: string;
    quantity: number;
  }>;
  couponCode?: string;
  destinationPincode: string;
  addressId: string;
}

interface BillDetails {
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  items: {
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
    total_price: number;
  }[];
}

const BillSummary: React.FC<BillSummaryProps> = ({
  isOpen,
  onClose,
  onBack,
  onComplete,
  orderItems,
  couponCode,
  destinationPincode
}) => {
  const [loading, setLoading] = useState(true);
  const [billDetails, setBillDetails] = useState<BillDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingOrder, setProcessingOrder] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchBillDetails();
    }
  }, [isOpen, orderItems, couponCode, destinationPincode]);

  const fetchBillDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getProductAmountDetailed({
        coupon_code_id: couponCode,
        items: orderItems,
        destination_pincode: destinationPincode
      });
      
      console.log(response,'bill details')
      if (response) {
        setBillDetails(response);
      } else {
        setError('Failed to retrieve billing details');
      }
    } catch (error) {
      console.error('Error fetching bill details:', error);
      setError('An error occurred while calculating your order total');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!billDetails) return;
    
    setProcessingOrder(true);
    setError(null);
    
    try {
      // Here you would call your place order API
      // const response = await apiService.placeOrder({
      //   items: orderItems,
      //   address_id: addressId,
      //   coupon_code: couponCode,
      // });
      
      // For now we'll just simulate a successful order
      setTimeout(() => {
        setProcessingOrder(false);
        onComplete();
      }, 1500);
    } catch (error) {
      console.error('Error placing order:', error);
      setError('Failed to place your order. Please try again.');
      setProcessingOrder(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/80" onClick={onClose}></div>
      
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center">
            <button 
              onClick={onBack}
              className="mr-3 text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft size={20} />
            </button>
            <h3 className="text-lg font-medium">Order Summary</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
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
          ) : billDetails ? (
            <>
              <div className="border rounded-lg p-4 mb-4">
                <h4 className="font-medium mb-3 pb-2 border-b">Item Details</h4>
                
                {billDetails.items.map((item, index) => (
                  <div key={index} className="flex justify-between py-2 border-b last:border-b-0">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{item.total_price.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">₹{item.price.toFixed(2)} each</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border rounded-lg p-4 mb-4">
                <h4 className="font-medium mb-3 pb-2 border-b">Price Details</h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{billDetails.subtotal.toFixed(2)}</span>
                  </div>
                  
                  {billDetails.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-₹{billDetails.discount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    {billDetails.shippingCost > 0 ? (
                      <span>₹{billDetails.shippingCost.toFixed(2)}</span>
                    ) : (
                      <span className="text-green-600">Free</span>
                    )}
                  </div>
                  
                  {billDetails.tax > 0 && (
                    <div className="flex justify-between">
                      <span>Estimated Tax</span>
                      <span>₹{billDetails.tax.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between font-medium pt-2 mt-2 border-t">
                    <span>Order Total</span>
                    <span>₹{billDetails.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 mb-4 bg-gray-50">
                <div className="flex items-start">
                  <div className="bg-[#175e7a] text-white p-1 rounded-full mr-3 mt-0.5">
                    <Check size={16} />
                  </div>
                  <div>
                    <p className="font-medium">Your order is eligible for FREE delivery</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Choose this option at checkout. See details
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button 
                  className="w-full bg-[#175e7a] text-white font-medium py-3 rounded flex items-center justify-center"
                  onClick={handlePlaceOrder}
                  disabled={processingOrder}
                >
                  {processingOrder ? 'Processing...' : 'Place Your Order'}
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
      </div>
    </div>
  );
};

export default BillSummary;