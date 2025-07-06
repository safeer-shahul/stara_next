// app/admin/replacement/view/page.tsx
"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Edit, Calendar, User, Package, FileText, AlertCircle, CheckCircle, XCircle, Clock, Loader2, Image as ImageIcon, X, ZoomIn } from 'lucide-react';
import Image from 'next/image';
import apiService from '@/utils/api/apiService';

// Define interfaces for the detailed replacement data
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

interface RequestedUser {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_superuser: boolean;
  is_active: boolean;
  is_staff: boolean;
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
  processed_user: any;
  requested_user: RequestedUser;
  created_at: string;
  updated_at: string;
  request_details: string;
  status: string;
  admin_notes: string | null;
  order: string;
  user: number;
  processed_by: string | null;
}

function ReplacementViewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const replacementId = searchParams.get('id');

  const [replacement, setReplacement] = useState<ReplacementRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  // Fetch replacement details
  const fetchReplacementDetails = useCallback(async () => {
    if (!replacementId) {
      setError('No replacement ID provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getByReplacementId(replacementId);
      setReplacement(response);
      setAdminNotes(response.admin_notes || '');
      setSelectedStatus(response.status || '');
    } catch (err) {
      console.error('Failed to fetch replacement details:', err);
      setError('Failed to load replacement details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [replacementId]);

  useEffect(() => {
    fetchReplacementDetails();
  }, [fetchReplacementDetails]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchReplacementDetails();
  }, [fetchReplacementDetails]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    router.push('/admin/replacement-requests');
  }, [router]);

  // Handle order view
  const handleViewOrder = useCallback((orderId: string) => {
    window.location.href = `http://localhost:3000/admin/orders/view?id=${orderId}`;
  }, []);

  // Handle status update
  const handleStatusUpdate = useCallback(async () => {
    if (!replacement) return;

    setIsUpdating(true);
    try {
      await apiService.replacementStatusUpdate(replacement.id, selectedStatus, adminNotes);
      
      alert('Replacement request updated successfully!');
      await fetchReplacementDetails();
    } catch (err) {
      console.error('Failed to update replacement request:', err);
      setError('Failed to update replacement request. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  }, [replacement, selectedStatus, adminNotes, fetchReplacementDetails]);

  // Handle full screen image view
  const openFullScreenImage = useCallback((imageUrl: string) => {
    setFullScreenImage(imageUrl);
  }, []);

  const closeFullScreenImage = useCallback(() => {
    setFullScreenImage(null);
  }, []);

  // Get status icon and color
  const getStatusDisplay = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
      case 'APPROVED':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
      case 'REJECTED':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
      case 'PROCESSING':
        return { icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
      case 'COMPLETED':
        return { icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' };
      case 'CANCELLED':
        return { icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
      default:
        return { icon: AlertCircle, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-10 w-10 text-[var(--color-primary-950)] mx-auto" />
          <p className="mt-4 text-lg text-gray-600">Loading replacement details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Replacement</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleRefresh}
              className="bg-[var(--color-primary-950)] text-white px-6 py-2 rounded-lg hover:bg-[var(--color-primary-900)] transition-colors duration-200"
            >
              Try Again
            </button>
            <button
              onClick={handleBack}
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!replacement) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Replacement Not Found</h2>
          <p className="text-gray-600 mb-6">The replacement request you're looking for doesn't exist.</p>
          <button
            onClick={handleBack}
            className="bg-[var(--color-primary-950)] text-white px-6 py-2 rounded-lg hover:bg-[var(--color-primary-900)] transition-colors duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const statusDisplay = getStatusDisplay(replacement.status);
  const StatusIcon = statusDisplay.icon;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              title="Go Back"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-800">Replacement Request Details</h1>
              <p className="text-gray-600 mt-1">ID: {replacement.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center shadow-sm
                         hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div className={`${statusDisplay.bg} ${statusDisplay.border} border rounded-xl p-6`}>
              <div className="flex items-center gap-3">
                <StatusIcon className={`w-8 h-8 ${statusDisplay.color}`} />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Current Status</h3>
                  <p className={`text-2xl font-bold ${statusDisplay.color}`}>
                    {replacement.status}
                  </p>
                </div>
              </div>
            </div>

            {/* Request Details */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-[var(--color-primary-950)]" />
                <h3 className="text-lg font-semibold text-gray-800">Request Details</h3>
              </div>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {replacement.request_details || 'No details provided'}
                </p>
              </div>
            </div>

            {/* Admin Notes */}
            {replacement.admin_notes && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Edit className="w-6 h-6 text-[var(--color-primary-950)]" />
                  <h3 className="text-lg font-semibold text-gray-800">Admin Notes</h3>
                </div>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {replacement.admin_notes}
                  </p>
                </div>
              </div>
            )}

            {/* Replacement Items */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Package className="w-6 h-6 text-[var(--color-primary-950)]" />
                <h3 className="text-lg font-semibold text-gray-800">Replacement Items</h3>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {replacement.replacement_item?.length || 0} items
                </span>
              </div>
              
              {replacement.replacement_item && replacement.replacement_item.length > 0 ? (
                <div className="space-y-6">
                  {replacement.replacement_item.map((item, index) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-lg font-medium text-gray-800">Item #{index + 1}</h4>
                      </div>

                      {/* Product Information - Show once per item */}
                      <div className="mb-6 p-4 bg-white rounded-lg border">
                        <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Product Information
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Product Name</label>
                            <p className="text-sm text-gray-800 font-medium">{item.order_item_details.product_details.product_name}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Product Code</label>
                            <p className="text-sm text-gray-800 font-mono">{item.order_item_details.product_details.product_code}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600 mb-2 block">Product Image</label>
                            {item.order_item_details.product_details.images?.[0] ? (
                              <div className="h-16 w-16 rounded-md overflow-hidden bg-gray-100 border">
                                <Image
                                  src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${item.order_item_details.product_details.images[0].product_image}`}
                                  alt="Product"
                                  width={64}
                                  height={64}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="h-16 w-16 rounded-md bg-gray-100 border flex items-center justify-center">
                                <ImageIcon className="h-4 w-4 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Original Product (To Replace) */}
                        <div className="space-y-4">
                          <h5 className="font-medium text-gray-800 border-b pb-2">Original Product (To Replace)</h5>
                          
                          <div>
                            <label className="text-sm font-medium text-gray-600">Current Variant</label>
                            <p className="text-sm text-gray-800">
                              Size: {item.order_item_details.product_details.product_variant?.find(v => v.id === item.order_item_details.product_variant)?.variant_name || 'N/A'}
                            </p>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-600">Price</label>
                            <p className="text-sm text-gray-800">₹{item.order_item_details.price}</p>
                          </div>
                        </div>

                        {/* New Product (Replacement) */}
                        <div className="space-y-4">
                          <h5 className="font-medium text-gray-800 border-b pb-2">Replacement Product</h5>
                          
                          <div>
                            <label className="text-sm font-medium text-gray-600">New Variant</label>
                            <p className="text-sm text-gray-800">
                              Size: {item.variant_details?.variant_name || 'N/A'}
                            </p>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-600">Price</label>
                            <p className="text-sm text-gray-800">₹{item.product_details.product_price}</p>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-600">Reason</label>
                            <p className="text-sm text-gray-800 bg-blue-50 px-2 py-1 rounded">{item.item_reason}</p>
                          </div>
                        </div>
                      </div>

                      {/* Additional Item Details */}
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <label className="text-xs font-medium text-gray-500">Item ID</label>
                            <p className="text-gray-800 font-mono">{item.id.substring(0, 8)}...</p>
                          </div>
                          
                          <div>
                            <label className="text-xs font-medium text-gray-500">Quantity</label>
                            <p className="text-gray-800">{item.order_item_details.quantity}</p>
                          </div>
                        </div>

                        {item.admin_notes && (
                          <div className="mt-4">
                            <label className="text-sm font-medium text-gray-600">Admin Notes</label>
                            <p className="text-sm text-gray-800 bg-white p-3 rounded border mt-1">
                              {item.admin_notes}
                            </p>
                          </div>
                        )}

                        {item.rejection_reason && (
                          <div className="mt-4">
                            <label className="text-sm font-medium text-gray-600">Rejection Reason</label>
                            <p className="text-sm text-red-800 bg-red-50 p-3 rounded border border-red-200 mt-1">
                              {item.rejection_reason}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Customer Uploaded Images - Only show if images exist */}
                      {item.replacement_images && item.replacement_images.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-gray-200">
                          <label className="text-sm font-medium text-gray-600 mb-3 block">
                            Customer Uploaded Images ({item.replacement_images.length})
                          </label>
                          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                            {item.replacement_images.map((image, imgIndex) => (
                              <div key={image.id} className="relative group cursor-pointer">
                                <div 
                                  className="h-24 w-full rounded-md overflow-hidden bg-gray-100 border border-gray-200 relative"
                                  onClick={() => openFullScreenImage(`${process.env.NEXT_PUBLIC_API_BASE_URL}${image.image}`)}
                                >
                                  <Image
                                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${image.image}`}
                                    alt={`Customer image ${imgIndex + 1}`}
                                    width={120}
                                    height={96}
                                    className="h-full w-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 flex items-center justify-center transition-all duration-200">
                                    <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 text-center">
                                  Image {imgIndex + 1}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 italic">No replacement items found</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Metadata */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Information</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium text-gray-800">
                      {new Date(replacement.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="font-medium text-gray-800">
                      {new Date(replacement.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Requested By</p>
                    <p className="font-medium text-gray-800">
                      {replacement.requested_user?.first_name} {replacement.requested_user?.last_name}
                    </p>
                    <p className="text-xs text-gray-500">{replacement.requested_user?.email}</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Processed By Card - Add this as a separate card after Quick Information */}
            {replacement.processed_user && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Processed By</h3>
                <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                    <p className="font-medium text-gray-800">
                        {replacement.processed_user.is_superuser 
                        ? 'Super Admin' 
                        : replacement.processed_user.first_name && replacement.processed_user.last_name
                            ? `${replacement.processed_user.first_name} ${replacement.processed_user.last_name}`.trim()
                            : replacement.processed_user.username
                        }
                    </p>
                    <p className="text-sm text-gray-500">{replacement.processed_user.email}</p>
                    <div className="flex gap-2 mt-2">
                        {replacement.processed_user.is_superuser && (
                        <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-0.5 rounded-full">
                            Super Admin
                        </span>
                        )}
                        {replacement.processed_user.is_staff && !replacement.processed_user.is_superuser && (
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                            Staff
                        </span>
                        )}
                        {replacement.processed_user.is_active && (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                            Active
                        </span>
                        )}
                    </div>
                    </div>
                </div>
                
                </div>
            </div>
            )}

            {/* Related Order */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Related Order</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <button
                    onClick={() => handleViewOrder(replacement.order)}
                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
                  >
                    {replacement.order}
                  </button>
                </div>
                <button
                  onClick={() => handleViewOrder(replacement.order)}
                  className="w-full bg-[var(--color-primary-950)] text-white px-4 py-2 rounded-lg hover:bg-[var(--color-primary-900)] transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  View Order Details
                </button>
              </div>
            </div>

            {/* Actions - Only show if status is PENDING */}
            {replacement.status?.toUpperCase() === 'PENDING' && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Admin Actions</h3>
                <div className="space-y-4">
                  {/* Status Update */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Update Status
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                                 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                      {/* <option value="PROCESSING">Processing</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option> */}
                    </select>
                  </div>

                  {/* Admin Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Notes
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes about this replacement request..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                                 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent
                                 resize-vertical"
                    />
                  </div>

                  {/* Update Button */}
                  <button
                    onClick={handleStatusUpdate}
                    disabled={isUpdating}
                    className="w-full bg-[var(--color-primary-950)] text-white px-4 py-2 rounded-lg 
                               hover:bg-[var(--color-primary-900)] transition-colors duration-200 
                               flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4" />
                        Update Request
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Screen Image Modal */}
      {fullScreenImage && (
        <div 
          className="fixed inset-0 bg-black opacity-90 flex items-center justify-center z-50"
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

export default function ReplacementViewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-10 w-10 text-[var(--color-primary-950)] mx-auto" />
          <p className="mt-4 text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ReplacementViewContent />
    </Suspense>
  );
}