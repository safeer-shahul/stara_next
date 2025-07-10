'use client';

import { useState } from 'react';
import { X, AlertTriangle, Package } from 'lucide-react';
import apiService from '@/utils/api/apiService';

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
    'Product no longer needed',
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
      // Call the new API with PUT method
      await apiService.cancelOrder(orderId, {
        cancel_reason: reason === 'Other' ? otherReason : reason
      });
      
      // console.log('Order cancelled successfully:', {
      //   order_id: orderId,
      //   cancel_reason: reason === 'Other' ? otherReason : reason
      // });
      
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
          <div className="absolute inset-0 bg-black opacity-50"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Package size={20} className="text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Cancel Order</h3>
              </div>
              <button 
                onClick={onClose} 
                className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <AlertTriangle size={20} className="text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Order Cancellation</p>
                    <p className="text-xs text-amber-700 mt-1">
                      You are about to cancel order #{orderId.replace(/-/g, '')}. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start">
                  <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Please tell us why you're cancelling this order
                  </label>
                  <div className="space-y-1">
                    {cancelReasons.map((r) => (
                      <label 
                        key={r} 
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                          reason === r 
                            ? 'border-[var(--color-primary-950)] bg-blue-50 ring-1 ring-[var(--color-primary-950)]' 
                            : 'border-gray-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="cancelReason"
                          value={r}
                          checked={reason === r}
                          onChange={() => setReason(r)}
                          className="h-4 w-4 text-[var(--color-primary-950)] focus:ring-[var(--color-primary-950)] border-gray-300"
                        />
                        <span className={`ml-3 text-sm ${
                          reason === r ? 'font-medium text-gray-900' : 'text-gray-700'
                        }`}>
                          {r}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {reason === 'Other' && (
                  <div className="mb-2">
                    <label htmlFor="otherReason" className="block text-sm font-semibold text-gray-700 mb-2">
                      Please provide more details
                    </label>
                    <textarea
                      id="otherReason"
                      value={otherReason}
                      onChange={(e) => setOtherReason(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-[var(--color-primary-950)] transition-colors resize-none"
                      placeholder="Please explain why you want to cancel this order..."
                    />
                  </div>
                )}

                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    onClick={onClose}
                  >
                    Keep Order
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${
                      loading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-[var(--color-primary-950)] hover:bg-[#0f4c67] focus:ring-[var(--color-primary-950)] shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Cancelling...
                      </span>
                    ) : (
                      'Cancel Order'
                    )}
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