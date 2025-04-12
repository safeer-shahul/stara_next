'use client';

import { Check } from 'lucide-react';

interface OrderConfirmationProps {
  orderId: string | null;
  paymentId?: string | null;
  paymentMethod: 'Cod' | 'Razorpay';  
  onContinueShopping: () => void;
}

const OrderConfirmation: React.FC<OrderConfirmationProps> = ({
  orderId,
  paymentId,
  paymentMethod,
  onContinueShopping
}) => {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
        <Check size={42} className="text-green-600" />
      </div>
      
      {paymentMethod === 'Cod' ? (
        <>
          <h3 className="text-xl font-medium mb-2">Order Placed Successfully!</h3>
          <p className="text-gray-600 mb-6">
            Your order has been placed successfully. We will deliver your package soon.
          </p>
        </>
      ) : (
        <>
          <h3 className="text-xl font-medium mb-1">Payment Successful!</h3>
          <p className="text-gray-600 text-[13px] mb-6">
            Your payment was successful and your order<br/> has been placed.
          </p>
        </>
      )}
      
      <div className="bg-gray-50 p-4 rounded-lg mb-6 inline-block mx-auto text-left">
        <p className="text-gray-700 text-[13px] mb-1">Order ID: <span className="font-medium text-black">{orderId?.replace(/-/g, '')}</span></p>
        {paymentId && (
          <p className="text-gray-700">Payment ID: <span className="font-medium">{paymentId}</span></p>
        )}
      </div>
      
      <p className=" text-[13px] text-gray-500 mb-6">
        A confirmation email has been sent to<br/> your registered email address 
        {paymentMethod === 'Razorpay' ? ' with order details.' : '.'}
      </p>
      
      <button
        className="px-6 py-2 bg-[#175e7a] text-[14px] text-white rounded-md hover:bg-[#0f4c67] cursor-pointer transition-colors shadow-sm"
        onClick={onContinueShopping}
      >
        Continue Shopping
      </button>
    </div>
  );
};

export default OrderConfirmation;