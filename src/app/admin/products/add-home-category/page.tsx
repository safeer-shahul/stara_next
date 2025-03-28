'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Home, ArrowLeft, Search, X } from 'lucide-react';
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
  const [categoryName, setCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Product selection state
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const productListRef = useRef<HTMLDivElement>(null);

  // Fetch initial products
  useEffect(() => {
    loadProducts(1);
  }, []);

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
      const newProducts = response.results || response;
      
      if (newProducts.length === 0) {
        setHasMore(false);
      } else {
        setProducts(prev => 
          page === 1 
            ? newProducts 
            : [...prev, ...newProducts]
        );
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
      // Extract product IDs
      const productIds = selectedProducts.map(product => product.id);
      
      // Call API to create home category using the existing service method
      await apiService.createHomeCategory(categoryName, productIds);
      
      alert(`Home Category "${categoryName}" created successfully!`);
      router.push('/admin/products/home-category');
    } catch (err) {
      console.error('Error creating home category:', err);
      setError('Failed to create home category. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Link href="/admin/home/categories" className="text-blue-600 hover:text-blue-800">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-2xl font-bold">Add New Home Category</h2>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-6">
          <div className="bg-blue-100 p-3 rounded-full mr-4">
            <Home className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium">Home Category Details</h3>
            <p className="text-gray-500">Create a new home page category section</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left side - Form inputs */}
            <div className="w-full md:w-1/2">
              <div className="mb-4">
                <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  id="categoryName"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Products *
                </label>
                
                <div className="relative" ref={dropdownRef}>
                  <div 
                    className="p-2 border border-gray-300 rounded flex items-center cursor-pointer"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <Search className="w-5 h-5 text-gray-400 mr-2" />
                    <input
                      type="text"
                      className="flex-grow outline-none"
                      placeholder="Search products..."
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
                      className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-72 overflow-auto"
                      ref={productListRef}
                      onScroll={handleScroll}
                    >
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map(product => (
                          <div 
                            key={product.id}
                            className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
                            onClick={() => handleSelectProduct(product)}
                          >
                            {product.images && product.images.length > 0 && (
                              <div className="w-10 h-10 mr-2 overflow-hidden relative">
                                <Image 
                                  src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${product.images[0].product_image}`}
                                  alt={product.product_name}
                                  fill
                                  sizes="40px"
                                  style={{ objectFit: 'cover' }}
                                />
                              </div>
                            )}
                            <div className="flex-grow">
                              <div className="font-medium text-[14px]">{product.product_code} - {product.product_name}</div>
                              <div className="text-[12px] text-gray-500">₹{product.product_price}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center text-gray-500">
                          {isLoading ? 'Loading...' : 'No products found'}
                        </div>
                      )}
                      
                      {isLoading && (
                        <div className="p-2 text-center text-gray-500">Loading more products...</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right side - Selected products */}
            <div className="w-full md:w-1/2">
              <div className="border border-gray-200 rounded p-4 h-full">
                <div className="text-sm font-medium text-gray-700 mb-3">
                  Selected Products ({selectedProducts.length})
                </div>
                
                {selectedProducts.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {selectedProducts.map(product => (
                      <div 
                        key={product.id}
                        className="border border-gray-200 rounded p-2 flex items-center"
                      >
                        {product.images && product.images.length > 0 && (
                          <div className="w-12 h-12 mr-2 overflow-hidden relative">
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
                          <div className="font-medium text-[14px] truncate">{product.product_code} - {product.product_name}</div>
                          <div className="text-[12px] text-gray-500">₹{product.product_price}</div>
                        </div>
                        <button 
                          type="button" 
                          className="ml-2 text-red-500 hover:text-red-700"
                          onClick={() => handleRemoveProduct(product)}
                          disabled={isSubmitting}
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm border border-dashed border-gray-300 rounded p-4 text-center h-72 flex items-center justify-center">
                    No products selected. Please select products from the dropdown on the left.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6 space-x-3">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              onClick={() => router.push('/admin/home/categories')}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded ${
                isSubmitting 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Home Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddHomeCategoryPage;