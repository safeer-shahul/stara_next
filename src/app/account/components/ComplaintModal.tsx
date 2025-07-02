'use client';

import { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, AlertTriangle, Gift } from 'lucide-react';
import Image from 'next/image';
import apiService from '@/utils/api/apiService';

interface ComplaintModalProps {
  orderId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ComplaintModal({ orderId, onClose, onSuccess }: ComplaintModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<any>(null);
  const [offers, setOffers] = useState<any>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [complaintReason, setComplaintReason] = useState('');
  const [error, setError] = useState('');
  const [showPolicy, setShowPolicy] = useState(false);

  const complaintReasons = [
    'Received damaged item',
    'Product doesn\'t match description',
    'Poor product quality',
    'Missing items from order',
    'Late delivery',
    'Wrong item received',
    'Defective product',
    'Other'
  ];

  // Fetch order and offers data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch order data and valid offers concurrently
        const [orderResponse, offersResponse] = await Promise.all([
          apiService.getOrderByIdUser(orderId),
          apiService.getValidOffers()
        ]);
        
        console.log('Order data response:', orderResponse);
        console.log('Valid offers response:', offersResponse);
        
        setOrderData(orderResponse);
        setOffers(offersResponse?.data || []);
        
        // Initialize selected items with false for all items
        const allItems = getAllOrderItems(orderResponse);
        const initialSelectedItems: Record<string, boolean> = {};
        allItems.forEach(item => {
          initialSelectedItems[item.id] = false;
        });
        setSelectedItems(initialSelectedItems);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    if (orderId) {
      fetchData();
    }
  }, [orderId]);

  // Get all items for the order (including bundle items)
  const getAllOrderItems = (order: any) => {
    if (!order) return [];
    
    let allItems = [...(order.order_items || [])];
    
    // Add bundle items if they exist
    if (order.bundles) {
      Object.keys(order.bundles).forEach(bundleId => {
        allItems = allItems.concat(order.bundles[bundleId]);
      });
    }
    
    return allItems;
  };

  // Get offer name for a bundle
  const getOfferName = (bundleItems: any[]) => {
    if (!bundleItems.length || !offers.length) return 'Special Offer';
    
    // Get product IDs from bundle items
    const bundleProductIds = bundleItems.map(item => item.product_id);
    
    // Find matching offer based on products
    const matchingOffer = offers.find((offer: any) => {
      return bundleProductIds.every(productId => offer.products.includes(productId));
    });
    
    return matchingOffer ? matchingOffer.offer_name : 'Special Offer';
  };

  // Group bundle items by bundle ID with offer names
  const getBundleGroups = (order: any) => {
    if (!order || !order.bundles) return [];
    
    return Object.keys(order.bundles).map((bundleId) => ({
      bundleId,
      items: order.bundles[bundleId],
      offerName: getOfferName(order.bundles[bundleId])
    }));
  };

  const handleItemSelection = (itemId: string, selected: boolean) => {
    setSelectedItems({
      ...selectedItems,
      [itemId]: selected
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if any items are selected for complaint
    const hasSelectedItems = Object.values(selectedItems).some(selected => selected);
    if (!hasSelectedItems) {
      setError('Please select at least one item to register complaint for');
      return;
    }
    
    // Check if a reason is provided
    if (!complaintReason.trim()) {
      setError('Please provide a reason for your complaint');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Get all items and filter selected ones
      const allItems = getAllOrderItems(orderData);
      const selectedItemIds = Object.keys(selectedItems).filter(itemId => selectedItems[itemId]);
      
      // Build products array with product_id and variant_id
      const products = selectedItemIds.map(itemId => {
        const item = allItems.find(item => item.id === itemId);
        return {
          product_id: item?.product_id || item?.product_details?.id,
          variant_id: item?.variant_id || item?.product_details?.variant_id || null
        };
      }).filter(product => product.product_id); // Remove any items without product_id
      
      // Complaint request data in the required format
      const complaintData = {
        orderID: orderId,
        products: products,
        reason: complaintReason
      };
      
      console.log('Complaint request data:', complaintData);
      
      // Call your API to process the complaint
      // In a real application, uncomment this:
      // await apiService.createComplaintRequest(complaintData);
      
      // For demo purposes, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Complaint request submitted:', complaintData);
      
      onSuccess();
    } catch (error: any) {
      setError(error.message || 'Failed to submit complaint. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" onClick={onClose}>
            <div className="absolute inset-0 bg-black opacity-75"></div>
          </div>
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary-950)]"></div>
                <span className="ml-3 text-gray-600">Loading order details...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" onClick={onClose}>
            <div className="absolute inset-0 bg-black opacity-75"></div>
          </div>
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
              <div className="text-center py-8">
                <p className="text-red-600">Failed to load order details</p>
                <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-500 text-white rounded">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const bundleGroups = getBundleGroups(orderData);
  const regularItems = orderData.order_items || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-black opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Register Complaint</h3>
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
                  Complaint Policy
                  {showPolicy ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {showPolicy && (
                  <div className="p-3 text-sm text-gray-600 bg-white">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Complaints can be registered for delivered orders</li>
                      <li>We aim to resolve complaints within 3-5 business days</li>
                      <li>You will receive updates via email/SMS on complaint status</li>
                      <li>Our customer support team will contact you for further details if needed</li>
                      <li>Provide accurate information to help us resolve your issue quickly</li>
                      <li>Keep your order details handy for reference</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="mb-5">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Select Items for Complaint</h4>
                
                {error && (
                  <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded flex items-start">
                    <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {/* Regular Items */}
                  {regularItems.length > 0 && (
                    <div className="space-y-2">
                      {regularItems.map((item: any) => (
                        <div key={item.id} className="flex bg-white p-3 rounded-lg border border-gray-200">
                          <div className="flex items-center mr-3">
                            <input
                              type="checkbox"
                              id={`item-${item.id}`}
                              checked={selectedItems[item.id] || false}
                              onChange={(e) => handleItemSelection(item.id, e.target.checked)}
                              className="h-4 w-4 text-[var(--color-primary-950)] focus:ring-[#175e7a] border-gray-300 rounded"
                            />
                          </div>
                          
                          <div className="w-16 h-16 rounded-md overflow-hidden mr-3 bg-gray-100 flex-shrink-0 relative">
                            {item.product_details.images && item.product_details.images.length > 0 ? (
                              <Image 
                                src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${item.product_details.images[0].product_image}`} 
                                alt={item.product_details.product_name}
                                fill
                                sizes="64px"
                                style={{objectFit: 'cover'}}
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200"></div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <label htmlFor={`item-${item.id}`} className="cursor-pointer">
                              <h4 className="text-sm font-medium text-gray-900 mb-1">{item.product_details.product_name}</h4>
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                                  {item.mode && item.mode !== 'Normal' && (
                                    <span className="text-xs bg-gray-100 text-gray-700 px-1 py-0.5 rounded">
                                      {item.mode}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm font-medium">₹{parseFloat(item.price || item.total_price).toFixed(2)}</p>
                              </div>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Bundle/Offer Items - Same styling as regular items */}
                  {bundleGroups.map((bundleGroup) => (
                    <div key={bundleGroup.bundleId} className="space-y-2">
                      <div className="flex items-center gap-2 px-3 py-1">
                        <Gift size={16} className="text-gray-600" />
                        <h5 className="text-sm font-medium text-gray-800">{bundleGroup.offerName}</h5>
                      </div>
                      
                      {bundleGroup.items.map((item: any) => (
                        <div key={item.id} className="flex bg-white p-3 rounded-lg border border-gray-200 ml-4">
                          <div className="flex items-center mr-3">
                            <input
                              type="checkbox"
                              id={`bundle-item-${item.id}`}
                              checked={selectedItems[item.id] || false}
                              onChange={(e) => handleItemSelection(item.id, e.target.checked)}
                              className="h-4 w-4 text-[var(--color-primary-950)] focus:ring-[#175e7a] border-gray-300 rounded"
                            />
                          </div>
                          
                          <div className="w-14 h-14 rounded-md overflow-hidden mr-3 bg-gray-100 flex-shrink-0 relative">
                            {item.product_details.images && item.product_details.images.length > 0 ? (
                              <Image 
                                src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${item.product_details.images[0].product_image}`} 
                                alt={item.product_details.product_name}
                                fill
                                sizes="56px"
                                style={{objectFit: 'cover'}}
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200"></div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <label htmlFor={`bundle-item-${item.id}`} className="cursor-pointer">
                              <h4 className="text-sm font-medium text-gray-900 mb-1">{item.product_details.product_name}</h4>
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                                  <span className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                                    {item.mode}
                                  </span>
                                </div>
                                <p className="text-sm font-medium">
                                  {item.mode === 'Get' ? (
                                    <span className="text-gray-600">FREE</span>
                                  ) : (
                                    `₹${parseFloat(item.price || item.total_price).toFixed(2)}`
                                  )}
                                </p>
                              </div>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            
              <div className="mb-4">
                <label htmlFor="complaintReason" className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Complaint
                </label>
                <textarea
                  id="complaintReason"
                  value={complaintReason}
                  onChange={(e) => setComplaintReason(e.target.value)}
                  rows={3}
                  className="shadow-sm focus:ring-[#175e7a] focus:border-[var(--color-primary-950)] block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Please explain the reason for your complaint..."
                  required
                />
              </div>

              <div className="sm:flex sm:flex-row-reverse mt-5">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[var(--color-primary-950)] text-base font-medium text-white hover:bg-[#0f4c67] focus:outline-none sm:ml-3 sm:w-auto sm:text-sm ${
                    submitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {submitting ? 'Submitting...' : 'Submit Complaint'}
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