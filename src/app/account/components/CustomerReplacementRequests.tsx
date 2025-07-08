'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, RefreshCw, Package, Clock, CheckCircle, XCircle, AlertCircle, Calendar, FileText, Image as ImageIcon, ZoomIn, X } from 'lucide-react';
import Image from 'next/image';
import apiService from '@/utils/api/apiService';

// Define interfaces for the replacement data
interface ProductImage {
  id: string;
  product_image: string;
  product: string;
}

interface ProductVariant {
  id: string;
  variant_name: string;
  quantity: number;
  weight: string;
  product: string;
}

interface ProductDetails {
  id: string;
  images: ProductImage[];
  product_variant: ProductVariant[];
  product_code: string;
  product_name: string;
  product_description: string;
  product_price: string;
  strike_price: string;
  have_variants: boolean;
  quantity: number;
  product_weight: string;
  product_box_weight: string;
  product_status: boolean;
  created_at: string;
  updated_at: string;
  sub_category: string;
}

interface OrderItemDetails {
  id: string;
  product_details: ProductDetails;
  offer_details: any;
  created_at: string;
  updated_at: string;
  quantity: number;
  price: string;
  total_price: string;
  mode: string;
  bundle_id: string | null;
  order_id: string;
  product_id: string;
  product_variant: string;
  offer: any;
}

interface VariantDetails {
  id: string;
  variant_name: string;
  quantity: number;
  weight: string;
  product: string;
}

interface ReplacementImage {
  id: string;
  created_at: string;
  updated_at: string;
  image: string;
  product_replacement: string;
}

interface ReplacementItem {
  id: string;
  order_item_details: OrderItemDetails;
  replacement_images: ReplacementImage[];
  product_details: ProductDetails;
  variant_details: VariantDetails;
  created_at: string;
  updated_at: string;
  item_reason: string;
  replacement_image: string | null;
  status: string;
  admin_notes: string | null;
  rejection_reason: string | null;
  replacement_request: string;
  order_item: string;
  new_requested_product: string;
  new_requested_product_variant: string;
}

interface ReplacementRequest {
  id: string;
  replacement_item: ReplacementItem[];
  created_at: string;
  updated_at: string;
  request_details: string;
  status: string;
  admin_notes: string | null;
  order: string;
}

export default function CustomerReplacementRequests() {
  const [replacements, setReplacements] = useState<ReplacementRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch replacement requests
  const fetchReplacements = useCallback(async () => {
    try {
      setLoading(true);
      // Replace with your actual API endpoint for customer replacement requests
      const response = await apiService.getMyReplacementRequests();
      setReplacements(response || []);
    } catch (error) {
      console.error('Error fetching replacement requests:', error);
      setReplacements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReplacements();
  }, [fetchReplacements]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReplacements();
    setRefreshing(false);
  };

  // Toggle request expansion
  const toggleRequestExpansion = (requestId: string) => {
    setExpandedRequests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(requestId)) {
        newSet.delete(requestId);
      } else {
        newSet.add(requestId);
      }
      return newSet;
    });
  };

  // Handle full screen image view
  const openFullScreenImage = (imageUrl: string) => {
    setFullScreenImage(imageUrl);
  };

  const closeFullScreenImage = () => {
    setFullScreenImage(null);
  };

  // Get status display
  const getStatusDisplay = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return { icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' };
      case 'APPROVED':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' };
      case 'REJECTED':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' };
      case 'PROCESSING':
        return { icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'COMPLETED':
        return { icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-100' };
      case 'CANCELLED':
        return { icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-100' };
      default:
        return { icon: AlertCircle, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get variant display name
  const getVariantDisplayName = (item: ReplacementItem, isOriginal: boolean = false) => {
    if (isOriginal) {
      // For original item, get variant from order_item_details
      const variants = item.order_item_details.product_details.product_variant || [];
      const variant = variants.find(v => v.id === item.order_item_details.product_variant);
      return variant ? `Size ${variant.variant_name}` : 'N/A';
    } else {
      // For replacement item, use variant_details
      return item.variant_details ? `Size ${item.variant_details.variant_name}` : 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow py-4 px-2 sm:py-6 sm:px-4">
        <div className="flex items-center justify-between mb-4 sm:mb-6 px-2">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4 mb-4 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!replacements.length) {
    return (
      <div className="bg-white rounded-lg shadow py-4 px-2 sm:py-6 sm:px-4">
        <div className="flex items-center justify-between mb-4 sm:mb-6 px-2">
          <h2 className="text-[16px] font-semibold">Replacement Requests</h2>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 text-[12px] bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        
        <div className="text-center py-12">
          <Package size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Replacement Requests</h3>
          <p className="text-gray-500 text-sm">You haven't made any replacement requests yet.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow py-4 px-2 sm:py-6 sm:px-4">
        <div className="flex items-center justify-between mb-4 sm:mb-6 px-2">
          <h2 className="text-[16px] font-semibold">Replacement Requests</h2>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 text-[12px] bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {replacements.map((request) => {
            const isExpanded = expandedRequests.has(request.id);
            const statusDisplay = getStatusDisplay(request.status);
            const StatusIcon = statusDisplay.icon;
            const itemsCount = request.replacement_item?.length || 0;

            return (
              <div key={request.id} className="border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                {/* Header Section - Always Visible */}
                <div 
                  className="p-3 sm:p-4 cursor-pointer"
                  onClick={() => toggleRequestExpansion(request.id)}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-3">
                    <div className="flex flex-col gap-2 flex-wrap">
                      <h3 className="text-[14px] font-medium">Request #{request.id.replace(/-/g, '')}</h3>
                      <span className="text-[11px] text-gray-500">Order: #{request.order.replace(/-/g, '')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium inline-flex items-center justify-center min-w-[70px] ${statusDisplay.bg} ${statusDisplay.color}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {request.status}
                      </span>
                      {isExpanded ? (
                        <ChevronUp size={16} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={16} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  {/* Request Summary - Always Visible */}
                  <div className="flex flex-col gap-1 text-[12px] sm:text-[14px] text-gray-500">
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      <span>Requested: {formatDate(request.created_at)}</span>
                      {request.updated_at !== request.created_at && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span>Updated: {formatDate(request.updated_at)}</span>
                        </>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      <span>{itemsCount} {itemsCount === 1 ? 'item' : 'items'}</span>
                      {request.request_details && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-48">{request.request_details}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expandable Content */}
                {isExpanded && (
                  <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t border-gray-100">
                    {/* Request Details */}
                    {request.request_details && (
                      <div className="py-3 px-3 bg-gray-50 rounded-lg mb-3 mt-3">
                        <div className="flex items-center mb-2">
                          <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 mr-2 flex-shrink-0" />
                          <h4 className="text-[12px] sm:text-sm font-bold text-gray-700">Request Details:</h4>
                        </div>
                        <p className="text-[11px] sm:text-sm ml-5 sm:ml-6 text-gray-600 whitespace-pre-wrap">
                          {request.request_details}
                        </p>
                      </div>
                    )}

                    {/* Admin Notes - Only show for approved/rejected requests */}
                    {(request.status?.toUpperCase() === 'APPROVED' || request.status?.toUpperCase() === 'REJECTED') && request.admin_notes && (
                      <div className={`py-3 px-3 rounded-lg mb-3 ${
                        request.status?.toUpperCase() === 'APPROVED' 
                          ? 'bg-green-50 border border-green-200' 
                          : 'bg-red-50 border border-red-200'
                      }`}>
                        <div className="flex items-center mb-2">
                          {request.status?.toUpperCase() === 'APPROVED' ? (
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 mr-2 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 mr-2 flex-shrink-0" />
                          )}
                          <h4 className={`text-[12px] sm:text-sm font-bold ${
                            request.status?.toUpperCase() === 'APPROVED' ? 'text-green-700' : 'text-red-700'
                          }`}>
                            Admin Response:
                          </h4>
                        </div>
                        <p className={`text-[11px] sm:text-sm ml-5 sm:ml-6 whitespace-pre-wrap ${
                          request.status?.toUpperCase() === 'APPROVED' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {request.admin_notes}
                        </p>
                      </div>
                    )}
                    
                    {/* Replacement Items */}
                    <div className="space-y-2 sm:space-y-3">
                      {request.replacement_item && request.replacement_item.map((item, index) => (
                        <div key={item.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                          <div className="flex items-center gap-2 mb-3">
                            <Package className="w-4 h-4 text-gray-600" />
                            <h4 className="text-[13px] sm:text-[14px] font-medium text-gray-800">
                              Item #{index + 1} - {item.item_reason}
                            </h4>
                          </div>

                          {/* Product Info */}
                          <div className="bg-white rounded-lg p-3 mb-3">
                            <div className="flex gap-3">
                              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden bg-gray-100 flex-shrink-0 relative">
                                {item.product_details.images?.[0] ? (
                                  <Image
                                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${item.product_details.images[0].product_image}`}
                                    alt={item.product_details.product_name}
                                    fill
                                    sizes="(max-width: 64px) 100vw, (max-width: 768px) 80px, 80px"
                                    style={{objectFit: 'cover'}}
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                    <ImageIcon className="w-6 h-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h5 className="text-[13px] sm:text-[15px] font-medium text-gray-900 mb-2 line-clamp-2">
                                  {item.product_details.product_name}
                                </h5>
                                
                                <div className="grid grid-cols-2 gap-2 text-[11px] sm:text-[12px]">
                                  <div>
                                    <span className="text-gray-500">Reason:</span>
                                    <p className="font-medium text-blue-600">{item.item_reason}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Original Size:</span>
                                    <p className="font-medium">{getVariantDisplayName(item, true)}</p>
                                  </div>
                                  {item.item_reason?.toLowerCase() !== 'damaged' && (
                                    <div>
                                      <span className="text-gray-500">New Size:</span>
                                      <p className="font-medium">{getVariantDisplayName(item, false)}</p>
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-gray-500">Quantity:</span>
                                    <p className="font-medium">{item.order_item_details.quantity}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Price:</span>
                                    <p className="font-medium">₹{parseFloat(item.order_item_details.price).toFixed(2)}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Customer Uploaded Images */}
                          {item.replacement_images && item.replacement_images.length > 0 && (
                            <div className="bg-white rounded-lg p-3">
                              <h6 className="text-[12px] sm:text-[13px] font-medium text-gray-700 mb-2">
                                Uploaded Images ({item.replacement_images.length})
                              </h6>
                              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                {item.replacement_images.map((image, imgIndex) => (
                                  <div 
                                    key={image.id} 
                                    className="relative group cursor-pointer"
                                    onClick={() => openFullScreenImage(`${process.env.NEXT_PUBLIC_API_BASE_URL}${image.image}`)}
                                  >
                                    <div className="aspect-square rounded-md overflow-hidden bg-gray-100 border border-gray-200 relative">
                                      <Image
                                        src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${image.image}`}
                                        alt={`Evidence ${imgIndex + 1}`}
                                        fill
                                        sizes="(max-width: 768px) 20vw, 15vw"
                                        style={{objectFit: 'cover'}}
                                      />
                                      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 flex items-center justify-center transition-all duration-200">
                                        <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Item rejection reason if applicable */}
                          {item.rejection_reason && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                              <div className="flex items-center gap-2 mb-1">
                                <XCircle className="w-4 h-4 text-red-600" />
                                <span className="text-[12px] sm:text-[13px] font-medium text-red-700">Rejection Reason:</span>
                              </div>
                              <p className="text-[11px] sm:text-[12px] text-red-600 ml-6">
                                {item.rejection_reason}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Full Screen Image Modal */}
      {fullScreenImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={closeFullScreenImage}
        >
          <div className="relative max-w-4xl max-h-full p-4">
            <button
              onClick={closeFullScreenImage}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X className="w-8 h-8" />
            </button>
            <Image
              src={fullScreenImage}
              alt="Full screen view"
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}