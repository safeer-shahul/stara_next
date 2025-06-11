'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tag, ArrowLeft, Search, X, Upload, Image as ImageIcon, Calendar } from 'lucide-react';
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

function AddOfferPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const offerId = searchParams.get('id');
  const isEditMode = !!offerId;
  
  const [offerName, setOfferName] = useState('');
  const [offerImage, setOfferImage] = useState<File | null>(null);
  const [offerImagePreview, setOfferImagePreview] = useState<string>('');
  const [buyCount, setBuyCount] = useState('');
  const [getCount, setGetCount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [originalSelectedProducts, setOriginalSelectedProducts] = useState<Product[]>([]); // Track original products
  const [removedProductIds, setRemovedProductIds] = useState<string[]>([]); // Track removed product IDs
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const productListRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Check if start date should be disabled (today or in the past)
  const isStartDateDisabled = () => {
    if (!isEditMode) return false;
    if (!startDate) return false;
    
    const today = new Date();
    const startDateObj = new Date(startDate);
    
    // Disable if start date is today or in the past
    return startDateObj <= today;
  };

  // Fetch offer data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchOfferData();
    } else {
      // Load initial products only for new offers
      loadProducts(1);
    }
  }, [offerId]);

  // Fetch offer data for editing
  const fetchOfferData = async () => {
    if (!offerId) return;
    
    setIsLoading(true);
    try {
      const offerData = await apiService.offerByID(offerId);
      setOfferName(offerData.offer_name);
      setBuyCount(offerData.buy_count.toString());
      setGetCount(offerData.get_count.toString());
      
      // Set dates if they exist
      if (offerData.start_date) {
        // Convert to YYYY-MM-DD format if needed
        const startDateFormatted = new Date(offerData.start_date).toISOString().split('T')[0];
        setStartDate(startDateFormatted);
      }
      if (offerData.end_date) {
        // Convert to YYYY-MM-DD format if needed
        const endDateFormatted = new Date(offerData.end_date).toISOString().split('T')[0];
        setEndDate(endDateFormatted);
      }
      
      // Set offer image preview if exists
      if (offerData.offer_image) {
        setOfferImagePreview(`${process.env.NEXT_PUBLIC_API_BASE_URL}${offerData.offer_image}`);
      }
      
      // Set selected products from the fetched offer
      let selectedProductsFromOffer = [];
      if (offerData.products && Array.isArray(offerData.products)) {
        selectedProductsFromOffer = offerData.products;
        setSelectedProducts(selectedProductsFromOffer);
        setOriginalSelectedProducts([...selectedProductsFromOffer]); // Store original products
      }
      
      // Load products after setting selected products
      await loadProducts(1, selectedProductsFromOffer);
      
    } catch (err) {
      console.error('Error fetching offer data:', err);
      setError('Failed to load offer data. Please try again.');
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
  const loadProducts = async (page: number, excludeProducts: Product[] = []) => {
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
          // Use excludeProducts parameter if provided, otherwise use current selectedProducts
          const productsToExclude = excludeProducts.length > 0 ? excludeProducts : selectedProducts;
          
          // Filter out products that are already selected
          const filteredNewProducts = newProducts.filter(
            (newProduct: any) => !productsToExclude.some(selectedProduct => selectedProduct.id === newProduct.id)
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
    
    // If this product was previously removed, remove it from the removedProductIds list
    if (isEditMode && removedProductIds.includes(product.id)) {
      setRemovedProductIds(prev => prev.filter(id => id !== product.id));
    }
    
    setIsDropdownOpen(false);
  };

  // Remove product from selected list
  const handleRemoveProduct = (product: Product) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== product.id));
    setProducts(prev => [...prev, product].sort((a, b) => 
      a.product_name.localeCompare(b.product_name)
    ));
    
    // If in edit mode and this product was originally selected, add it to removedProductIds
    if (isEditMode && originalSelectedProducts.some(originalProduct => originalProduct.id === product.id)) {
      setRemovedProductIds(prev => [...prev, product.id]);
    }
  };

  // Filter products based on search term - ensure selected products are not shown
  const filteredProducts = searchTerm 
    ? products.filter(product => 
        product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !selectedProducts.some(selectedProduct => selectedProduct.id === product.id)
      )
    : products.filter(product => 
        !selectedProducts.some(selectedProduct => selectedProduct.id === product.id)
      );

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      
      setOfferImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setOfferImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  // Remove uploaded image
  const handleRemoveImage = () => {
    setOfferImage(null);
    setOfferImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Validate dates
  const validateDates = () => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return false;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

    // For new offers, start date should be today or in the future
    if (!isEditMode && start < today) {
      setError("Start date cannot be in the past");
      return false;
    }

    // End date should be after start date
    if (end <= start) {
      setError("End date must be after start date");
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (selectedProducts.length === 0) {
      setError("Please select at least one product");
      return;
    }

    if (!isEditMode && !offerImage) {
      setError("Please upload an offer image");
      return;
    }

    if (!buyCount || !getCount) {
      setError("Please fill in both buy count and get count");
      return;
    }

    if (parseInt(buyCount) <= 0 || parseInt(getCount) <= 0) {
      setError("Buy count and get count must be greater than 0");
      return;
    }

    // Validate dates
    if (!validateDates()) {
      return;
    }
  
    setIsSubmitting(true);
    setError(null);
  
    try {
      const formData = new FormData();
      formData.append('offer_name', offerName);
      formData.append('buy_count', buyCount);
      formData.append('get_count', getCount);
      formData.append('start_date', startDate);
      formData.append('end_date', endDate);
      
      // Add product IDs for products to be added
      selectedProducts.forEach(product => {
        formData.append('add_product_ids', product.id);
      });
      
      // Add product IDs for products to be removed (only in edit mode)
      if (isEditMode && removedProductIds.length > 0) {
        removedProductIds.forEach(productId => {
          formData.append('delete_product_ids', productId);
        });
      }
      
      // Add image if selected
      if (offerImage) {
        formData.append('offer_image', offerImage);
      }
      
      // Add ID for edit mode
      if (isEditMode) {
        formData.append('id', offerId.replace(/-/g, ''));
      }
  
      await apiService.createOffer(formData);
      alert(`Offer "${offerName}" ${isEditMode ? 'updated' : 'created'} successfully!`);
      router.push('/admin/offers/list');
    } catch (err) {
      console.error('Error processing offer:', err);
      setError(`Failed to ${isEditMode ? 'update' : 'create'} offer. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };
  

  const pageTitle = isEditMode ? 'Edit Offer' : 'Add New Offer';
  const submitButtonText = isEditMode ? (isSubmitting ? 'Updating...' : 'Update Offer') : (isSubmitting ? 'Creating...' : 'Create Offer');

  if (isLoading && isEditMode) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading offer data...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Link href="/admin/offers/list" className="text-blue-600 hover:text-blue-800">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-2xl font-bold">{pageTitle}</h2>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-6">
          <div className="bg-orange-100 p-3 rounded-full mr-4">
            <Tag className="w-8 h-8 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium">Offer Details</h3>
            <p className="text-gray-500">
              {isEditMode ? 'Update existing offer' : 'Create a new special offer for customers'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Debug info - Remove in production */}
        {isEditMode && process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded text-sm">
            <div>Selected Products: {selectedProducts.length}</div>
            <div>Removed Product IDs: {removedProductIds.join(', ')}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left side - Form inputs */}
            <div className="w-full lg:w-1/2">
              <div className="mb-4">
                <label htmlFor="offerName" className="block text-sm font-medium text-gray-700 mb-1">
                  Offer Name *
                </label>
                <input
                  type="text"
                  id="offerName"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={offerName}
                  onChange={(e) => setOfferName(e.target.value)}
                  placeholder="e.g. Buy 2 Get 1 Free"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Offer Image * (1:1 Ratio)
                </label>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 relative">
                  {offerImagePreview ? (
                    <div className="relative">
                      <div className="w-32 h-32 mx-auto relative rounded-lg overflow-hidden">
                        <Image
                          src={offerImagePreview}
                          alt="Offer preview"
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 transform translate-x-2 -translate-y-2"
                        disabled={isSubmitting}
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="text-center mt-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-sm text-blue-600 cursor-pointer hover:text-blue-800 underline"
                          disabled={isSubmitting}
                        >
                          Click to change image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="text-center cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        Click to upload offer image
                      </p>
                      <p className="text-xs text-gray-500">
                        Recommended: 1:1 aspect ratio (e.g., 500x500px)
                      </p>
                    </div>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="buyCount" className="block text-sm font-medium text-gray-700 mb-1">
                    Buy Count *
                  </label>
                  <input
                    type="number"
                    id="buyCount"
                    className="w-full p-2 border border-gray-300 rounded"
                    value={buyCount}
                    onChange={(e) => setBuyCount(e.target.value)}
                    placeholder="2"
                    min="1"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                
                <div>
                  <label htmlFor="getCount" className="block text-sm font-medium text-gray-700 mb-1">
                    Get Count *
                  </label>
                  <input
                    type="number"
                    id="getCount"
                    className="w-full p-2 border border-gray-300 rounded"
                    value={getCount}
                    onChange={(e) => setGetCount(e.target.value)}
                    placeholder="1"
                    min="1"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Date Controls */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="startDate"
                      className={`w-full p-2 border border-gray-300 rounded pr-10 ${
                        isStartDateDisabled() ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={!isEditMode ? getTodayDate() : undefined}
                      required
                      disabled={isSubmitting || isStartDateDisabled()}
                    />
                    <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                  {isStartDateDisabled() && (
                    <p className="text-xs text-gray-500 mt-1">
                      Start date cannot be changed as it's today or in the past
                    </p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="endDate"
                      className="w-full p-2 border border-gray-300 rounded pr-10"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || getTodayDate()}
                      required
                      disabled={isSubmitting}
                    />
                    <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
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
            <div className="w-full lg:w-1/2">
              <div className="border border-gray-200 rounded p-4 h-full">
                <div className="text-sm font-medium text-gray-700 mb-3">
                  Selected Products ({selectedProducts.length})
                </div>
                
                {buyCount && getCount && (
                  <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-3">
                    <div className="text-sm font-medium text-orange-800">
                      Offer Summary: Buy {buyCount} Get {getCount} Free
                    </div>
                    {startDate && endDate && (
                      <div className="text-xs text-orange-600 mt-1">
                        Valid from {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )}
                
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
                          className="ml-2 cursor-pointer text-red-500 hover:text-red-700"
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
              className="px-4 py-2 border cursor-pointer border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              onClick={() => router.push('/admin/offers')}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded ${
                isSubmitting 
                  ? 'bg-orange-400 cursor-not-allowed' 
                  : 'bg-orange-600 cursor-pointer hover:bg-orange-700'
              } text-white`}
              disabled={isSubmitting}
            >
              {submitButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddOfferPage;