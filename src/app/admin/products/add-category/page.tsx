// app/admin/products/add-category/page.tsx
"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Folder, ArrowLeft, Upload, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import apiService from '@/utils/api/apiService';

export default function AddCategoryPage() {
  const router = useRouter();
  const [categoryName, setCategoryName] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create a preview
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      
      // Check image dimensions to ensure 1:1 ratio
      const img = new Image();
      img.onload = () => {
        const width = img.width;
        const height = img.height;
        const ratio = width / height;
        
        if (ratio < 0.9 || ratio > 1.1) {
          setError("Image should have a 1:1 aspect ratio (square image)");
        } else {
          setError(null);
          setImageFile(file);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageFile) {
      setError("Please upload a category image");
      return;
    }
    
    if (error) {
      return; 
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await apiService.createCategory(categoryName, imageFile);
      
      alert(`Category "${categoryName}" created successfully!`);
      router.push('/admin/products/categories');
    } catch (err) {
      console.error('Error creating category:', err);
      setError('Failed to create category. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Link href="/admin/products/categories" className="text-blue-600 hover:text-blue-800">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-2xl font-bold">Add New Category</h2>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-6">
          <div className="bg-blue-100 p-3 rounded-full mr-4">
            <Folder className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium">Category Details</h3>
            <p className="text-gray-500">Create a new product category</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
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
              Category Image *
            </label>
            
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50"
              onClick={triggerFileInput}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isSubmitting}
              />
              
              {imagePreview ? (
                <div className="flex flex-col items-center">
                  <div className="w-48 h-48 mb-3 overflow-hidden">
                    <img 
                      src={imagePreview} 
                      alt="Category preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button 
                    type="button"
                    className="text-blue-600 hover:text-blue-800"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImagePreview(null);
                      setImageFile(null);
                      setError(null);
                    }}
                  >
                    Change image
                  </button>
                </div>
              ) : (
                <div className="py-4">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-2 flex justify-center">
                    <Upload className="w-5 h-5 text-blue-600 mr-1" />
                    <span className="text-sm text-blue-600">Upload category image</span>
                  </div>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Please upload a square image (1:1 aspect ratio). Recommended size: 500x500 pixels.
            </p>
          </div>

          <div className="flex justify-end mt-6 space-x-3">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              onClick={() => router.push('/admin/products/categories')}
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
              {isSubmitting ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}