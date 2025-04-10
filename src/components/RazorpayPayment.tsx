'use client';

import { useState, useEffect } from 'react';
import apiService from '@/utils/api/apiService';

interface RazorpayPaymentProps {
  orderId: string; // This is now the razorpay_order_id
  customerPhone: string;
  onSuccess: (paymentId: string) => void;
  onError: (errorMessage: string) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RazorpayPayment: React.FC<RazorpayPaymentProps> = ({
  orderId,
  customerPhone,
  onSuccess,
  onError
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load Razorpay script
    const loadRazorpayScript = () => {
      return new Promise<void>((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        
        script.onload = () => {
          resolve();
        };
        
        script.onerror = () => {
          setError('Failed to load payment gateway. Please try again.');
          onError('Failed to load payment gateway');
        };
        
        document.body.appendChild(script);
      });
    };

    const initializePayment = async () => {
      try {
        setLoading(true);
        
        // Load the script if not already loaded
        if (!window.Razorpay) {
          await loadRazorpayScript();
        }
        
        // Since we already have the Razorpay order ID, no need to call getRazorpayOrder
        // Initialize Razorpay checkout directly
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          currency: 'INR',
          name: 'Your Company Name',
          description: 'Order Payment',
          order_id: orderId, // Direct use of the razorpay_order_id passed from BillSummary
          handler: function (response: any) {
            handlePaymentSuccess(response);
          },
          prefill: {
            contact: customerPhone
          },
          notes: {
            order_id: orderId
          },
          theme: {
            color: '#175e7a'
          },
          modal: {
            ondismiss: function() {
              setError('Payment cancelled. Your order is still pending payment.');
              onError('Payment cancelled by user');
            }
          }
        };
        
        const razorpay = new window.Razorpay(options);
        razorpay.open();
        setLoading(false);
        
      } catch (error) {
        console.error('Error initializing payment:', error);
        setError('Failed to initialize payment. Please try again.');
        onError('Failed to initialize payment');
        setLoading(false);
      }
    };

    initializePayment();
  }, [orderId, customerPhone, onError]);

  const handlePaymentSuccess = async (paymentResponse: any) => {
    try {
      // Verify payment with your backend
      const verificationData = {
        order_id: orderId,
        payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature
      };
      
      const response = await apiService.verifyPayment(verificationData);
      
      if (response && response.success) {
        // Payment verified successfully
        onSuccess(paymentResponse.razorpay_payment_id);
      } else {
        setError('Payment verification failed. Please contact support.');
        onError('Payment verification failed');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      setError('Error verifying payment. Please contact support.');
      onError('Error during payment verification');
    }
  };

  return (
    <div className="py-8 text-center">
      {loading ? (
        <div className="flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-[#175e7a] rounded-full animate-spin mb-4"></div>
          <p>Initializing secure payment...</p>
        </div>
      ) : error ? (
        <div className="text-red-500">
          <p>{error}</p>
        </div>
      ) : null}
    </div>
  );
};

export default RazorpayPayment;