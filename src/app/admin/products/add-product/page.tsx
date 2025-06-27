// app/admin/products/add-product/page.tsx
"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { Package, ArrowLeft, Upload, X, Info, CheckCircle, XCircle } from 'lucide-react'; // Added Info, CheckCircle, XCircle
import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react'; // Added useCallback
import apiService from '@/utils/api/apiService';
import Image from 'next/image';

// Define more specific interfaces for clarity and type safety
interface Category {
  id: string;
  category_name: string;
  sub_categories?: SubCategory[]; 
  category_image?: string | null; 
  slug?: string; 
}


interface SubCategory {
  id: string;
  sub_category_name: string;
}

interface ProductImage {
  id: string; // Assuming image has an ID when fetched
  product_image: string; // The URL path from the API
}

interface ProductData {
  product_name: string;
  product_price: number;
  quantity: number;
  product_weight: number;
  product_box_weight: number;
  product_description: string;
  product_status: boolean;
  sub_category: string; // This will be the ID of the subcategory
  strike_price: number;
  product_code: string;
  images: ProductImage[];
}

export default function ProductFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('id');
  const isEditMode = !!productId;

  const [isLoading, setIsLoading] = useState(false); // For form submission state
  const [isFetching, setIsFetching] = useState(isEditMode); // For initial data fetch state
  const [formError, setFormError] = useState<string | null>(null); // General form error
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [productWeight, setProductWeight] = useState(''); // Renamed for consistency
  const [productBoxWeight, setProductBoxWeight] = useState(''); // Renamed for consistency
  const [productDescription, setProductDescription] = useState('');
  const [productStatus, setProductStatus] = useState(true); // Default to active
  const [strikePrice, setStrikePrice] = useState('');
  const [productCode, setProductCode] = useState('');

  // Category selection states
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(''); // New state for subcategory dropdown

  // Multiple images
  const [newProductImages, setNewProductImages] = useState<File[]>([]); // Renamed for clarity
  const [imageErrors, setImageErrors] = useState<string | null>(null);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]); // Renamed for clarity

  // Existing images from the database (for edit mode)
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]); // Store original IDs for deletion

  // Fetch data on component mount
  const fetchData = useCallback(async () => {
    setIsFetching(true);
    setFormError(null);
    try {
      // Fetch categories first
      const allCategories = await apiService.getAllCategories();
      setCategories(allCategories);

      if (isEditMode && productId) {
        const productData: ProductData = await apiService.getProductByID(productId);

        // Populate form fields
        setProductName(productData.product_name || '');
        setProductPrice(productData.product_price?.toString() || '');
        setQuantity(productData.quantity?.toString() || '');
        setProductWeight(productData.product_weight?.toString() || '');
        setProductBoxWeight(productData.product_box_weight?.toString() || '');
        setProductDescription(productData.product_description || '');
        setProductStatus(productData.product_status ?? true); // Default to true if null/undefined
        setStrikePrice(productData.strike_price?.toString() || '');
        setProductCode(productData.product_code || '');

        // Handle existing images
        if (productData.images && productData.images.length > 0) {
          setExistingImages(productData.images);
        }

        // Find and set the selected category and subcategory based on productData.sub_category ID
        if (productData.sub_category) {
          for (const cat of allCategories) {
            const subCat = cat.sub_categories?.find(
              (sc: SubCategory) => sc.id === productData.sub_category
            );
            if (subCat) {
              setSelectedCategoryId(cat.id);
              setSelectedSubCategoryId(subCat.id); // Set the actual subcategory ID
              break;
            }
          }
        }
      }
    } catch (err) {
      console.error(`Error fetching ${isEditMode ? 'product data' : 'categories'}:`, err);
      setFormError(`Failed to load ${isEditMode ? 'product data' : 'categories'}. Please try again.`);
    } finally {
      setIsFetching(false);
    }
  }, [isEditMode, productId]); // Dependencies for useCallback

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Run fetchData on component mount or when dependencies change

  // Clean up new image previews when component unmounts
  useEffect(() => {
    return () => {
      newImagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [newImagePreviews]); // Only run when newImagePreviews changes

  // Update subcategory options when selected category changes
  const getSubCategoriesForSelectedCategory = useCallback(() => {
    const selectedCat = categories.find(cat => cat.id === selectedCategoryId);
    return selectedCat?.sub_categories || [];
  }, [categories, selectedCategoryId]);

  // Handle category change - reset subcategory if new category has none or different ones
  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = e.target.value;
    setSelectedCategoryId(categoryId);
    setSelectedSubCategoryId(''); // Reset subcategory when category changes
  }, []);

  // Handle image upload
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setImageErrors(null);

    const newUploadedFiles = Array.from(files);

    // Filter out invalid file types
    const invalidFiles = newUploadedFiles.filter(file =>
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
    );

    if (invalidFiles.length > 0) {
      setImageErrors('Only JPG, PNG, and WebP formats are allowed.');
      if (fileInputRef.current) fileInputRef.current.value = ''; // Clear input
      return;
    }

    // Add the new files to existing files in state
    setNewProductImages(prevFiles => [...prevFiles, ...newUploadedFiles]);

    // Create preview URLs
    const newFilePreviews = newUploadedFiles.map(file => URL.createObjectURL(file));
    setNewImagePreviews(prevPreviews => [...prevPreviews, ...newFilePreviews]);

    if (fileInputRef.current) fileInputRef.current.value = ''; // Clear input after selection
  }, []);

  // Remove a new image (not yet uploaded)
  const removeNewImage = useCallback((indexToRemove: number) => {
    setNewProductImages(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));

    // Revoke the object URL to prevent memory leaks
    URL.revokeObjectURL(newImagePreviews[indexToRemove]);

    setNewImagePreviews(prevPreviews => prevPreviews.filter((_, index) => index !== indexToRemove));
    setImageErrors(null); // Clear image error if user removes problematic image
  }, [newImagePreviews]);

  // Remove an existing image (in edit mode)
  const removeExistingImage = useCallback((imageId: string) => {
    setDeletedImageIds(prevIds => [...prevIds, imageId]); // Add to deleted images list
    setExistingImages(prevImages => prevImages.filter(img => img.id !== imageId)); // Remove from existing images list (visually)
    setImageErrors(null); // Clear image error if user removes problematic image
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Combined total images for validation
    const totalImagesCount = existingImages.length + newProductImages.length;

    // Form validation
    if (!productName.trim() || !productPrice.trim() || !quantity.trim() || !productDescription.trim() || !productCode.trim() || !productWeight.trim() || !productBoxWeight.trim()) {
      setFormError('All required fields must be filled.');
      return;
    }
    if (!selectedSubCategoryId) {
      setFormError('Please select a subcategory.');
      return;
    }
    if (totalImagesCount < 2) {
      setImageErrors('Please upload at least 2 product images.');
      return;
    }
    if (parseFloat(productPrice) <= 0 || (strikePrice && parseFloat(strikePrice) <= 0)) {
        setFormError('Price and Strike Price must be positive numbers.');
        return;
    }
    if (strikePrice && parseFloat(strikePrice) < parseFloat(productPrice)) {
        setFormError('Strike Price cannot be less than Product Price.');
        return;
    }


    setIsLoading(true); // For form submission
    setFormError(null);
    setImageErrors(null);

    try {
      const formData = new FormData();
      formData.append('product_name', productName);
      formData.append('product_price', productPrice);
      formData.append('quantity', quantity);
      formData.append('product_description', productDescription);
      formData.append('sub_category', selectedSubCategoryId); // Use the selected subcategory ID
      formData.append('product_status', productStatus.toString());
      formData.append('strike_price', strikePrice);
      formData.append('product_code', productCode);
      formData.append('product_weight', productWeight);
      formData.append('product_box_weight', productBoxWeight);

      if (isEditMode && productId) {
        formData.append('id', productId); // Pass original ID without replacing hyphens
        // Only include for_delete if there are images to delete
        if (deletedImageIds.length > 0) {
          formData.append('for_delete', JSON.stringify(deletedImageIds));
        }
      }

      newProductImages.forEach(image => {
        formData.append('product_images', image); // Append new images
      });

      await apiService.post('/products/add_product', formData, true); // Assuming this endpoint handles both add/edit

      alert(`Product "${productName}" ${isEditMode ? 'updated' : 'created'} successfully!`);
      router.push('/admin/products/list');
    } catch (err) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} product:`, err);
      setFormError(`Failed to ${isEditMode ? 'update' : 'create'} product. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  // Show loading state while fetching initial data
  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-xl shadow-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary-950)]"></div>
        <p className="mt-4 text-lg text-gray-600">Loading product details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products/list"
          className="text-gray-600 hover:text-[var(--color-primary-950)] transition-colors duration-200"
          aria-label="Back to Product List"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h2 className="text-3xl font-extrabold text-gray-800">
          {isEditMode ? 'Edit Product' : 'Add New Product'}
        </h2>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center mb-8 pb-4 border-b border-gray-200">
          <div className="bg-blue-50 p-4 rounded-full mr-5">
            <Package className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Product Information</h3>
            <p className="text-gray-600 text-sm">
              {isEditMode ? 'Update existing product details and images.' : 'Fill in the details to create a new product listing.'}
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

        <form onSubmit={handleSubmit} className="space-y-8"> {/* Increased vertical spacing for form sections */}
          {/* Section: General Information */}
          <div>
            <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <Info className="w-5 h-5 mr-2 text-blue-500" /> General Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label htmlFor="productCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Product Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="productCode"
                  className="w-full p-3 border border-gray-300 rounded-md text-gray-800
                             focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent
                             transition-all duration-200"
                  value={productCode}
                  onChange={(e) => setProductCode(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="e.g., SKU12345"
                />
              </div>
              <div>
                <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="productName"
                  className="w-full p-3 border border-gray-300 rounded-md text-gray-800
                             focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent
                             transition-all duration-200"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="e.g., Classic Leather Wallet"
                />
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  className="w-full p-3 border border-gray-300 rounded-md text-gray-800 appearance-none cursor-pointer
                             focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent
                             transition-all duration-200 bg-white"
                  value={selectedCategoryId}
                  onChange={handleCategoryChange}
                  required
                  disabled={isLoading}
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.category_name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Subcategory dropdown - Only show if a category is selected and has subcategories */}
              {selectedCategoryId && getSubCategoriesForSelectedCategory().length > 0 && (
                <div>
                  <label htmlFor="subCategory" className="block text-sm font-medium text-gray-700 mb-2">
                    Subcategory <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="subCategory"
                    className="w-full p-3 border border-gray-300 rounded-md text-gray-800 appearance-none cursor-pointer
                               focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent
                               transition-all duration-200 bg-white"
                    value={selectedSubCategoryId}
                    onChange={(e) => setSelectedSubCategoryId(e.target.value)}
                    required
                    disabled={isLoading}
                  >
                    <option value="">Select a subcategory</option>
                    {getSubCategoriesForSelectedCategory().map((subCat) => (
                      <option key={subCat.id} value={subCat.id}>
                        {subCat.sub_category_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label htmlFor="productStatus" className="block text-sm font-medium text-gray-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="productStatus"
                  className="w-full p-3 border border-gray-300 rounded-md text-gray-800 appearance-none cursor-pointer
                             focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent
                             transition-all duration-200 bg-white"
                  value={productStatus ? "active" : "inactive"}
                  onChange={(e) => setProductStatus(e.target.value === "active")}
                  disabled={isLoading}
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Pricing & Inventory */}
          <div>
            <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center mt-6 border-t pt-6">
              <Info className="w-5 h-5 mr-2 text-green-500" /> Pricing & Inventory
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="productPrice" className="block text-sm font-medium text-gray-700 mb-2">
                  Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="productPrice"
                  min="0"
                  step="0.01"
                  className="w-full p-3 border border-gray-300 rounded-md text-gray-800
                             focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent
                             transition-all duration-200"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="e.g., 99.99"
                />
              </div>
              <div>
                <label htmlFor="strikePrice" className="block text-sm font-medium text-gray-700 mb-2">
                  Strike Price (₹)
                </label>
                <input
                  type="number"
                  id="strikePrice"
                  min="0"
                  step="0.01"
                  className="w-full p-3 border border-gray-300 rounded-md text-gray-800
                             focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent
                             transition-all duration-200"
                  value={strikePrice}
                  onChange={(e) => setStrikePrice(e.target.value)}
                  disabled={isLoading}
                  placeholder="Optional, e.g., 129.99"
                />
              </div>
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="quantity"
                  min="0"
                  className="w-full p-3 border border-gray-300 rounded-md text-gray-800
                             focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent
                             transition-all duration-200"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="e.g., 100"
                />
              </div>
              <div>
                <label htmlFor="productWeight" className="block text-sm font-medium text-gray-700 mb-2">
                  Product Weight (kg/g) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="productWeight"
                  min="0"
                  step="0.01"
                  className="w-full p-3 border border-gray-300 rounded-md text-gray-800
                             focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent
                             transition-all duration-200"
                  value={productWeight}
                  onChange={(e) => setProductWeight(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="e.g., 0.5 (for 500g)"
                />
              </div>
              <div>
                <label htmlFor="productBoxWeight" className="block text-sm font-medium text-gray-700 mb-2">
                  Product Box Weight (kg/g) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="productBoxWeight"
                  min="0"
                  step="0.01"
                  className="w-full p-3 border border-gray-300 rounded-md text-gray-800
                             focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent
                             transition-all duration-200"
                  value={productBoxWeight}
                  onChange={(e) => setProductBoxWeight(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="e.g., 0.1 (for 100g packaging)"
                />
              </div>
            </div>
          </div>

          {/* Section: Description */}
          <div>
            <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center mt-6 border-t pt-6">
              <Info className="w-5 h-5 mr-2 text-purple-500" /> Description
            </h4>
            <label htmlFor="productDescription" className="sr-only">Description</label> {/*sr-only for accessibility*/}
            <textarea
              id="productDescription"
              rows={8}
              className="w-full p-3 border border-gray-300 rounded-md text-gray-800
                         focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent
                         transition-all duration-200"
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Enter a detailed product description here, including features, benefits, and specifications."
            />
          </div>

          {/* Section: Product Images */}
          <div>
            <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center mt-6 border-t pt-6">
              <Info className="w-5 h-5 mr-2 text-orange-500" /> Product Images <span className="text-red-500 ml-2">*</span>
              <span className="text-gray-500 font-normal text-sm ml-2">(Minimum 2 required, JPG, PNG, WebP)</span>
            </h4>

            {imageErrors && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border-l-4 border-red-500 flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="font-medium">{imageErrors}</p>
              </div>
            )}

            {/* Existing images in edit mode */}
            {isEditMode && existingImages.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Current Images:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {existingImages.map((image) => (
                    <div key={image.id} className="relative h-32 w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm group bg-gray-100 flex items-center justify-center">
                      <Image
                        src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${image.product_image}`}
                        alt={`Existing product image ${image.id}`}
                        width={128} // Corresponds to h-32/w-32 if square
                        height={128}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(image.id)}
                        className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md opacity-80 hover:opacity-100 transition-opacity duration-200
                                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-400"
                        title="Remove existing image"
                        disabled={isLoading}
                      >
                        <X className="w-5 h-5 text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New images preview */}
            {newImagePreviews.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  {isEditMode ? 'New Images to Upload:' : 'Selected Images:'}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {newImagePreviews.map((preview, index) => (
                    <div key={index} className="relative h-32 w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm group bg-gray-100 flex items-center justify-center">
                      <Image
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        width={128}
                        height={128}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md opacity-80 hover:opacity-100 transition-opacity duration-200
                                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-400"
                        title="Remove new image"
                        disabled={isLoading}
                      >
                        <X className="w-5 h-5 text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Image Upload Area */}
            <div
              onClick={triggerFileInput}
              className={`border-2 border-dashed ${imageErrors ? 'border-red-400' : 'border-gray-300'} rounded-xl p-8 text-center cursor-pointer transition-all duration-200
                          hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary-950)]`}
              tabIndex={0}
              role="button"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                disabled={isLoading}
              />
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" /> {/* Larger icon */}
              <p className="text-lg font-medium text-[var(--color-primary-950)]">Drag & drop or click to upload</p>
              <p className="text-sm text-gray-500 mt-1">Upload multiple images (JPG, PNG, WebP) for your product.</p>
            </div>
            <div className="mt-4 flex items-center gap-3 text-gray-600">
              <Info className="w-5 h-5 text-gray-400" />
              <p className="text-sm">
                Total images: <span className="font-semibold">{existingImages.length + newProductImages.length}</span> (Existing: {existingImages.length}, New: {newProductImages.length})
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end pt-8 border-t border-gray-200 mt-8 space-x-4">
            <Link href="/admin/products/list" passHref>
              <button
                type="button"
                className="px-6 py-3 border border-gray-300 rounded-md text-gray-700
                           hover:bg-gray-100 transition-colors duration-200
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
                disabled={isLoading}
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              className={`px-6 py-3 rounded-md text-white shadow-md transition-all duration-200
                         flex items-center justify-center gap-2
                         ${isLoading || formError || imageErrors || (existingImages.length + newProductImages.length < 2)
                           ? 'bg-gray-400 cursor-not-allowed opacity-80'
                           : 'bg-[var(--color-primary-950)] hover:bg-[color:var(--color-primary-950)]/90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary-950)]'
                         }`}
              disabled={isLoading || !!formError || !!imageErrors || (existingImages.length + newProductImages.length < 2)}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditMode ? 'Update Product' : 'Create Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}