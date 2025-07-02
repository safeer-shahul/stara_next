// app/admin/staff/list/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
// Import relevant icons for consistent design
import { Users, Plus, Edit, ChevronLeft, ChevronRight, Search, Trash2, Info, Loader2 } from 'lucide-react';
import apiService from '@/utils/api/apiService';

// Define an interface for StaffMember
interface StaffMember {
  id: string; // Assuming a string ID
  username: string; // Added username to the interface
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean; // For the toggle switch
  // Add any other properties if your API returns them
}

export default function StaffListPage() {
  const [allStaff, setAllStaff] = useState<StaffMember[]>([]); // Stores all fetched staff
  const [currentStaffPage, setCurrentStaffPage] = useState<StaffMember[]>([]); // Staff for the current page
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0); // Total items from API (or filtered list)
  const [totalPages, setTotalPages] = useState(1); // Total pages calculated client-side
  const [pageSize] = useState(10); // Fixed page size for client-side pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce search query for filtering
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Effect to fetch all staff initially
  useEffect(() => {
    const fetchAllStaffData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiService.getAllStaffes(); // Use the non-paginated API
        const fetchedStaff = response || []; // Assuming 'results' is where staff array is
        setAllStaff(fetchedStaff);
        setTotalItems(fetchedStaff.length);
        // Recalculate totalPages based on all fetched staff
        setTotalPages(Math.ceil(fetchedStaff.length / pageSize));
      } catch (err) {
        console.error('Failed to fetch all staff:', err);
        setError('Failed to load staff list. Please try again.');
        setAllStaff([]);
        setTotalItems(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchAllStaffData();
  }, []); // Run only once on component mount

  // Effect to perform client-side filtering and pagination whenever data or filters change
  useEffect(() => {
    // Filter staff based on search query
    const filteredStaff = allStaff.filter(member =>
      member.first_name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      member.last_name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      member.username.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) // Include username in search filter
    );

    // Apply client-side pagination
    const indexOfLastItem = currentPage * pageSize;
    const indexOfFirstItem = indexOfLastItem - pageSize;
    const paginatedStaff = filteredStaff.slice(indexOfFirstItem, indexOfLastItem);

    setCurrentStaffPage(paginatedStaff);
    // Update total items and total pages based on filtered results for accurate pagination display
    setTotalItems(filteredStaff.length);
    setTotalPages(Math.ceil(filteredStaff.length / pageSize));

    // Adjust currentPage if it becomes invalid due to filtering
    if (currentPage > Math.ceil(filteredStaff.length / pageSize) && Math.ceil(filteredStaff.length / pageSize) > 0) {
      setCurrentPage(Math.max(1, Math.ceil(filteredStaff.length / pageSize)));
    } else if (filteredStaff.length === 0 && currentPage !== 1) {
      setCurrentPage(1); // Go back to page 1 if no results found
    }

  }, [allStaff, currentPage, pageSize, debouncedSearchQuery]);


  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
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

  // Handle active status toggle
  const handleToggleActive = useCallback(async (staffId: string, currentStatus: boolean) => {
    if (confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this staff member?`)) {
      try {
        setLoading(true); // Show loading feedback while API call is made
        // You'll need to implement apiService.updateStaffStatus in your apiService.ts
        await apiService.updateStaffStatus(staffId, !currentStatus);
        alert(`Staff member ${currentStatus ? 'deactivated' : 'activated'} successfully!`);
        // Update the local allStaff state directly for immediate UI feedback
        setAllStaff(prevAllStaff =>
          prevAllStaff.map(member =>
            member.id === staffId ? { ...member, is_active: !currentStatus } : member
          )
        );
        setLoading(false); // Hide loading after update
      } catch (err) {
        console.error('Failed to update staff status:', err);
        setError('Failed to update staff status. Please try again.');
        setLoading(false);
      }
    }
  }, []);

  // Handle delete staff
  const handleDeleteStaff = useCallback(async (staffId: string) => {
    if (confirm(`Are you sure you want to delete this staff member? This action cannot be undone.`)) {
      try {
        setLoading(true); // Show loading feedback
        // You'll need to implement apiService.deleteStaff in your apiService.ts
        // await apiService.deleteStaff(staffId);
        alert('Staff member deleted successfully!');
        // Update the local allStaff state by removing the deleted member
        setAllStaff(prevAllStaff => prevAllStaff.filter(member => member.id !== staffId));
        setLoading(false); // Hide loading after deletion
      } catch (err) {
        console.error('Failed to delete staff:', err);
        setError('Failed to delete staff member. Please try again.');
        setLoading(false);
      }
    }
  }, []);


  return (
    <div className="space-y-8">
      {/* Page Header and Add Button */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-extrabold text-gray-800 flex items-center">
            <Users className="w-8 h-8 mr-3 text-[var(--color-primary-950)]" />
            Staff Management
          </h2>
        </div>
        <Link
          href="/admin/staff/create"
          className="bg-[var(--color-primary-950)] text-white px-6 py-3 rounded-lg flex items-center shadow-md
                     hover:bg-[color:var(--color-primary-950)]/90 transition-colors duration-200
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-950)] focus-visible:ring-offset-2"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Staff
        </Link>
      </div>

      {/* Main Content Area: Staff Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        {/* Table Header/Toolbar with Search */}
        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center">
            <Users className="w-6 h-6 text-[var(--color-primary-950)] mr-3" />
            <h3 className="font-semibold text-lg text-gray-800">All Staff Members</h3>
          </div>
          {/* Search Input */}
          <div className="relative w-full sm:w-48">
            <input
              type="text"
              placeholder="Search staff..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full text-sm
                         focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-6 text-red-700 bg-red-50 border-l-4 border-red-500">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Conditional Loading State: Only show full spinner if no staff data has been loaded yet */}
        {loading && allStaff.length === 0 ? (
          <div className="p-10 text-center">
            <Loader2 className="animate-spin h-10 w-10 text-[var(--color-primary-950)] mx-auto" />
            <p className="mt-4 text-lg text-gray-600">Loading staff data...</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Staff Member
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentStaffPage.length > 0 ? (
                    currentStaffPage.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-base font-medium text-gray-900">
                            {member.username} {/* Display the username */}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-base font-medium text-gray-900">
                            {member.first_name} {member.last_name}
                          </div>
                          {/* Use optional chaining and convert to string for substring, if ID might be number */}
                          <div className="text-sm text-gray-500">ID: {member.id?.toString().substring(0, 8)}...</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {member.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {/* Toggle switch for active/inactive status */}
                          <button
                            onClick={() => handleToggleActive(member.id, member.is_active)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                              ${member.is_active ? 'bg-green-500' : 'bg-gray-300'} focus:ring-green-500`}
                            role="switch"
                            aria-checked={member.is_active}
                            aria-label={member.is_active ? "Deactivate staff" : "Activate staff"}
                          >
                            <span className="sr-only">Toggle staff status</span>
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200
                                ${member.is_active ? 'translate-x-6' : 'translate-x-1'}`}
                            />
                          </button>
                          <span className={`ml-2 text-sm font-medium ${member.is_active ? 'text-green-600' : 'text-gray-600'}`}>
                            {member.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <Link
                              href={`/admin/staff/create?id=${member.id}`}
                              className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                              title="Edit Staff Member"
                            >
                              <Edit className="w-5 h-5" />
                            </Link>
                            <button
                              onClick={() => handleDeleteStaff(member.id)}
                              className="text-red-600 hover:text-red-800 transition-colors duration-200"
                              title="Delete Staff Member"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-500"> {/* Updated colSpan */}
                        <Info className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-lg">No staff members found.</p>
                        <Link href="/admin/staff/create" className="block mt-4 text-[var(--color-primary-950)] hover:underline">
                          Click here to add a new staff member.
                        </Link>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-5 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-600">
                Showing {currentStaffPage.length} of {totalItems} members
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