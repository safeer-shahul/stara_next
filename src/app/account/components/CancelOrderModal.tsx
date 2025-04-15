'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface CancelOrderModalProps {
  orderId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CancelOrderModal({ orderId, onClose, onSuccess }: CancelOrderModalProps) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [error, setError] = useState('');

  const cancelReasons = [
    'Changed my mind',
    'Found a better price elsewhere',
    'Ordered by mistake',
    'Shipping time is too long',
    'Payment issues',
    'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason) {
      setError('Please select a reason for cancellation');
      return;
    }

    if (reason === 'Other' && !otherReason.trim()) {
      setError('Please provide details for your cancellation reason');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Call your API to cancel the order
      // Replace this with your actual API call
      /*
      await apiService.cancelOrder({
        order_id: orderId,
        reason: reason === 'Other' ? otherReason : reason
      });
      */
      
      // For demo purposes, let's simulate an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Order cancelled:', {
        order_id: orderId,
        reason: reason === 'Other' ? otherReason : reason
      });
      
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel order. Please try again.');
      setLoading(false);
    }
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
              <h3 className="text-lg font-medium text-gray-900">Cancel Order</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <X size={20} />
              </button>
            </div>

            <div className="mt-2">
              <p className="text-sm text-gray-600 mb-4">
                Please select a reason for cancelling your order #{orderId.replace(/-/g, '')}
              </p>

              {error && (
                <div className="mb-4 p-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Cancellation
                  </label>
                  <div className="space-y-2">
                    {cancelReasons.map((r) => (
                      <div key={r} className="flex items-center">
                        <input
                          id={`reason-${r}`}
                          name="cancelReason"
                          type="radio"
                          value={r}
                          checked={reason === r}
                          onChange={() => setReason(r)}
                          className="h-4 w-4 text-[#175e7a] focus:ring-[#175e7a] border-gray-300"
                        />
                        <label htmlFor={`reason-${r}`} className="ml-3 block text-sm text-gray-700">
                          {r}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {reason === 'Other' && (
                  <div className="mb-4">
                    <label htmlFor="otherReason" className="block text-sm font-medium text-gray-700 mb-2">
                      Please specify
                    </label>
                    <textarea
                      id="otherReason"
                      value={otherReason}
                      onChange={(e) => setOtherReason(e.target.value)}
                      rows={3}
                      className="shadow-sm focus:ring-[#175e7a] focus:border-[#175e7a] block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Tell us more about why you're cancelling..."
                    />
                  </div>
                )}

                <div className="sm:flex sm:flex-row-reverse mt-5">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm ${
                      loading ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#175e7a] sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={onClose}
                  >
                    Keep Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}