'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Ticket, ArrowLeft, Search, X, Calendar, Percent, IndianRupee, Info, Loader2, XCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import apiService from '@/utils/api/apiService';

// Define specific interfaces for better type safety
interface Product {
  id: string;
  product_name: string;
  product_code: string;
  product_price: string; // Keeping as string from original, convert to number if needed
  images: {
    id?: string;
    product_image: string;
    product?: string;
  }[];
}

interface CouponData {
    id: string;
    coupon_code: string;
    coupon_name: string;
    discount_type: 'percentage' | 'fixed_amount'; // Ensure this matches API
    discount_value: number;
    start_date: string; // ISO string format
    end_date: string;   // ISO string format
    products: Product[]; // Associated products
}

function AddCouponPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const couponId = searchParams.get('id');
  const isEditMode = !!couponId;

  // Form states
  const [couponCode, setCouponCode] = useState('');
  const [couponName, setCouponName] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed_amount'>('percentage'); // Explicit type
  const [discountValue, setDiscountValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // For form submission
  const [formError, setFormError] = useState<string | null>(null); // General form errors

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

  // Generate random coupon code
  const generateCouponCode = useCallback(() => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setCouponCode(result);
  }, []);

  // Fetch coupon data if in edit mode (memoized)
  const fetchCouponData = useCallback(async () => {
    if (!couponId) return;

    setIsFetchingInitialData(true);
    setFormError(null);
    try {
      const couponData: CouponData = await apiService.couponByID(couponId); // Assuming API handles ID directly

      setCouponCode(couponData.coupon_code || '');
      setCouponName(couponData.coupon_name || '');
      setDiscountType(couponData.discount_type || 'percentage');
      setDiscountValue(couponData.discount_value?.toString() || '');
      setStartDate(couponData.start_date ? new Date(couponData.start_date).toISOString().split('T')[0] : '');
      setEndDate(couponData.end_date ? new Date(couponData.end_date).toISOString().split('T')[0] : '');

      // Set selected products from the fetched coupon
      if (couponData.products && Array.isArray(couponData.products)) {
        const productsFromCoupon = couponData.products.map(p => ({
            id: p.id, product_name: p.product_name, product_code: p.product_code, product_price: p.product_price, images: p.images || []
        }));
        setSelectedProducts(productsFromCoupon);
        setOriginalSelectedProductIds(new Set(productsFromCoupon.map(p => p.id))); // Store original IDs
      } else {
          setSelectedProducts([]);
          setOriginalSelectedProductIds(new Set());
      }

    } catch (err) {
      console.error('Error fetching coupon data:', err);
      setFormError('Failed to load coupon data. Please try again.');
    } finally {
      setIsFetchingInitialData(false);
    }
  }, [couponId]); // Depend on couponId

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

  // Effect to fetch initial coupon data (edit mode) AND then initial products
  useEffect(() => {
    if (isEditMode) {
      fetchCouponData();
    }
    if (!isFetchingInitialData) {
      loadProducts(1, searchTerm);
    }
  }, [isEditMode, fetchCouponData, isFetchingInitialData, searchTerm, loadProducts]);


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

    // For new coupons, start date should be today or in the future
    if (!isEditMode && start < today) {
      setFormError("Start date cannot be in the past for a new coupon.");
      return false;
    }

    // End date must be after start date
    if (end <= start) {
      setFormError("End date must be after start date.");
      return false;
    }
    return true;
  }, [startDate, endDate, isEditMode]);

  // Validate discount value
  const validateDiscountValue = useCallback(() => {
    const value = parseFloat(discountValue);

    if (isNaN(value) || value <= 0) {
      setFormError("Discount value must be a positive number.");
      return false;
    }

    if (discountType === 'percentage' && value > 100) {
      setFormError("Percentage discount cannot exceed 100%.");
      return false;
    }
    return true;
  }, [discountType, discountValue]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Perform all validations upfront
    if (!couponName.trim()) {
      setFormError("Coupon Name is required.");
      return;
    }
    if (!validateDiscountValue()) {
        return;
    }
    if (!validateDates()) {
      return;
    }
    if (selectedProducts.length === 0) {
      setFormError("Please select at least one product for the coupon.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null); // Clear form errors before submission

    try {
      const formData = new FormData();
      formData.append('coupon_name', couponName);
      if (couponCode.trim()) { // Only append if coupon code is not empty
        formData.append('coupon_code', couponCode);
      }
      formData.append('discount_type', discountType);
      formData.append('discount_value', discountValue);
      formData.append('start_date', startDate);
      formData.append('end_date', endDate);

      // Add product IDs for products to be associated (newly added or still selected)
      selectedProducts.forEach(product => {
        formData.append('add_product_ids', product.id); // Assuming backend adds if not exists
      });

      // Add product IDs for products to be removed (only in edit mode)
      if (isEditMode && removedProductIds.length > 0) {
        removedProductIds.forEach(productId => {
          formData.append('remove_product_ids', productId); // Ensure this matches API's expected key
        });
      }

      // Add ID for edit mode
      if (isEditMode && couponId) {
        formData.append('id', couponId); // Assuming API accepts ID directly
      }

      await apiService.createCoupon(formData); // Assuming this API function handles both create and update

      alert(`Coupon "${couponName}" ${isEditMode ? 'updated' : 'created'} successfully!`);
      router.push('/admin/coupons/list');
    } catch (err: any) {
      console.error('Error processing coupon:', err);
      let errorMessage = `Failed to ${isEditMode ? 'update' : 'create'} coupon. Please try again.`;
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


  const pageTitle = isEditMode ? 'Edit Coupon' : 'Add New Coupon';
  const submitButtonText = isSubmitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Coupon' : 'Create Coupon');

  // Show loading state while fetching initial data
  if (isFetchingInitialData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-xl shadow-lg">
        <Loader2 className="animate-spin h-12 w-12 text-[var(--color-primary-950)]" />
        <p className="mt-4 text-lg text-gray-600">Loading coupon data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/coupons/list"
          className="text-gray-600 hover:text-[var(--color-primary-950)] transition-colors duration-200"
          aria-label="Back to Coupons List"
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
          <div className="bg-purple-50 p-4 rounded-full mr-5">
            <Ticket className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Coupon Details</h3>
            <p className="text-gray-600 text-sm">
              {isEditMode ? 'Update existing discount coupon properties.' : 'Create a new discount coupon for your products.'}
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
          {/* Section: Basic Coupon Information */}
          <div>
            <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <Info className="w-5 h-5 mr-2 text-blue-500" /> Basic Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Coupon Name */}
              <div>
                <label htmlFor="couponName" className="block text-sm font-medium text-gray-700 mb-2">
                  Coupon Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="couponName"
                  className="w-full p-3 border border-gray-300 rounded-md text-gray-800
                             focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent
                             transition-all duration-200"
                  value={couponName}
                  onChange={(e) => setCouponName(e.target.value)}
                  placeholder="e.g., Summer Sale 20% Off"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Coupon Code */}
              <div>
                <label htmlFor="couponCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Coupon Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="couponCode"
                    className="flex-1 p-3 border border-gray-300 rounded-md font-mono uppercase text-gray-800
                               focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent
                               transition-all duration-200"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="AUTO-GENERATE"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={generateCouponCode}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium
                               transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
                    disabled={isSubmitting}
                  >
                    Generate
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Leave empty to auto-generate code upon creation, or enter a custom one.
                </p>
              </div>
            </div>
          </div>

          {/* Section: Discount Details & Dates */}
          <div>
            <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center mt-6 border-t pt-6">
              <Percent className="w-5 h-5 mr-2 text-green-500" /> Discount & Validity
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Discount Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50
                                  transition-colors duration-200 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[var(--color-primary-950)]">
                    <input
                      type="radio"
                      name="discountType"
                      value="percentage"
                      checked={discountType === 'percentage'}
                      onChange={(e) => setDiscountType(e.target.value as 'percentage')} // Cast type
                      className="form-radio h-5 w-5 text-blue-600 border-gray-300 focus:ring-[var(--color-primary-950)] mr-2"
                      disabled={isSubmitting}
                    />
                    <Percent className="w-5 h-5 mr-2 text-green-600" />
                    <span className="font-medium text-gray-800">Percentage</span>
                  </label>
                  <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50
                                  transition-colors duration-200 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[var(--color-primary-950)]">
                    <input
                      type="radio"
                      name="discountType"
                      value="fixed_amount" // Changed from 'amount' to 'fixed_amount' for clarity and common API pattern
                      checked={discountType === 'fixed_amount'}
                      onChange={(e) => setDiscountType(e.target.value as 'fixed_amount')} // Cast type
                      className="form-radio h-5 w-5 text-blue-600 border-gray-300 focus:ring-[var(--color-primary-950)] mr-2"
                      disabled={isSubmitting}
                    />
                    <IndianRupee className="w-5 h-5 mr-2 text-green-600" /> {/* Indian Rupee icon */}
                    <span className="font-medium text-gray-800">Fixed Amount</span>
                  </label>
                </div>
              </div>

              {/* Discount Value */}
              <div>
                <label htmlFor="discountValue" className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Value <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="discountValue"
                    className="w-full p-3 border border-gray-300 rounded-md pr-10 text-gray-800
                               focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent
                               transition-all duration-200"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'percentage' ? 'e.g., 20 (for 20%)' : 'e.g., 100 (for ₹100)'}
                    min="0"
                    max={discountType === 'percentage' ? '100' : undefined}
                    step={discountType === 'percentage' ? '1' : '0.01'}
                    required
                    disabled={isSubmitting}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {discountType === 'percentage' ? '%' : '₹'} {/* Updated symbol */}
                  </span>
                </div>
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
              <Ticket className="w-5 h-5 mr-2 text-purple-500" /> Applicable Products <span className="text-red-500 ml-2">*</span>
              <span className="text-gray-500 font-normal text-sm ml-2">(Select products this coupon applies to)</span>
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

              {/* Right side - Selected products and summary */}
              <div className="w-full lg:w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Selection ({selectedProducts.length})
                </label>
                <div className="border border-gray-200 rounded-lg p-4 h-80 min-h-[320px] overflow-y-auto bg-gray-50">
                  {couponName || discountValue || startDate || endDate ? (
                    <div className="bg-purple-50 border border-purple-200 rounded p-3 mb-3">
                      <div className="text-sm font-medium text-purple-800">
                        {couponName || 'Untitled Coupon'}
                      </div>
                      <div className="text-sm text-purple-600">
                        {discountValue ? (
                          discountType === 'percentage' ? `${discountValue}% Off` : `₹${parseFloat(discountValue).toFixed(2)} Off`
                        ) : 'No Discount Set'}
                      </div>
                      {couponCode && (
                        <div className="text-xs text-purple-600 font-mono bg-purple-100 px-2 py-1 rounded mt-1 inline-block">
                          {couponCode}
                        </div>
                      )}
                      {(startDate || endDate) && (
                        <div className="text-xs text-purple-600 mt-1">
                          Valid from {startDate ? new Date(startDate).toLocaleDateString() : 'N/A'} to {endDate ? new Date(endDate).toLocaleDateString() : 'N/A'}
                        </div>
                      )}
                    </div>
                  ) : null}

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
                      <p className="text-sm mt-1">Search and add products from the left to apply this coupon to them.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end pt-8 border-t border-gray-200 mt-8 space-x-4">
            <Link href="/admin/coupons/list" passHref>
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
                         ${isSubmitting || !!formError || (selectedProducts.length === 0) || !couponName.trim() || !discountValue.trim()
                           ? 'bg-gray-400 cursor-not-allowed opacity-80'
                           : 'bg-[var(--color-primary-950)] hover:bg-[color:var(--color-primary-950)]/90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary-950)]'
                         }`}
              disabled={isSubmitting || !!formError || (selectedProducts.length === 0) || !couponName.trim() || !discountValue.trim()}
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

export default AddCouponPage;