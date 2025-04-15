'use client';

import { useState, useEffect, useRef } from 'react';
import apiService from '@/utils/api/apiService';

interface RazorpayPaymentProps {
  orderId: string; // This is the razorpay_order_id
  customerPhone: string;
  onSuccess: (paymentId?: string) => void;
  onError: (errorMessage?: string) => void;
  onCancel: () => void;
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
  onError,
  onCancel
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const razorpayInstanceRef = useRef<any>(null);
  const paymentHandledRef = useRef<boolean>(false);
  const razorpayInitialized = useRef<boolean>(false);

  // Cleanup function to force close the Razorpay modal if needed
  const closeRazorpay = () => {
    if (razorpayInstanceRef.current) {
      try {
        razorpayInstanceRef.current.close();
        razorpayInstanceRef.current = null;
      } catch (e) {
        console.log('Error closing Razorpay', e);
      }
    }
  };

  // Function to handle payment success
  const handlePaymentSuccess = async (paymentResponse: any) => {
    try {
      // Prevent multiple calls
      if (paymentHandledRef.current) return;
      paymentHandledRef.current = true;
      
      console.log('Payment response received:', paymentResponse);
      
      // Make sure to close the Razorpay modal first
      closeRazorpay();
      
      // Slight delay to ensure UI updates properly before verifying
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const response = await apiService.verifyPayment(paymentResponse);
      console.log('Payment verification response:', response);
      
      if (response) {
        // Use a timeout to ensure state updates complete before navigating
        setTimeout(() => {
          onSuccess(paymentResponse.razorpay_payment_id);
        }, 500);
      } else {
        const errorMessage = 'Payment verification failed. Please contact support.';
        setError(errorMessage);
        onError(errorMessage);
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      const errorMessage = 'Error verifying payment. Please contact support.';
      setError(errorMessage);
      onError(errorMessage);
    }
  };

  useEffect(() => {
    // Prevent double initialization
    if (razorpayInitialized.current) return;
    razorpayInitialized.current = true;
    
    // Reset payment handled flag on mount
    paymentHandledRef.current = false;
    
    // Load Razorpay script
    const loadRazorpayScript = () => {
      return new Promise<void>((resolve, reject) => {
        // Check if script is already loaded
        if (window.Razorpay) {
          resolve();
          return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        
        script.onload = () => {
          resolve();
        };
        
        script.onerror = () => {
          reject(new Error('Failed to load payment gateway script'));
        };
        
        document.body.appendChild(script);
      });
    };

    const initializePayment = async () => {
      try {
        setLoading(true);
        
        // Load the script if not already loaded
        await loadRazorpayScript();
        
        // Ensure any existing instance is closed
        closeRazorpay();
        
        // Initialize Razorpay checkout
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
              if (!paymentHandledRef.current) {
                paymentHandledRef.current = true;
                setError('Payment cancelled. Your order is still pending payment.');
                onCancel();
              }
            },
            escape: false,
            backdropclose: false
          }
        };
        
        // Create and store the Razorpay instance
        razorpayInstanceRef.current = new window.Razorpay(options);
        
        // Open the Razorpay modal with a small delay to ensure DOM is ready
        setTimeout(() => {
          if (razorpayInstanceRef.current) {
            razorpayInstanceRef.current.open();
          }
          setLoading(false);
        }, 300);
        
      } catch (error) {
        console.error('Error initializing payment:', error);
        const errorMessage = 'Failed to initialize payment. Please try again.';
        setError(errorMessage);
        onError(errorMessage);
        setLoading(false);
      }
    };

    initializePayment();

    // Cleanup function when component unmounts
    return () => {
      closeRazorpay();
    };
  }, [orderId, customerPhone, onError, onCancel]);

  return (
    <div className="py-8 text-center">
      {loading ? (
        <div className="flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-[#175e7a] rounded-full animate-spin mb-4"></div>
          <p>Initializing secure payment...</p>
          <p className="text-sm text-gray-500 mt-2">Please don&apos;t refresh or close this window</p>
        </div>
      ) : error ? (
        <div className="text-red-500">
          <p>{error}</p>
          <button 
            onClick={() => onError(error)}
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