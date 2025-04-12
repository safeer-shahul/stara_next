'use client';

import { useState, useEffect, useRef } from 'react';
import apiService from '@/utils/api/apiService';

interface RazorpayPaymentProps {
  orderId: string; // This is now the razorpay_order_id
  customerPhone: string;
  onSuccess: () => void;
  onError: () => void;
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
  const razorpayInstanceRef = useRef<any>(null);

  // Cleanup function to force close the Razorpay modal if needed
  const closeRazorpay = () => {
    if (razorpayInstanceRef.current) {
      try {
        razorpayInstanceRef.current.close();
      } catch (e) {
        console.log('Error closing Razorpay', e);
      }
    }
  };

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
          onError();
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
          name: 'Stara Silver Jewels',
          description: 'Order Payment',
          order_id: orderId, 
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
              onError();
            },
            escape: false, // Prevent closing with ESC key
            backdropclose: false // Prevent closing by clicking outside
          }
        };
        
        // Create and store the Razorpay instance
        razorpayInstanceRef.current = new window.Razorpay(options);
        razorpayInstanceRef.current.open();
        setLoading(false);
        
      } catch (error) {
        console.error('Error initializing payment:', error);
        setError('Failed to initialize payment. Please try again.');
        onError();
        setLoading(false);
      }
    };

    initializePayment();

    // Cleanup function when component unmounts
    return () => {
      closeRazorpay();
    };
  }, [orderId, customerPhone, onError]);

  const handlePaymentSuccess = async (paymentResponse: any) => {
    try {
      console.log(paymentResponse, 'paymentResponse');
      const response = await apiService.verifyPayment(paymentResponse);
      console.log(response, 'verify payment');
      
      if (response) {
        // Make sure to close the Razorpay modal
        closeRazorpay();
        // Slight delay to ensure UI updates properly
        setTimeout(() => {
          onSuccess();
        }, 100);
      } else {
        setError('Payment verification failed. Please contact support.');
        onError();
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      setError('Error verifying payment. Please contact support.');
      onError();
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
          <button 
            onClick={onError}
            className="mt-4 px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Go Back
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default RazorpayPayment;