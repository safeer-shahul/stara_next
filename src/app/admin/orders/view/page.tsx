// app/admin/orders/view/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Package, ArrowLeft, Truck, Calendar, CreditCard, MapPin, ShoppingCart, Info, Loader2, DollarSign, Tag, HandCoins, MinusCircle, Gift } from 'lucide-react';
import apiService from '@/utils/api/apiService';
import { useRouter, useSearchParams } from 'next/navigation';

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

// --- Interfaces ---
interface AddressData {
  id: string;
  user_data: {
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    is_superuser: boolean;
    is_active: boolean;
    is_staff: boolean;
  };
  created_at: string;
  updated_at: string;
  address: string;
  state: string;
  town: string;
  pincode: number;
  phone_number_1: string;
  phone_number_2?: string;
  user: number;
}

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

interface OfferDetails {
  id: string;
  products: string[];
  created_at: string;
  updated_at: string;
  offer_name: string;
  buy_count: number;
  get_count: number;
  start_date: string;
  end_date: string;
  offer_image: string | null;
}

interface OrderItemProductDetails {
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

interface OrderItem {
  id: string;
  product_details: OrderItemProductDetails;
  offer_details?: OfferDetails;
  created_at: string;
  updated_at: string;
  quantity: number;
  price: string;
  total_price: string;
  mode: string; // 'Normal', 'Buy', 'Get'
  bundle_id: string | null;
  order_id: string;
  product_id: string;
  product_variant: string | null;
  offer: string | null;
}

interface OrderData {
  order_id: string;
  order_items: OrderItem[];
  address_details: AddressData;
  created_at: string;
  updated_at: string;
  payable_price: string;
  actual_price: string;
  discounted_price: string;
  shipping_price: string;
  status: string;
  payment_mode: string;
  payment_status: string;
  is_packed: boolean;
  packed_date: string | null;
  is_shipped: boolean;
  is_delivered: boolean;
  is_cancelled: boolean;
  is_returned: boolean;
  is_refunded: boolean;
  is_paid: boolean;
  razorpay_signature?: string | null;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  cancel_reason: string;
  user: number;
  address: string;
  assigned_to: number | null;
  coupon: string | null;
  bundles: { [bundleId: string]: OrderItem[] };
}

interface BundleGroup {
  bundleId: string;
  items: OrderItem[];
  offerName: string;
}

export default function OrderDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderDetails = useCallback(async (orderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response: OrderData = await apiService.getOrderById(orderId);
      setOrder(response);
    } catch (err) {
      // console.error('Failed to fetch order details:', err);
      setError('Failed to load order details. Please try again.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchOrderDetails(id);
    }
  }, [id, fetchOrderDetails]);

  const formatDate = useCallback((dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      // console.error("Invalid date string:", dateString, e);
      return dateString;
    }
  }, []);

  const getStatusBadgeClasses = useCallback((status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'Processing':
        return 'bg-blue-100 text-blue-800';
      case 'Shipped':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  // Get all items for an order (including bundle items)
  const getAllOrderItems = useCallback((order: OrderData) => {
    let allItems = [...order.order_items];
    
    // Add bundle items if they exist
    if (order.bundles) {
      Object.keys(order.bundles).forEach(bundleId => {
        allItems = allItems.concat(order.bundles[bundleId]);
      });
    }
    
    return allItems;
  }, []);

  // Get total item count for an order
  const getTotalItemCount = useCallback((order: OrderData) => {
    const allItems = getAllOrderItems(order);
    return allItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [getAllOrderItems]);

  // Get offer name for a bundle
  const getOfferName = useCallback((bundleItems: OrderItem[]) => {
    if (!bundleItems.length) return 'Special Offer';
    
    // Try to get offer name from the first item with offer_details
    const itemWithOffer = bundleItems.find(item => item.offer_details);
    return itemWithOffer ? itemWithOffer.offer_details!.offer_name : 'Special Offer';
  }, []);

  // Group bundle items by bundle ID with offer names
  const getBundleGroups = useCallback((order: OrderData): BundleGroup[] => {
    if (!order.bundles) return [];
    
    return Object.keys(order.bundles).map((bundleId) => ({
      bundleId,
      items: order.bundles[bundleId],
      offerName: getOfferName(order.bundles[bundleId])
    }));
  }, [getOfferName]);

  // Get full state name from state code
  const getStateName = useCallback((stateCode: string) => {
    return INDIAN_STATES[stateCode] || stateCode;
  }, []);

  // Get variant name for a product
  const getVariantName = useCallback((productDetails: OrderItemProductDetails, variantId: string | null) => {
    if (!variantId || !productDetails.product_variant?.length) return null;
    
    const variant = productDetails.product_variant.find(v => v.id === variantId);
    return variant ? variant.variant_name : null;
  }, []);

  // Collect all unique offers applied in the order
  const uniqueOffersApplied = useMemo(() => {
    if (!order) return [];

    const offersMap = new Map<string, OfferDetails>();
    const allItems = getAllOrderItems(order);

    allItems.forEach(item => {
      if (item.offer_details && !offersMap.has(item.offer_details.id)) {
        offersMap.set(item.offer_details.id, item.offer_details);
      }
    });

    return Array.from(offersMap.values());
  }, [order, getAllOrderItems]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/orders/list"
              className="text-gray-600 hover:text-[var(--color-primary-950)] transition-colors duration-200"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h2 className="text-3xl font-extrabold text-gray-800">Order Details</h2>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="p-10 text-center">
            <Loader2 className="animate-spin h-10 w-10 text-[var(--color-primary-950)] mx-auto" />
            <p className="mt-4 text-lg text-gray-600">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/orders/list"
              className="text-gray-600 hover:text-[var(--color-primary-950)] transition-colors duration-200"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h2 className="text-3xl font-extrabold text-gray-800">Order Details</h2>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="p-6 text-red-700 bg-red-50 border-l-4 border-red-500">
            <p className="font-medium">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/orders/list"
              className="text-gray-600 hover:text-[var(--color-primary-950)] transition-colors duration-200"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h2 className="text-3xl font-extrabold text-gray-800">Order Details</h2>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="p-8 text-center text-gray-500">
            <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-xl font-medium">No order found.</p>
            <p className="mt-2 text-base">Please check the Order ID in the URL or try again later.</p>
            <Link href="/admin/orders/list" className="block mt-6 text-[var(--color-primary-950)] hover:underline">
              Back to Order List
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const bundleGroups = getBundleGroups(order);
  const totalItemCount = getTotalItemCount(order);
  const hasOffers = bundleGroups.length > 0;

  const handleSmartBackNavigation = () => {
    // Check if there's a previous page in browser history
    if (window.history.length > 1) {
      router.back();
    } else {
      // Fallback to products dashboard if no history
      router.push('/admin/orders/list');
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
                      onClick={handleSmartBackNavigation} // Choose your preferred method here
                      className="text-gray-600 cursor-pointer hover:text-[var(--color-primary-950)] transition-colors duration-200 p-1 rounded-md hover:bg-gray-100"
                      aria-label="Go back to previous page"
                    >
                      <ArrowLeft className="w-6 h-6" />
                    </button>
          <h2 className="text-3xl font-extrabold text-gray-800">
            Order Details
          </h2>
        </div>
      </div>

      {/* Main Content Area: Order Details */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        {/* Top Header Section within the card */}
        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center">
            <ShoppingCart className="w-6 h-6 text-[var(--color-primary-950)] mr-3" />
            <h3 className="font-semibold text-lg text-gray-800">Order Information</h3>
          </div>
          {hasOffers && (
            <div className="flex items-center gap-2 text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">
              <Gift size={16} />
              <span>Special Offers Applied</span>
            </div>
          )}
        </div>

        <div className="p-6 space-y-8">
          {/* Order Header & Key Details */}
          <div className="pb-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-5">
              <h3 className="text-2xl font-bold text-gray-900">
                Order #{order.order_id}
              </h3>
              <span className={`text-base px-4 py-2 rounded-full font-semibold mt-3 sm:mt-0 ${getStatusBadgeClasses(order.status)}`}>
                {order.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Order Date */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                  <Calendar className="w-5 h-5 text-gray-500 mr-2" />
                  <h4 className="text-sm font-medium text-gray-700">Order Date</h4>
                </div>
                <p className="text-base text-gray-900 font-semibold">{formatDate(order.created_at)}</p>
              </div>

              {/* Delivery Status */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                  <Truck className="w-5 h-5 text-gray-500 mr-2" />
                  <h4 className="text-sm font-medium text-gray-700">Delivery Status</h4>
                </div>
                <p className="text-base text-gray-900 font-semibold">{order.status}</p>
              </div>

              {/* Payment Status */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                  <CreditCard className="w-5 h-5 text-gray-500 mr-2" />
                  <h4 className="text-sm font-medium text-gray-700">Payment Status</h4>
                </div>
                <p className="text-base text-gray-900 font-semibold">
                  <span className={order.payment_status === "Success" ? "text-green-600" : "text-orange-600"}>
                    {order.payment_status}
                  </span>
                  <span className="text-sm text-gray-600 ml-1">({order.payment_mode})</span>
                </p>
              </div>

              {/* Items Count */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                  <Package className="w-5 h-5 text-gray-500 mr-2" />
                  <h4 className="text-sm font-medium text-gray-700">Total Items</h4>
                </div>
                <p className="text-base text-gray-900 font-semibold">{totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}</p>
              </div>

              {/* Overall Order Status Flags */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 col-span-full md:col-span-2 lg:col-span-3 xl:col-span-4">
                <div className="flex items-center mb-2">
                  <Info className="w-5 h-5 text-gray-500 mr-2" />
                  <h4 className="text-sm font-medium text-gray-700">Order Progress</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm text-gray-800">
                  <p>Packed: <span className={`font-semibold ${order.is_packed ? 'text-green-600' : 'text-red-600'}`}>{order.is_packed ? 'Yes' : 'No'}</span> {order.packed_date && `(${formatDate(order.packed_date)})`}</p>
                  <p>Shipped: <span className={`font-semibold ${order.is_shipped ? 'text-green-600' : 'text-red-600'}`}>{order.is_shipped ? 'Yes' : 'No'}</span></p>
                  <p>Delivered: <span className={`font-semibold ${order.is_delivered ? 'text-green-600' : 'text-red-600'}`}>{order.is_delivered ? 'Yes' : 'No'}</span></p>
                  <p>Paid: <span className={`font-semibold ${order.is_paid ? 'text-green-600' : 'text-red-600'}`}>{order.is_paid ? 'Yes' : 'No'}</span></p>
                  <p>Cancelled: <span className={`font-semibold ${order.is_cancelled ? 'text-red-600' : 'text-green-600'}`}>{order.is_cancelled ? 'Yes' : 'No'}</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          {order.address_details?.user_data && (
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h4 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Info className="w-6 h-6 text-[var(--color-primary-950)] mr-3" /> Customer Information
              </h4>
              <div className="text-gray-700 space-y-2">
                <p className="text-base">
                  <span className="font-medium">Name:</span> {order.address_details.user_data.first_name} {order.address_details.user_data.last_name}
                </p>
                <p className="text-base">
                  <span className="font-medium">Email:</span> {order.address_details.user_data.email}
                </p>
              </div>
            </div>
          )}

          {/* Shipping Address */}
          {order.address_details && (
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h4 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <MapPin className="w-6 h-6 text-[var(--color-primary-950)] mr-3" /> Shipping Address
              </h4>
              <div className="text-gray-700 space-y-2">
                <p className="text-base font-semibold">{order.address_details.address}</p>
                <p className="text-base">{order.address_details.town}, {getStateName(order.address_details.state)} - {order.address_details.pincode}</p>
                <div className="pt-2 space-y-1">
                  <p className="text-base">
                    <span className="font-medium">Primary Phone:</span> {order.address_details.phone_number_1}
                  </p>
                  {order.address_details.phone_number_2 && order.address_details.phone_number_2.trim() !== "" && (
                    <p className="text-base">
                      <span className="font-medium">Secondary Phone:</span> {order.address_details.phone_number_2}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h4 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Package className="w-6 h-6 text-[var(--color-primary-950)] mr-3" /> Order Items
            </h4>
            <div className="space-y-6">
              {/* Regular Items */}
              {order.order_items.length > 0 && (
                <div>
                  <h5 className="text-lg font-medium text-gray-800 mb-3">Regular Items</h5>
                  <div className="space-y-4">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex flex-col sm:flex-row bg-gray-50 p-4 rounded-lg border border-gray-100 items-center">
                        <div className="w-24 h-24 sm:w-20 sm:h-20 flex-shrink-0 rounded-md overflow-hidden mr-4 bg-gray-100 relative border border-gray-200">
                          {item.product_details.images && item.product_details.images.length > 0 ? (
                            <Image
                              src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${item.product_details.images[0].product_image}`}
                              alt={item.product_details.product_name}
                              fill
                              sizes="80px"
                              style={{ objectFit: 'cover' }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <Package className="w-10 h-10 text-gray-400" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 w-full mt-4 sm:mt-0">
                          <div className="flex justify-between items-start mb-2">
                            <h6 className="text-lg font-medium text-gray-900 pr-4">{item.product_details.product_name}</h6>
                            <p className="text-lg font-bold text-gray-900">₹{parseFloat(item.price).toFixed(2)}</p>
                          </div>



                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
                            <div className="space-y-1">
                              <p className="text-sm text-gray-700">Quantity: <span className="font-semibold">{item.quantity}</span></p>
                              <p className="text-sm text-gray-700">Code: <span className="font-semibold">{item.product_details.product_code}</span></p>
                              {getVariantName(item.product_details, item.product_variant) && (
                                <p className="text-sm text-gray-700">Size: <span className="font-semibold">{getVariantName(item.product_details, item.product_variant)}</span></p>
                              )}
                              <p className="text-sm text-gray-700">Total: <span className="font-semibold">₹{parseFloat(item.total_price).toFixed(2)}</span></p>
                            </div>

                            {item.product_details.strike_price && parseFloat(item.product_details.strike_price) > 0 && (
                              <p className="text-sm text-gray-500 line-through text-left sm:text-right">M.R.P: ₹{parseFloat(item.product_details.strike_price).toFixed(2)}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bundle/Offer Items */}
              {bundleGroups.map((bundleGroup) => (
                <div key={bundleGroup.bundleId} className="border-2 border-dashed border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="flex items-center gap-2 mb-4">
                    <Gift size={20} className="text-green-600" />
                    <h5 className="text-lg font-semibold text-green-800">{bundleGroup.offerName}</h5>
                  </div>
                  
                  <div className="space-y-3">
                    {bundleGroup.items.map((item) => (
                      <div key={item.id} className="flex flex-col sm:flex-row bg-white p-4 rounded-lg border border-green-200 items-center">
                        <div className="w-20 h-20 sm:w-16 sm:h-16 flex-shrink-0 rounded-md overflow-hidden mr-4 bg-gray-100 relative border border-gray-200">
                          {item.product_details.images && item.product_details.images.length > 0 ? (
                            <Image
                              src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${item.product_details.images[0].product_image}`}
                              alt={item.product_details.product_name}
                              fill
                              sizes="64px"
                              style={{ objectFit: 'cover' }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 w-full mt-3 sm:mt-0">
                          <div className="flex justify-between items-start mb-2">
                            <h6 className="text-base font-medium text-gray-900 pr-4">{item.product_details.product_name}</h6>
                            <div className="text-right">
                              <p className="text-base font-bold">
                                {item.mode === 'Get' ? (
                                  <span className="text-green-600">FREE</span>
                                ) : (
                                  `₹${parseFloat(item.price).toFixed(2)}`
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
                            <div className="flex items-center gap-4">
                              <p className="text-sm text-gray-700">Qty: <span className="font-semibold">{item.quantity}</span></p>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                item.mode === 'Buy' 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {item.mode}
                              </span>
                              {getVariantName(item.product_details, item.product_variant) && (
                                <p className="text-sm text-gray-700">Size: <span className="font-semibold">{getVariantName(item.product_details, item.product_variant)}</span></p>
                              )}
                            </div>

                            {item.product_details.strike_price && parseFloat(item.product_details.strike_price) > 0 && (
                              <p className="text-sm text-gray-500 line-through text-left sm:text-right">M.R.P: ₹{parseFloat(item.product_details.strike_price).toFixed(2)}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Offers Applied Card */}
          {uniqueOffersApplied.length > 0 && (
            <div className="bg-white p-6 rounded-lg border border-blue-200 shadow-sm">
              <h4 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
                <Gift className="w-6 h-6 text-blue-800 mr-3" /> Offers Applied
              </h4>
              <div className="space-y-4">
                {uniqueOffersApplied.map(offer => (
                  <div key={offer.id} className="p-4 bg-blue-50 border border-blue-100 rounded-md">
                    <p className="text-base font-semibold text-blue-900">{offer.offer_name}</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Buy {offer.buy_count} Get {offer.get_count} Free
                      (Valid from {formatDate(offer.start_date)} to {formatDate(offer.end_date)})
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h4 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <DollarSign className="w-6 h-6 text-[var(--color-primary-950)] mr-3" /> Billing Summary
            </h4>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-700 flex items-center"><HandCoins className="w-4 h-4 mr-2 text-gray-500" />Actual Price:</span>
                <span className="text-gray-900 font-medium">₹{parseFloat(order.actual_price).toFixed(2)}</span>
              </div>
              {parseFloat(order.discounted_price) > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700 flex items-center"><MinusCircle className="w-4 h-4 mr-2 text-gray-500" />Discount:</span>
                  <span className="text-red-600 font-medium">- ₹{parseFloat(order.discounted_price).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-700 flex items-center"><Truck className="w-4 h-4 mr-2 text-gray-500" />Shipping:</span>
                <span className="text-gray-900 font-medium">₹{parseFloat(order.shipping_price).toFixed(2)}</span>
              </div>
              {order.coupon && (
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700 flex items-center"><Tag className="w-4 h-4 mr-2 text-gray-500" />Coupon Applied:</span>
                  <span className="text-green-600 font-medium">{order.coupon}</span>
                </div>
              )}
              <div className="flex justify-between py-3 font-bold text-xl text-gray-900">
                <span>Payable Total:</span>
                <span>₹{(parseFloat(order.payable_price) + parseFloat(order.shipping_price)).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Order IDs and Technical Details */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h4 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Info className="w-6 h-6 text-[var(--color-primary-950)] mr-3" /> Technical Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <p><span className="font-medium text-gray-800">Order UUID:</span> <span className="font-mono break-all">{order.order_id}</span></p>
                <p><span className="font-medium text-gray-800">User ID:</span> <span className="font-mono">{order.user}</span></p>
                {order.razorpay_order_id && (
                  <p><span className="font-medium text-gray-800">Razorpay Order ID:</span> <span className="font-mono break-all">{order.razorpay_order_id}</span></p>
                )}
                {order.assigned_to && (
                  <p><span className="font-medium text-gray-800">Assigned To:</span> <span className="font-mono">{order.assigned_to}</span></p>
                )}
              </div>
              <div>
                {order.razorpay_payment_id && (
                  <p><span className="font-medium text-gray-800">Payment ID:</span> <span className="font-mono break-all">{order.razorpay_payment_id}</span></p>
                )}
                {order.razorpay_signature && (
                  <p><span className="font-medium text-gray-800">Payment Signature:</span> <span className="font-mono break-all text-xs">{order.razorpay_signature}</span></p>
                )}
                <p><span className="font-medium text-gray-800">Created At:</span> {formatDate(order.created_at)}</p>
                <p><span className="font-medium text-gray-800">Last Updated:</span> {formatDate(order.updated_at)}</p>
                {order.cancel_reason && order.cancel_reason !== "1" && (
                  <p><span className="font-medium text-gray-800">Cancel Reason:</span> <span className="text-red-600">{order.cancel_reason}</span></p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}