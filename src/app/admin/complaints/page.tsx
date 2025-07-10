// app/admin/complaints/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Search, Eye, Calendar, User, Mail, Image as ImageIcon, ChevronLeft, ChevronRight, Info, Loader2, X } from 'lucide-react';
import apiService from '@/utils/api/apiService';
import { showToast } from '@/utils/toast';

// Define interfaces for the complaint structure
interface ComplaintImage {
  id: string;
  created_at: string;
  updated_at: string;
  image: string;
  enquiry: string;
}

interface ComplaintUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

interface Complaint {
  id: string;
  subject: string;
  message: string;
  created_at: string;
  updated_at: string;
  images: ComplaintImage[];
  user: ComplaintUser;
}

export default function AdminComplaintsPage() {
  const [allComplaints, setAllComplaints] = useState<Complaint[]>([]);
  const [currentComplaintsPage, setCurrentComplaintsPage] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  // Debounce search query for filtering
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Effect to fetch all complaints initially
  useEffect(() => {
    const fetchAllComplaintsData = async () => {
  setLoading(true);
  try {
    // console.log('Fetching complaints from:', process.env.NEXT_PUBLIC_API_BASE_URL);
    const response = await apiService.getAllEnquiries();
    const fetchedComplaints = response?.data || response || [];
    
    // console.log('Fetched complaints:', fetchedComplaints);
    setAllComplaints(fetchedComplaints);
    setTotalItems(fetchedComplaints.length);
    setTotalPages(Math.ceil(fetchedComplaints.length / pageSize));
  } catch (err: any) {
    // console.error('Detailed error:', err);
    
    // Handle different types of errors
    if (err.response) {
      // Server responded with error status
      // console.error('Response error:', {
      //   status: err.response.status,
      //   data: err.response.data,
      //   headers: err.response.headers
      // });
      
      const errorDetails = `Status: ${err.response.status} | Data: ${JSON.stringify(err.response.data)} | Headers: ${JSON.stringify(err.response.headers)}`;
      showToast.error(`API Error - ${errorDetails}`);
    } else if (err.request) {
      // Request was made but no response received
      // console.error('No response received:', err.request);
      showToast.error('Network Error - No response from server');
    } else {
      // Something else happened
      // console.error('Error setting up request:', err.message);
      showToast.error(`Request Setup Error - ${err.message}`);
    }
    
    // Reset state on error
    setAllComplaints([]);
    setTotalItems(0);
    setTotalPages(1);
  } finally {
    setLoading(false);
  }
};

    fetchAllComplaintsData();
  }, []);

  // Effect to perform client-side filtering and pagination
  useEffect(() => {
    const filteredComplaints = allComplaints.filter(complaint =>
      complaint.subject.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      complaint.message.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      complaint.user.email.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      complaint.user.first_name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      complaint.user.last_name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );

    const indexOfLastItem = currentPage * pageSize;
    const indexOfFirstItem = indexOfLastItem - pageSize;
    const paginatedComplaints = filteredComplaints.slice(indexOfFirstItem, indexOfLastItem);

    setCurrentComplaintsPage(paginatedComplaints);
    setTotalItems(filteredComplaints.length);
    setTotalPages(Math.ceil(filteredComplaints.length / pageSize));

    if (currentPage > Math.ceil(filteredComplaints.length / pageSize) && Math.ceil(filteredComplaints.length / pageSize) > 0) {
      setCurrentPage(Math.max(1, Math.ceil(filteredComplaints.length / pageSize)));
    } else if (filteredComplaints.length === 0 && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [allComplaints, currentPage, pageSize, debouncedSearchQuery]);

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
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

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return formatDate(dateString);
  };

  // Truncate message helper
  const truncateMessage = (message: string, maxLength: number = 100) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  // Get user display name
  const getUserDisplayName = (user: ComplaintUser) => {
    const fullName = `${user.first_name} ${user.last_name}`.trim();
    return fullName || user.email;
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-extrabold text-gray-800 flex items-center">
            <MessageSquare className="w-8 h-8 mr-3 text-[var(--color-primary-950)]" />
            Complaints Management
          </h2>
        </div>
        <div className="text-sm text-gray-600">
          Total Complaints: {allComplaints.length}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        {/* Table Header/Toolbar with Search */}
        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center">
            <MessageSquare className="w-6 h-6 text-[var(--color-primary-950)] mr-3" />
            <h3 className="font-semibold text-lg text-gray-800">All Customer Complaints</h3>
          </div>
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search complaints..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full text-sm
                         focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Loading State */}
        {loading && allComplaints.length === 0 ? (
          <div className="p-10 text-center">
            <Loader2 className="animate-spin h-10 w-10 text-[var(--color-primary-950)] mx-auto" />
            <p className="mt-4 text-lg text-gray-600">Loading complaints data...</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Images
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentComplaintsPage.length > 0 ? (
                    currentComplaintsPage.map((complaint) => (
                      <tr key={complaint.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 max-w-xs">
                            {complaint.subject}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {complaint.id.substring(0, 8)}...
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="bg-gray-100 rounded-full p-2 mr-3">
                              <User className="w-4 h-4 text-gray-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {getUserDisplayName(complaint.user)}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center">
                                <Mail className="w-3 h-3 mr-1" />
                                {complaint.user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            {getRelativeTime(complaint.created_at)}
                          </div>
                          {complaint.updated_at !== complaint.created_at && (
                            <div className="text-xs text-gray-500">
                              Updated: {getRelativeTime(complaint.updated_at)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {complaint.images.length > 0 ? (
                            <div className="flex items-center">
                              <div className="flex space-x-1">
                                {complaint.images.slice(0, 2).map((image, index) => (
                                  <img
                                    key={image.id}
                                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${image.image}`}
                                    alt="Complaint attachment"
                                    className="w-8 h-8 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => setFullScreenImage(`${process.env.NEXT_PUBLIC_API_BASE_URL}${image.image}`)}
                                  />
                                ))}
                                {complaint.images.length > 2 && (
                                  <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500 border border-gray-200">
                                    +{complaint.images.length - 2}
                                  </div>
                                )}
                              </div>
                              <span className="ml-2 text-xs text-gray-500">
                                {complaint.images.length}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">No images</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setSelectedComplaint(complaint)}
                            className="text-[var(--color-primary-950)] hover:text-opacity-80 transition-colors duration-200 flex items-center"
                            title="View Full Complaint"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                        <Info className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-lg">No complaints found.</p>
                        {searchQuery && (
                          <p className="text-sm mt-2">Try adjusting your search terms.</p>
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
                Showing {currentComplaintsPage.length} of {totalItems} complaints
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

      {/* Complaint Detail Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Complaint Details</h3>
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Customer Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Customer Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium">{getUserDisplayName(selectedComplaint.user)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{selectedComplaint.user.email}</p>
                    </div>
                  </div>
                </div>

                {/* Complaint Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Subject</h4>
                  <p className="text-gray-700 text-lg">{selectedComplaint.subject}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Message</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {selectedComplaint.message}
                    </p>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="font-medium">{formatDate(selectedComplaint.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Updated</p>
                    <p className="font-medium">{formatDate(selectedComplaint.updated_at)}</p>
                  </div>
                </div>

                {/* Images */}
                {selectedComplaint.images.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <ImageIcon className="w-5 h-5 mr-2" />
                      Attached Images ({selectedComplaint.images.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {selectedComplaint.images.map((image) => (
                        <img
                          key={image.id}
                          src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${image.image}`}
                          alt="Complaint attachment"
                          className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setFullScreenImage(`${process.env.NEXT_PUBLIC_API_BASE_URL}${image.image}`)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full screen image modal */}
      {fullScreenImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-full max-h-full w-full">
            <button
              onClick={() => setFullScreenImage(null)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-60 rounded-full p-3 hover:bg-opacity-80 transition-colors z-10"
            >
              <X size={20} />
            </button>
            <img
              src={fullScreenImage}
              alt="Full screen"
              className="max-w-full max-h-full object-contain mx-auto rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}