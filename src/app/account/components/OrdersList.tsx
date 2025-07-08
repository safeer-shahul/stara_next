'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapPin, PackageOpen, Gift, ChevronDown, ChevronUp } from 'lucide-react';
import Image from 'next/image';
import apiService from '@/utils/api/apiService';
import CancelOrderModal from './CancelOrderModal';
import ReplacementOrderModal from './ReplacementOrderModal';
import ComplaintModal from './ComplaintModal';

// --- Constants ---
const INDIAN_STATES: { [key: string]: string } = {
  "AN": "Andaman and Nicobar Islands",
  "AP": "Andhra Pradesh",
  "AR": "Arunachal Pradesh",
  "AS": "Assam",
  "BR": "Bihar",
  "CG": "Chandigarh",
  "CH": "Chhattisgarh",
  "DN": "Dadra and Nagar Haveli",
  "DD": "Daman and Diu",
  "DL": "Delhi",
  "GA": "Goa",
  "GJ": "Gujarat",
  "HR": "Haryana",
  "HP": "Himachal Pradesh",
  "JK": "Jammu and Kashmir",
  "JH": "Jharkhand",
  "KA": "Karnataka",
  "KL": "Kerala",
  "LA": "Ladakh",
  "LD": "Lakshadweep",
  "MP": "Madhya Pradesh",
  "MH": "Maharashtra",
  "MN": "Manipur",
  "ML": "Meghalaya",
  "MZ": "Mizoram",
  "NL": "Nagaland",
  "OR": "Odisha",
  "PY": "Puducherry",
  "PB": "Punjab",
  "RJ": "Rajasthan",
  "SK": "Sikkim",
  "TN": "Tamil Nadu",
  "TS": "Telangana",
  "TR": "Tripura",
  "UP": "Uttar Pradesh",
  "UK": "Uttarakhand",
  "WB": "West Bengal"
};

export default function OrdersList() {
  const [orders, setOrders] = useState<any>([]);
  const [offers, setOffers] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  // Helper function to get variant display name
  const getVariantDisplayName = (item: any) => {
    if (!item.product_variant) return null;
    
    // If product_variant is a string (variant ID), find the variant details
    if (typeof item.product_variant === 'string') {
      const variants = item.product_details?.product_variant || [];
      const variant = variants.find((v: any) => v.id === item.product_variant);
      return variant ? `Size ${variant.variant_name}` : `Size ${item.product_variant}`;
    }
    
    // If product_variant is an object with variant details
    if (typeof item.product_variant === 'object' && item.product_variant.variant_name) {
      return `Size ${item.product_variant.variant_name}`;
    }
    
    return null;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch both orders and offers concurrently
        const [ordersResponse, offersResponse] = await Promise.all([
          apiService.getMyOrders(),
          apiService.getValidOffers()
        ]);
        
        console.log('Orders response:', ordersResponse);
        console.log('Offers response:', offersResponse);
        
        setOrders(ordersResponse || []);
        setOffers(offersResponse?.data || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setOrders([]);
        setOffers([]);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Toggle order expansion
  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  // Get full state name from state code
  const getStateName = useCallback((stateCode: string) => {
    return INDIAN_STATES[stateCode] || stateCode;
  }, []);

  // Helper function to format dates
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Check if order can be cancelled (only pending orders)
  const canCancelOrder = (status: string) => {
    return status === 'Pending';
  };

  // Check if order can be replaced (only delivered orders, within 3 days, not already requested)
  const canReplaceOrder = (order: any) => {
    if (order.status !== 'Delivered') return false;
    if (order.is_replacement_requested) return false;
    if (!order.delivered_date) return false;

    // Check if within 3 days of delivery
    const deliveryDate = new Date(order.delivered_date);
    const currentDate = new Date();
    const daysDifference = Math.floor((currentDate.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysDifference <= 3;
  };

  // Check if order can have complaint registered (only delivered orders)
  const canRegisterComplaint = (status: any) => {
    return status === 'Delivered';
  };

  // Get all items for an order (including bundle items)
  const getAllOrderItems = (order: any) => {
    let allItems = [...order.order_items];
    
    // Add bundle items if they exist
    if (order.bundles) {
      Object.keys(order.bundles).forEach(bundleId => {
        allItems = allItems.concat(order.bundles[bundleId]);
      });
    }
    
    return allItems;
  };

  // Get total item count for an order
  const getTotalItemCount = (order: any) => {
    const allItems = getAllOrderItems(order);
    return allItems.reduce((sum: any, item: any) => sum + item.quantity, 0);
  };

  // Get offer name for a bundle
  const getOfferName = (bundleItems: any[]) => {
    if (!bundleItems.length || !offers.length) return 'Special Offer';
    
    // Get product IDs from bundle items
    const bundleProductIds = bundleItems.map(item => item.product_id);
    
    // Find matching offer based on products
    const matchingOffer = offers.find((offer: any) => {
      // Check if all bundle products are included in the offer's products
      return bundleProductIds.every(productId => offer.products.includes(productId));
    });
    
    return matchingOffer ? matchingOffer.offer_name : 'Special Offer';
  };

  // Group bundle items by bundle ID with offer names
  const getBundleGroups = (order: any) => {
    if (!order.bundles) return [];
    
    return Object.keys(order.bundles).map((bundleId, index) => ({
      bundleId,
      items: order.bundles[bundleId],
      offerName: getOfferName(order.bundles[bundleId])
    }));
  };

  // Handle refreshing orders after an action
  const handleOrderUpdate = async () => {
    try {
      const response = await apiService.getMyOrders();
      setOrders(response || []);
    } catch (error) {
      console.error('Error refreshing orders:', error);
    }
  };

  // Handle opening cancel modal
  const handleOpenCancelModal = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowCancelModal(true);
  };

  // Handle opening complaint modal
  const handleOpenComplaintModal = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowComplaintModal(true);
  };

  // Handle opening replacement modal
  const handleOpenReplacementModal = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowReplacementModal(true);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4 mb-4 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-1/4 mb-3"></div>
            <div className="flex justify-between mb-2">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/5"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 text-center">
        <PackageOpen size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">No Orders Yet</h3>
        <p className="text-gray-500">Once you place an order, it will appear here.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow py-4 px-2 sm:py-6 sm:px-4">
        <h2 className="text-[16px] font-semibold mb-4 sm:mb-6 px-2">Your Orders</h2>
        
        <div className="space-y-3 sm:space-y-4">
          {orders.map((order: any) => {
            const itemsCount = getTotalItemCount(order);
            const deliveryDate = order.delivered_date;
            const isExpanded = expandedOrders.has(order.order_id);
            
            const canCancel = canCancelOrder(order.status);
            const canReplace = canReplaceOrder(order);
            const canComplaint = canRegisterComplaint(order.status);
            const bundleGroups = getBundleGroups(order);
            const hasOffers = bundleGroups.length > 0;
            
            return (
              <div key={order.order_id} className="border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                {/* Header Section - Always Visible */}
                <div 
                  className="p-3 sm:p-4 cursor-pointer"
                  onClick={() => toggleOrderExpansion(order.order_id)}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[14px] font-medium">Order #{order.order_id.replace(/-/g, '')}</h3>
                      {hasOffers && (
                        <div className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          <Gift size={12} />
                          <span>Offer</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium inline-flex items-center justify-center min-w-[70px] ${
                        order.status === "Pending" 
                          ? "bg-orange-100 text-orange-800" 
                          : order.status === "Delivered" 
                            ? "bg-green-100 text-green-800" 
                            : order.status === "Shipped"
                              ? "bg-blue-100 text-blue-800"
                              : order.status === "Cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                      }`}>
                        {order.status}
                      </span>
                      {isExpanded ? (
                        <ChevronUp size={16} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={16} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  {/* Order Summary - Always Visible */}
                  <div className="flex flex-col gap-1 text-[12px] sm:text-[14px] text-gray-500">
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      <span>Ordered: {formatDate(order.created_at)}</span>
                      {order.status === 'Delivered' && deliveryDate && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span>Delivered: {formatDate(deliveryDate)}</span>
                        </>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      <span>{itemsCount} {itemsCount === 1 ? 'item' : 'items'}</span>
                      <span>•</span>
                      <span className="font-medium text-gray-900">₹{parseFloat(order.total_price || order.payable_price).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Expandable Content */}
                {isExpanded && (
                  <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t border-gray-100">
                    {/* Address Section */}
                    {order.address_details && (
                      <div className="py-3 px-3 bg-gray-50 rounded-lg mb-3 mt-3">
                        <div className="flex items-center mb-1">
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 mr-2 flex-shrink-0" />
                          <h4 className="text-[12px] sm:text-sm font-bold text-gray-700">Delivering to:</h4>
                        </div>
                        <p className="text-[11px] sm:text-sm ml-5 sm:ml-6 text-gray-600">
                          {order.address_details.address}, {order.address_details.town}, {getStateName(order.address_details.state)} - {order.address_details.pincode}
                        </p>
                        <p className="text-[11px] sm:text-sm ml-5 sm:ml-6 text-gray-600">
                          <span className="font-medium">Phone:</span> {order.address_details.phone_number_1}
                          {order.address_details.phone_number_2 && order.address_details.phone_number_2.trim() !== "" && (
                            <>, {order.address_details.phone_number_2}</>
                          )}
                        </p>
                      </div>
                    )}
                    
                    {/* Items Section */}
                    <div className="space-y-2 sm:space-y-3">
                      {/* Regular Items */}
                      {order.order_items.length > 0 && (
                        <div className="space-y-2">
                          {order.order_items.map((item: any) => {
                            const variantDisplayName = getVariantDisplayName(item);
                            
                            return (
                              <div key={item.id} className="flex bg-white p-2 rounded-lg border border-gray-200">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-md overflow-hidden mr-2 sm:mr-3 bg-gray-100 flex-shrink-0 relative">
                                  {item.product_details.images && item.product_details.images.length > 0 ? (
                                    <Image 
                                      src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${item.product_details.images[0].product_image}`} 
                                      alt={item.product_details.product_name}
                                      fill
                                      sizes="(max-width: 48px) 100vw, (max-width: 768px) 64px, 64px"
                                      style={{objectFit: 'cover'}}
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gray-200"></div>
                                  )}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-[12px] sm:text-[14px] font-medium text-gray-900 line-clamp-2 mb-1">
                                    {item.product_details.product_name}
                                  </h4>
                                  
                                  <div className="flex justify-between items-end">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                      <p className="text-[11px] sm:text-[13px] text-gray-600">Qty: {item.quantity}</p>
                                      {item.mode && item.mode !== 'Normal' && (
                                        <span className="text-[10px] sm:text-[11px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded w-fit">
                                          {item.mode}
                                        </span>
                                      )}
                                      {variantDisplayName && (
                                        <span className="text-[10px] sm:text-[11px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded w-fit">
                                          {variantDisplayName}
                                        </span>
                                      )}
                                    </div>
                                    
                                    <p className="text-[12px] sm:text-[14px] font-medium">₹{parseFloat(item.price || item.total_price).toFixed(2)}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Bundle/Offer Items */}
                      {bundleGroups.map((bundleGroup, bundleIndex) => (
                        <div key={bundleGroup.bundleId} className="border-2 border-dashed border-green-200 rounded-lg p-2 sm:p-3 bg-green-50">
                          <div className="flex items-center gap-2 mb-2">
                            <Gift size={14} className="text-green-600" />
                            <h5 className="text-[12px] sm:text-[13px] font-semibold text-green-800">{bundleGroup.offerName}</h5>
                          </div>
                          
                          <div className="space-y-2">
                            {bundleGroup.items.map((item: any) => {
                              const variantDisplayName = getVariantDisplayName(item);
                              
                              return (
                                <div key={item.id} className="flex bg-white p-2 rounded-lg border border-green-200">
                                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-md overflow-hidden mr-2 sm:mr-3 bg-gray-100 flex-shrink-0 relative">
                                    {item.product_details.images && item.product_details.images.length > 0 ? (
                                      <Image 
                                        src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${item.product_details.images[0].product_image}`} 
                                        alt={item.product_details.product_name}
                                        fill
                                        sizes="(max-width: 40px) 100vw, (max-width: 768px) 56px, 56px"
                                        style={{objectFit: 'cover'}}
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gray-200"></div>
                                    )}
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-[11px] sm:text-[13px] font-medium text-gray-900 line-clamp-2 mb-1">
                                      {item.product_details.product_name}
                                    </h4>
                                    
                                    <div className="flex justify-between items-end">
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                        <p className="text-[10px] sm:text-[12px] text-gray-600">Qty: {item.quantity}</p>
                                        <span className={`text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full font-medium w-fit ${
                                          item.mode === 'Buy' 
                                            ? 'bg-blue-100 text-blue-700' 
                                            : 'bg-green-100 text-green-700'
                                        }`}>
                                          {item.mode}
                                        </span>
                                        {variantDisplayName && (
                                          <span className="text-[9px] sm:text-[10px] bg-purple-100 text-purple-700 px-1 sm:px-1.5 py-0.5 rounded w-fit">
                                            {variantDisplayName}
                                          </span>
                                        )}
                                      </div>
                                      
                                      <p className="text-[11px] sm:text-[13px] font-medium">
                                        {item.mode === 'Get' ? (
                                          <span className="text-green-600">FREE</span>
                                        ) : (
                                          `₹${parseFloat(item.price || item.total_price).toFixed(2)}`
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Footer Section */}
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
                        <div className="text-[11px] sm:text-[13px]">
                          <span className="font-medium">Payment: </span>
                          <span className={order.payment_status === "Success" ? "text-green-600" : "text-orange-600"}>
                            {order.payment_status} ({order.payment_mode})
                          </span>
                        </div>
                        <div className="text-[11px] sm:text-[13px] font-medium">
                          Total: ₹{parseFloat(order.total_price || order.payable_price).toFixed(2)}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        {canCancel && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCancelModal(order.order_id);
                            }}
                            className="px-3 py-1.5 sm:py-1 text-[11px] sm:text-[12px] border border-black text-black rounded hover:bg-gray-50 transition-colors flex-shrink-0"
                          >
                            Cancel Order
                          </button>
                        )}
                        
                        {canReplace && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenReplacementModal(order.order_id);
                            }}
                            className="px-3 py-1.5 sm:py-1 text-[11px] sm:text-[12px] border border-black text-black rounded hover:bg-gray-50 transition-colors flex-shrink-0"
                          >
                            Replace Order
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showCancelModal && selectedOrderId && (
        <CancelOrderModal
          orderId={selectedOrderId}
          onClose={() => setShowCancelModal(false)}
          onSuccess={() => {
            setShowCancelModal(false);
            handleOrderUpdate();
          }}
        />
      )}

      {showComplaintModal && selectedOrderId && (
        <ComplaintModal
          orderId={selectedOrderId}
          onClose={() => setShowComplaintModal(false)}
          onSuccess={() => {
            setShowComplaintModal(false);
            handleOrderUpdate();
          }}
        />
      )}

      {showReplacementModal && selectedOrderId && (
        <ReplacementOrderModal
          orderId={selectedOrderId}
          onClose={() => setShowReplacementModal(false)}
          onSuccess={() => {
            setShowReplacementModal(false);
            handleOrderUpdate();
          }}
        />
      )}
    </>
  );
}