'use client';

import { useState } from 'react';
import { X, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import Image from 'next/image';

interface OrderItem {
  id: string;
  quantity: number;
  price: string;
  product_details: {
    id: string;
    product_name: string;
    images: { id: string; product_image: string; }[];
  };
}

interface ReturnOrderModalProps {
  orderId: string;
  orderItems: OrderItem[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReturnOrderModal({ orderId, orderItems, onClose, onSuccess }: ReturnOrderModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [returnItems, setReturnItems] = useState<Record<string, number>>(() => {
    // Initialize return items with 0 quantities
    const initialItems: Record<string, number> = {};
    orderItems.forEach(item => {
      initialItems[item.id] = 0;
    });
    return initialItems;
  });
  const [returnReason, setReturnReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [error, setError] = useState('');
  const [showPolicy, setShowPolicy] = useState(false);

  const returnReasons = [
    'Received damaged item',
    'Product doesn\'t match description',
    'Not satisfied with quality',
    'Received wrong item',
    'Other'
  ];

  const handleItemReturnChange = (itemId: string, quantity: number) => {
    const orderItem = orderItems.find(item => item.id === itemId);
    if (!orderItem) return;

    if (quantity >= 0 && quantity <= orderItem.quantity) {
      setReturnItems({
        ...returnItems,
        [itemId]: quantity
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if any items are selected for return
    const hasSelectedItems = Object.values(returnItems).some(qty => qty > 0);
    if (!hasSelectedItems) {
      setError('Please select at least one item to return');
      return;
    }
    
    // Check if a reason is selected
    if (!returnReason) {
      setError('Please select a reason for return');
      return;
    }
    
    // Check if other reason is provided when "Other" is selected
    if (returnReason === 'Other' && !otherReason.trim()) {
      setError('Please provide details for your return reason');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Prepare return items data
      const itemsToReturn = Object.entries(returnItems)
        .filter(([_, qty]) => qty > 0)
        .map(([itemId, quantity]) => ({
          item_id: itemId,
          quantity: quantity
        }));
      
      // Return request data
      const returnData = {
        order_id: orderId,
        items: itemsToReturn,
        reason: returnReason === 'Other' ? otherReason : returnReason
      };
      
      // Call your API to process the return
      // In a real application, uncomment this:
      // await apiService.createReturnRequest(returnData);
      
      // For demo purposes, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Return request submitted:', returnData);
      
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to submit return request. Please try again.');
      setSubmitting(false);
    }
  };

  const calculateRefundAmount = () => {
    return orderItems.reduce((total, item) => {
      const returnQty = returnItems[item.id] || 0;
      return total + (returnQty * parseFloat(item.price));
    }, 0);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-black opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Return Order</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-5 border border-gray-200 rounded-md overflow-hidden">
                <button
                  type="button"
                  className="w-full flex justify-between items-center p-3 bg-gray-50 text-sm font-medium text-gray-700"
                  onClick={() => setShowPolicy(!showPolicy)}
                >
                  Return Policy
                  {showPolicy ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {showPolicy && (
                  <div className="p-3 text-sm text-gray-600 bg-white">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Returns must be initiated within 2 days of delivery</li>
                      <li>Items must be in original condition, unworn/unused with all tags attached</li>
                      <li>Refunds will be processed to the original payment method</li>
                      <li>Shipping charges for returns will be deducted from your refund</li>
                      <li>Processing may take 5-7 business days after we receive your return</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="mb-5">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Select Items to Return</h4>
                
                {error && (
                  <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded flex items-start">
                    <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {orderItems.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-md p-3">
                      <div className="flex items-center">
                        <div className="w-12 h-12 relative rounded overflow-hidden flex-shrink-0 mr-3 bg-gray-100">
                          {item.product_details.images && item.product_details.images.length > 0 ? (
                            <Image 
                              src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${item.product_details.images[0].product_image}`} 
                              alt={item.product_details.product_name}
                              fill
                              sizes="48px"
                              style={{objectFit: 'cover'}}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200"></div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.product_details.product_name}</p>
                          <p className="text-xs text-gray-500">₹{parseFloat(item.price).toFixed(2)} x {item.quantity}</p>
                        </div>
                        
                        <div className="ml-4 flex items-center">
                          <button 
                            type="button"
                            className="p-1 border border-gray-300 rounded-l"
                            onClick={() => handleItemReturnChange(item.id, (returnItems[item.id] || 0) - 1)}
                          >
                            -
                          </button>
                          <div className="w-10 text-center">
                            <input 
                              type="number"
                              value={returnItems[item.id] || 0}
                              onChange={(e) => handleItemReturnChange(item.id, parseInt(e.target.value) || 0)}
                              className="w-full text-center border-y border-gray-300 p-1 text-sm h-8"
                              min="0"
                              max={item.quantity}
                            />
                          </div>
                          <button 
                            type="button"
                            className="p-1 border border-gray-300 rounded-r"
                            onClick={() => handleItemReturnChange(item.id, (returnItems[item.id] || 0) + 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Reason for Return</h4>
                <div className="space-y-2">
                  {returnReasons.map((reason) => (
                    <div key={reason} className="flex items-center">
                      <input
                        id={`reason-${reason}`}
                        name="returnReason"
                        type="radio"
                        value={reason}
                        checked={returnReason === reason}
                        onChange={() => setReturnReason(reason)}
                        className="h-4 w-4 text-[#175e7a] focus:ring-[#175e7a] border-gray-300"
                      />
                      <label htmlFor={`reason-${reason}`} className="ml-3 block text-sm text-gray-700">
                        {reason}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {returnReason === 'Other' && (
                <div className="mb-4">
                  <label htmlFor="otherReason" className="block text-sm font-medium text-gray-700 mb-1">
                    Please specify
                  </label>
                  <textarea
                    id="otherReason"
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    rows={3}
                    className="shadow-sm focus:ring-[#175e7a] focus:border-[#175e7a] block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Tell us more about why you're returning these items..."
                  />
                </div>
              )}

              <div className="mt-4 mb-5 bg-gray-50 p-3 rounded-md">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Total Refund Amount:</span>
                  <span className="font-medium">₹{calculateRefundAmount().toFixed(2)}</span>
                </div>
              </div>

              <div className="sm:flex sm:flex-row-reverse mt-5">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#175e7a] text-base font-medium text-white hover:bg-[#0f4c67] focus:outline-none sm:ml-3 sm:w-auto sm:text-sm ${
                    submitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {submitting ? 'Processing...' : 'Submit Return Request'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={onClose}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}