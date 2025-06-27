'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
// Importing additional icons for better UX and consistency
import { Tag, ArrowLeft, Search, X, Upload, Image as ImageIcon, Calendar, Info, Loader2, DollarSign, Percent, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import apiService from '@/utils/api/apiService';

// Define specific interfaces for better type safety
interface Product {
  id: string;
  product_name: string;
  product_code: string;
  product_price: string; // Keeping as string from original, convert to number if needed for math
  images: {
    id?: string;
    product_image: string;
    product?: string;
  }[];
}

interface OfferData {
  id: string; // Assuming ID can be string from API
  offer_name: string;
  offer_image: string | null;
  buy_count: number;
  get_count: number;
  start_date: string; // ISO string format
  end_date: string;   // ISO string format
  products: Product[]; // Associated products
}

function AddOfferPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const offerId = searchParams.get('id');
  const isEditMode = !!offerId; // Proper boolean check

  // Form states
  const [offerName, setOfferName] = useState('');
  const [offerImageFile, setOfferImageFile] = useState<File | null>(null);
  const [offerImagePreview, setOfferImagePreview] = useState<string | null>(null); // Changed to null for no image state
  const [buyCount, setBuyCount] = useState('');
  const [getCount, setGetCount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // For form submission
  const [formError, setFormError] = useState<string | null>(null); // General form errors
  const [offerImageError, setOfferImageError] = useState<string | null>(null); // Specific image upload errors

  // Data fetching states
  const [isFetchingInitialData, setIsFetchingInitialData] = useState(isEditMode); // For initial data fetch (edit mode)
  const [isProductsLoading, setIsProductsLoading] = useState(false); // For infinite scroll loading

  // Product selection states
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]); // Renamed from 'products' for clarity
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [originalSelectedProductIds, setOriginalSelectedProductIds] = useState<Set<string>>(new Set()); // Track original product IDs for deletion
  const [removedProductIds, setRemovedProductIds] = useState<string[]>([]); // Track removed product IDs to send to API

  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreProducts, setHasMoreProducts] = useState(true); // Renamed from 'hasMore'
  const dropdownRef = useRef<HTMLDivElement>(null);
  const productListScrollRef = useRef<HTMLDivElement>(null); // Renamed from 'productListRef'
  const fileInputRef = useRef<HTMLInputElement>(null); // For offer image

  // Get today's date in YYYY-MM-DD format for date pickers
  const getTodayDate = useCallback(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }, []);

  // Check if start date input should be disabled (today or in the past for edit mode)
  const isStartDateDisabled = useCallback(() => {
    if (!isEditMode) return false; // Not disabled in create mode
    if (!startDate) return false; // Not disabled if no start date set yet

    const today = new Date();
    const startDateObj = new Date(startDate);
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    startDateObj.setHours(0, 0, 0, 0); // Reset time to start of day

    return startDateObj <= today; // Disable if start date is today or in the past
  }, [isEditMode, startDate]);

  // Fetch offer data if in edit mode (memoized)
  const fetchOfferData = useCallback(async () => {
    if (!offerId) return;

    setIsFetchingInitialData(true);
    setFormError(null);
    try {
      const offerData: OfferData = await apiService.offerByID(offerId); // Assuming API handles ID directly

      setOfferName(offerData.offer_name || '');
      setBuyCount(offerData.buy_count?.toString() || '');
      setGetCount(offerData.get_count?.toString() || '');
      setStartDate(offerData.start_date ? new Date(offerData.start_date).toISOString().split('T')[0] : '');
      setEndDate(offerData.end_date ? new Date(offerData.end_date).toISOString().split('T')[0] : '');

      if (offerData.offer_image) {
        setOfferImagePreview(`${process.env.NEXT_PUBLIC_API_BASE_URL}${offerData.offer_image}`);
      } else {
        setOfferImagePreview(null);
      }

      // Set selected products from the fetched offer
      if (offerData.products && Array.isArray(offerData.products)) {
        const productsFromOffer = offerData.products.map(p => ({
            id: p.id, product_name: p.product_name, product_code: p.product_code, product_price: p.product_price, images: p.images || []
        }));
        setSelectedProducts(productsFromOffer);
        setOriginalSelectedProductIds(new Set(productsFromOffer.map(p => p.id))); // Store original IDs
      } else {
          setSelectedProducts([]);
          setOriginalSelectedProductIds(new Set());
      }

    } catch (err) {
      console.error('Error fetching offer data:', err);
      setFormError('Failed to load offer data. Please try again.');
    } finally {
      setIsFetchingInitialData(false);
    }
  }, [offerId]); // Depend on offerId

  // Load initial available products or more products for infinite scroll (memoized)
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
        (newProduct) => !selectedProducts.some((selectedProduct) => selectedProduct.id === newProduct.id)
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

  // Effect to fetch initial offer data (edit mode) AND then initial products
  useEffect(() => {
    if (isEditMode) {
      fetchOfferData();
    }
    // Load initial products (first page) when component mounts or search term changes
    // This will be called after fetchOfferData potentially completes in edit mode,
    // ensuring `selectedProducts` is up-to-date before `loadProducts` filters.
    // The `isFetchingInitialData` check in the `loadProducts` dependency array will also help.
    if (!isFetchingInitialData) {
        loadProducts(1, searchTerm); // Re-load products if search term changes or initial fetch finishes
    }
  }, [isEditMode, fetchOfferData, isFetchingInitialData, searchTerm]);


  // Handle clicks outside the dropdown to close it
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
    // If this product was previously marked for removal, unmark it
    setRemovedProductIds(prev => prev.filter(id => id !== product.id));
    setIsDropdownOpen(false); // Close dropdown after selection
    setSearchTerm(''); // Clear search term after selection
    setFormError(null); // Clear error if products now selected
  }, []);

  // Remove product from selected list
  const handleRemoveProduct = useCallback((product: Product) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== product.id));
    // Add back to available products, maintaining sorted order
    setAvailableProducts(prev => [...prev, product].sort((a, b) =>
      a.product_name.localeCompare(b.product_name)
    ));
    // If in edit mode and this product was originally selected, add its ID to removedProductIds
    if (isEditMode && originalSelectedProductIds.has(product.id)) {
      setRemovedProductIds(prev => [...prev, product.id]);
    }
  }, [isEditMode, originalSelectedProductIds]);

  // Filter products based on search term
  const filteredAvailableProducts = searchTerm
    ? availableProducts.filter(product =>
        product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.product_code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : availableProducts;

  // Handle offer image file upload
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setOfferImageFile(null);
      setOfferImagePreview(null);
      setOfferImageError(null);
      return;
    }

    setOfferImageError(null); // Clear previous error

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setOfferImageError('Please select a valid image file (JPG, PNG, WebP).');
      setOfferImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate file size (e.g., 5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setOfferImageError('Image size should be less than 5MB.');
      setOfferImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate aspect ratio (1:1)
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const width = img.width;
        const height = img.height;
        const ratio = width / height;

        // Allow a small tolerance, e.g., 5% deviation from 1:1
        if (ratio < 0.95 || ratio > 1.05) {
          setOfferImageError("Image should have a 1:1 aspect ratio (square image).");
          setOfferImageFile(null); // Invalidate file
        } else {
          setOfferImageError(null);
          setOfferImageFile(file); // Set file if valid
        }
      };
      img.onerror = () => {
        setOfferImageError("Failed to load image for preview.");
        setOfferImageFile(null);
        setOfferImagePreview(null);
      };
      setOfferImagePreview(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  // Remove uploaded image
  const handleRemoveImage = useCallback(() => {
    setOfferImageFile(null);
    setOfferImagePreview(null);
    setOfferImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear file input
    }
  }, []);

  // Validate all form dates before submission
  const validateDates = useCallback(() => {
    if (!startDate || !endDate) {
      setFormError("Please select both start and end dates.");
      return false;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day

    // For new offers, start date should be today or in the future
    if (!isEditMode && start < today) {
      setFormError("Start date cannot be in the past for a new offer.");
      return false;
    }

    // End date must be after start date
    if (end <= start) {
      setFormError("End date must be after start date.");
      return false;
    }
    return true;
  }, [startDate, endDate, isEditMode]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Perform all validations upfront
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
    if (!validateDates()) { // validateDates will set formError if needed
      return;
    }
    if (selectedProducts.length === 0) {
      setFormError("Please select at least one product for the offer.");
      return;
    }
    if (!offerImageFile && !offerImagePreview && !isEditMode) { // Offer image is required for new offers
        setFormError("Please upload an offer image.");
        return;
    }
    if (offerImageError) { // Don't submit if image has errors
        setFormError("Please correct the offer image issues before submitting.");
        return;
    }


    setIsSubmitting(true);
    setFormError(null); // Clear form errors before submission
    setOfferImageError(null); // Clear image-specific errors

    try {
      const formData = new FormData();
      formData.append('offer_name', offerName);
      formData.append('buy_count', buyCount);
      formData.append('get_count', getCount);
      formData.append('start_date', startDate);
      formData.append('end_date', endDate);

      // Append all product IDs for products to be *associated* with the offer.
      // API should handle difference between 'add' and 'delete' based on this complete list.
      // Or, if API expects separate 'add_product_ids' and 'delete_product_ids',
      // we need to construct those arrays based on 'originalSelectedProductIds' and 'selectedProducts'.
      // Based on original code's formData.append('add_product_ids', ...) and formData.append('delete_product_ids', ...),
      // we need to differentiate.
      
      const productsToAdd = selectedProducts.filter(p => !originalSelectedProductIds.has(p.id));
      productsToAdd.forEach(product => {
        formData.append('add_product_ids', product.id);
      });

      // Pass removed product IDs if in edit mode
      if (isEditMode && removedProductIds.length > 0) {
        removedProductIds.forEach(productId => {
          formData.append('delete_product_ids', productId);
        });
      }

      // Only append new offer image file if selected
      if (offerImageFile) {
        formData.append('offer_image', offerImageFile);
      }

      // Add ID for edit mode
      if (isEditMode && offerId) {
        formData.append('id', offerId); // Assuming API accepts ID in formData for update
      }

      await apiService.createOffer(formData); // Assuming this API function handles both create and update

      alert(`Offer "${offerName}" ${isEditMode ? 'updated' : 'created'} successfully!`);
      router.push('/admin/offers/list');
    } catch (err: any) {
      console.error('Error processing offer:', err);
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

  // Show loading state while fetching initial data
  if (isFetchingInitialData) {
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
              <div className="md:col-span-2"> {/* Span across two columns */}
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
                          e.stopPropagation(); // Prevent triggering file input again
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
                    min={!isEditMode ? getTodayDate() : undefined} // For new offers, cannot be in past
                    required
                    disabled={isSubmitting || isStartDateDisabled()}
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
                {isStartDateDisabled() && (
                  <p className="text-xs text-gray-500 mt-1">
                    Start date cannot be changed as it's today or in the past.
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
                    min={startDate || getTodayDate()} // End date cannot be before start date or today
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
                        setAvailableProducts([]); // Clear existing products to fetch new ones
                        setHasMoreProducts(true);
                        setIsDropdownOpen(true);
                      }}
                      onFocus={() => {
                        setIsDropdownOpen(true);
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
                         ${isSubmitting || !!formError || !!offerImageError || (selectedProducts.length === 0) || (!isEditMode && !offerImageFile)
                           ? 'bg-gray-400 cursor-not-allowed opacity-80'
                           : 'bg-[var(--color-primary-950)] hover:bg-[color:var(--color-primary-950)]/90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary-950)]'
                         }`}
              disabled={isSubmitting || !!formError || !!offerImageError || (selectedProducts.length === 0) || (!isEditMode && !offerImageFile)}
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