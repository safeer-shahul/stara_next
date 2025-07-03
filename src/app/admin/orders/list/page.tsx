// app/admin/orders/list/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Package, Eye, ChevronLeft, ChevronRight, Search, ShoppingCart, Info,
  Box, UserRound, CheckCircle, Clock, CalendarDays, Edit, Copy, RotateCcw
} from 'lucide-react';
import apiService from '@/utils/api/apiService';
import { useAdminUser } from '../../context/AdminUserContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface Order {
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
  razorpay_order_id: string;
  user: number;
  assigned_to?: number | null;
  is_packed: boolean;
  packed_date: string | null;
  is_shipped: boolean;
  is_delivered: boolean;
  is_cancelled: boolean;
  is_returned: boolean;
  is_refunded: boolean;
  is_paid: boolean;
  phone_number: string;
}

type OrderMode =
  'all' | 'assigned_order_to_me' | 'un_assigned_order' |
  'packed_order_by_me' | 'all_packed_order' | 'all_delivered_order';

const DeliveryStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as const;
type DeliveryStatus = typeof DeliveryStatuses[number];

export default function OrderListPage() {
  const adminUser = useAdminUser();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);

  const [selectedOrderMode, setSelectedOrderMode] = useState<OrderMode>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [newDeliveryStatus, setNewDeliveryStatus] = useState<DeliveryStatus>('Pending');

  // CHANGED: Separate state for input values and actual search values
  const [searchOrderIdInput, setSearchOrderIdInput] = useState(''); // For input field
  const [searchPhoneNumberInput, setSearchPhoneNumberInput] = useState(''); // For input field
  const [searchOrderId, setSearchOrderId] = useState(''); // For actual search
  const [searchPhoneNumber, setSearchPhoneNumber] = useState(''); // For actual search

  const [showCopyDropdown, setShowCopyDropdown] = useState<string | null>(null);
  const [triggerFetch, setTriggerFetch] = useState(0);

  const availableOrderModes = useMemo(() => {
    const modes: { label: string; value: OrderMode; icon: any }[] = [
      { label: 'All Orders', value: 'all', icon: ShoppingCart },
    ];

    if (adminUser?.isStaff) {
      modes.push(
        { label: 'Assigned to Me', value: 'assigned_order_to_me', icon: UserRound },
        { label: 'Unassigned', value: 'un_assigned_order', icon: Clock },
        { label: 'Packed by Me', value: 'packed_order_by_me', icon: Box }
      );
    }
    if (adminUser?.is_superuser) {
      modes.push(
        { label: 'All Packed', value: 'all_packed_order', icon: Box },
        { label: 'All Delivered', value: 'all_delivered_order', icon: CheckCircle }
      );
    }
    return modes;
  }, [adminUser]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelectedOrderIds([]);
    setEditingOrderId(null);

    try {
      const options: {
        order_mode?: string;
        sort_order?: 'asc' | 'desc';
        start_date?: string;
        end_date?: string;
        order_id?: string;
        phone_number?: string;
      } = { sort_order: sortOrder };

      if (selectedOrderMode !== 'all') {
        options.order_mode = selectedOrderMode;
      }
      if (startDate) {
        options.start_date = startDate.toISOString().split('T')[0];
      }
      if (endDate) {
        options.end_date = endDate.toISOString().split('T')[0];
      }

      // CHANGED: Use actual search values, not input values
      if (searchOrderId) {
        options.order_id = searchOrderId;
      }
      if (searchPhoneNumber) {
        options.phone_number = searchPhoneNumber;
      }

      const response = await apiService.getPaginatedOrders(currentPage, pageSize, options);

      const formattedOrders = response.orders.map((order: any) => ({
        ...order,
        payable_price: order.payable_price ? parseFloat(order.payable_price).toFixed(2) : '0.00',
        actual_price: order.actual_price ? parseFloat(order.actual_price).toFixed(2) : '0.00',
        discounted_price: order.discounted_price ? parseFloat(order.discounted_price).toFixed(2) : '0.00',
        shipping_price: order.shipping_price ? parseFloat(order.shipping_price).toFixed(2) : '0.00',
      }));

      setOrders(formattedOrders);
      setTotalItems(response.total);
      setTotalPages(Math.ceil(response.total / pageSize));
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load orders. Please try again.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, selectedOrderMode, sortOrder, startDate, endDate, adminUser, searchOrderId, searchPhoneNumber]);

  // CHANGED: Remove search input dependencies from useEffect
  useEffect(() => {
    if (adminUser) {
      fetchOrders();
    }
  }, [currentPage, selectedOrderMode, sortOrder, startDate, endDate, adminUser, triggerFetch, fetchOrders]);

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

  const handleOrderModeChange = useCallback((mode: OrderMode) => {
    setSelectedOrderMode(mode);
    setCurrentPage(1);
    setSelectedOrderIds([]);
    // CHANGED: Clear input fields and actual search values
    setSearchOrderIdInput('');
    setSearchPhoneNumberInput('');
    setSearchOrderId('');
    setSearchPhoneNumber('');
    setTriggerFetch(prev => prev + 1);
  }, []);

  const handleSortOrderChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(event.target.value as 'asc' | 'desc');
    setCurrentPage(1);
    setTriggerFetch(prev => prev + 1);
  }, []);

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

  // CHANGED: Modified search handler to update actual search values
  const handleSearch = useCallback(() => {
    // Update actual search values from input values
    setSearchOrderId(searchOrderIdInput);
    setSearchPhoneNumber(searchPhoneNumberInput);
    setCurrentPage(1);
    setTriggerFetch(prev => prev + 1);
  }, [searchOrderIdInput, searchPhoneNumberInput]);

  const handleResetFilters = useCallback(() => {
    setSelectedOrderMode('all');
    setSortOrder('desc');
    setStartDate(null);
    setEndDate(null);
    // CHANGED: Clear both input and actual search values
    setSearchOrderIdInput('');
    setSearchPhoneNumberInput('');
    setSearchOrderId('');
    setSearchPhoneNumber('');
    setSelectedOrderIds([]);
    setEditingOrderId(null);
    setCurrentPage(1);
    setTriggerFetch(prev => prev + 1);
  }, []);

  // CHANGED: Added handler for Enter key press in search inputs
  const handleSearchKeyPress = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  const handleSelectAllOrders = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allUnassignedOrderIds = orders.filter(order => order.assigned_to === null).map(order => order.order_id);
      setSelectedOrderIds(allUnassignedOrderIds);
    } else {
      setSelectedOrderIds([]);
    }
  }, [orders]);

  const handleSelectOrder = useCallback((orderId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedOrderIds(prev => [...prev, orderId]);
    } else {
      setSelectedOrderIds(prev => prev.filter(id => id !== orderId));
    }
  }, []);

  const handleAssignSelectedOrders = useCallback(async () => {
    if (selectedOrderIds.length === 0) {
      alert('Please select orders to assign.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiService.assignOrdersToMe(selectedOrderIds);
      alert('Selected orders assigned successfully!');
      setTriggerFetch(prev => prev + 1);
    } catch (err) {
      console.error('Failed to assign orders:', err);
      setError('Failed to assign orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedOrderIds]);

  const handleTogglePackedStatus = useCallback(async (orderId: string, currentPackingStatus: boolean) => {
    setLoading(true);
    setError(null);
    try {
      console.log('currentPackingStatus', orderId)
      await apiService.markOrderAsPacked(orderId, !currentPackingStatus);
      alert(`Order ${orderId.substring(0, 8)}... packing status updated!`);
      setTriggerFetch(prev => prev + 1);
    } catch (err) {
      console.error(`Failed to update packing status for order ${orderId}:`, err);
      setError('Failed to update packing status. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleEditDeliveryStatus = useCallback((orderId: string, currentStatus: string) => {
    setEditingOrderId(orderId);
    setNewDeliveryStatus(currentStatus as DeliveryStatus);
  }, []);

  const handleUpdateDeliveryStatus = useCallback(async (orderId: string) => {
    setLoading(true);
    setError(null);
    try {
      await apiService.updateOrderStatus(orderId, { status: newDeliveryStatus });
      alert(`Delivery status for order ${orderId.substring(0, 8)}... updated to ${newDeliveryStatus}!`);
      setEditingOrderId(null);
      setTriggerFetch(prev => prev + 1);
    } catch (err) {
      console.error(`Failed to update delivery status for order ${orderId}:`, err);
      setError('Failed to update delivery status. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [newDeliveryStatus]);

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

  const isAllUnassignedSelected = useMemo(() => {
    const unassignedOrders = orders.filter(order => order.assigned_to === null);
    return unassignedOrders.length > 0 && unassignedOrders.every(order => selectedOrderIds.includes(order.order_id));
  }, [orders, selectedOrderIds]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
      setShowCopyDropdown(null);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      alert('Failed to copy to clipboard.');
    });
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-extrabold text-gray-800 flex items-center">
          <ShoppingCart className="w-8 h-8 mr-3 text-[var(--color-primary-950)]" />
          Order Management
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
        {availableOrderModes.map((mode) => {
          const ModeIcon = mode.icon;
          return (
            <button
              key={mode.value}
              onClick={() => handleOrderModeChange(mode.value)}
              className={`flex items-center justify-center p-4 rounded-lg shadow-md transition-all duration-200
                ${selectedOrderMode === mode.value
                  ? 'bg-[var(--color-primary-950)] text-white scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-100 hover:shadow-lg'
                }`}
            >
              <ModeIcon className="w-6 h-6 mr-2" />
              <span className="font-semibold">{mode.label}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="p-5 border-b border-gray-200 flex flex-col gap-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h3 className="font-semibold text-lg text-gray-800 flex items-center">
              <Package className="w-6 h-6 text-[var(--color-primary-950)] mr-3" />
              {availableOrderModes.find(m => m.value === selectedOrderMode)?.label || 'All Customer Orders'}
            </h3>

            {selectedOrderMode === 'un_assigned_order' && selectedOrderIds.length > 0 && (
              <button
                onClick={handleAssignSelectedOrders}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center"
                disabled={loading}
              >
                <UserRound className="w-5 h-5 mr-2" /> Assign Selected to Me
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-between gap-4">
            <div className="flex items-center flex-wrap gap-2">
              <div className="relative">
                <select
                  value={sortOrder}
                  onChange={handleSortOrderChange}
                  className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-md leading-tight focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z" /></svg>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative">
                  <DatePicker
                    selected={startDate}
                    onChange={handleStartDateChange}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    placeholderText="From Date"
                    dateFormat="yyyy-MM-dd"
                    className="w-full sm:w-36 border border-gray-300 rounded-md py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)]"
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
                    placeholderText="To Date"
                    dateFormat="yyyy-MM-dd"
                    className="w-full sm:w-36 border border-gray-300 rounded-md py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)]"
                  />
                  <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-2">
              {/* CHANGED: Use input state variables and add onKeyPress handler */}
              <input
                type="text"
                placeholder="Search by Order ID"
                value={searchOrderIdInput}
                onChange={(e) => setSearchOrderIdInput(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="w-full sm:w-48 border border-gray-300 rounded-md py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)]"
              />
              <input
                type="text"
                placeholder="Search by Phone No."
                value={searchPhoneNumberInput}
                onChange={(e) => setSearchPhoneNumberInput(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="w-full sm:w-48 border border-gray-300 rounded-md py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)]"
              />
              <button
                onClick={handleSearch}
                className={`px-4 py-2 rounded-md transition-colors duration-200 flex items-center justify-center
                  ${(searchOrderIdInput || searchPhoneNumberInput) ? 'bg-[var(--color-primary-950)] text-white hover:bg-[var(--color-primary-800)]' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
                disabled={!(searchOrderIdInput || searchPhoneNumberInput) || loading}
                title="Search Orders"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200 flex items-center justify-center"
                title="Reset Filters"
              >
                <RotateCcw className="w-5 h-5" />
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
            <p className="mt-4 text-lg text-gray-600">Loading orders...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {selectedOrderMode === 'un_assigned_order' && (
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          onChange={handleSelectAllOrders}
                          checked={isAllUnassignedSelected}
                          className="form-checkbox h-4 w-4 text-[var(--color-primary-950)] rounded"
                        />
                      </th>
                    )}
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Payable Price
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actual Price
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Delivery Status
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
                        {selectedOrderMode === 'un_assigned_order' && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedOrderIds.includes(order.order_id)}
                              onChange={(e) => handleSelectOrder(order.order_id, e)}
                              disabled={order.assigned_to !== null}
                              className="form-checkbox h-4 w-4 text-[var(--color-primary-950)] rounded"
                            />
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-base font-medium text-gray-900 flex items-center gap-2">
                            #{order.order_id.substring(0, 8)}...
                            <div className="relative">
                              <button
                                onClick={() => setShowCopyDropdown(showCopyDropdown === order.order_id ? null : order.order_id)}
                                className="text-gray-500 hover:text-gray-700"
                                title="Copy ID"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              {showCopyDropdown === order.order_id && (
                                <div className="absolute z-60 bg-white shadow-md rounded-md mt-2 w-42 left-0 -ml-16">
                                  <button
                                    onClick={() => copyToClipboard(order.order_id)}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    Copy Order ID
                                  </button>
                                  {order.razorpay_order_id && (
                                    <button
                                      onClick={() => copyToClipboard(order.razorpay_order_id)}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                      Copy Transaction ID
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {order.razorpay_order_id ? `Txn: ${order.razorpay_order_id.substring(0, 10)}...` : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-base font-semibold text-gray-800">
                          ₹{order.payable_price}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-base font-semibold text-gray-800">
                          ₹{order.actual_price}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingOrderId === order.order_id && (adminUser?.is_superuser || selectedOrderMode === 'packed_order_by_me') && !['Delivered', 'Cancelled'].includes(order.status) ? (
                            <div className="flex items-center space-x-2">
                              <select
                                value={newDeliveryStatus}
                                onChange={(e) => setNewDeliveryStatus(e.target.value as DeliveryStatus)}
                                className="block w-full bg-white border border-gray-300 text-gray-700 py-1 px-2 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-950)]"
                              >
                                {DeliveryStatuses.map(status => (
                                  <option key={status} value={status}>{status}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleUpdateDeliveryStatus(order.order_id)}
                                className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
                                disabled={loading}
                              >
                                Update
                              </button>
                              <button
                                onClick={() => setEditingOrderId(null)}
                                className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusBadgeClasses(order.status)}`}>
                                {order.status}
                              </span>
                              {((adminUser?.is_superuser || selectedOrderMode === 'packed_order_by_me') && !['Delivered', 'Cancelled'].includes(order.status)) ? (
                                <button
                                  onClick={() => handleEditDeliveryStatus(order.order_id, order.status)}
                                  className="text-gray-500 hover:text-gray-700"
                                  title="Edit Delivery Status"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              ) : null}
                            </div>
                          )}
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

                            {selectedOrderMode === 'assigned_order_to_me' && (
                              <button
                                onClick={() => handleTogglePackedStatus(order.order_id, order.is_packed)}
                                className={`flex items-center transition-colors duration-200 ${order.is_packed ? 'text-orange-500 hover:text-orange-700' : 'text-green-600 hover:text-green-800'}`}
                                title={order.is_packed ? 'Mark as Unpacked' : 'Mark as Packed'}
                                disabled={loading}
                              >
                                <Package className="w-5 h-5 mr-1" />
                                {order.is_packed ? 'Unpack' : 'Pack'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={selectedOrderMode === 'un_assigned_order' ? 8 : 7} className="px-6 py-10 text-center text-gray-500">
                        <Info className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-lg">No orders found for this mode and filter combination.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

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