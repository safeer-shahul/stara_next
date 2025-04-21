// app/admin/Orders/list/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import apiService from '@/utils/api/apiService';

interface Order {
  order_id: string;
  created_at: string;
  updated_at: string;
  total_price: string;
  status: string;
  payment_mode: string;
  payment_status: string;
  razorpay_order_id: string;
  user: number;
}

export default function OrderListPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [currentPage, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await apiService.getPaginatedOrders(currentPage, pageSize);
      setOrders(response.orders);
      setTotalItems(response.total);
      setTotalPages(Math.ceil(response.total / pageSize));
      setError(null);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load orders. Please try again.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // You would need to implement search in your API and call it here
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when changing status
  };

  // Function to format date string
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Orders</h2>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center">
            <Package className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="font-semibold">All Orders</h3>
          </div>
          <div className="flex space-x-2">
            <input 
              type="text" 
              placeholder="Search Orders..." 
              className="border rounded px-3 py-1 text-sm"
              value={searchQuery}
              onChange={handleSearch}
            />
            <select 
              className="border rounded px-3 py-1 text-sm"
              value={statusFilter}
              onChange={handleStatusChange}
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
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
            <p className="mt-2 text-gray-600">Loading Orders...</p>
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders?.length > 0 ? (
                  orders.map((order) => (
                    <tr key={order.order_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{order.order_id.replace(/-/g, '')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.razorpay_order_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{parseFloat(order.total_price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' : 
                            order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                            order.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 
                            'bg-blue-100 text-blue-800'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${order.payment_status === 'Success' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {order.payment_status}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {order.payment_mode}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <Link href={`/admin/orders/view/?id=${order.order_id}`}>
                            <button className="text-blue-600 hover:text-blue-800">
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="px-6 py-4 border-t flex justify-between items-center">
              <p className="text-sm text-gray-500">
                Showing {orders?.length} of {totalItems} Orders
              </p>
              <div className="flex space-x-2">
                <button 
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded border ${currentPage === 1 ? 'text-gray-400 border-gray-200' : 'text-blue-600 border-blue-600'}`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button 
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded border ${currentPage === totalPages ? 'text-gray-400 border-gray-200' : 'text-blue-600 border-blue-600'}`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}