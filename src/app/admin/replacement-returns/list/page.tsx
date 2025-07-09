// app/admin/replacement-orders/list/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Package, Eye, ChevronLeft, ChevronRight, RotateCcw, CalendarDays,
  RefreshCw, UserRound, Info, Clock
} from 'lucide-react';
import apiService from '@/utils/api/apiService';
import { useAdminUser } from '../../context/AdminUserContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

interface ReplacementOrder {
  id: string;
  user: User;
  created_at: string;
  updated_at: string;
  status: string;
  replacement_request: string;
  order: string;
}

const ReplacementStatuses = ['Pending', 'Processing', 'Completed', 'Cancelled'] as const;
type ReplacementStatus = typeof ReplacementStatuses[number];

export default function ReplacementOrdersListPage() {
  const adminUser = useAdminUser();

  const [replacementOrders, setReplacementOrders] = useState<ReplacementOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [triggerFetch, setTriggerFetch] = useState(0);

  const fetchReplacementOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const options: {
        start_date?: string;
        end_date?: string;
      } = {};

      if (startDate) {
        options.start_date = startDate.toISOString();
      }
      if (endDate) {
        options.end_date = endDate.toISOString();
      }

      const response = await apiService.getReplacementOrdersPaginated(currentPage, pageSize, options);

      setReplacementOrders(response.replacements_orders || []);
      setTotalItems(response.total || response.replacements_orders?.length || 0);
      setTotalPages(response.total_pages || Math.ceil((response.total || response.replacements_orders?.length || 0) / pageSize));
    } catch (err) {
      console.error('Failed to fetch replacement orders:', err);
      setError('Failed to load replacement orders. Please try again.');
      setReplacementOrders([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, startDate, endDate, adminUser]);

  useEffect(() => {
    if (adminUser) {
      fetchReplacementOrders();
    }
  }, [currentPage, startDate, endDate, adminUser, triggerFetch, fetchReplacementOrders]);

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

  const handleStartDateChange = useCallback((date: Date | null) => {
    setStartDate(date);
    setCurrentPage(1);
    setTriggerFetch(prev => prev + 1);
  }, []);

  const handleEndDateChange = useCallback((date: Date | null) => {
    setEndDate(date);
    setCurrentPage(1);
    setTriggerFetch(prev => prev + 1);
  }, []);

  const handleResetDates = useCallback(() => {
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(1);
    setTriggerFetch(prev => prev + 1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(1);
    setTriggerFetch(prev => prev + 1);
  }, []);

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

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'Processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatUserName = (user: User) => {
    const fullName = `${user.first_name} ${user.last_name}`.trim();
    return fullName || user.email.split('@')[0];
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-extrabold text-gray-800 flex items-center">
          <RefreshCw className="w-8 h-8 mr-3 text-[var(--color-primary-950)]" />
          Replacement Return Orders
        </h2>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="p-5 border-b border-gray-200 flex flex-col gap-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h3 className="font-semibold text-lg text-gray-800 flex items-center">
              <Package className="w-6 h-6 text-[var(--color-primary-950)] mr-3" />
              All Replacement Return Orders
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-between gap-4">
            {/* Date Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative">
                <DatePicker
                  selected={startDate}
                  onChange={handleStartDateChange}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  placeholderText="From Date & Time"
                  dateFormat="yyyy-MM-dd HH:mm"
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  timeCaption="Time"
                  className="w-full sm:w-48 border border-gray-300 rounded-md py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)]"
                />
                <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <DatePicker
                  selected={endDate}
                  onChange={handleEndDateChange}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate || undefined}
                  placeholderText="To Date & Time"
                  dateFormat="yyyy-MM-dd HH:mm"
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  timeCaption="Time"
                  className="w-full sm:w-48 border border-gray-300 rounded-md py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)]"
                />
                <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {(startDate || endDate) && (
                <button
                  onClick={handleResetDates}
                  className="px-3 py-2 bg-orange-200 text-orange-700 rounded-md hover:bg-orange-300 transition-colors duration-200 flex items-center justify-center"
                  title="Reset Dates"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Reset All Filters */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200 flex items-center justify-center"
                title="Reset All Filters"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-6 text-red-700 bg-red-50 border-l-4 border-red-500">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="p-10 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--color-primary-950)] mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600">Loading replacement orders...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Replacement Order ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Created Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Original Order
                    </th>
                    {/* <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th> */}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {replacementOrders?.length > 0 ? (
                    replacementOrders.map((replacementOrder) => (
                      <tr key={replacementOrder.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            #{replacementOrder.id.replace(/-/g, '')}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Request: {replacementOrder.replacement_request.substring(0, 8)}...
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-[var(--color-primary-950)] flex items-center justify-center">
                                <UserRound className="w-4 h-4 text-white" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {formatUserName(replacementOrder.user)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {replacementOrder.user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 text-gray-400 mr-2" />
                            {formatDate(replacementOrder.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusBadgeClasses(replacementOrder.status)}`}>
                            {replacementOrder.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            #{replacementOrder.order.substring(0, 8)}...
                          </div>
                          <Link
                            href={`/admin/orders/view?id=${replacementOrder.order}`}
                            className="text-xs text-blue-600 hover:text-blue-800 transition-colors duration-200"
                          >
                            View Original Order →
                          </Link>
                        </td>
                        {/* <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <Link
                              href={`/admin/replacement-orders/view?id=${replacementOrder.id}`}
                              className="text-blue-600 hover:text-blue-800 transition-colors duration-200 flex items-center"
                              title="View Replacement Order Details"
                            >
                              <Eye className="w-5 h-5 mr-1" />
                              View Details
                            </Link>
                          </div>
                        </td> */}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                        <Info className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-lg">No replacement orders found for the selected date range.</p>
                        <p className="text-sm mt-2">Try adjusting your date filters or check back later.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-5 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-600">
                Showing {replacementOrders.length} of {totalItems} replacement orders
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