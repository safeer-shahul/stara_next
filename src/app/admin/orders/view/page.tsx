"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Package, ArrowLeft, Truck, Calendar, CreditCard } from 'lucide-react';
import apiService from '@/utils/api/apiService';
import { useSearchParams } from 'next/navigation';

interface OrderData {
  order_id: string;
  created_at: string;
  updated_at: string;
  total_price: string;
  status: string;
  payment_mode: string;
  payment_status: string;
  razorpay_signature?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  user: number;
  order_items: Array<{
    id: string;
    product_details: {
      id: string;
      images: Array<{
        id: string;
        product_image: string;
        product: string;
      }>;
      product_code: string;
      product_name: string;
      product_description: string;
      product_price: string;
      strike_price: string;
      product_weight: string;
      product_box_weight: string;
      product_status: boolean;
      created_at: string;
      updated_at: string;
      sub_category: string;
    };
    created_at: string;
    updated_at: string;
    quantity: number;
    price: string;
    total_price: string;
    order_id: string;
    product_id: string;
  }>;
  address: any;
}

export default function OrderDetailsPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchOrderDetails(id);
    }
  }, [id]);

  const fetchOrderDetails = async (orderId: string) => {
    setLoading(true);
    try {
      const response = await apiService.getOrderById(orderId.replace(/-/g, ''));
      setOrder(response);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch order details:', err);
      setError('Failed to load order details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Link href="/admin/orders/list" className="text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-2xl font-bold">Order Details</h2>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center">
            <Package className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="font-semibold">Order Information</h3>
          </div>
        </div>

        {error && (
          <div className="p-4 text-red-700 bg-red-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading order details...</p>
          </div>
        ) : order ? (
          <div className="p-6">
            {/* Order Header Information */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
                <h3 className="text-lg font-medium">Order #{order.order_id.replace(/-/g, '')}</h3>
                <span className={`text-sm px-3 py-1 rounded-full font-medium mt-2 sm:mt-0 ${
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                    <h4 className="text-sm font-medium text-gray-700">Order Date</h4>
                  </div>
                  <p className="text-sm">{formatDate(order.created_at)}</p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Truck className="w-4 h-4 text-gray-500 mr-2" />
                    <h4 className="text-sm font-medium text-gray-700">Delivery Status</h4>
                  </div>
                  <p className="text-sm">{order.status}</p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <CreditCard className="w-4 h-4 text-gray-500 mr-2" />
                    <h4 className="text-sm font-medium text-gray-700">Payment</h4>
                  </div>
                  <p className="text-sm">
                    <span className={order.payment_status === "Success" ? "text-green-600" : "text-orange-600"}>
                      {order.payment_status}
                    </span>
                    {" "}({order.payment_mode})
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h4 className="text-md font-medium mb-3 pb-2 border-b">Order Items ({order.order_items.length})</h4>
              <div className="space-y-4">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex bg-white p-3 rounded-lg border border-gray-200">
                    <div className="w-20 h-20 rounded-md overflow-hidden mr-4 bg-gray-100 flex-shrink-0 relative">
                      {item.product_details.images && item.product_details.images.length > 0 ? (
                        <Image 
                          src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${item.product_details.images[0].product_image}`} 
                          alt={item.product_details.product_name}
                          fill
                          sizes="(max-width: 80px) 100vw, 80px"
                          style={{objectFit: 'cover'}}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-md font-medium text-gray-900">{item.product_details.product_name}</h4>
                        <p className="text-md font-medium">₹{parseFloat(item.price).toFixed(2)}</p>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.product_details.product_description}</p>
                      
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                          <p className="text-sm text-gray-600">Product Code: {item.product_details.product_code}</p>
                        </div>
                        
                        <div className="text-right">
                          {item.product_details.strike_price && parseFloat(item.product_details.strike_price) > 0 && (
                            <p className="text-sm text-gray-500 line-through">₹{parseFloat(item.product_details.strike_price).toFixed(2)}</p>
                          )}
                          <p className="text-sm font-medium">Item Total: ₹{parseFloat(item.total_price).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="mt-8 pt-4 border-t border-gray-200">
              <h4 className="text-md font-medium mb-3">Order Summary</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Items Subtotal:</span>
                  <span>₹{parseFloat(order.total_price).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Shipping:</span>
                  <span>₹0.00</span>
                </div>
                <div className="flex justify-between py-2 font-medium text-lg">
                  <span>Total:</span>
                  <span>₹{parseFloat(order.total_price).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Order IDs and Technical Details */}
            <div className="mt-8 text-sm text-gray-500">
              <h4 className="text-md font-medium mb-3 text-gray-700">Order Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><span className="font-medium">Order ID:</span> {order.order_id.replace(/-/g, '')}</p>
                  {order.razorpay_order_id && (
                    <p><span className="font-medium">Razorpay Order ID:</span> {order.razorpay_order_id}</p>
                  )}
                </div>
                <div>
                  {order.razorpay_payment_id && (
                    <p><span className="font-medium">Payment ID:</span> {order.razorpay_payment_id}</p>
                  )}
                  <p><span className="font-medium">Created:</span> {formatDate(order.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-600">No order found with the provided ID.</p>
          </div>
        )}
      </div>
    </div>
  );
}