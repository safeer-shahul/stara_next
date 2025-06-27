// app/admin/Orders/list/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Package, Eye, ChevronLeft, ChevronRight, Search, ShoppingCart, Info } from 'lucide-react';
import apiService from '@/utils/api/apiService';

// Define more specific types for Order for better type safety
interface Order {
  order_id: string;
  created_at: string;
  updated_at: string;
  total_price: string;
  status: string; // e.g., 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'
  payment_mode: string; // e.g., 'COD', 'Razorpay'
  payment_status: string; // e.g., 'Success', 'Pending', 'Failed'
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
  // Removed searchQuery and statusFilter states as they are not supported by the API
  // const [searchQuery, setSearchQuery] = useState('');
  // const [statusFilter, setStatusFilter] = useState('');

  // Removed useEffect for debounced search as search is not supported by API

  // Fetch orders whenever currentPage changes
  useEffect(() => {
    fetchOrders();
  }, [currentPage]); // Only depend on currentPage now

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Adjusted API call to match the provided getPaginatedOrders signature
      const response = await apiService.getPaginatedOrders(currentPage, pageSize, {
        // You can add a default sort_by here if your API supports it and you want it
        // sort_by: 'created_at_desc'
      });
      setOrders(response.orders); // Assuming response.orders contains the array of orders
      setTotalItems(response.total); // Assuming response.total contains the total count
      setTotalPages(Math.ceil(response.total / pageSize));
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load orders. Please try again.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]); // Memoized with dependencies

  // Removed handleSearchChange function
  // Removed handleStatusChange function

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  // Function to format date string
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
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
  };

  // Helper to get status badge colors
  const getStatusBadgeClasses = (status: string) => {
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
  };

  // Helper to get payment status badge colors
  const getPaymentStatusBadgeClasses = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'Success':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-extrabold text-gray-800 flex items-center">
          <ShoppingCart className="w-8 h-8 mr-3 text-[var(--color-primary-950)]" />
          Order Management
        </h2>
      </div>

      {/* Main Content Area: Orders Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        {/* Table Header/Toolbar - Only includes title now, as search/filter not supported by API */}
        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center">
            <Package className="w-6 h-6 text-[var(--color-primary-950)] mr-3" />
            <h3 className="font-semibold text-lg text-gray-800">All Customer Orders</h3>
          </div>
          {/* Search Input and Status Filter are removed from here */}
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
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--color-primary-950)] mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600">Loading orders...</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders?.length > 0 ? (
                    orders.map((order) => (
                      <tr key={order.order_id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-base font-medium text-gray-900">
                            #{order.order_id.substring(0, 8)}...
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {order.razorpay_order_id ? `Txn: ${order.razorpay_order_id.substring(0, 10)}...` : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-base font-semibold text-gray-800">
                          ₹{parseFloat(order.total_price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusBadgeClasses(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getPaymentStatusBadgeClasses(order.payment_status)}`}>
                            {order.payment_status}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            {order.payment_mode}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <Link
                              href={`/admin/orders/view?id=${order.order_id}`}
                              className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                              title="View Order Details"
                            >
                              <Eye className="w-5 h-5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                        <Info className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-lg">No orders found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-5 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-600">
                Showing {orders.length} of {totalItems} orders
              </p>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1 || loading}
                  className={`px-4 py-2 rounded-md border border-gray-300 bg-white
                              flex items-center justify-center transition-colors duration-200
                              ${currentPage === 1 || loading ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100 hover:border-[var(--color-primary-950)]'}`}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-gray-700 font-medium text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || loading}
                  className={`px-4 py-2 rounded-md border border-gray-300 bg-white
                              flex items-center justify-center transition-colors duration-200
                              ${currentPage === totalPages || loading ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100 hover:border-[var(--color-primary-950)]'}`}
                  aria-label="Next page"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}