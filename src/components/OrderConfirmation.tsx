'use client';

import { Check, AlertCircle, XCircle } from 'lucide-react';

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
  return (
    <div className="text-center py-8">
      {paymentStatus === 'success' && (
        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
          <Check size={42} className="text-green-600" />
        </div>
      )}
      
      {paymentStatus === 'failed' && (
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <XCircle size={42} className="text-red-600" />
        </div>
      )}
      
      {paymentStatus === 'canceled' && (
        <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
          <AlertCircle size={42} className="text-yellow-600" />
        </div>
      )}
      
      {paymentStatus === 'success' && paymentMethod === 'Cod' && (
        <>
          <h3 className="text-xl font-medium mb-2">Order Placed Successfully!</h3>
          <p className="text-gray-600 mb-6">
            Your order has been placed successfully. We will deliver your package soon.
          </p>
        </>
      )}
      
      {paymentStatus === 'success' && paymentMethod === 'Razorpay' && (
        <>
          <h3 className="text-xl font-medium mb-1">Payment Successful!</h3>
          <p className="text-gray-600 text-[13px] mb-6">
            Your payment was successful and your order<br/> has been placed.
          </p>
        </>
      )}
      
      {paymentStatus === 'failed' && (
        <>
          <h3 className="text-xl font-medium mb-1">Payment Failed</h3>
          <p className="text-gray-600 text-[13px] mb-6">
            {errorMessage || "There was an issue processing your payment. Please try again."}
          </p>
        </>
      )}
      
      {paymentStatus === 'canceled' && (
        <>
          <h3 className="text-xl font-medium mb-1">Payment Canceled</h3>
          <p className="text-gray-600 text-[13px] mb-6">
            Your payment was canceled. Your order is still pending payment.
          </p>
        </>
      )}
      
      {paymentStatus === 'success' && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6 inline-block mx-auto text-left">
          <p className="text-gray-700 text-[13px] mb-1">
            Order ID: <span className="font-medium text-black">{orderId ? orderId.replace(/-/g, '') : ''}</span>
          </p>
          {paymentId && (
            <p className="text-gray-700 text-[13px]">
              Payment ID: <span className="font-medium">{paymentId}</span>
            </p>
          )}
        </div>
      )}
      
      {paymentStatus === 'success' && (
        <>
          <p className="text-[13px] text-gray-500 mb-2">
            A confirmation email has been sent to<br/> your registered email address 
            {paymentMethod === 'Razorpay' ? ' with order details.' : '.'}
          </p>
        </>
      )}
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {(paymentStatus === 'failed' || paymentStatus === 'canceled') && onRetryPayment && (
          <button
            className="px-6 py-2 bg-[var(--color-primary-950)] text-[14px] text-white rounded-md hover:bg-[#0f4c67] transition-colors shadow-sm"
            onClick={onRetryPayment}
          >
            Retry Payment
          </button>
        )}
        
        <button
          className={`px-6 py-2 ${paymentStatus === 'success' ? 'bg-[var(--color-primary-950)] text-white hover:bg-[#0f4c67]' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} text-[14px] rounded-md cursor-pointer transition-colors shadow-sm`}
          onClick={onContinueShopping}
        >
          {paymentStatus === 'success' ? 'Continue Shopping' : 'Go Back to Shop'}
        </button>
      </div>
    </div>
  );
};

export default OrderConfirmation;