// app/admin/orders/view/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react'; // Import useMemo
import Link from 'next/link';
import Image from 'next/image';
import { Package, ArrowLeft, Truck, Calendar, CreditCard, MapPin, ShoppingCart, Info, Loader2, DollarSign, Tag, HandCoins, MinusCircle, Gift } from 'lucide-react';
import apiService from '@/utils/api/apiService';
import { useSearchParams } from 'next/navigation';

// --- Interfaces ---
interface AddressData {
  id: string;
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
  images: Array<{
    id: string;
    product_image: string;
    product: string;
  }>;
  product_code: string;
  product_name: string;
  product_description: string;
  product_price: string; // Unit price
  strike_price: string;
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
  offer_details?: OfferDetails; // Keep this as it's from backend response
  created_at: string;
  updated_at: string;
  quantity: number;
  price: string; // Price per unit at time of order for this specific item
  total_price: string; // Total price for this order_item (quantity * price)
  order_id: string;
  product_id: string;
  offer: string | null;
}

interface OrderData {
  order_id: string;
  created_at: string;
  updated_at: string;
  payable_price: string;
  actual_price: string;
  discounted_price: string;
  shipping_price: string;
  status: string;
  payment_mode: string;
  payment_status: string;
  razorpay_signature?: string | null;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  user: number;
  order_items: OrderItem[];
  address: string;
  address_details?: AddressData;

  is_packed: boolean;
  packed_date: string | null;
  is_shipped: boolean;
  is_delivered: boolean;
  is_cancelled: boolean;
  is_returned: boolean;
  is_refunded: boolean;
  is_paid: boolean;
  assigned_to: number | null;
  coupon: string | null;
}

// --- Interface for Grouped Products (offers_applied removed) ---
interface GroupedOrderItem {
  product_id: string;
  product_details: OrderItemProductDetails;
  total_quantity: number;
  unit_price_at_order: string;
}


export default function OrderDetailsPage() {
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
      console.error('Failed to fetch order details:', err);
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
      console.error("Invalid date string:", dateString, e);
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

  // --- Pre-process order_items for display (offers_applied removed from grouped item) ---
  const groupedOrderItems = useMemo(() => {
    if (!order?.order_items) return [];

    const grouped: { [productId: string]: GroupedOrderItem } = {};

    order.order_items.forEach(item => {
      if (grouped[item.product_id]) {
        grouped[item.product_id].total_quantity += item.quantity;
      } else {
        grouped[item.product_id] = {
          product_id: item.product_id,
          product_details: item.product_details,
          total_quantity: item.quantity,
          unit_price_at_order: item.price,
        };
      }
    });

    return Object.values(grouped);
  }, [order?.order_items]);

  // --- Collect all unique offers applied in the order ---
  const uniqueOffersApplied = useMemo(() => {
    if (!order?.order_items) return [];

    const offersMap = new Map<string, OfferDetails>();

    order.order_items.forEach(item => {
      if (item.offer_details && !offersMap.has(item.offer_details.id)) {
        offersMap.set(item.offer_details.id, item.offer_details);
      }
    });

    return Array.from(offersMap.values());
  }, [order?.order_items]);


  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/orders/list"
            className="text-gray-600 hover:text-[var(--color-primary-950)] transition-colors duration-200"
            aria-label="Back to Order List"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
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
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-6 text-red-700 bg-red-50 border-l-4 border-red-500">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="p-10 text-center">
            <Loader2 className="animate-spin h-10 w-10 text-[var(--color-primary-950)] mx-auto" />
            <p className="mt-4 text-lg text-gray-600">Loading order details...</p>
          </div>
        ) : order ? (
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

                {/* Overall Order Status Flags */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 col-span-full md:col-span-1">
                  <div className="flex items-center mb-2">
                    <Info className="w-5 h-5 text-gray-500 mr-2" />
                    <h4 className="text-sm font-medium text-gray-700">Order Progress</h4>
                  </div>
                  <div className="text-sm text-gray-800 space-y-1">
                    <p>Packed: <span className={`font-semibold ${order.is_packed ? 'text-green-600' : 'text-red-600'}`}>{order.is_packed ? 'Yes' : 'No'}</span> {order.packed_date && `(${formatDate(order.packed_date)})`}</p>
                    <p>Shipped: <span className={`font-semibold ${order.is_shipped ? 'text-green-600' : 'text-red-600'}`}>{order.is_shipped ? 'Yes' : 'No'}</span></p>
                    <p>Delivered: <span className={`font-semibold ${order.is_delivered ? 'text-green-600' : 'text-red-600'}`}>{order.is_delivered ? 'Yes' : 'No'}</span></p>
                    <p>Paid: <span className={`font-semibold ${order.is_paid ? 'text-green-600' : 'text-red-600'}`}>{order.is_paid ? 'Yes' : 'No'}</span></p>
                    <p>Cancelled: <span className={`font-semibold ${order.is_cancelled ? 'text-red-600' : 'text-green-600'}`}>{order.is_cancelled ? 'Yes' : 'No'}</span></p>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            {order.address_details && (
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h4 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <MapPin className="w-6 h-6 text-[var(--color-primary-950)] mr-3" /> Shipping Address
                </h4>
                <div className="text-gray-700 space-y-1">
                  <p className="text-base font-semibold">{order.address_details.address}</p>
                  <p className="text-base">{order.address_details.town}, {order.address_details.state} - {order.address_details.pincode}</p>
                  <p className="text-base pt-2">
                    <span className="font-medium">Phone:</span> {order.address_details.phone_number_1}
                    {order.address_details.phone_number_2 && order.address_details.phone_number_2 !== "" && (
                      <>, {order.address_details.phone_number_2}</>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Order Items - NOW GROUPED */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h4 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Package className="w-6 h-6 text-[var(--color-primary-950)] mr-3" /> Order Items ({groupedOrderItems.length})
              </h4>
              <div className="space-y-6">
                {groupedOrderItems.map((item) => (
                  <div key={item.product_id} className="flex flex-col sm:flex-row bg-gray-50 p-4 rounded-lg border border-gray-100 items-center">
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
                        <h5 className="text-lg font-medium text-gray-900 pr-4">{item.product_details.product_name}</h5>
                        {/* Display single product price */}
                        <p className="text-lg font-bold text-gray-900">₹{parseFloat(item.unit_price_at_order).toFixed(2)}</p>
                      </div>

                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.product_details.product_description}</p>

                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
                        <div>
                          {/* Display total quantity for this grouped product */}
                          <p className="text-sm text-gray-700">Quantity: <span className="font-semibold">{item.total_quantity}</span></p>
                          <p className="text-sm text-gray-700">Code: <span className="font-semibold">{item.product_details.product_code}</span></p>
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

            {/* Offers Applied Card - NEW SECTION */}
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
                  <span>₹{parseFloat(order.payable_price).toFixed(2)}</span>
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
                  {order.razorpay_order_id && (
                    <p><span className="font-medium text-gray-800">Razorpay Order ID:</span> <span className="font-mono break-all">{order.razorpay_order_id}</span></p>
                  )}
                </div>
                <div>
                  {order.razorpay_payment_id && (
                    <p><span className="font-medium text-gray-800">Payment ID:</span> <span className="font-mono break-all">{order.razorpay_payment_id}</span></p>
                  )}
                  <p><span className="font-medium text-gray-800">Created At:</span> {formatDate(order.created_at)}</p>
                  <p><span className="font-medium text-gray-800">Last Updated:</span> {formatDate(order.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-xl font-medium">No order found.</p>
            <p className="mt-2 text-base">Please check the Order ID in the URL or try again later.</p>
            <Link href="/admin/orders/list" className="block mt-6 text-[var(--color-primary-950)] hover:underline">
              Back to Order List
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}