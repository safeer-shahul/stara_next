// app/admin/products/home-category/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
// Import additional icons from lucide-react for consistent styling
import { Plus, Edit, ChevronLeft, ChevronRight, ArrowLeft, Home, Info, Trash2 } from 'lucide-react';
import apiService from '@/utils/api/apiService';

// Define a more specific interface for HomeCategory
interface HomeCategory {
  id: string; // Assuming unique ID for category
  name: string; // Assuming category name
  // Add other properties like 'order', 'status', 'image' if they exist in your API response
}

export default function HomeCategoryListPage() {
  const [categories, setCategories] = useState<HomeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10); // Page size for client-side pagination

  // Memoize fetchCategories for better performance
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      // Assuming apiService.getHomeCategories() returns an array of HomeCategory
      const response: HomeCategory[] = await apiService.getHomeCategories();
      setCategories(response);
      setTotalItems(response.length);
      setTotalPages(Math.ceil(response.length / pageSize));
    } catch (err) {
      console.error('Failed to fetch home categories:', err);
      setError('Failed to load home categories. Please try again.');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [pageSize]); // Depend on pageSize if it can change

  useEffect(() => {
    fetchCategories();
  }, [currentPage, fetchCategories]); // Depend on currentPage and memoized fetchCategories

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

  // Placeholder for delete functionality
  const handleDeleteCategory = useCallback((categoryId: string) => {
    if (confirm(`Are you sure you want to delete home category "${categoryId}"?`)) {
      // Implement actual API call for deletion here
      console.log(`Deleting home category with ID: ${categoryId}`);
      // After successful deletion, you might want to refetch categories to update the list
      // apiService.deleteHomeCategory(categoryId).then(() => fetchCategories());
      alert('Delete functionality not yet implemented in API.');
    }
  }, [fetchCategories]); // Depend on fetchCategories to re-run it after deletion


  // Calculate pagination for client-side data
  const indexOfLastCategory = currentPage * pageSize;
  const indexOfFirstCategory = indexOfLastCategory - pageSize;
  const currentCategories = categories.slice(indexOfFirstCategory, indexOfLastCategory);

  return (
    <div className="space-y-8">
      {/* Page Header and Add Button */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/products"
            className="text-gray-600 hover:text-[var(--color-primary-950)] transition-colors duration-200"
            aria-label="Back to Products Dashboard"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h2 className="text-3xl font-extrabold text-gray-800">
            Home Page Categories
          </h2>
        </div>
        <Link
          href="/admin/products/add-home-category"
          className="bg-[var(--color-primary-950)] text-white px-6 py-3 rounded-lg flex items-center shadow-md
                     hover:bg-[color:var(--color-primary-950)]/90 transition-colors duration-200
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-950)] focus-visible:ring-offset-2"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Home Category
        </Link>
      </div>

      {/* Main Content Area: Home Categories Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        {/* Table Header/Toolbar */}
        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center">
            <Home className="w-6 h-6 text-[var(--color-primary-950)] mr-3" />
            <h3 className="font-semibold text-lg text-gray-800">Featured Home Categories</h3>
          </div>
          {/* No search/filter in original, so keeping it out for now */}
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
            <p className="mt-4 text-lg text-gray-600">Loading home categories...</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto"> {/* Ensures table is scrollable on small screens */}
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Category Name
                    </th>
                    {/* Add other columns like Display Order, Status, etc. if available in data */}
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentCategories?.length > 0 ? (
                    currentCategories.map((category) => (
                      <tr key={category.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-base font-medium text-gray-900">{category.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <Link
                              href={`/admin/products/add-home-category?id=${category.id}`}
                              className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                              title="Edit Home Category"
                            >
                              <Edit className="w-5 h-5" />
                            </Link>
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
                              className="text-red-600 hover:text-red-800 transition-colors duration-200"
                              title="Delete Home Category"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="px-6 py-10 text-center text-gray-500">
                        <Info className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-lg">No home categories found.</p>
                        <Link href="/admin/products/add-home-category" className="block mt-4 text-[var(--color-primary-950)] hover:underline">
                          Click here to add a new home category.
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
                Showing {currentCategories.length} of {totalItems} categories
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