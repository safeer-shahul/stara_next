// app/admin/products/add-product/page.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, ArrowLeft, Upload } from 'lucide-react';
import Link from 'next/link';

export default function AddProductPage() {
  const router = useRouter();
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<FileList | null>(null);
  const [sku, setSku] = useState('');
  const [weight, setWeight] = useState('');
  const [brand, setBrand] = useState('');
  const [status, setStatus] = useState('active');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Here you would normally save the product data to your backend
    // For now, we'll just simulate it with a success message
    alert(`Product "${productName}" created successfully!`);
    
    // Then redirect back to the products list page
    router.push('/admin/products/list');
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
                />
              </div>

              <div className="mb-4">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  id="category"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value="">Select a category</option>
                  <option value="electronics">Electronics</option>
                  <option value="smartphones">Smartphones</option>
                  <option value="laptops">Laptops</option>
                  <option value="clothing">Clothing</option>
                  <option value="mens-clothing">Men's Clothing</option>
                  <option value="womens-clothing">Women's Clothing</option>
                  <option value="home">Home & Kitchen</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    id="price"
                    min="0"
                    step="0.01"
                    className="w-full p-2 border border-gray-300 rounded"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    id="stockQuantity"
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
            </div>

            <div>
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  id="description"
                  rows={7}
                  className="w-full p-2 border border-gray-300 rounded"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Images
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input 
                    type="file" 
                    id="images" 
                    multiple 
                    accept="image/*" 
                    className="hidden"
                    onChange={(e) => setImages(e.target.files)}
                  />
                  <label htmlFor="images" className="cursor-pointer flex flex-col items-center justify-center">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm font-medium text-gray-700">Click to upload images</span>
                    <span className="text-xs text-gray-500 mt-1">or drag and drop</span>
                  </label>
                  {images && images.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      {images.length} file(s) selected
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t pt-4">
            <h4 className="font-medium mb-4">Additional Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                  SKU
                </label>
                <input
                  type="text"
                  id="sku"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  id="weight"
                  step="0.01"
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  id="brand"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Product Attributes</h4>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">
                  You can add custom attributes after creating the product.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t pt-6 flex justify-end space-x-3">
            <Link href="/admin/products/list">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}