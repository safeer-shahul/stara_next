'use client';

import { useState, useEffect } from 'react';
import { MapPin, PackageOpen } from 'lucide-react';
import Image from 'next/image';
import apiService from '@/utils/api/apiService';
import CancelOrderModal from './CancelOrderModal';
import ReturnOrderModal from './ReturnOrderModal';
import ReplacementOrderModal from './ReplacementOrderModal';


export default function OrdersList() {
  const [orders, setOrders] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await apiService.getMyOrders();
        console.log('Orders response:', response);
        setOrders(response || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrders([]);
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Helper function to format dates
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Check if order can be cancelled (not delivered or cancelled)
  const canCancelOrder = (status: string) => {
    return status !== 'Delivered' && status !== 'Cancelled';
  };

  // Check if order can be returned or replaced (within 2 days of delivery)
  const canReturnOrReplace = (status: string, deliveryDate: string | null) => {
    if (status == 'Delivered' || !deliveryDate) return false;
    
    const delivered = new Date(deliveryDate);
    const today = new Date();
    
    // Calculate difference in days
    const diffTime = Math.abs(today.getTime() - delivered.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= 2;
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

  // Handle opening return modal
  const handleOpenReturnModal = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowReturnModal(true);
  };

  // Handle opening replacement modal
  const handleOpenReplacementModal = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowReplacementModal(true);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
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
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <PackageOpen size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">No Orders Yet</h3>
        <p className="text-gray-500">Once you place an order, it will appear here.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow py-6 px-2">
        <h2 className="text-[16px] font-semibold mb-6">Your Orders</h2>
        
        <div className="space-y-4">
          {orders.map((order: any) => {
            const itemsCount = order.order_items.reduce((sum: any, item: any) => sum + item.quantity, 0);
            // For demo purposes, let's assume delivery date is 2 days after order creation
            // In production, you should use the actual delivery date from the API
            const deliveryDate = order.delivery_date || (order.status === 'Delivered' ? 
              new Date(new Date(order.created_at).getTime() + (2 * 24 * 60 * 60 * 1000)).toISOString() : 
              null);
            
            const canCancel = canCancelOrder(order.status);
            const canReturn = canReturnOrReplace(order.status, deliveryDate);
            
            return (
              <div key={order.order_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2">
                  <h3 className="text-[14px] font-medium">Order #{order.order_id.replace(/-/g, '')}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium mt-1 sm:mt-0 inline-flex self-start ${
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
                
                <div className="flex flex-wrap gap-x-4 text-[14px] text-gray-500 mb-3">
                  <span>Ordered: {formatDate(order.created_at)}</span>
                  {order.status === 'Delivered' && deliveryDate && (
                    <>
                      <span>•</span>
                      <span>Delivered: {formatDate(deliveryDate)}</span>
                    </>
                  )}
                  <span>•</span>
                  <span>{itemsCount} {itemsCount === 1 ? 'item' : 'items'}</span>
                  <span>•</span>
                  <span className="font-medium text-gray-900">₹{parseFloat(order.total_price).toFixed(2)}</span>
                </div>

                {order.address_details && (
                  <div className="py-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-gray-500 mr-2" />
                      <h4 className="text-sm font-bold text-gray-700">Delivering to:</h4>
                    </div>
                    <p className="text-sm ml-6">{order.address_details.address}, {order.address_details.town}, {order.address_details.state} - {order.address_details.pincode}</p>
                    <p className="text-sm ml-6">
                      <span className="font-medium">Phone:</span> {order.address_details.phone_number_1}
                      {order.address_details.phone_number_2 && (
                        <>, {order.address_details.phone_number_2}</>
                      )}
                    </p>
                  </div>
                )}
                
                <div className="mt-3 space-y-2">
                  {order.order_items.map((item: any) => (
                    <div key={item.id} className="flex bg-white p-2 rounded-lg border border-gray-200">
                      <div className="w-16 h-16 rounded-md overflow-hidden mr-3 bg-gray-100 flex-shrink-0 relative">
                        {item.product_details.images && item.product_details.images.length > 0 ? (
                          <Image 
                            src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${item.product_details.images[0].product_image}`} 
                            alt={item.product_details.product_name}
                            fill
                            sizes="(max-width: 64px) 100vw, 64px"
                            style={{objectFit: 'cover'}}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200"></div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-[14px] font-medium text-gray-900 line-clamp-1">{item.product_details.product_name}</h4>
                        </div>
                        
                        <div className="flex justify-between">
                          <div>
                            <p className="text-[13px] text-gray-600">Qty: {item.quantity}</p>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-[14px] font-medium">₹{parseFloat(item.price)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-[13px]">
                      <span className="font-medium">Payment: </span>
                      <span className={order.payment_status === "Success" ? "text-green-600" : "text-orange-600"}>
                        {order.payment_status} ({order.payment_mode})
                      </span>
                    </div>
                    <div className="text-[13px] font-medium">
                      Total: ₹{parseFloat(order.total_price).toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {canCancel && (
                      <button 
                        onClick={() => handleOpenCancelModal(order.order_id)}
                        className="px-3 py-1 cursor-pointer text-[12px] border border-black text-black rounded hover:bg-gray-50 transition-colors"
                      >
                        Cancel Order
                      </button>
                    )}
                    
                    {/* {canReturn && ( */}
                      <button 
                        onClick={() => handleOpenReturnModal(order.order_id)}
                        className="px-3 py-1 cursor-pointer text-[12px] border border-black text-black rounded hover:bg-gray-50 transition-colors"
                      >
                        Return Order
                      </button>
                    {/* )} */}
                    
                    {/* {canReturn && ( */}
                      <button 
                        onClick={() => handleOpenReplacementModal(order.order_id)}
                        className="px-3 py-1 cursor-pointer text-[12px] border border-black text-black rounded hover:bg-gray-50 transition-colors"
                      >
                        Replace Order
                      </button>
                    {/* )} */}
                  </div>
                </div>
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

      {showReturnModal && selectedOrderId && (
        <ReturnOrderModal
          orderId={selectedOrderId}
          orderItems={orders.find((order:any) => order.order_id === selectedOrderId)?.order_items || []}
          onClose={() => setShowReturnModal(false)}
          onSuccess={() => {
            setShowReturnModal(false);
            handleOrderUpdate();
          }}
        />
      )}

      {showReplacementModal && selectedOrderId && (
        <ReplacementOrderModal
          orderId={selectedOrderId}
          orderItems={orders.find((order:any) => order.order_id === selectedOrderId)?.order_items || []}
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