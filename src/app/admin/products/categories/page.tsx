// app/admin/products/categories/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Folder, Plus, Edit, Image as ImageIcon, ArrowLeft, ChevronLeft, ChevronRight, Search, Trash2 } from 'lucide-react'; // Added Search, Trash2, ChevronLeft, ChevronRight icons
import apiService from '@/utils/api/apiService'; // Assuming this path is correct

interface Category {
  id: string;
  category_name: string;
  category_image: string | null;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10); // Keeping page size constant for this example
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(''); // For debounced search

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Fetch categories whenever currentPage or debouncedSearchQuery changes
  useEffect(() => {
    fetchCategories();
  }, [currentPage, debouncedSearchQuery]);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      // Pass search query to API if implemented
      const response = await apiService.getPaginatedCategories(currentPage, pageSize, debouncedSearchQuery);
      setCategories(response.results);
      setTotalItems(response.count);
      setTotalPages(Math.ceil(response.count / pageSize));
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError('Failed to load categories. Please try again.');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearchQuery]); // Memoize with dependencies

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

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

  // Placeholder for delete functionality (to show the button in UI)
  const handleDeleteCategory = useCallback((categoryId: string) => {
    if (confirm(`Are you sure you want to delete category ${categoryId}?`)) {
      // Implement actual API call for deletion here
      console.log(`Deleting category with ID: ${categoryId}`);
      // After successful deletion, you might want to refetch categories
      // fetchCategories(); // Uncomment this after implementing delete API
      alert('Delete functionality not yet implemented in API.');
    }
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Header and Add Button */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/products"
            className="text-gray-600 hover:text-[var(--color-primary-950)] transition-colors duration-200"
            aria-label="Back to Products"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h2 className="text-3xl font-extrabold text-gray-800">Product Categories</h2>
        </div>
        <Link
          href="/admin/products/add-category"
          className="bg-[var(--color-primary-950)] text-white px-6 py-3 rounded-lg flex items-center shadow-md
                     hover:bg-[color:var(--color-primary-950)]/90 transition-colors duration-200
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-950)] focus-visible:ring-offset-2"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Category
        </Link>
      </div>

      {/* Main Content Area: Categories Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Table Header/Toolbar */}
        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center">
            <Folder className="w-6 h-6 text-[var(--color-primary-950)] mr-3" />
            <h3 className="font-semibold text-lg text-gray-800">All Product Categories</h3>
          </div>
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search categories..."
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

        {/* Loading State */}
        {loading ? (
          <div className="p-10 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--color-primary-950)] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading categories...</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto"> {/* Ensures table is scrollable on small screens */}
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Category Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <tr key={category.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200 flex-shrink-0">
                            {category.category_image ? (
                              <Image
                                src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${category.category_image}`}
                                alt={category.category_name}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="w-8 h-8 text-gray-400" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-800">{category.category_name}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <Link
                              href={`/admin/products/add-category?id=${category.id}`}
                              className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                              title="Edit Category"
                            >
                              <Edit className="w-5 h-5" />
                            </Link>
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
                              className="text-red-600 hover:text-red-800 transition-colors duration-200"
                              title="Delete Category"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-10 text-center text-gray-500">
                        No categories found.
                        <Link href="/admin/products/add-category" className="block mt-4 text-[var(--color-primary-950)] hover:underline">
                          Click here to add a new category.
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
                Showing {categories.length} of {totalItems} categories
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