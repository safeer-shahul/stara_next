// app/admin/products/add-home-category/page.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react'; // Added useCallback
import { useRouter, useSearchParams } from 'next/navigation';
import { Home, ArrowLeft, Search, X, Info, Loader2 } from 'lucide-react'; // Added Info, Loader2
import Link from 'next/link';
import Image from 'next/image';
import apiService from '@/utils/api/apiService';

// Define more specific interfaces for clarity and type safety
interface Product {
  id: string;
  product_name: string;
  product_code: string;
  product_price: string; // Keep as string if API returns it that way, convert to number for calculations
  images: {
    id?: string; // ID might be optional for new images
    product_image: string;
    product?: string; // Product ID, optional in image object
  }[];
}

interface HomeCategoryData {
  id: string;
  name: string;
  products: Product[]; // Array of associated products
}

function AddHomeCategoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get('id');
  const isEditMode = !!categoryId;

  const [categoryName, setCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // For form submission state
  const [formError, setFormError] = useState<string | null>(null); // General form error
  const [isFetchingInitialData, setIsFetchingInitialData] = useState(isEditMode); // For initial product/category data fetch
  const [isProductsLoading, setIsProductsLoading] = useState(false); // For infinite scroll loading

  const [availableProducts, setAvailableProducts] = useState<Product[]>([]); // Renamed from 'products' for clarity
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreProducts, setHasMoreProducts] = useState(true); // Renamed from 'hasMore'
  const dropdownRef = useRef<HTMLDivElement>(null);
  const productListScrollRef = useRef<HTMLDivElement>(null); // Renamed from 'productListRef' for clarity

  // Fetch category data if in edit mode
  const fetchCategoryData = useCallback(async () => {
    if (!categoryId) return;

    setIsFetchingInitialData(true);
    setFormError(null);
    try {
      const categoryData: HomeCategoryData = await apiService.homeCategoryByID(categoryId); // Assuming API handles hyphens in ID

      setCategoryName(categoryData.name);

      if (categoryData.products && Array.isArray(categoryData.products)) {
        // Ensure fetched products have the same structure as local Product interface
        setSelectedProducts(categoryData.products.map(p => ({
          id: p.id,
          product_name: p.product_name,
          product_code: p.product_code,
          product_price: p.product_price,
          images: p.images || []
        })));
      }
    } catch (err) {
      console.error('Error fetching category data:', err);
      setFormError('Failed to load category data. Please try again.');
    } finally {
      setIsFetchingInitialData(false);
    }
  }, [categoryId]); // Depend on categoryId

  // Load initial products or more products for infinite scroll
  const loadProducts = useCallback(async (pageToLoad: number, term: string = '') => {
    if (isProductsLoading) return; // Prevent multiple simultaneous fetches

    setIsProductsLoading(true);
    try {
      // Assuming getPaginatedProducts can take a search query and returns Product[] and count
      const response = await apiService.getPaginatedProducts(
        pageToLoad,
        10, // Page size
        term || undefined // Pass search term if not empty
      );

      const newFetchedProducts: Product[] = response.products || []; // Adjust based on your API response

      // Filter out products that are already in selectedProducts list
      const filteredNewProducts = newFetchedProducts.filter(
        (newProduct) =>
          !selectedProducts.some((selectedProduct) => selectedProduct.id === newProduct.id)
      );

      // Also filter out products already loaded in availableProducts list (if not first page)
      const uniqueFilteredProducts = pageToLoad === 1
        ? filteredNewProducts
        : filteredNewProducts.filter(
            (np) => !availableProducts.some((ap) => ap.id === np.id)
          );

      setAvailableProducts(prev =>
        pageToLoad === 1 ? uniqueFilteredProducts : [...prev, ...uniqueFilteredProducts]
      );
      setCurrentPage(pageToLoad);
      setHasMoreProducts(newFetchedProducts.length > 0); // Check if there's more to load

    } catch (err) {
      console.error('Error loading products:', err);
      setFormError('Failed to load products for selection. Please try again.');
    } finally {
      setIsProductsLoading(false);
    }
  }, [selectedProducts, availableProducts, isProductsLoading]); // Dependencies for useCallback

  // Effect to fetch initial data for edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchCategoryData();
    }
    // Also load initial products for selection when component mounts
    // Need to load them after selectedProducts are potentially loaded in edit mode
  }, [isEditMode, fetchCategoryData]);

  // Effect to load initial products (after category data is potentially loaded in edit mode)
  useEffect(() => {
    // Only load products if initial fetching is complete
    if (!isFetchingInitialData) {
        loadProducts(1, searchTerm);
    }
  }, [isFetchingInitialData, searchTerm, loadProducts]); // Re-fetch on search term change

  // Handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle infinite scroll in dropdown
  const handleScroll = useCallback(() => {
    if (productListScrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = productListScrollRef.current;

      // Load more data when scrolled to bottom (with a small buffer)
      if (scrollTop + clientHeight >= scrollHeight - 50 && hasMoreProducts && !isProductsLoading) {
        loadProducts(currentPage + 1, searchTerm);
      }
    }
  }, [currentPage, hasMoreProducts, isProductsLoading, loadProducts, searchTerm]);

  // Add product to selected list
  const handleSelectProduct = useCallback((product: Product) => {
    setSelectedProducts(prev => {
      if (!prev.some(p => p.id === product.id)) { // Prevent adding duplicates
        return [...prev, product];
      }
      return prev;
    });
    setAvailableProducts(prev => prev.filter(p => p.id !== product.id)); // Remove from available
    setIsDropdownOpen(false); // Close dropdown after selection
    setSearchTerm(''); // Clear search term after selection
  }, []);

  // Remove product from selected list
  const handleRemoveProduct = useCallback((product: Product) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== product.id));
    // Add back to available products, maintaining sorted order if possible
    setAvailableProducts(prev => [...prev, product].sort((a, b) =>
      a.product_name.localeCompare(b.product_name)
    ));
    setFormError(null); // Clear error if minimum products issue is resolved
  }, []);

  // Filter products based on search term (only for currently available products)
  const filteredAvailableProducts = searchTerm
    ? availableProducts.filter(product =>
        product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.product_code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : availableProducts;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryName.trim()) {
      setFormError('Category Name is required.');
      return;
    }
    if (selectedProducts.length === 0) {
      setFormError('Please select at least one product.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        name: categoryName,
        product_ids: selectedProducts.map(product => product.id),
      };

      if (isEditMode && categoryId) {
        // Assuming your API expects 'id' in the payload for update
        await apiService.createHomeCategory({ ...payload, id: categoryId }); // Pass ID for update
      } else {
        await apiService.createHomeCategory(payload);
      }

      alert(`Home Category "${categoryName}" ${isEditMode ? 'updated' : 'created'} successfully!`);
      router.push('/admin/products/home-category');
    } catch (err) {
      console.error('Error processing home category:', err);
      // More detailed error message based on API response if available
      setFormError(`Failed to ${isEditMode ? 'update' : 'create'} home category. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pageTitle = isEditMode ? 'Edit Home Category' : 'Add New Home Category';
  const submitButtonText = isEditMode ? (isSubmitting ? 'Updating...' : 'Update Home Category') : (isSubmitting ? 'Creating...' : 'Create Home Category');

  // Show loading state while fetching initial data (e.g., in edit mode)
  if (isFetchingInitialData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-xl shadow-lg">
        <Loader2 className="animate-spin h-12 w-12 text-[var(--color-primary-950)]" />
        <p className="mt-4 text-lg text-gray-600">Loading category data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products/home-category"
          className="text-gray-600 hover:text-[var(--color-primary-950)] transition-colors duration-200"
          aria-label="Back to Home Categories"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h2 className="text-3xl font-extrabold text-gray-800">
          {pageTitle}
        </h2>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center mb-8 pb-4 border-b border-gray-200">
          <div className="bg-blue-50 p-4 rounded-full mr-5">
            <Home className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Home Category Details</h3>
            <p className="text-gray-600 text-sm">
              {isEditMode ? 'Update existing home page category section.' : 'Create a new section for your homepage featuring specific products.'}
            </p>
          </div>
        </div>

        {/* Form-level Error Message */}
        {formError && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md border-l-4 border-red-500 flex items-center gap-3">
            <X className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="font-medium">{formError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section: Category Name */}
          <div>
            <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <Info className="w-5 h-5 mr-2 text-blue-500" /> Category Information
            </h4>
            <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-2">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="categoryName"
              className="w-full p-3 border border-gray-300 rounded-md text-gray-800
                         focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent
                         transition-all duration-200"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
              disabled={isSubmitting}
              placeholder="e.g., Trending Products, Best Sellers"
            />
          </div>

          {/* Section: Product Selection */}
          <div>
            <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center mt-6 border-t pt-6">
              <Info className="w-5 h-5 mr-2 text-green-500" /> Select Products <span className="text-red-500 ml-2">*</span>
              <span className="text-gray-500 font-normal text-sm ml-2">(Minimum 1 product required)</span>
            </h4>
            <div className="flex flex-col md:flex-row gap-8"> {/* Increased gap */}
              {/* Left side - Product Search & Available List */}
              <div className="w-full md:w-1/2">
                <label htmlFor="productSearch" className="block text-sm font-medium text-gray-700 mb-2">
                  Find & Add Products
                </label>
                <div className="relative" ref={dropdownRef}>
                  <div
                    className="p-3 border border-gray-300 rounded-md flex items-center cursor-pointer
                               focus-within:ring-2 focus-within:ring-[var(--color-primary-950)] focus-within:border-transparent
                               transition-all duration-200"
                  >
                    <Search className="w-5 h-5 text-gray-400 mr-3" />
                    <input
                      type="text"
                      id="productSearch"
                      className="flex-grow outline-none text-gray-800 placeholder-gray-500"
                      placeholder="Search by product name or code..."
                      value={searchTerm}
                      onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1); // Reset page on new search
                          setAvailableProducts([]); // Clear existing products to fetch new ones based on search
                          setHasMoreProducts(true);
                          setIsDropdownOpen(true);
                      }}
                      onFocus={() => {
                        setIsDropdownOpen(true);
                        // If dropdown is empty, try to load initial products
                        if (availableProducts.length === 0 && !isProductsLoading && hasMoreProducts) {
                            loadProducts(1, searchTerm);
                        }
                      }}
                      disabled={isSubmitting}
                    />
                  </div>

                  {isDropdownOpen && (
                    <div
                      className="absolute z-20 mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-xl max-h-80 overflow-y-auto"
                      ref={productListScrollRef}
                      onScroll={handleScroll}
                    >
                      {isProductsLoading && currentPage === 1 ? (
                         <div className="p-4 text-center text-gray-600 flex items-center justify-center gap-2">
                            <Loader2 className="animate-spin w-5 h-5" /> Loading products...
                         </div>
                      ) : filteredAvailableProducts.length > 0 ? (
                        filteredAvailableProducts.map(product => (
                          <div
                            key={product.id}
                            className="p-3 hover:bg-gray-100 cursor-pointer flex items-center border-b border-gray-100 last:border-b-0"
                            onClick={() => handleSelectProduct(product)}
                          >
                            {product.images && product.images.length > 0 && (
                              <div className="w-12 h-12 flex-shrink-0 mr-3 rounded-md overflow-hidden relative bg-gray-100 border border-gray-200">
                                <Image
                                  src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${product.images[0].product_image}`}
                                  alt={product.product_name}
                                  fill
                                  sizes="48px"
                                  style={{ objectFit: 'cover' }}
                                />
                              </div>
                            )}
                            <div className="flex-grow truncate">
                              <div className="font-medium text-base text-gray-800 truncate">{product.product_name}</div>
                              <div className="text-sm text-gray-500">{product.product_code} - ₹{parseFloat(product.product_price).toFixed(2)}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          {isProductsLoading ? 'Loading...' : 'No products found matching your search.'}
                        </div>
                      )}

                      {/* Infinite scroll loading indicator */}
                      {isProductsLoading && currentPage > 1 && (
                        <div className="p-2 text-center text-gray-600 flex items-center justify-center gap-2">
                          <Loader2 className="animate-spin w-4 h-4" /> Loading more...
                        </div>
                      )}
                      {!hasMoreProducts && currentPage > 1 && !isProductsLoading && (
                          <div className="p-2 text-center text-gray-400 text-sm">No more products to load.</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right side - Selected products */}
              <div className="w-full md:w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Selection
                </label>
                <div className="border border-gray-200 rounded-lg p-4 h-80 min-h-[320px] overflow-y-auto bg-gray-50"> {/* Increased height */}
                  {selectedProducts.length > 0 ? (
                    <div className="space-y-3">
                      {selectedProducts.map(product => (
                        <div
                          key={product.id}
                          className="bg-white border border-gray-200 rounded-md p-3 flex items-center shadow-sm"
                        >
                          {product.images && product.images.length > 0 && (
                            <div className="w-14 h-14 flex-shrink-0 mr-3 rounded-md overflow-hidden relative bg-gray-100 border border-gray-200">
                              <Image
                                src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${product.images[0].product_image}`}
                                alt={product.product_name}
                                fill
                                sizes="56px"
                                style={{ objectFit: 'cover' }}
                              />
                            </div>
                          )}
                          <div className="flex-grow pr-2 truncate"> {/* Added pr-2 to prevent text overlapping button */}
                            <div className="font-medium text-base text-gray-800 truncate">{product.product_name}</div>
                            <div className="text-sm text-gray-500">{product.product_code} - ₹{parseFloat(product.product_price).toFixed(2)}</div>
                          </div>
                          <button
                            type="button"
                            className="ml-auto flex-shrink-0 text-red-600 hover:text-red-800 transition-colors duration-200"
                            onClick={() => handleRemoveProduct(product)}
                            disabled={isSubmitting}
                            title="Remove product"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center border border-dashed border-gray-300 rounded-lg p-6 h-full flex flex-col items-center justify-center">
                      <Info className="w-10 h-10 mb-3 text-gray-400" />
                      <p className="text-lg">No products selected.</p>
                      <p className="text-sm mt-1">Search and add products from the left to feature them here.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end pt-8 border-t border-gray-200 mt-8 space-x-4">
            <Link href="/admin/products/home-category" passHref>
              <button
                type="button"
                className="px-6 py-3 border border-gray-300 rounded-md text-gray-700
                           hover:bg-gray-100 transition-colors duration-200
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
                disabled={isSubmitting}
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              className={`px-6 py-3 rounded-md text-white shadow-md transition-all duration-200
                         flex items-center justify-center gap-2
                         ${isSubmitting || !categoryName.trim() || selectedProducts.length === 0
                           ? 'bg-gray-400 cursor-not-allowed opacity-80'
                           : 'bg-[var(--color-primary-950)] hover:bg-[color:var(--color-primary-950)]/90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary-950)]'
                         }`}
              disabled={isSubmitting || !categoryName.trim() || selectedProducts.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                submitButtonText
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddHomeCategoryPage;