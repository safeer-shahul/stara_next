// app/admin/products/list/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Package, Plus, Edit, ChevronLeft, ChevronRight, ImageIcon, ArrowLeft, Search, Trash2, Eye } from 'lucide-react';
import apiService from '@/utils/api/apiService';
import { useRouter } from 'next/navigation';

// Define more specific types for Product for better type safety
interface Product {
  id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  product_status: boolean; // Assuming boolean for active/inactive
  images: Array<{ product_image: string }>; // Assuming first image is thumbnail
  // Add other product properties if needed (e.g., description)
}

export default function ProductsListPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10); // Keeping page size constant
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

  // Fetch products whenever currentPage or debouncedSearchQuery changes
  useEffect(() => {
    fetchProducts();
  }, [currentPage, debouncedSearchQuery]); // Removed categoryFilter from dependencies

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      // Assuming apiService.getPaginatedProducts now accepts search only, no category filter
      const response = await apiService.getPaginatedProducts(
        currentPage,
        pageSize,
        debouncedSearchQuery,
        // categoryId is no longer passed here
      );
      setProducts(response.products); // Ensure this matches your API response structure
      setTotalItems(response.count);
      setTotalPages(Math.ceil(response.total_pages));
    } catch (err) {
      // console.error('Failed to fetch products:', err);
      setError('Failed to load products. Please try again.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearchQuery]); // Removed categoryFilter from dependencies

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  }, []);

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

  // Removed handleCategoryChange function

  // Placeholder for delete functionality
  const handleDeleteProduct = useCallback((productId: string) => {
    if (confirm(`Are you sure you want to delete product ${productId}?`)) {
      // Implement actual API call for deletion here
      // console.log(`Deleting product with ID: ${productId}`);
      // After successful deletion, you might want to refetch products
      // fetchProducts(); // Uncomment this after implementing delete API
      alert('Delete functionality not yet implemented in API.');
    }
  }, []);

  const handleSmartBackNavigation = () => {
    // Check if there's a previous page in browser history
    if (window.history.length > 1) {
      router.back();
    } else {
      // Fallback to products dashboard if no history
      router.push('/admin/products');
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header and Add Button */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handleSmartBackNavigation} // Choose your preferred method here
            className="text-gray-600 cursor-pointer hover:text-[var(--color-primary-950)] transition-colors duration-200 p-1 rounded-md hover:bg-gray-100"
            aria-label="Go back to previous page"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-3xl font-extrabold text-gray-800">Product List</h2>
        </div>
        <Link
          href="/admin/products/add-product"
          className="bg-[var(--color-primary-950)] text-white px-6 py-3 rounded-lg flex items-center shadow-md
                     hover:bg-[color:var(--color-primary-950)]/90 transition-colors duration-200
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-950)] focus-visible:ring-offset-2"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Product
        </Link>
      </div>

      {/* Main Content Area: Products Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Table Header/Toolbar with Search */}
        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center">
            <Package className="w-6 h-6 text-[var(--color-primary-950)] mr-3" />
            <h3 className="font-semibold text-lg text-gray-800">All Inventory Products</h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-48">
              <input
                type="text"
                placeholder="Search products..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full text-sm
                           focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            {/* Category Filter - Removed */}
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
            <p className="mt-4 text-lg text-gray-600">Loading products...</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto"> {/* Ensures table is scrollable on small screens */}
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Stock
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
                  {products?.length > 0 ? (
                    products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-16 w-16 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
                              {product.images && product.images.length > 0 ? (
                                <Image
                                  src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${product.images[0].product_image}`}
                                  alt={product.product_name}
                                  width={64} // Matches w-16 h-16
                                  height={64} // Matches w-16 h-16
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="h-8 w-8 text-gray-400" /> 
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-base font-medium text-gray-900">{product.product_name}</div>
                              <div className="text-sm text-gray-500">ID: {product.id.substring(0, 8)}...</div> {/* Truncate ID */}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-base text-gray-700">
                          ₹{parseFloat(product.product_price.toString()).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-base text-gray-700">
                          {product.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full
                            ${product.product_status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {product.product_status ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <Link
                              href={`/admin/products/view/${product.id}`}
                              className="text-gray-600 hover:text-gray-800 transition-colors duration-200"
                              title="View Product Details"
                            >
                              <Eye className="w-5 h-5" />
                            </Link>
                            <Link
                              href={`/admin/products/add-product?id=${product.id}`}
                              className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                              title="Edit Product"
                            >
                              <Edit className="w-5 h-5" />
                            </Link>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-red-600 hover:text-red-800 transition-colors duration-200"
                              title="Delete Product"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                        No products found matching your criteria.
                        <Link href="/admin/products/add-product" className="block mt-4 text-[var(--color-primary-950)] hover:underline">
                          Click here to add a new product.
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
                Showing {products.length} of {totalItems} products
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