"use client";

import { useRouter } from 'next/navigation';
import { Package, ArrowLeft, Upload, X } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import apiService from '@/utils/api/apiService';
import Image from 'next/image';
export default function AddProductPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form fields - only what's required in the payload
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productStatus, setProductStatus] = useState(true);
  const [subCategory, setSubCategory] = useState('');
  
  // Multiple images
  const [productImages, setProductImages] = useState<File[]>([]);
  const [imageErrors, setImageErrors] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  // Category selection (not sent to backend)
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  
  // Categories data
  const [categories, setCategories] = useState<any[]>([]);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const allCategories = await apiService.getAllCategories();
        setCategories(allCategories);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories. Please refresh the page.');
      }
    };

    fetchCategories();
  }, []);

  // Update subcategory when category changes
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = e.target.value;
    setSelectedCategoryId(categoryId);
    
    // Find the selected category and update subcategory automatically
    const category = categories.find(cat => cat.id === categoryId);
    if (category && category.sub_categories && category.sub_categories.length > 0) {
      // Automatically set the first subcategory
      setSubCategory(category.sub_categories[0].id);
    } else {
      setSubCategory('');
    }
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    setImageErrors(null);
    
    // Validate files
    const newFiles = Array.from(files);
    
    // Check file types
    const invalidFiles = newFiles.filter(file => 
      !file.type.match('image/jpeg') && 
      !file.type.match('image/png') && 
      !file.type.match('image/webp')
    );
    
    if (invalidFiles.length > 0) {
      setImageErrors('Only JPG, PNG, and WebP formats are allowed');
      return;
    }
    
    // Add the new files to existing files
    const updatedFiles = [...productImages, ...newFiles];
    setProductImages(updatedFiles);
    
    // Create preview URLs
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };
  
  // Remove an image
  const removeImage = (index: number) => {
    // Update files array
    const updatedFiles = [...productImages];
    updatedFiles.splice(index, 1);
    setProductImages(updatedFiles);
    
    // Revoke the object URL to prevent memory leaks
    URL.revokeObjectURL(imagePreviews[index]);
    
    // Update previews array
    const updatedPreviews = [...imagePreviews];
    updatedPreviews.splice(index, 1);
    setImagePreviews(updatedPreviews);
    
    setImageErrors(null);
  };

  // Clean up previews when component unmounts
  useEffect(() => {
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subCategory) {
      setError('Please select a category with subcategories');
      return;
    }
    
    // Validate minimum images requirement
    if (productImages.length < 2) {
      setImageErrors('Please upload at least 2 product images');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setImageErrors(null);
    
    try {
      // Create FormData for API request
      const formData = new FormData();
      formData.append('product_name', productName);
      formData.append('product_price', productPrice);
      formData.append('quantity', quantity);
      formData.append('product_description', productDescription);
      formData.append('sub_category', subCategory);
      formData.append('product_status', productStatus.toString());
      
      // Append all product images with the same key
      productImages.forEach(image => {
        formData.append('product_images', image);
      });
      
      // Call API to create product
      await apiService.post('/products/add_product', formData, 0, true);
      
      alert(`Product "${productName}" created successfully!`);
      router.push('/admin/products/list');
    } catch (err) {
      console.error('Error creating product:', err);
      setError('Failed to create product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Link href="/admin/products/list" className="text-blue-600 hover:text-blue-800">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-2xl font-bold">Add New Product</h2>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-6">
          <div className="bg-blue-100 p-3 rounded-full mr-4">
            <Package className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium">Product Details</h3>
            <p className="text-gray-500">Create a new product listing</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  id="productName"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="mb-4">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  id="category"
                  className="w-full p-2 border border-gray-300 rounded"
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
                {selectedCategoryId && (
                  <p className="text-sm text-gray-600 mt-1">
                    Selected subcategory: {
                      categories.find(cat => cat.id === selectedCategoryId)?.sub_categories?.[0]?.sub_category_name || 'None available'
                    }
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label htmlFor="productPrice" className="block text-sm font-medium text-gray-700 mb-1">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    id="productPrice"
                    min="0"
                    step="0.01"
                    className="w-full p-2 border border-gray-300 rounded"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="productStatus" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="productStatus"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={productStatus ? "active" : "inactive"}
                  onChange={(e) => setProductStatus(e.target.value === "active")}
                  disabled={isLoading}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <div className="mb-4">
                <label htmlFor="productDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  id="productDescription"
                  rows={8}
                  className="w-full p-2 border border-gray-300 rounded"
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="Enter detailed product description here..."
                />
              </div>
            </div>
          </div>

          {/* Product Images Section */}
          <div className="mt-6 border-t pt-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Images * <span className="text-gray-500">(Minimum 2 required)</span>
              </label>
              
              {imageErrors && (
                <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">
                  {imageErrors}
                </div>
              )}
              
              <div className="flex flex-wrap gap-4 mb-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative h-32 w-32 border rounded overflow-hidden group">
                 <Image 
                    src={preview} 
                    alt={`Preview ${index + 1}`} 
                    className="h-full w-full object-cover" 
                    width={128}
                    height={128}
                  />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-white rounded-full p-1 shadow opacity-80 hover:opacity-100"
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isLoading}
                />
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">Click to upload product images</p>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG, WebP formats accepted</p>
              </div>
              
              <div className="mt-2 flex items-center">
                <div className="text-sm text-gray-500">
                  {productImages.length} {productImages.length === 1 ? 'image' : 'images'} selected
                </div>
                {productImages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setProductImages([]);
                      setImagePreviews([]);
                    }}
                    className="ml-3 text-sm text-red-600 hover:text-red-800"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 border-t pt-6 flex justify-end space-x-3">
            <Link href="/admin/products/list">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                disabled={isLoading}
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              className={`px-4 py-2 rounded ${
                isLoading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}