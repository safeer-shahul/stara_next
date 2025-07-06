'use client';

import { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, AlertTriangle, Gift, Trash2, Eye, FileImage } from 'lucide-react';
import Image from 'next/image';
import apiService from '@/utils/api/apiService';

interface ReplacementOrderModalProps {
  orderId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReplacementOrderModal({ orderId, onClose, onSuccess }: ReplacementOrderModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<any>(null);
  const [offers, setOffers] = useState<any>([]);
  const [replacementItems, setReplacementItems] = useState<Record<string, {
    selected: boolean;
    reason: 'Damaged' | 'Change Size' | '';
    newVariant?: string;
    replacementImages?: File[];
  }>>({});
  const [requestDetails, setRequestDetails] = useState('');
  const [error, setError] = useState('');
  const [showPolicy, setShowPolicy] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<{ url: string; name: string } | null>(null);

  const mainReasons = ['Damaged', 'Change Size'];

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

        // Initialize replacement items state
        const allItems = getAllOrderItems(orderResponse);
        const initialItems: Record<string, any> = {};
        allItems.forEach(item => {
          initialItems[item.id] = {
            selected: false,
            reason: '',
            newVariant: item.product_variant || '',
            replacementImages: []
          };
        });
        setReplacementItems(initialItems);
        
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

  // Check if product has variants
  const hasVariants = (item: any) => {
    return item.product_details?.product_variant && 
           Array.isArray(item.product_details.product_variant) && 
           item.product_details.product_variant.length > 0;
  };

  // Get available reasons for an item
  const getAvailableReasons = (item: any) => {
    if (hasVariants(item)) {
      return mainReasons; // Both Damaged and Change Size
    } else {
      return ['Damaged']; // Only Damaged if no variants
    }
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

  const handleItemChange = (itemId: string, field: string, value: any) => {
    const allItems = getAllOrderItems(orderData);
    const orderItem = allItems.find(item => item.id === itemId);
    if (!orderItem) return;

    setReplacementItems(prev => {
      const updated = { ...prev };
      
      if (!updated[itemId]) {
        updated[itemId] = { selected: false, reason: '', newVariant: orderItem.product_variant || '', replacementImages: [] };
      }
      
      if (field === 'selected') {
        updated[itemId] = { 
          ...updated[itemId], 
          selected: value
        };
        // Reset reason when deselecting
        if (!value) {
          updated[itemId].reason = '';
          updated[itemId].newVariant = orderItem.product_variant || '';
          updated[itemId].replacementImages = [];
        }
      } else if (field === 'reason') {
        updated[itemId] = { 
          ...updated[itemId], 
          reason: value,
          // Reset variant to current if switching to Damaged
          newVariant: value === 'Damaged' ? orderItem.product_variant : updated[itemId].newVariant
        };
      } else if (field === 'newVariant') {
        updated[itemId] = { ...updated[itemId], newVariant: value };
      } else if (field === 'replacementImages') {
        // Handle multiple file selection
        const files = value ? Array.from(value as FileList) : [];
        updated[itemId] = { 
          ...updated[itemId], 
          replacementImages: files
        };
      }
      
      return updated;
    });
  };

  // Delete specific image from the array
  const handleDeleteImage = (itemId: string, indexToDelete: number) => {
    setReplacementItems(prev => {
      const updated = { ...prev };
      if (updated[itemId] && updated[itemId].replacementImages) {
        updated[itemId] = {
          ...updated[itemId],
          replacementImages: updated[itemId].replacementImages!.filter((_, index) => index !== indexToDelete)
        };
      }
      return updated;
    });
  };

  // Open full screen image view
  const handleViewImage = (file: File) => {
    const url = URL.createObjectURL(file);
    setFullScreenImage({ url, name: file.name });
  };

  // Close full screen image view
  const closeFullScreenImage = () => {
    if (fullScreenImage) {
      URL.revokeObjectURL(fullScreenImage.url);
      setFullScreenImage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Check if any items are selected for replacement
  const selectedItems = Object.entries(replacementItems).filter(([, item]) => item.selected);
  if (selectedItems.length === 0) {
    setError('Please select at least one item to replace');
    return;
  }
  
  // Validate that all selected items have reasons and required fields
  for (const [itemId, item] of selectedItems) {
    if (!item.reason) {
      setError('Please select a reason for all items you want to replace');
      return;
    }
    
    if (item.reason === 'Change Size' && !item.newVariant) {
      setError('Please select a new variant for size change requests');
      return;
    }
  }

  setSubmitting(true);
  setError('');

  try {
    const allItems = getAllOrderItems(orderData);
    
    // Prepare replacement items data with image keys
    const items = selectedItems.map(([itemId, item], index) => {
      const orderItem = allItems.find(oi => oi.id === itemId);
      const itemData:any = {
        order_item_id: itemId,
        item_reason: item.reason,
        new_requested_product: orderItem?.product_details?.id || orderItem?.product_id || '',
        new_requested_product_variant: item.newVariant || '',
      };

      // Add image_key if item has replacement images
      if (item.replacementImages && item.replacementImages.length > 0) {
        itemData.image_key = `item_${index + 1}_images`;
      }

      return itemData;
    });
    
    console.log('Replacement request payload for backend:', {
      order_id: orderId,
      ...(requestDetails.trim() && { request_details: requestDetails }),
      items: items
    });

    // Create FormData for file upload
    const formData = new FormData();

    // Add order_id
    formData.append('order_id', orderId);

    // Add request_details only if provided
    if (requestDetails.trim()) {
      formData.append('request_details', requestDetails);
    }

    // Add entire items array as JSON string
    formData.append('items', JSON.stringify(items));

    // Add replacement images with their corresponding keys
    selectedItems.forEach(([itemId, item], index) => {
      if (item.replacementImages && item.replacementImages.length > 0) {
        const imageKey = `item_${index + 1}_images`;
        
        // Add all images for this item under the same key
        item.replacementImages.forEach((file) => {
          formData.append(imageKey, file);
        });
      }
    });

    // Call your API to process the replacement
    await apiService.requestReplacement(formData);

    console.log('Replacement request submitted successfully');
    onSuccess();
  } catch (error: any) {
    setError(error.message || 'Failed to submit replacement request. Please try again.');
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

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all  sm:align-middle w-full md:max-w-4xl ">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Replace Items</h3>
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
                  Replacement Policy
                  {showPolicy ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {showPolicy && (
                  <div className="p-3 text-sm text-gray-600 bg-white">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Replacements must be requested within 2 days of delivery</li>
                      <li>Original items must be returned in their packaging</li>
                      <li>Shipping for replacement items is free</li>
                      <li>Processing may take 7-10 business days after we receive your original items</li>
                      <li>Replacement items will be of the same product and quantity</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="mb-5">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Select Items to Replace</h4>
                
                {error && (
                  <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded flex items-start">
                    <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {/* Regular Items */}
                  {regularItems.length > 0 && (
                    <div className="space-y-3">
                      {regularItems.map((item: any) => {
                        const currentItem = replacementItems[item.id] || { selected: false, reason: '', newVariant: item.product_variant || '', replacementImages: [] };
                        const isSelected = currentItem.selected;
                        const canChangeVariant = currentItem.reason === 'Change Size' && hasVariants(item);
                        const availableReasons = getAvailableReasons(item);
                        
                        return (
                          <div key={item.id} className={`border rounded-lg p-3 sm:p-4 ${isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                            <div className="flex items-start space-x-3">
                              <div className="flex items-center pt-1 sm:pt-2">
                                <input
                                  type="checkbox"
                                  id={`item-${item.id}`}
                                  checked={isSelected}
                                  onChange={(e) => handleItemChange(item.id, 'selected', e.target.checked)}
                                  className="h-4 w-4 text-[var(--color-primary-950)] focus:ring-[#175e7a] border-gray-300 rounded"
                                />
                              </div>
                              
                              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0 relative">
                                {item.product_details.images && item.product_details.images.length > 0 ? (
                                  <Image 
                                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${item.product_details.images[0].product_image}`} 
                                    alt={item.product_details.product_name}
                                    fill
                                    sizes="(max-width: 640px) 48px, 64px"
                                    style={{objectFit: 'cover'}}
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-200"></div>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <label htmlFor={`item-${item.id}`} className="cursor-pointer">
                                  <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">{item.product_details.product_name}</h4>
                                  <p className="text-xs text-gray-500 mb-2 sm:mb-3">₹{parseFloat(item.price || item.total_price).toFixed(2)} x {item.quantity}</p>
                                </label>

                                {/* Show controls only if selected */}
                                {isSelected && (
                                  <div className="space-y-2 sm:space-y-3">
                                    {/* Reason Selection */}
                                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
                                      <span className="text-sm text-gray-600 sm:w-16 font-medium">Reason:</span>
                                      <select
                                        value={currentItem.reason}
                                        onChange={(e) => handleItemChange(item.id, 'reason', e.target.value)}
                                        className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-[var(--color-primary-950)] focus:border-[var(--color-primary-950)]"
                                      >
                                        <option value="">Select reason</option>
                                        {availableReasons.map(reason => (
                                          <option key={reason} value={reason}>{reason}</option>
                                        ))}
                                      </select>
                                    </div>

                                    {/* Variant Selection - only show if reason is "Change Size" and product has variants */}
                                    {canChangeVariant && (
                                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
                                        <span className="text-sm text-gray-600 sm:w-16 font-medium">New Size:</span>
                                        <select
                                          value={currentItem.newVariant || ''}
                                          onChange={(e) => handleItemChange(item.id, 'newVariant', e.target.value)}
                                          className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-[var(--color-primary-950)] focus:border-[var(--color-primary-950)]"
                                        >
                                          <option value="">Select new variant</option>
                                          {item.product_details.product_variant.map((variant: any) => (
                                            <option 
                                              key={variant.id} 
                                              value={variant.id}
                                              disabled={variant.quantity <= 0}
                                              className={variant.quantity <= 0 ? 'text-gray-400' : ''}
                                            >
                                              Size {variant.variant_name} {variant.quantity > 0 ? `(${variant.quantity} available)` : '(Out of stock)'}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    )}

                                    {/* Image Upload for damaged items */}
                                    {currentItem.reason === 'Damaged' && (
                                      <div className="flex flex-col sm:flex-row sm:items-start space-y-1 sm:space-y-0 sm:space-x-3">
                                        <span className="text-sm text-gray-600 sm:w-16 font-medium sm:pt-1">Images:</span>
                                        <div className="flex-1">
                                          <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={(e) => handleItemChange(item.id, 'replacementImages', e.target.files)}
                                            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-[var(--color-primary-950)] focus:border-[var(--color-primary-950)]"
                                          />
                                          <p className="text-xs text-gray-500 mt-1">Upload images showing damage (optional)</p>
                                          
                                          {/* Image Previews */}
                                          {currentItem.replacementImages && currentItem.replacementImages.length > 0 && (
                                            <div className="mt-3">
                                              <p className="text-xs text-gray-600 mb-2">Selected images ({currentItem.replacementImages.length}):</p>
                                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                                {currentItem.replacementImages.map((file, index) => (
                                                  <div key={index} className="relative group">
                                                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                                      <Image
                                                        src={URL.createObjectURL(file)}
                                                        alt={file.name}
                                                        fill
                                                        className="object-cover"
                                                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                                                      />
                                                    </div>
                                                    {/* Overlay with actions */}
                                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-lg flex items-center justify-center space-x-1 opacity-0 group-hover:opacity-100">
                                                      <button
                                                        type="button"
                                                        onClick={() => handleViewImage(file)}
                                                        className="p-1.5 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full transition-all"
                                                        title="View image"
                                                      >
                                                        <Eye size={14} className="text-gray-700" />
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={() => handleDeleteImage(item.id, index)}
                                                        className="p-1.5 bg-red-500 bg-opacity-90 hover:bg-opacity-100 rounded-full transition-all"
                                                        title="Delete image"
                                                      >
                                                        <Trash2 size={14} className="text-white" />
                                                      </button>
                                                    </div>
                                                    {/* File name */}
                                                    <p className="text-xs text-gray-600 mt-1 truncate" title={file.name}>
                                                      {file.name}
                                                    </p>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Bundle/Offer Items - Same logic as regular items */}
                  {bundleGroups.map((bundleGroup) => (
                    <div key={bundleGroup.bundleId} className="space-y-3">
                      <div className="flex items-center gap-2 px-3 py-1">
                        <Gift size={16} className="text-gray-600" />
                        <h5 className="text-sm font-medium text-gray-800">{bundleGroup.offerName}</h5>
                      </div>
                      
                      {bundleGroup.items.map((item: any) => {
                        const currentItem = replacementItems[item.id] || { selected: false, reason: '', newVariant: item.product_variant || '', replacementImages: [] };
                        const isSelected = currentItem.selected;
                        const canChangeVariant = currentItem.reason === 'Change Size' && hasVariants(item);
                        const availableReasons = getAvailableReasons(item);
                        
                        return (
                          <div key={item.id} className={`border rounded-lg p-3 sm:p-4 ml-2 sm:ml-4 ${isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                            <div className="flex items-start space-x-3">
                              <div className="flex items-center pt-1 sm:pt-2">
                                <input
                                  type="checkbox"
                                  id={`bundle-item-${item.id}`}
                                  checked={isSelected}
                                  onChange={(e) => handleItemChange(item.id, 'selected', e.target.checked)}
                                  className="h-4 w-4 text-[var(--color-primary-950)] focus:ring-[#175e7a] border-gray-300 rounded"
                                />
                              </div>
                              
                              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-md overflow-hidden bg-gray-100 flex-shrink-0 relative">
                                {item.product_details.images && item.product_details.images.length > 0 ? (
                                  <Image 
                                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${item.product_details.images[0].product_image}`} 
                                    alt={item.product_details.product_name}
                                    fill
                                    sizes="(max-width: 640px) 48px, 56px"
                                    style={{objectFit: 'cover'}}
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-200"></div>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <label htmlFor={`bundle-item-${item.id}`} className="cursor-pointer">
                                  <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">{item.product_details.product_name}</h4>
                                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
                                    <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                                    <span className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                                      {item.mode}
                                    </span>
                                    <p className="text-xs">
                                      {item.mode === 'Get' ? (
                                        <span className="text-gray-600">FREE</span>
                                      ) : (
                                        `₹${parseFloat(item.price || item.total_price).toFixed(2)}`
                                      )}
                                    </p>
                                  </div>
                                </label>

                                {/* Same controls as regular items */}
                                {isSelected && (
                                  <div className="space-y-2 sm:space-y-3">
                                    {/* Reason Selection */}
                                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
                                      <span className="text-sm text-gray-600 sm:w-16 font-medium">Reason:</span>
                                      <select
                                        value={currentItem.reason}
                                        onChange={(e) => handleItemChange(item.id, 'reason', e.target.value)}
                                        className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-[var(--color-primary-950)] focus:border-[var(--color-primary-950)]"
                                      >
                                        <option value="">Select reason</option>
                                        {availableReasons.map(reason => (
                                          <option key={reason} value={reason}>{reason}</option>
                                        ))}
                                      </select>
                                    </div>

                                    {/* Variant Selection for bundle items */}
                                    {canChangeVariant && (
                                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
                                        <span className="text-sm text-gray-600 sm:w-16 font-medium">New Size:</span>
                                        <select
                                          value={currentItem.newVariant || ''}
                                          onChange={(e) => handleItemChange(item.id, 'newVariant', e.target.value)}
                                          className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-[var(--color-primary-950)] focus:border-[var(--color-primary-950)]"
                                        >
                                          <option value="">Select new variant</option>
                                          {item.product_details.product_variant.map((variant: any) => (
                                            <option 
                                              key={variant.id} 
                                              value={variant.id}
                                              disabled={variant.quantity <= 0}
                                              className={variant.quantity <= 0 ? 'text-gray-400' : ''}
                                            >
                                              Size {variant.variant_name} {variant.quantity > 0 ? `(${variant.quantity} available)` : '(Out of stock)'}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    )}

                                    {/* Image Upload for damaged bundle items */}
                                    {currentItem.reason === 'Damaged' && (
                                      <div className="flex flex-col sm:flex-row sm:items-start space-y-1 sm:space-y-0 sm:space-x-3">
                                        <span className="text-sm text-gray-600 sm:w-16 font-medium sm:pt-1">Images:</span>
                                        <div className="flex-1">
                                          <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={(e) => handleItemChange(item.id, 'replacementImages', e.target.files)}
                                            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-[var(--color-primary-950)] focus:border-[var(--color-primary-950)]"
                                          />
                                          <p className="text-xs text-gray-500 mt-1">Upload images showing damage (optional)</p>
                                          
                                          {/* Image Previews */}
                                          {currentItem.replacementImages && currentItem.replacementImages.length > 0 && (
                                            <div className="mt-3">
                                              <p className="text-xs text-gray-600 mb-2">Selected images ({currentItem.replacementImages.length}):</p>
                                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                                {currentItem.replacementImages.map((file, index) => (
                                                  <div key={index} className="relative group">
                                                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                                      <Image
                                                        src={URL.createObjectURL(file)}
                                                        alt={file.name}
                                                        fill
                                                        className="object-cover"
                                                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                                                      />
                                                    </div>
                                                    {/* Overlay with actions */}
                                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-lg flex items-center justify-center space-x-1 opacity-0 group-hover:opacity-100">
                                                      <button
                                                        type="button"
                                                        onClick={() => handleViewImage(file)}
                                                        className="p-1.5 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full transition-all"
                                                        title="View image"
                                                      >
                                                        <Eye size={14} className="text-gray-700" />
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={() => handleDeleteImage(item.id, index)}
                                                        className="p-1.5 bg-red-500 bg-opacity-90 hover:bg-opacity-100 rounded-full transition-all"
                                                        title="Delete image"
                                                      >
                                                        <Trash2 size={14} className="text-white" />
                                                      </button>
                                                    </div>
                                                    {/* File name */}
                                                    <p className="text-xs text-gray-600 mt-1 truncate" title={file.name}>
                                                      {file.name}
                                                    </p>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            
              <div className="mb-4">
                <label htmlFor="requestDetails" className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Details
                </label>
                <textarea
                  id="requestDetails"
                  value={requestDetails}
                  onChange={(e) => setRequestDetails(e.target.value)}
                  rows={3}
                  required
                  className="shadow-sm focus:ring-[#175e7a] focus:border-[var(--color-primary-950)] block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Please provide any additional details about your replacement request..."
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-5">
                <button
                  type="button"
                  className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:text-sm"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[var(--color-primary-950)] text-base font-medium text-white hover:bg-[#0f4c67] focus:outline-none sm:text-sm ${
                    submitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {submitting ? 'Processing...' : 'Submit Replacement Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Full Screen Image Modal */}
      {fullScreenImage && (
        <div className="fixed inset-0 z-[60] bg-black bg-opacity-90 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={closeFullScreenImage}
              className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-30 hover:bg-opacity-50 rounded-full transition-all border border-white border-opacity-20"
            >
              <X size={24} className="text-white" />
            </button>
            
            {/* Image */}
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={fullScreenImage.url}
                alt={fullScreenImage.name}
                fill
                className="object-contain"
                sizes="(max-width: 1200px) 100vw, 1200px"
              />
            </div>
            
            {/* Image name */}
            <div className="absolute bottom-4 left-4 right-4 text-center">
              <p className="text-white text-sm bg-black bg-opacity-50 rounded px-3 py-1 inline-block">
                {fullScreenImage.name}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}