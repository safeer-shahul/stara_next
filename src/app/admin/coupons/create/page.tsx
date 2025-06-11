'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Ticket, ArrowLeft, Search, X, Calendar, Percent, DollarSign, IndianRupee } from 'lucide-react';
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

function AddCouponPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const couponId = searchParams.get('id');
  const isEditMode = !!couponId;
  
  const [couponCode, setCouponCode] = useState('');
  const [couponName, setCouponName] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [quantity, setQuantity] = useState('');
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

  // Generate random coupon code
  const generateCouponCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setCouponCode(result);
  };

  // Fetch coupon data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchCouponData();
    } else {
      // Load initial products only for new coupons
      loadProducts(1);
    }
  }, [couponId]);

  // Fetch coupon data for editing
  const fetchCouponData = async () => {
    if (!couponId) return;
    
    setIsLoading(true);
    try {
      const couponData = await apiService.couponByID(couponId);
      setCouponCode(couponData.coupon_code || '');
      setCouponName(couponData.coupon_name);
      setDiscountType(couponData.discount_type);
      setDiscountValue(couponData.discount_value.toString());
      setQuantity(couponData.quantity.toString());
      
      // Set dates if they exist
      if (couponData.start_date) {
        const startDateFormatted = new Date(couponData.start_date).toISOString().split('T')[0];
        setStartDate(startDateFormatted);
      }
      if (couponData.end_date) {
        const endDateFormatted = new Date(couponData.end_date).toISOString().split('T')[0];
        setEndDate(endDateFormatted);
      }
      
      // Set selected products from the fetched coupon
      let selectedProductsFromCoupon = [];
      if (couponData.products && Array.isArray(couponData.products)) {
        selectedProductsFromCoupon = couponData.products;
        setSelectedProducts(selectedProductsFromCoupon);
        setOriginalSelectedProducts([...selectedProductsFromCoupon]); // Store original products
      }
      
      // Load products after setting selected products
      await loadProducts(1, selectedProductsFromCoupon);
      
    } catch (err) {
      console.error('Error fetching coupon data:', err);
      setError('Failed to load coupon data. Please try again.');
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

    // For new coupons, start date should be today or in the future
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

  // Validate discount value
  const validateDiscountValue = () => {
    const value = parseFloat(discountValue);
    
    if (value <= 0) {
      setError("Discount value must be greater than 0");
      return false;
    }

    if (discountType === 'percentage' && value > 100) {
      setError("Percentage discount cannot exceed 100%");
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

    if (!couponName || !discountValue || !quantity) {
      setError("Please fill in all required fields");
      return;
    }

    if (parseInt(quantity) <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }

    // Validate dates
    if (!validateDates()) {
      return;
    }

    // Validate discount value
    if (!validateDiscountValue()) {
      return;
    }
  
    setIsSubmitting(true);
    setError(null);
  
    try {
      const formData = new FormData();
      formData.append('coupon_name', couponName);
      if (couponCode) {
        formData.append('coupon_code', couponCode);
      }
      formData.append('discount_type', discountType);
      formData.append('discount_value', discountValue);
      formData.append('quantity', quantity);
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
      
      // Add ID for edit mode
      if (isEditMode) {
        formData.append('id', couponId.replace(/-/g, ''));
      }
  
      await apiService.createCoupon(formData);
      alert(`Coupon "${couponName}" ${isEditMode ? 'updated' : 'created'} successfully!`);
      router.push('/admin/coupons/list');
    } catch (err) {
      console.error('Error processing coupon:', err);
      setError(`Failed to ${isEditMode ? 'update' : 'create'} coupon. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };
  

  const pageTitle = isEditMode ? 'Edit Coupon' : 'Add New Coupon';
  const submitButtonText = isEditMode ? (isSubmitting ? 'Updating...' : 'Update Coupon') : (isSubmitting ? 'Creating...' : 'Create Coupon');

  if (isLoading && isEditMode) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading coupon data...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Link href="/admin/coupons/list" className="text-blue-600 hover:text-blue-800">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-2xl font-bold">{pageTitle}</h2>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-6">
          <div className="bg-purple-100 p-3 rounded-full mr-4">
            <Ticket className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium">Coupon Details</h3>
            <p className="text-gray-500">
              {isEditMode ? 'Update existing coupon' : 'Create a new discount coupon for customers'}
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
                <label htmlFor="couponName" className="block text-sm font-medium text-gray-700 mb-1">
                  Coupon Name *
                </label>
                <input
                  type="text"
                  id="couponName"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={couponName}
                  onChange={(e) => setCouponName(e.target.value)}
                  placeholder="e.g. Summer Sale 20% Off"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="mb-4">
                <label htmlFor="couponCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Coupon Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="couponCode"
                    className="flex-1 p-2 border border-gray-300 rounded font-mono uppercase"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="SUMMER20"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={generateCouponCode}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                    disabled={isSubmitting}
                  >
                    Generate
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Leave empty for system generated code</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center p-3 border rounded cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="discountType"
                      value="percentage"
                      checked={discountType === 'percentage'}
                      onChange={(e) => setDiscountType(e.target.value)}
                      className="mr-2"
                      disabled={isSubmitting}
                    />
                    <Percent className="w-4 h-4 mr-2 text-green-600" />
                    <span>Percentage</span>
                  </label>
                  <label className="flex items-center p-3 border rounded cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="discountType"
                      value="amount"
                      checked={discountType === 'amount'}
                      onChange={(e) => setDiscountType(e.target.value)}
                      className="mr-2"
                      disabled={isSubmitting}
                    />
                    <IndianRupee className="w-4 h-4 mr-2 text-green-600" />
                    <span>Fixed Amount</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="discountValue" className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Value *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="discountValue"
                      className="w-full p-2 border border-gray-300 rounded pr-8"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder={discountType === 'percentage' ? '20' : '100'}
                      min="0"
                      max={discountType === 'percentage' ? '100' : undefined}
                      step={discountType === 'percentage' ? '1' : '0.01'}
                      required
                      disabled={isSubmitting}
                    />
                    <span className="absolute right-2 top-2 text-gray-500">
                      {discountType === 'percentage' ? '%' : '₹'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    className="w-full p-2 border border-gray-300 rounded"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="100"
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
            
            {/* Right side - Selected products and summary */}
            <div className="w-full lg:w-1/2">
              <div className="border border-gray-200 rounded p-4 h-full">
                <div className="text-sm font-medium text-gray-700 mb-3">
                  Selected Products ({selectedProducts.length})
                </div>
                
                {couponName && discountValue && (
                  <div className="bg-purple-50 border border-purple-200 rounded p-3 mb-3">
                    <div className="text-sm font-medium text-purple-800">
                      {couponName}
                    </div>
                    <div className="text-sm text-purple-600">
                      {discountType === 'percentage' ? `${discountValue}% Off` : `₹${discountValue} Off`}
                    </div>
                    {couponCode && (
                      <div className="text-xs text-purple-600 font-mono bg-purple-100 px-2 py-1 rounded mt-1 inline-block">
                        {couponCode}
                      </div>
                    )}
                    {startDate && endDate && (
                      <div className="text-xs text-purple-600 mt-1">
                        Valid from {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
                      </div>
                    )}
                    {quantity && (
                      <div className="text-xs text-purple-600 mt-1">
                        Quantity: {quantity} coupons available
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
              onClick={() => router.push('/admin/coupons/list')}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded ${
                isSubmitting 
                  ? 'bg-purple-400 cursor-not-allowed' 
                  : 'bg-purple-600 hover:bg-purple-700'
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

export default AddCouponPage;