// app/admin/replacement-requests/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
// Import relevant icons for consistent design
import { RefreshCw, Plus, Edit, ChevronLeft, ChevronRight, Search, Trash2, Info, Loader2, Eye } from 'lucide-react';
import apiService from '@/utils/api/apiService';

// Define an interface for ReplacementRequest
interface ReplacementRequest {
  id: string; // Assuming a string ID
  // Add properties based on your API response structure
  // These are placeholder properties - update based on actual API response
  customer_name?: string;
  product_name?: string;
  request_date?: string;
  status?: string;
  reason?: string;
  // Add any other properties your API returns
}

export default function ReplacementRequestsPage() {
  const [allRequests, setAllRequests] = useState<ReplacementRequest[]>([]); // Stores all fetched requests
  const [currentRequestsPage, setCurrentRequestsPage] = useState<ReplacementRequest[]>([]); // Requests for the current page
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0); // Total items from API
  const [totalPages, setTotalPages] = useState(1); // Total pages from API
  const [pageSize] = useState(10); // Fixed page size for pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // Default to newest first

  // Debounce search query for filtering
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

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
            sort_order: sortOrder
          }
        );
        
        // Update these based on your actual API response structure
        const fetchedRequests = response.results || response.data || response || [];
        const totalCount = response.total || response.count || fetchedRequests.length;
        
        setAllRequests(fetchedRequests);
        setCurrentRequestsPage(fetchedRequests);
        setTotalItems(totalCount);
        setTotalPages(Math.ceil(totalCount / pageSize));
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
  }, [currentPage, pageSize, sortOrder]); // Refetch when page, size, or sort changes

  // Effect to perform client-side filtering when search query changes
  useEffect(() => {
    if (!debouncedSearchQuery) {
      setCurrentRequestsPage(allRequests);
      return;
    }

    // Filter requests based on search query
    const filteredRequests = allRequests.filter(request =>
      request.customer_name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      request.product_name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      request.status?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      request.reason?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      request.id.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );

    setCurrentRequestsPage(filteredRequests);
  }, [allRequests, debouncedSearchQuery]);

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // Handle sort order change
  const handleSortChange = useCallback((newSortOrder: 'asc' | 'desc') => {
    setSortOrder(newSortOrder);
    setCurrentPage(1); // Reset to first page when sorting changes
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
    setSearchQuery('');
    setDebouncedSearchQuery('');
    // This will trigger the useEffect to refetch data
  }, []);

  // Handle view details (placeholder)
  const handleViewDetails = useCallback((requestId: string) => {
    // Navigate to details page or open modal
    console.log('View details for request:', requestId);
    // You can implement this based on your requirements
  }, []);

  // Handle delete request (placeholder)
  const handleDeleteRequest = useCallback(async (requestId: string) => {
    if (confirm(`Are you sure you want to delete this replacement request? This action cannot be undone.`)) {
      try {
        setLoading(true);
        // Implement delete API call when available
        // await apiService.deleteReplacementRequest(requestId);
        alert('Replacement request deleted successfully!');
        
        // Refresh the data after deletion
        handleRefresh();
      } catch (err) {
        console.error('Failed to delete replacement request:', err);
        setError('Failed to delete replacement request. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  }, [handleRefresh]);

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
        {/* Table Header/Toolbar with Search and Sort */}
        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center">
            <RefreshCw className="w-6 h-6 text-[var(--color-primary-950)] mr-3" />
            <h3 className="font-semibold text-lg text-gray-800">All Replacement Requests</h3>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Sort Dropdown */}
            <select
              value={sortOrder}
              onChange={(e) => handleSortChange(e.target.value as 'asc' | 'desc')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>

            {/* Search Input */}
            <div className="relative w-full sm:w-48">
              <input
                type="text"
                placeholder="Search requests..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full text-sm
                           focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                      Request ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Request Date
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
                          <div className="text-sm font-medium text-gray-900">
                            {request.customer_name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {request.product_name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full
                            ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              request.status === 'approved' ? 'bg-green-100 text-green-800' :
                              request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'}`}>
                            {request.status || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {request.request_date ? new Date(request.request_date).toLocaleDateString() : 'N/A'}
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
                            <button
                              onClick={() => handleDeleteRequest(request.id)}
                              className="text-red-600 hover:text-red-800 transition-colors duration-200"
                              title="Delete Request"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                        <Info className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-lg">No replacement requests found.</p>
                        {searchQuery && (
                          <p className="text-sm text-gray-400 mt-2">
                            Try adjusting your search criteria.
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