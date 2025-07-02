'use client';

import { Check, AlertCircle, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface OrderConfirmationProps {
  orderId: string | null;
  paymentId?: string | null;
  paymentMethod: 'Cod' | 'Razorpay';
  paymentStatus?: 'success' | 'failed' | 'canceled';
  errorMessage?: string | null;
  onContinueShopping: () => void;
  onRetryPayment?: () => void;
}

const OrderConfirmation: React.FC<OrderConfirmationProps> = ({
  orderId,
  paymentId,
  paymentMethod,
  paymentStatus = 'success',
  errorMessage,
  onContinueShopping,
  onRetryPayment,
}) => {
  const [showAnimation, setShowAnimation] = useState(false);
  // const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Trigger animations with slight delay
    setTimeout(() => setShowAnimation(true), 100);
    // if (paymentStatus === 'success') {
    //   setTimeout(() => setShowConfetti(true), 500);
    // }
  }, [paymentStatus]);

  // // Animated jewelry elements
  // const JewelryElements = () => (
  //   <div className="absolute inset-0 overflow-hidden pointer-events-none">
  //     {/* Floating rings */}
  //     <div className="absolute top-10 left-8 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}>
  //       <div className="w-4 h-4 rounded-full border-2 border-yellow-400 opacity-70"></div>
  //     </div>
  //     <div className="absolute top-20 right-12 animate-bounce" style={{ animationDelay: '1s', animationDuration: '2.5s' }}>
  //       <div className="w-6 h-6 rounded-full border-2 border-yellow-500 opacity-60"></div>
  //     </div>
  //     <div className="absolute bottom-32 left-6 animate-bounce" style={{ animationDelay: '2s', animationDuration: '4s' }}>
  //       <div className="w-3 h-3 rounded-full border-2 border-amber-400 opacity-50"></div>
  //     </div>
      
  //     {/* Diamond sparkles */}
  //     <div className="absolute top-16 right-8 animate-pulse" style={{ animationDelay: '0.5s' }}>
  //       <div className="w-2 h-2 bg-yellow-300 transform rotate-45 opacity-80"></div>
  //     </div>
  //     <div className="absolute bottom-24 right-16 animate-pulse" style={{ animationDelay: '1.5s' }}>
  //       <div className="w-1.5 h-1.5 bg-amber-300 transform rotate-45 opacity-70"></div>
  //     </div>
  //     <div className="absolute top-32 left-12 animate-pulse" style={{ animationDelay: '2.5s' }}>
  //       <div className="w-3 h-3 bg-yellow-400 transform rotate-45 opacity-60"></div>
  //     </div>

  //     {/* Bangles/Bracelets */}
  //     <div className="absolute bottom-40 right-6 animate-spin" style={{ animationDuration: '8s' }}>
  //       <div className="w-8 h-8 rounded-full border-3 border-transparent border-t-yellow-400 border-r-amber-400 opacity-50"></div>
  //     </div>
  //     <div className="absolute top-24 left-16 animate-spin" style={{ animationDuration: '10s', animationDirection: 'reverse' }}>
  //       <div className="w-6 h-6 rounded-full border-2 border-transparent border-b-yellow-500 border-l-amber-500 opacity-40"></div>
  //     </div>
  //   </div>
  // );

  // Confetti animation
  // const ConfettiElements = () => (
  //   showConfetti && (
  //     <div className="absolute inset-0 overflow-hidden pointer-events-none">
  //       {Array.from({ length: 15 }).map((_, i) => (
  //         <div
  //           key={i}
  //           className="absolute w-1.5 h-1.5 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full animate-ping"
  //           style={{
  //             left: `${Math.random() * 100}%`,
  //             top: `${Math.random() * 100}%`,
  //             animationDelay: `${Math.random() * 2}s`,
  //             animationDuration: `${1 + Math.random() * 2}s`
  //           }}
  //         />
  //       ))}
  //     </div>
  //   )
  // );

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      {/* Jewelry background elements */}
      {/* <JewelryElements /> */}
      
      {/* Confetti */}
      {/* <ConfettiElements /> */}
      
      {/* Main confirmation card - NO HEADER */}
      <div className={`relative w-full max-w-md transform transition-all duration-1000 ${showAnimation ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-yellow-200 overflow-hidden">
          
          {/* Content starts directly - NO decorative header */}
          <div className="p-6 text-center relative">
            {/* Status Icon */}
            <div className={`relative inline-flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full transform transition-all duration-1000 ${showAnimation ? 'scale-100 rotate-0' : 'scale-0 rotate-180'}`}>
              
              {paymentStatus === 'success' && (
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <Check size={32} className="text-white animate-bounce" style={{ animationDelay: '0.5s' }} />
                  </div>
                  <div className="absolute inset-0 w-16 h-16 rounded-full border-3 border-green-300 animate-ping"></div>
                </div>
              )}
              
              {paymentStatus === 'failed' && (
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-r from-red-400 to-rose-500 rounded-full flex items-center justify-center shadow-lg">
                    <XCircle size={32} className="text-white" />
                  </div>
                  <div className="absolute inset-0 w-16 h-16 rounded-full border-3 border-red-300 animate-pulse"></div>
                </div>
              )}
              
              {paymentStatus === 'canceled' && (
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                    <AlertCircle size={32} className="text-white" />
                  </div>
                  <div className="absolute inset-0 w-16 h-16 rounded-full border-3 border-yellow-300 animate-pulse"></div>
                </div>
              )}
            </div>

            {/* Success Messages - Smaller text */}
            {paymentStatus === 'success' && paymentMethod === 'Cod' && (
              <>
                <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-[var(--color-primary-950)] to-indigo-600 bg-clip-text text-transparent">
                  Order Placed Successfully! 
                </h3>
                <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                  Your order has been placed successfully.<br/>
                  <span className="font-medium text-[var(--color-primary-950)]">We will deliver your package soon!</span>
                </p>
              </>
            )}
            
            {paymentStatus === 'success' && paymentMethod === 'Razorpay' && (
              <>
                <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-[var(--color-primary-950)] to-indigo-600 bg-clip-text text-transparent">
                  Payment Successful!
                </h3>
                <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                  Your payment was successful and your order<br/>
                  <span className="font-medium text-[var(--color-primary-950)]">has been placed successfully!</span>
                </p>
              </>
            )}
            
            {/* Error Messages - Smaller text */}
            {paymentStatus === 'failed' && (
              <>
                <h3 className="text-xl font-bold mb-2 text-red-600">
                  Payment Failed 
                </h3>
                <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                  {errorMessage || "There was an issue processing your payment. Please try again."}
                </p>
              </>
            )}
            
            {paymentStatus === 'canceled' && (
              <>
                <h3 className="text-xl font-bold mb-2 text-orange-600">
                  Payment Canceled 
                </h3>
                <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                  Your payment was canceled.<br/>
                  <span className="font-medium">Your order is still pending payment.</span>
                </p>
              </>
            )}
            
            {/* Order Details Card - Smaller */}
            {paymentStatus === 'success' && (
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl mb-6 border border-gray-200 shadow-inner">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[var(--color-primary-950)] to-indigo-600 flex items-center justify-center mr-2">
                    <span className="text-white text-xs font-bold">📋</span>
                  </div>
                  <h4 className="font-semibold text-gray-800 text-sm">Order Details</h4>
                </div>
                
                <div className="space-y-2 text-left">
                  <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg">
                    <span className="text-gray-600 font-medium text-xs">Order ID:</span>
                    <span className="font-bold text-[var(--color-primary-950)] font-mono text-xs">
                      {orderId ? orderId.replace(/-/g, '') : ''}
                    </span>
                  </div>
                  
                  {paymentId && (
                    <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg">
                      <span className="text-gray-600 font-medium text-xs">Payment ID:</span>
                      <span className="font-bold text-indigo-600 font-mono text-xs">
                        {paymentId}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Email confirmation note - Smaller */}
            {paymentStatus === 'success' && (
              <div className="mb-6 p-3 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center justify-center mb-2">
                  <span className="text-lg mr-2">📧</span>
                  <span className="font-semibold text-green-800 text-sm">Confirmation Sent!</span>
                </div>
                <p className="text-green-700 text-xs leading-relaxed">
                  A confirmation email has been sent to your registered email address 
                  {paymentMethod === 'Razorpay' ? ' with order details.' : '.'}
                </p>
              </div>
            )}
            
            {/* Action Buttons - Smaller */}
            <div className="flex flex-col gap-3">
              {(paymentStatus === 'failed' || paymentStatus === 'canceled') && onRetryPayment && (
                <button
                  className="w-full py-3 bg-gradient-to-r from-[var(--color-primary-950)] to-indigo-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-sm"
                  onClick={onRetryPayment}
                >
                  <span className="flex items-center justify-center">
                    🔄 Retry Payment
                  </span>
                </button>
              )}
              
              <button
                className={`w-full py-3 font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg text-sm ${
                  paymentStatus === 'success' 
                    ? 'bg-gradient-to-r from-[var(--color-primary-950)] to-indigo-600 text-white' 
                    : 'bg-gradient-to-r from-gray-600 to-gray-700 text-white'
                }`}
                onClick={onContinueShopping}
              >
                <span className="flex items-center justify-center">
                  {paymentStatus === 'success' ? '🛍️ Continue Shopping' : '🏠 Go Back to Shop'}
                </span>
              </button>
            </div>

            {/* Thank you message for success - Smaller */}
            {paymentStatus === 'success' && (
              <div className="mt-6 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                <p className="text-purple-800 font-medium text-sm">
                  ✨ Thank you for your purchase! ✨
                </p>
                <p className="text-purple-600 text-xs mt-1">
                  We appreciate your trust in our jewelry collection
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Decorative elements around the card - Smaller */}
        <div className="absolute -top-1 -left-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -top-0.5 -right-2 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>
    </div>
  );
};

export default OrderConfirmation;