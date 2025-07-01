'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Home, ArrowLeft, Search, X, Info, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import apiService from '@/utils/api/apiService';

interface Product {
  id: string;
  product_name: string;
  product_code: string;
  product_price: string;
  images: {
    id: string;
    product_image: string;
    product: string;
  }[];
}

function AddHomeCategoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get('id');
  const isEditMode = !!categoryId;
  
  const [categoryName, setCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const productListRef = useRef<HTMLDivElement>(null);

  // Fetch category data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchCategoryData();
    }
  }, [categoryId]);

  // Fetch initial products
  useEffect(() => {
    loadProducts(1);
  }, []);

  // Fetch category data for editing
  const fetchCategoryData = async () => {
    if (!categoryId) return;
    
    setIsLoading(true);
    try {
      const categoryData = await apiService.homeCategoryByID(categoryId.replace(/-/g, ''));
      setCategoryName(categoryData.name);
      
      // Set selected products from the fetched category
      if (categoryData.products && Array.isArray(categoryData.products)) {
        setSelectedProducts(categoryData.products);
        
        // Remove selected products from the products list to avoid duplicates
        setProducts(prevProducts => 
          prevProducts.filter(p => !categoryData.products.some((cp: Product) => cp.id === p.id))
        );
      }
    } catch (err) {
      console.error('Error fetching category data:', err);
      setError('Failed to load category data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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

  // Load products from API
  const loadProducts = async (page: number) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await apiService.getPaginatedProducts(page, 10);
      
      // Check if API returns data in expected format
      const newProducts = response.products || response;
      
      if (newProducts.length === 0) {
        setHasMore(false);
      } else {
        setProducts(prev => {
          // Filter out products that are already selected
          const filteredNewProducts = newProducts.filter(
            (newProduct:any) => !selectedProducts.some(selectedProduct => selectedProduct.id === newProduct.id)
          );
          
          return page === 1 
            ? filteredNewProducts 
            : [...prev, ...filteredNewProducts];
        });
        setCurrentPage(page);
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle infinite scroll in dropdown
  const handleScroll = () => {
    if (productListRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = productListRef.current;
      
      // Load more data when scrolled to bottom (with a small buffer)
      if (scrollTop + clientHeight >= scrollHeight - 20 && hasMore && !isLoading) {
        loadProducts(currentPage + 1);
      }
    }
  };

  // Add product to selected list
  const handleSelectProduct = (product: Product) => {
    setSelectedProducts(prev => [...prev, product]);
    setProducts(prev => prev.filter(p => p.id !== product.id));
    setIsDropdownOpen(false);
  };

  // Remove product from selected list
  const handleRemoveProduct = (product: Product) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== product.id));
    setProducts(prev => [...prev, product].sort((a, b) => 
      a.product_name.localeCompare(b.product_name)
    ));
  };

  // Filter products based on search term
  const filteredProducts = searchTerm 
    ? products.filter(product => 
        product.product_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (selectedProducts.length === 0) {
      setError("Please select at least one product");
      return;
    }
  
    setIsSubmitting(true);
    setError(null);
  
    try {
      const payload = {
        name: categoryName,
        product_ids: selectedProducts.map(product => product.id),
        ...(isEditMode && { id: categoryId.replace(/-/g, '') }) 
      };
  
      await apiService.createHomeCategory(payload);
      alert(`Home Category "${categoryName}" ${isEditMode ? 'updated' : 'created'} successfully!`);
      router.push('/admin/products/home-category');
    } catch (err) {
      console.error('Error processing home category:', err);
      setError(`Failed to ${isEditMode ? 'update' : 'create'} home category. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };
  

  const pageTitle = isEditMode ? 'Edit Home Category' : 'Add New Home Category';
  const submitButtonText = isEditMode ? (isSubmitting ? 'Updating...' : 'Update Home Category') : (isSubmitting ? 'Creating...' : 'Create Home Category');

  if (isLoading && isEditMode) {
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
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md border-l-4 border-red-500 flex items-center gap-3">
            <X className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="font-medium">{error}</p>
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
            <div className="flex flex-col md:flex-row gap-8">
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
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <Search className="w-5 h-5 text-gray-400 mr-3" />
                    <input
                      type="text"
                      id="productSearch"
                      className="flex-grow outline-none text-gray-800 placeholder-gray-500"
                      placeholder="Search by product name or code..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsDropdownOpen(true);
                      }}
                      disabled={isSubmitting}
                    />
                  </div>

                  {isDropdownOpen && (
                    <div
                      className="absolute z-20 mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-xl max-h-80 overflow-y-auto"
                      ref={productListRef}
                      onScroll={handleScroll}
                    >
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map(product => (
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
                              <div className="font-medium text-base text-gray-800 truncate">{product.product_code} - {product.product_name}</div>
                              <div className="text-sm text-gray-500">₹{product.product_price}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          {isLoading ? 'Loading...' : 'No products found'}
                        </div>
                      )}

                      {isLoading && !isEditMode && (
                        <div className="p-2 text-center text-gray-600 flex items-center justify-center gap-2">
                          <Loader2 className="animate-spin w-4 h-4" /> Loading more products...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right side - Selected products */}
              <div className="w-full md:w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Selection ({selectedProducts.length})
                </label>
                <div className="border border-gray-200 rounded-lg p-4 h-80 min-h-[320px] overflow-y-auto bg-gray-50">
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
                          <div className="flex-grow pr-2 truncate">
                            <div className="font-medium text-base text-gray-800 truncate">{product.product_code} - {product.product_name}</div>
                            <div className="text-sm text-gray-500">₹{product.product_price}</div>
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
            <button
              type="button"
              className="px-6 py-3 border border-gray-300 rounded-md text-gray-700
                         hover:bg-gray-100 transition-colors duration-200
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
              onClick={() => router.push('/admin/products/home-category')}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 py-3 rounded-md text-white shadow-md transition-all duration-200
                         flex items-center justify-center gap-2
                         ${isSubmitting 
                           ? 'bg-gray-400 cursor-not-allowed opacity-80'
                           : 'bg-[var(--color-primary-950)] hover:bg-[color:var(--color-primary-950)]/90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary-950)]'
                         }`}
              disabled={isSubmitting}
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