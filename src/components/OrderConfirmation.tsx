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
  cartCleared?: boolean;
}

const OrderConfirmation: React.FC<OrderConfirmationProps> = ({
  orderId,
  paymentId,
  paymentMethod,
  paymentStatus = 'success',
  errorMessage,
  onContinueShopping,
  onRetryPayment,
  cartCleared
}) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Trigger animations with slight delay
    setTimeout(() => setShowAnimation(true), 100);
    if (paymentStatus === 'success') {
      setTimeout(() => setShowConfetti(true), 500);
    }
  }, [paymentStatus]);

  // Animated jewelry elements
  const JewelryElements = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Floating rings */}
      <div className="absolute top-10 left-8 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}>
        <div className="w-6 h-6 rounded-full border-2 border-yellow-400 opacity-70"></div>
      </div>
      <div className="absolute top-20 right-12 animate-bounce" style={{ animationDelay: '1s', animationDuration: '2.5s' }}>
        <div className="w-8 h-8 rounded-full border-2 border-yellow-500 opacity-60"></div>
      </div>
      <div className="absolute bottom-32 left-6 animate-bounce" style={{ animationDelay: '2s', animationDuration: '4s' }}>
        <div className="w-5 h-5 rounded-full border-2 border-amber-400 opacity-50"></div>
      </div>
      
      {/* Diamond sparkles */}
      <div className="absolute top-16 right-8 animate-pulse" style={{ animationDelay: '0.5s' }}>
        <div className="w-3 h-3 bg-yellow-300 transform rotate-45 opacity-80"></div>
      </div>
      <div className="absolute bottom-24 right-16 animate-pulse" style={{ animationDelay: '1.5s' }}>
        <div className="w-2 h-2 bg-amber-300 transform rotate-45 opacity-70"></div>
      </div>
      <div className="absolute top-32 left-12 animate-pulse" style={{ animationDelay: '2.5s' }}>
        <div className="w-4 h-4 bg-yellow-400 transform rotate-45 opacity-60"></div>
      </div>

      {/* Bangles/Bracelets */}
      <div className="absolute bottom-40 right-6 animate-spin" style={{ animationDuration: '8s' }}>
        <div className="w-12 h-12 rounded-full border-4 border-transparent border-t-yellow-400 border-r-amber-400 opacity-50"></div>
      </div>
      <div className="absolute top-24 left-16 animate-spin" style={{ animationDuration: '10s', animationDirection: 'reverse' }}>
        <div className="w-10 h-10 rounded-full border-3 border-transparent border-b-yellow-500 border-l-amber-500 opacity-40"></div>
      </div>
    </div>
  );

  // Confetti animation
  const ConfettiElements = () => (
    showConfetti && (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
    )
  );

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      {/* Jewelry background elements */}
      <JewelryElements />
      
      {/* Confetti */}
      <ConfettiElements />
      
      {/* Main confirmation card */}
      <div className={`relative w-full max-w-lg transform transition-all duration-1000 ${showAnimation ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <div className="bg-white rounded-3xl shadow-2xl border-2 border-yellow-200 overflow-hidden">
          
          {/* Decorative header with gradient */}
          <div className="relative h-32 bg-gradient-to-r from-[var(--color-primary-950)] via-indigo-600 to-purple-600 overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            {/* Animated rings in header */}
            <div className="absolute top-4 right-6 w-16 h-16 rounded-full border-2 border-white/30 animate-pulse"></div>
            <div className="absolute top-8 right-10 w-8 h-8 rounded-full border border-white/40 animate-bounce" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/5 animate-spin" style={{ animationDuration: '8s' }}></div>
          </div>

          <div className="p-8 text-center relative">
            {/* Status Icon */}
            <div className={`relative inline-flex items-center justify-center w-24 h-24 mx-auto mb-6 rounded-full transform transition-all duration-1000 ${showAnimation ? 'scale-100 rotate-0' : 'scale-0 rotate-180'}`}>
              
              {paymentStatus === 'success' && (
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <Check size={48} className="text-white animate-bounce" style={{ animationDelay: '0.5s' }} />
                  </div>
                  <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-green-300 animate-ping"></div>
                </div>
              )}
              
              {paymentStatus === 'failed' && (
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-r from-red-400 to-rose-500 rounded-full flex items-center justify-center shadow-lg">
                    <XCircle size={48} className="text-white" />
                  </div>
                  <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-red-300 animate-pulse"></div>
                </div>
              )}
              
              {paymentStatus === 'canceled' && (
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                    <AlertCircle size={48} className="text-white" />
                  </div>
                  <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-yellow-300 animate-pulse"></div>
                </div>
              )}
            </div>

            {/* Success Messages */}
            {paymentStatus === 'success' && paymentMethod === 'Cod' && (
              <>
                <h3 className="text-3xl font-bold mb-3 bg-gradient-to-r from-[var(--color-primary-950)] to-indigo-600 bg-clip-text text-transparent">
                  Order Placed Successfully! 🎉
                </h3>
                <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                  Your order has been placed successfully.<br/>
                  <span className="font-medium text-[var(--color-primary-950)]">We will deliver your package soon!</span>
                </p>
              </>
            )}
            
            {paymentStatus === 'success' && paymentMethod === 'Razorpay' && (
              <>
                <h3 className="text-3xl font-bold mb-3 bg-gradient-to-r from-[var(--color-primary-950)] to-indigo-600 bg-clip-text text-transparent">
                  Payment Successful! ✨
                </h3>
                <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                  Your payment was successful and your order<br/>
                  <span className="font-medium text-[var(--color-primary-950)]">has been placed successfully!</span>
                </p>
              </>
            )}
            
            {/* Error Messages */}
            {paymentStatus === 'failed' && (
              <>
                <h3 className="text-3xl font-bold mb-3 text-red-600">
                  Payment Failed 😔
                </h3>
                <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                  {errorMessage || "There was an issue processing your payment. Please try again."}
                </p>
              </>
            )}
            
            {paymentStatus === 'canceled' && (
              <>
                <h3 className="text-3xl font-bold mb-3 text-orange-600">
                  Payment Canceled ⏸️
                </h3>
                <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                  Your payment was canceled.<br/>
                  <span className="font-medium">Your order is still pending payment.</span>
                </p>
              </>
            )}
            
            {/* Order Details Card */}
            {paymentStatus === 'success' && (
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-2xl mb-8 border border-gray-200 shadow-inner">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[var(--color-primary-950)] to-indigo-600 flex items-center justify-center mr-3">
                    <span className="text-white text-sm font-bold">📋</span>
                  </div>
                  <h4 className="font-semibold text-gray-800">Order Details</h4>
                </div>
                
                <div className="space-y-3 text-left">
                  <div className="flex items-center justify-between py-2 px-4 bg-white rounded-lg">
                    <span className="text-gray-600 font-medium">Order ID:</span>
                    <span className="font-bold text-[var(--color-primary-950)] font-mono">
                      {orderId ? orderId.replace(/-/g, '') : ''}
                    </span>
                  </div>
                  
                  {paymentId && (
                    <div className="flex items-center justify-between py-2 px-4 bg-white rounded-lg">
                      <span className="text-gray-600 font-medium">Payment ID:</span>
                      <span className="font-bold text-indigo-600 font-mono text-sm">
                        {paymentId}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Email confirmation note */}
            {paymentStatus === 'success' && (
              <div className="mb-8 p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center justify-center mb-2">
                  <span className="text-2xl mr-2">📧</span>
                  <span className="font-semibold text-green-800">Confirmation Sent!</span>
                </div>
                <p className="text-green-700 text-sm leading-relaxed">
                  A confirmation email has been sent to your registered email address 
                  {paymentMethod === 'Razorpay' ? ' with order details.' : '.'}
                </p>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-4">
              {(paymentStatus === 'failed' || paymentStatus === 'canceled') && onRetryPayment && (
                <button
                  className="w-full py-4 bg-gradient-to-r from-[var(--color-primary-950)] to-indigo-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  onClick={onRetryPayment}
                >
                  <span className="flex items-center justify-center">
                    🔄 Retry Payment
                  </span>
                </button>
              )}
              
              <button
                className={`w-full py-4 font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
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

            {/* Thank you message for success */}
            {paymentStatus === 'success' && (
              <div className="mt-8 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                <p className="text-purple-800 font-medium text-lg">
                  ✨ Thank you for your purchase! ✨
                </p>
                <p className="text-purple-600 text-sm mt-1">
                  We appreciate your trust in our jewelry collection
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Decorative elements around the card */}
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-yellow-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
        <div className="absolute -bottom-2 -right-2 w-3 h-3 bg-amber-400 rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -top-1 -right-3 w-2 h-2 bg-yellow-300 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>
    </div>
  );
};

export default OrderConfirmation;