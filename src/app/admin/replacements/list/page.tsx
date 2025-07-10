// app/admin/replacement-requests/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// Import relevant icons for consistent design
import { RefreshCw, Plus, Edit, ChevronLeft, ChevronRight, Info, Loader2, Eye, Filter, Package, CheckCircle, Clock, Truck } from 'lucide-react';
import apiService from '@/utils/api/apiService';
import { showToast } from '@/utils/toast';
import Swal from 'sweetalert2';

// Define an interface for ReplacementRequest based on actual API response
interface ReplacementRequest {
  id: string;
  replacement_item: any[];
  created_at: string;
  updated_at: string;
  request_details: string;
  status: string;
  admin_notes: string | null;
  is_recieved: boolean;
  order: string;
  user: number;
  processed_by: string | null;
  order_initiated: boolean;
}

type ReplacementMode = 'all' | 'approved_and_not_recieved' | 'recieved_and_not_reshipped';

export default function ReplacementRequestsPage() {
  const router = useRouter();
  const [allRequests, setAllRequests] = useState<ReplacementRequest[]>([]); // Stores all fetched requests
  const [currentRequestsPage, setCurrentRequestsPage] = useState<ReplacementRequest[]>([]); // Requests for the current page
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0); // Total items from API
  const [totalPages, setTotalPages] = useState(1); // Total pages from API
  const [pageSize] = useState(10); // Fixed page size for pagination
  const [statusFilter, setStatusFilter] = useState<string>('all'); // Status filter
  const [selectedMode, setSelectedMode] = useState<ReplacementMode>('all'); // Mode filter

  // Available modes with icons
  const availableModes = useMemo(() => {
    const modes: { label: string; value: ReplacementMode; icon: any }[] = [
      { label: 'All Replacements', value: 'all', icon: RefreshCw },
      { label: 'Approved & Not Received', value: 'approved_and_not_recieved', icon: Clock },
      { label: 'Received & Not Reshipped', value: 'recieved_and_not_reshipped', icon: Truck }
    ];
    return modes;
  }, []);

  // Status options - only pending and approved
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    // { value: 'REJECTED', label: 'Rejected' },
    // { value: 'PROCESSING', label: 'Processing' },
    // { value: 'COMPLETED', label: 'Completed' },
    // { value: 'CANCELLED', label: 'Cancelled' }
  ];

  // Effect to fetch replacement requests
  useEffect(() => {
    const fetchReplacementRequests = async () => {
      setLoading(true);
      setError(null);
      try {
        const options: {
          status?: string | null;
          mode?: string;
        } = {};

        // Add status filter if not 'all'
        if (statusFilter !== 'all') {
          options.status = statusFilter;
        }

        // Add mode filter if not 'all'
        if (selectedMode !== 'all') {
          options.mode = selectedMode;
        }

        const response = await apiService.getPaginatedReplacementRequests(
          currentPage,
          pageSize,
          options
        );
        
        // Update these based on your actual API response structure
        const fetchedRequests = response.replacements || [];
        const totalCount = response.total_products || 0;
        
        setAllRequests(fetchedRequests);
        setCurrentRequestsPage(fetchedRequests);
        setTotalItems(totalCount);
        setTotalPages(response.total_pages || 1);
      } catch (err) {
        // console.error('Failed to fetch replacement requests:', err);
        setError('Failed to load replacement requests. Please try again.');
        setAllRequests([]);
        setCurrentRequestsPage([]);
        setTotalItems(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchReplacementRequests();
  }, [currentPage, pageSize, statusFilter, selectedMode]); // Refetch when page, size, status filter, or mode changes

  // Handle mode change
  const handleModeChange = useCallback((mode: ReplacementMode) => {
    setSelectedMode(mode);
    setCurrentPage(1); // Reset to first page when mode changes
    // Reset status filter to 'all' when changing modes
    setStatusFilter('all');
  }, []);

  // Handle status filter change
  const handleStatusFilterChange = useCallback((newStatus: string) => {
    setStatusFilter(newStatus);
    setCurrentPage(1); // Reset to first page when filter changes
  }, []);

  // Pagination handlers
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

  // Handle view details - route to replacement view page
  const handleViewDetails = useCallback((requestId: string) => {
    router.push(`/admin/replacements/view?id=${requestId}`);
  }, [router]);

  // Handle order click - route to order view page
  const handleOrderClick = useCallback((orderId: string) => {
    router.push(`/admin/orders/view?id=${orderId}`);
  }, [router]);

  // Handle mark as received
  const handleMarkAsReceived = useCallback(async (requestId: string, currentStatus: boolean) => {
    const action = !currentStatus ? 'received' : 'not received';
    
    // Show confirmation dialog
    const result = await Swal.fire({
      title: 'Confirm Action',
      text: `Are you sure you want to mark this replacement request as ${action}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: `Yes, mark as ${action}`,
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    setError(null);
    try {
      await apiService.updateReplacementReceived(requestId, { is_recieved: !currentStatus });
      showToast.success(`Replacement request ${requestId.substring(0, 8)}... marked as ${action}!`);
      
      // Refetch data to update the UI
      setCurrentPage(1);
      const fetchData = async () => {
        const options: {
          status?: string | null;
          mode?: string;
        } = {};

        if (statusFilter !== 'all') {
          options.status = statusFilter;
        }

        if (selectedMode !== 'all') {
          options.mode = selectedMode;
        }

        const response = await apiService.getPaginatedReplacementRequests(1, pageSize, options);
        const fetchedRequests = response.replacements || [];
        const totalCount = response.total_products || 0;
        
        setAllRequests(fetchedRequests);
        setCurrentRequestsPage(fetchedRequests);
        setTotalItems(totalCount);
        setTotalPages(response.total_pages || 1);
      };
      await fetchData();
    } catch (err: any) {
      // console.error(`Failed to update received status for replacement ${requestId}:`, err);
      
      // Enhanced error message extraction
      let errorMessage = 'Failed to update received status. Please try again.';
      
      if (err?.response?.data) {
        // Check for different possible error message formats
        if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.non_field_errors) {
          errorMessage = Array.isArray(err.response.data.non_field_errors) 
            ? err.response.data.non_field_errors[0] 
            : err.response.data.non_field_errors;
        } else {
          // If response data exists but no standard message field, show status
          errorMessage = `Server error (${err.response.status}): ${err.response.statusText}`;
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      // Show error with status code for debugging
      const statusCode = err?.response?.status ? ` (Status: ${err.response.status})` : '';
      showToast.error(`${errorMessage}${statusCode}`);
      
      // Also show a more detailed error in console for debugging
      // console.error('Full error response:', {
      //   status: err?.response?.status,
      //   statusText: err?.response?.statusText,
      //   data: err?.response?.data,
      //   message: err?.message
      // });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, selectedMode, pageSize]);

  // Handle create replacement order with stock update
  const handleCreateReplacementOrder = useCallback(async (requestId: string) => {
    // Show confirmation dialog
    const result = await Swal.fire({
      title: 'Create Replacement Order',
      text: 'Are you sure you want to create a replacement order for this request?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, create order',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    setError(null);
    try {
      await apiService.createReplacementOrder({ replacement_request_id: requestId });
      showToast.success(`Replacement order created for request ${requestId.substring(0, 8)}...!`);
      
      // After successful replacement order creation, ask about stock update
      const stockUpdateResult = await Swal.fire({
        title: 'Update Stock',
        text: 'Do you want to add the returned items back to stock?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, update stock',
        cancelButtonText: 'Skip for now'
      });

      // If admin wants to update stock, call the stock update API
      if (stockUpdateResult.isConfirmed) {
        try {
          // Note: Make sure this method exists in your apiService
          // Example: updateStockOnReplace: (data) => api.post('/stock/update-on-replace', data)
          await apiService.updateStockOnReplace(requestId );
          showToast.success('Stock updated successfully!');
        } catch (stockErr: any) {
          // console.error(`Failed to update stock for replacement ${requestId}:`, stockErr);
          
          // Enhanced error message extraction for stock update
          let stockErrorMessage = 'Failed to update stock. Please try again.';
          
          if (stockErr?.response?.data) {
            if (stockErr.response.data.message) {
              stockErrorMessage = stockErr.response.data.message;
            } else if (stockErr.response.data.error) {
              stockErrorMessage = stockErr.response.data.error;
            } else if (stockErr.response.data.detail) {
              stockErrorMessage = stockErr.response.data.detail;
            } else if (typeof stockErr.response.data === 'string') {
              stockErrorMessage = stockErr.response.data;
            } else if (stockErr.response.data.non_field_errors) {
              stockErrorMessage = Array.isArray(stockErr.response.data.non_field_errors) 
                ? stockErr.response.data.non_field_errors[0] 
                : stockErr.response.data.non_field_errors;
            } else {
              stockErrorMessage = `Server error (${stockErr.response.status}): ${stockErr.response.statusText}`;
            }
          } else if (stockErr?.message) {
            stockErrorMessage = stockErr.message;
          }
          
          const stockStatusCode = stockErr?.response?.status ? ` (Status: ${stockErr.response.status})` : '';
          showToast.error(`Stock Update Error: ${stockErrorMessage}${stockStatusCode}`);
          
          // console.error('Full stock update error response:', {
          //   status: stockErr?.response?.status,
          //   statusText: stockErr?.response?.statusText,
          //   data: stockErr?.response?.data,
          //   message: stockErr?.message
          // });
        }
      }
      
      // Refetch data to update the UI
      setCurrentPage(1);
      const fetchData = async () => {
        const options: {
          status?: string | null;
          mode?: string;
        } = {};

        if (statusFilter !== 'all') {
          options.status = statusFilter;
        }

        if (selectedMode !== 'all') {
          options.mode = selectedMode;
        }

        const response = await apiService.getPaginatedReplacementRequests(1, pageSize, options);
        const fetchedRequests = response.replacements || [];
        const totalCount = response.total_products || 0;
        
        setAllRequests(fetchedRequests);
        setCurrentRequestsPage(fetchedRequests);
        setTotalItems(totalCount);
        setTotalPages(response.total_pages || 1);
      };
      await fetchData();
    } catch (err: any) {
      // console.error(`Failed to create replacement order for request ${requestId}:`, err);
      
      // Enhanced error message extraction
      let errorMessage = 'Failed to create replacement order. Please try again.';
      
      if (err?.response?.data) {
        // Check for different possible error message formats
        if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.non_field_errors) {
          errorMessage = Array.isArray(err.response.data.non_field_errors) 
            ? err.response.data.non_field_errors[0] 
            : err.response.data.non_field_errors;
        } else {
          // If response data exists but no standard message field, show status
          errorMessage = `Server error (${err.response.status}): ${err.response.statusText}`;
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      // Show error with status code for debugging
      const statusCode = err?.response?.status ? ` (Status: ${err.response.status})` : '';
      showToast.error(`${errorMessage}${statusCode}`);
      
      // Also show a more detailed error in console for debugging
      // console.error('Full error response:', {
      //   status: err?.response?.status,
      //   statusText: err?.response?.statusText,
      //   data: err?.response?.data,
      //   message: err?.message
      // });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, selectedMode, pageSize]);

  // Check if "Mark as Received" button should be shown
  const shouldShowReceivedButton = useCallback((request: ReplacementRequest) => {
    // Don't show buttons in 'all' mode
    if (selectedMode === 'all') return false;
    
    return (
      request.status === 'APPROVED' && (
        selectedMode === 'approved_and_not_recieved' || 
        (request.status === 'APPROVED' && !request.is_recieved)
      )
    );
  }, [selectedMode]);

  // Check if "Create Replacement Order" button should be shown
  const shouldShowCreateOrderButton = useCallback((request: ReplacementRequest) => {
    // Don't show buttons in 'all' mode
    if (selectedMode === 'all') return false;
    
    // Don't show if order is already initiated
    if (request.order_initiated) return false;
    
    return (
      request.status === 'APPROVED' && (
        (request.status === 'APPROVED' && request.is_recieved) || 
        selectedMode === 'recieved_and_not_reshipped'
      )
    );
  }, [selectedMode]);

  // Check if "Order Created" status should be shown
  const shouldShowOrderCreatedStatus = useCallback((request: ReplacementRequest) => {
    // Don't show in 'all' mode
    if (selectedMode === 'all') return false;
    
    return (
      request.status === 'APPROVED' && 
      request.order_initiated && 
      (selectedMode === 'recieved_and_not_reshipped' || 
       (request.status === 'APPROVED' && request.is_recieved))
    );
  }, [selectedMode]);

  return (
    <div className="space-y-8">
      {/* Page Header and Actions */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-extrabold text-gray-800 flex items-center">
            <RefreshCw className="w-8 h-8 mr-3 text-[var(--color-primary-950)]" />
            Replacement Requests
          </h2>
        </div>
      </div>

      {/* Mode Selection Cards */}
      <div className="flex flex-wrap gap-4 mb-8">
        {availableModes.map((mode) => {
          const ModeIcon = mode.icon;
          return (
            <button
              key={mode.value}
              onClick={() => handleModeChange(mode.value)}
              className={`flex items-center px-6 py-3 rounded-lg shadow-md transition-all duration-200
                ${selectedMode === mode.value
                  ? 'bg-[var(--color-primary-950)] text-white scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-100 hover:shadow-lg'
                }`}
            >
              <ModeIcon className="w-5 h-5 mr-2" />
              <span className="font-semibold whitespace-nowrap">{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area: Replacement Requests Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        {/* Table Header/Toolbar with Status Filter */}
        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center">
            <RefreshCw className="w-6 h-6 text-[var(--color-primary-950)] mr-3" />
            <h3 className="font-semibold text-lg text-gray-800">
              {availableModes.find(m => m.value === selectedMode)?.label || 'All Replacement Requests'}
            </h3>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Status Filter - Only show if not in special modes or show limited options */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent"
                disabled={selectedMode !== 'all'} // Disable status filter for special modes
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
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
            <p className="mt-4 text-lg text-gray-600">Loading replacement requests...</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Replacement ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Created Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Received Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentRequestsPage.length > 0 ? (
                    currentRequestsPage.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {request.id?.toString().substring(0, 8)}...
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleOrderClick(request.order)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
                          >
                            {request.order?.toString().substring(0, 8)}...
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full
                            ${request.status?.toUpperCase() === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              request.status?.toUpperCase() === 'APPROVED' ? 'bg-green-100 text-green-800' :
                              request.status?.toUpperCase() === 'REJECTED' ? 'bg-red-100 text-red-800' :
                              request.status?.toUpperCase() === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                              request.status?.toUpperCase() === 'COMPLETED' ? 'bg-purple-100 text-purple-800' :
                              request.status?.toUpperCase() === 'CANCELLED' ? 'bg-gray-100 text-gray-800' :
                              'bg-gray-100 text-gray-800'}`}>
                            {request.status || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {request.created_at ? new Date(request.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full
                            ${request.is_recieved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {request.is_recieved ? 'Received' : 'Not Received'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleViewDetails(request.id)}
                              className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                              title="View Details"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            
                            {/* Mark as Received button */}
                            {shouldShowReceivedButton(request) && (
                              <button
                                onClick={() => handleMarkAsReceived(request.id, request.is_recieved)}
                                className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg border transition-colors duration-200
                                  ${request.is_recieved 
                                    ? 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' 
                                    : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'}`}
                                title={request.is_recieved ? 'Mark as Not Received' : 'Mark as Received'}
                                disabled={loading}
                              >
                                <Package className="w-4 h-4 mr-2" />
                                {request.is_recieved ? 'Mark Not Received' : 'Mark as Received'}
                              </button>
                            )}
                            
                            {/* Create Replacement Order button */}
                            {shouldShowCreateOrderButton(request) && (
                              <button
                                onClick={() => handleCreateReplacementOrder(request.id)}
                                className="flex items-center px-4 py-2 text-sm font-medium rounded-lg border bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors duration-200"
                                title="Create Replacement Order"
                                disabled={loading}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Create Order
                              </button>
                            )}

                            {/* Order Created Status */}
                            {shouldShowOrderCreatedStatus(request) && (
                              <div className="flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-green-50 text-green-700 border border-green-200">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Order Created
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                        <Info className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-lg">No replacement requests found.</p>
                        {(statusFilter !== 'all' || selectedMode !== 'all') && (
                          <p className="text-sm text-gray-400 mt-2">
                            Try selecting a different mode or status filter.
                          </p>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-5 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-600">
                Showing {currentRequestsPage.length} of {totalItems} requests
                {selectedMode !== 'all' && (
                  <span className="text-gray-500"> ({availableModes.find(mode => mode.value === selectedMode)?.label})</span>
                )}
                {statusFilter !== 'all' && (
                  <span className="text-gray-500"> - {statusOptions.find(opt => opt.value === statusFilter)?.label}</span>
                )}
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