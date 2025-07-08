// app/admin/replacement-requests/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// Import relevant icons for consistent design
import { RefreshCw, Plus, Edit, ChevronLeft, ChevronRight, Info, Loader2, Eye, Filter } from 'lucide-react';
import apiService from '@/utils/api/apiService';

// Define an interface for ReplacementRequest based on actual API response
interface ReplacementRequest {
  id: string;
  replacement_item: any[];
  created_at: string;
  updated_at: string;
  request_details: string;
  status: string;
  admin_notes: string | null;
  order: string;
  user: number;
  processed_by: string | null;
}

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

  // Status options based on the RequestStatus enum
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  // Effect to fetch replacement requests
  useEffect(() => {
    const fetchReplacementRequests = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiService.getPaginatedReplacementRequests(
          currentPage,
          pageSize,
          {
            status: statusFilter === 'all' ? null : statusFilter
          }
        );
        
        // Update these based on your actual API response structure
        const fetchedRequests = response.replacements || [];
        const totalCount = response.total_products || 0;
        
        setAllRequests(fetchedRequests);
        setCurrentRequestsPage(fetchedRequests);
        setTotalItems(totalCount);
        setTotalPages(response.total_pages || 1);
      } catch (err) {
        console.error('Failed to fetch replacement requests:', err);
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
  }, [currentPage, pageSize, statusFilter]); // Refetch when page, size, or status filter changes

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

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setCurrentPage(1);
    setStatusFilter('all');
    // This will trigger the useEffect to refetch data
  }, []);

  // Handle view details - route to replacement view page
  const handleViewDetails = useCallback((requestId: string) => {
    router.push(`/admin/replacements/view?id=${requestId}`);
  }, [router]);

  // Handle order click - route to order view page
  const handleOrderClick = useCallback((orderId: string) => {
    router.push(`/admin/orders/view?id=${orderId}`);
  }, [router]);

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

      {/* Main Content Area: Replacement Requests Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        {/* Table Header/Toolbar with Status Filter */}
        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center">
            <RefreshCw className="w-6 h-6 text-[var(--color-primary-950)] mr-3" />
            <h3 className="font-semibold text-lg text-gray-800">All Replacement Requests</h3>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent"
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewDetails(request.id)}
                            className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                        <Info className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-lg">No replacement requests found.</p>
                        {statusFilter !== 'all' && (
                          <p className="text-sm text-gray-400 mt-2">
                            Try selecting a different status filter.
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
                {statusFilter !== 'all' && (
                  <span className="text-gray-500"> (filtered by {statusOptions.find(opt => opt.value === statusFilter)?.label})</span>
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