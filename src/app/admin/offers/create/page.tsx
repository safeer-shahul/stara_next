'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tag, ArrowLeft, Search, X, Upload, Calendar, Info, Loader2, DollarSign, Percent, XCircle, Trash2 } from 'lucide-react';
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

interface OfferData {
  id: string;
  offer_name: string;
  offer_image: string | null;
  buy_count: number;
  get_count: number;
  start_date: string;
  end_date: string;
  products: Product[];
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
  const [formError, setFormError] = useState<string | null>(null); // Changed from 'error' to 'formError' for clarity in new design
  const [offerImageError, setOfferImageError] = useState<string | null>(null); // New state for image specific errors
  const [isLoading, setIsLoading] = useState(false); // Renamed from isFetchingInitialData to isLoading for consistency with old code

  const [products, setProducts] = useState<Product[]>([]); // These are the available products from API
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [originalSelectedProducts, setOriginalSelectedProducts] = useState<Product[]>([]); // Track original products for edit mode
  const [removedProductIds, setRemovedProductIds] = useState<string[]>([]); // Track removed product IDs for edit mode
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true); // Renamed from hasMoreProducts to hasMore for consistency with old code
  const dropdownRef = useRef<HTMLDivElement>(null);
  const productListRef = useRef<HTMLDivElement>(null); // Renamed from productListScrollRef for consistency
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

    // Reset time to start of day for comparison
    today.setHours(0, 0, 0, 0);
    startDateObj.setHours(0, 0, 0, 0);

    return startDateObj <= today;
  };

  // Fetch offer data for editing
  const fetchOfferData = useCallback(async () => {
    if (!offerId) return;

    setIsLoading(true);
    setFormError(null);
    try {
      const offerData: OfferData = await apiService.offerByID(offerId);
      setOfferName(offerData.offer_name);
      setBuyCount(offerData.buy_count.toString());
      setGetCount(offerData.get_count.toString());

      if (offerData.start_date) {
        const startDateFormatted = new Date(offerData.start_date).toISOString().split('T')[0];
        setStartDate(startDateFormatted);
      }
      if (offerData.end_date) {
        const endDateFormatted = new Date(offerData.end_date).toISOString().split('T')[0];
        setEndDate(endDateFormatted);
      }

      if (offerData.offer_image) {
        setOfferImagePreview(`${process.env.NEXT_PUBLIC_API_BASE_URL}${offerData.offer_image}`);
      } else {
        setOfferImagePreview('');
      }

      let selectedProductsFromOffer: Product[] = [];
      if (offerData.products && Array.isArray(offerData.products)) {
        selectedProductsFromOffer = offerData.products;
        setSelectedProducts(selectedProductsFromOffer);
        setOriginalSelectedProducts([...selectedProductsFromOffer]);
      }

      await loadProducts(1, selectedProductsFromOffer);

    } catch (err) {
      // console.error('Error fetching offer data:', err);
      setFormError('Failed to load offer data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [offerId]);

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


  const loadProducts = useCallback(async (page: number, excludeProducts: Product[] = []) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const response = await apiService.getPaginatedProducts(page, 10);
      const newProducts = response.products || response;

      if (newProducts.length === 0) {
        setHasMore(false);
      } else {
        setProducts(prev => {
          const productsToExclude = excludeProducts.length > 0 ? excludeProducts : selectedProducts;
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
      // console.error('Error loading products:', err);
      setFormError('Failed to load products. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  useEffect(() => {
    const fetchData = async () => {
      if (isEditMode) {
        await fetchOfferData();
      } else {
        await loadProducts(1);
      }
    };
    
    fetchData();
  }, [isEditMode, offerId]);
  
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
    setSearchTerm(''); // Clear search term after selection
    setFormError(null); // Clear any general form errors if product is added
  };

  // Remove product from selected list
  const handleRemoveProduct = (product: Product) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== product.id));
    // When removing, add it back to available and sort (old logic)
    setProducts(prev => [...prev, product].sort((a, b) =>
      a.product_name.localeCompare(b.product_name)
    ));

    // If in edit mode and this product was originally selected, add it to removedProductIds
    if (isEditMode && originalSelectedProducts.some(originalProduct => originalProduct.id === product.id)) {
      setRemovedProductIds(prev => [...prev, product.id]);
    }
  };

  // Filter products based on search term - ensure selected products are not shown
  // This uses the 'products' state (available products from API)
  const filteredProducts = searchTerm
    ? products.filter(product =>
      (product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       product.product_code.toLowerCase().includes(searchTerm.toLowerCase())) && // Include product code in search
      !selectedProducts.some(selectedProduct => selectedProduct.id === product.id)
    )
    : products.filter(product =>
      !selectedProducts.some(selectedProduct => selectedProduct.id === product.id)
    );

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setOfferImage(null);
      setOfferImagePreview('');
      setOfferImageError(null);
      return;
    }

    setOfferImageError(null); // Clear previous image errors

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setOfferImageError('Please select a valid image file (JPG, PNG, WebP).');
      setOfferImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setOfferImageError('Image size should be less than 5MB.');
      setOfferImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Read file for preview and validate aspect ratio
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const width = img.width;
        const height = img.height;
        const ratio = width / height;

        if (ratio < 0.95 || ratio > 1.05) { // Allowing a small tolerance
          setOfferImageError("Image should have a 1:1 aspect ratio (square image).");
          setOfferImage(null);
        } else {
          setOfferImageError(null); // Clear error if ratio is good
          setOfferImage(file); // Set file only if valid
        }
      };
      img.onerror = () => {
        setOfferImageError("Failed to load image for preview.");
        setOfferImage(null);
        setOfferImagePreview('');
      };
      setOfferImagePreview(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Remove uploaded image
  const handleRemoveImage = () => {
    setOfferImage(null);
    setOfferImagePreview('');
    setOfferImageError(null); // Clear image error on removal
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Validate dates
  const validateDates = () => {
    if (!startDate || !endDate) {
      setFormError("Please select both start and end dates.");
      return false;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

    // For new offers, start date should be today or in the future
    if (!isEditMode && start < today) {
      setFormError("Start date cannot be in the past for a new offer.");
      return false;
    }

    // End date should be after start date
    if (end <= start) {
      setFormError("End date must be after start date.");
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Re-validate all required fields before submission (old logic was less comprehensive here)
    if (!offerName.trim()) {
      setFormError("Offer Name is required.");
      return;
    }
    if (!buyCount || parseInt(buyCount) <= 0) {
      setFormError("Buy Count must be a positive number.");
      return;
    }
    if (!getCount || parseInt(getCount) <= 0) {
      setFormError("Get Count must be a positive number.");
      return;
    }
    if (!validateDates()) {
      return; // Error message set by validateDates
    }
    if (selectedProducts.length === 0) {
      setFormError("Please select at least one product for the offer.");
      return;
    }
    // Only require image for new offer OR if there's no existing preview in edit mode AND no new file is selected
    if (!offerImage && !offerImagePreview && !isEditMode) {
      setFormError("Please upload an offer image.");
      return;
    }
    if (offerImageError) { // Check for existing image errors
      setFormError("Please correct the offer image issues before submitting.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null); // Clear form error before submission attempt
    setOfferImageError(null); // Clear image error before submission attempt

    try {
      const formData = new FormData();
      formData.append('offer_name', offerName);
      formData.append('buy_count', buyCount);
      formData.append('get_count', getCount);
      formData.append('start_date', startDate);
      formData.append('end_date', endDate);

      // Add product IDs for products to be added (those newly selected)
      selectedProducts.forEach(product => {
        // Only add if not originally selected in edit mode, or if it's a new offer
        if (!isEditMode || !originalSelectedProducts.some(orig => orig.id === product.id)) {
          formData.append('add_product_ids', product.id);
        }
      });

      // Add product IDs for products to be removed (only in edit mode)
      if (isEditMode && removedProductIds.length > 0) {
        removedProductIds.forEach(productId => {
          formData.append('delete_product_ids', productId);
        });
      }

      // Add new image file if selected
      if (offerImage) {
        formData.append('offer_image', offerImage);
      }
      // If in edit mode and no new image is selected, but there was an old image, no 'offer_image' field is needed.
      // If in edit mode and image was removed (offerImage is null, offerImagePreview is empty), backend should handle it as deletion.
      // (Assuming apiService.createOffer handles this nuance)

      // Add ID for edit mode
      if (isEditMode && offerId) {
        formData.append('id', offerId); // Use direct offerId, replace(/-/g, '') not needed unless API truly requires it
      }

      await apiService.createOffer(formData); // This API call is used for both create and update

      alert(`Offer "${offerName}" ${isEditMode ? 'updated' : 'created'} successfully!`);
      router.push('/admin/offers/list');
    } catch (err: any) {
      // console.error('Error processing offer:', err);
      let errorMessage = `Failed to ${isEditMode ? 'update' : 'create'} offer. Please try again.`;
      if (err.response?.data?.detail) {
        errorMessage = `Error: ${err.response.data.detail}`;
      } else if (err.message) {
        errorMessage = `Error: ${err.message}`;
      }
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };


  const pageTitle = isEditMode ? 'Edit Offer' : 'Add New Offer';
  const submitButtonText = isSubmitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Offer' : 'Create Offer');

  if (isLoading && isEditMode) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-xl shadow-lg">
        <Loader2 className="animate-spin h-12 w-12 text-[var(--color-primary-950)]" />
        <p className="mt-4 text-lg text-gray-600">Loading offer details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/offers/list"
          className="text-gray-600 hover:text-[var(--color-primary-950)] transition-colors duration-200"
          aria-label="Back to Offers List"
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
          <div className="bg-orange-50 p-4 rounded-full mr-5">
            <Tag className="w-8 h-8 text-orange-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Offer Details</h3>
            <p className="text-gray-600 text-sm">
              {isEditMode ? 'Update existing special offer properties and images.' : 'Create a new special offer for your products.'}
            </p>
          </div>
        </div>

        {/* Form-level Error Message */}
        {formError && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md border-l-4 border-red-500 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="font-medium">{formError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section: Basic Offer Information */}
          <div>
            <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <Info className="w-5 h-5 mr-2 text-blue-500" /> Basic Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Offer Name */}
              <div>
                <label htmlFor="offerName" className="block text-sm font-medium text-gray-700 mb-2">
                  Offer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="offerName"
                  className="w-full p-3 border border-gray-300 rounded-md text-gray-800
                                  focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent
                                  transition-all duration-200"
                  value={offerName}
                  onChange={(e) => setOfferName(e.target.value)}
                  placeholder="e.g., Summer Sale, Diwali Special"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Offer Image Upload */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Offer Image <span className="text-red-500">*</span> (1:1 Aspect Ratio)
                </label>
                <div
                  className={`border-2 border-dashed ${offerImageError ? 'border-red-400' : 'border-gray-300'} rounded-xl p-6 text-center cursor-pointer transition-all duration-200
                                  hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary-950)]`}
                  onClick={() => fileInputRef.current?.click()}
                  tabIndex={0}
                  role="button"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isSubmitting}
                  />

                  {offerImagePreview ? (
                    <div className="flex flex-col items-center">
                      <div className="w-32 h-32 mb-4 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
                        <Image
                          src={offerImagePreview}
                          alt="Offer preview"
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        className="text-red-600 hover:text-red-800 font-medium transition-colors duration-200 flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage();
                        }}
                        disabled={isSubmitting}
                      >
                        <Trash2 className="w-5 h-5" /> Remove Image
                      </button>
                    </div>
                  ) : (
                    <div className="py-4">
                      <Upload className="mx-auto h-16 w-16 text-gray-400 mb-3" />
                      <p className="text-lg font-medium text-[var(--color-primary-950)]">Upload Offer Image</p>
                      <p className="text-sm text-gray-500 mt-1">Drag & drop or click to browse (JPG, PNG, WebP)</p>
                    </div>
                  )}
                </div>
                {offerImageError && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> {offerImageError}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Offer Mechanics & Dates */}
          <div>
            <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center mt-6 border-t pt-6">
              <Percent className="w-5 h-5 mr-2 text-green-500" /> Offer Mechanics & Dates
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Buy Count */}
              <div>
                <label htmlFor="buyCount" className="block text-sm font-medium text-gray-700 mb-2">
                  Buy Count <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="buyCount"
                  className="w-full p-3 border border-gray-300 rounded-md text-gray-800
                                  focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent
                                  transition-all duration-200"
                  value={buyCount}
                  onChange={(e) => setBuyCount(e.target.value)}
                  placeholder="e.g., 2"
                  min="1"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Get Count */}
              <div>
                <label htmlFor="getCount" className="block text-sm font-medium text-gray-700 mb-2">
                  Get Count <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="getCount"
                  className="w-full p-3 border border-gray-300 rounded-md text-gray-800
                                  focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent
                                  transition-all duration-200"
                  value={getCount}
                  onChange={(e) => setGetCount(e.target.value)}
                  placeholder="e.g., 1"
                  min="1"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Start Date */}
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="startDate"
                    className={`w-full p-3 border border-gray-300 rounded-md pr-10 text-gray-800
                                  ${isStartDateDisabled() ? 'bg-gray-100 cursor-not-allowed' : ''}
                                  focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent
                                  transition-all duration-200`}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={!isEditMode ? getTodayDate() : undefined}
                    required
                    disabled={isSubmitting || isStartDateDisabled()}
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
                {isStartDateDisabled() && (
                  <p className="text-xs text-gray-500 mt-1">
                    Start date cannot be changed as it&apos;s today or in the past.
                  </p>
                )}
              </div>

              {/* End Date */}
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="endDate"
                    className="w-full p-3 border border-gray-300 rounded-md pr-10 text-gray-800
                                  focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent
                                  transition-all duration-200"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || getTodayDate()}
                    required
                    disabled={isSubmitting}
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Product Selection */}
          <div>
            <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center mt-6 border-t pt-6">
              <DollarSign className="w-5 h-5 mr-2 text-purple-500" /> Products for Offer <span className="text-red-500 ml-2">*</span>
              <span className="text-gray-500 font-normal text-sm ml-2">(Select products for this offer)</span>
            </h4>
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left side - Product Search & Available List */}
              <div className="w-full lg:w-1/2">
                <label htmlFor="productSearch" className="block text-sm font-medium text-gray-700 mb-2">
                  Find & Add Products
                </label>
                <div className="relative" ref={dropdownRef}>
                  <div
                    className="p-3 border border-gray-300 rounded-md flex items-center cursor-pointer
                                  focus-within:ring-2 focus-within:ring-[var(--color-primary-950)] focus-within:border-transparent
                                  transition-all duration-200"
                    // Modified to specifically open dropdown but let input handle search state
                    onClick={() => setIsDropdownOpen(true)}
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
                        setIsDropdownOpen(true); // Open dropdown on change
                      }}
                      onFocus={() => {
                        setIsDropdownOpen(true);
                      }}
                      disabled={isSubmitting}
                    />
                  </div>

                  {isDropdownOpen && (
                    <div
                      className="absolute z-20 mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-xl max-h-80 overflow-y-auto"
                      ref={productListRef} // Use productListRef for consistency with old code
                      onScroll={handleScroll}
                    >
                      {isLoading && currentPage === 1 ? ( // Use isLoading
                        <div className="p-4 text-center text-gray-600 flex items-center justify-center gap-2">
                          <Loader2 className="animate-spin w-5 h-5" /> Loading products...
                        </div>
                      ) : filteredProducts.length > 0 ? (
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
                              <div className="font-medium text-base text-gray-800 truncate">{product.product_name}</div>
                              <div className="text-sm text-gray-500">
                                {product.product_code} - ₹{parseFloat(product.product_price).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          {isLoading ? 'Loading...' : 'No products found matching your search.'}
                        </div>
                      )}

                      {/* Infinite scroll loading indicator */}
                      {isLoading && currentPage > 0 && ( // Use isLoading and currentPage > 0
                        <div className="p-2 text-center text-gray-600 flex items-center justify-center gap-2">
                          <Loader2 className="animate-spin w-4 h-4" /> Loading more...
                        </div>
                      )}
                      {!hasMore && currentPage > 0 && !isLoading && ( // Use hasMore
                        <div className="p-2 text-center text-gray-400 text-sm">No more products to load.</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right side - Selected products */}
              <div className="w-full lg:w-1/2">
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
                            <div className="font-medium text-base text-gray-800 truncate">{product.product_name}</div>
                            <div className="text-sm text-gray-500">
                              {product.product_code} - ₹{parseFloat(product.product_price).toFixed(2)}
                            </div>
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

          {/* Form Actions */}
          <div className="flex justify-end pt-8 border-t border-gray-200 mt-8 space-x-4">
            <Link href="/admin/offers/list" passHref>
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
              className={`px-6 py-3 rounded-md text-white font-semibold shadow-md transition-all duration-200
                                flex items-center justify-center gap-2
                                ${isSubmitting || !!formError || !!offerImageError || (selectedProducts.length === 0) || (!isEditMode && !offerImage)
                                  ? 'bg-gray-400 cursor-not-allowed opacity-80'
                                  : 'bg-[var(--color-primary-950)] hover:bg-[color:var(--color-primary-950)]/90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary-950)]'
                                }`}
              disabled={isSubmitting || !!formError || !!offerImageError || (selectedProducts.length === 0) || (!isEditMode && !offerImage)} // Disable if no image in add mode
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

export default AddOfferPage;