// app/admin/hero/create-hero/page.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Image as ImageIcon, ArrowLeft, Upload } from 'lucide-react';
import Link from 'next/link';
import apiService from '@/utils/api/apiService';
import Image from 'next/image';

export default function CreateHeroBannerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bannerId = searchParams.get('id');
  
  // Form state
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Big image state
  const [bigImageFile, setBigImageFile] = useState<File | null>(null);
  const [bigImagePreview, setBigImagePreview] = useState<string | null>(null);
  const bigFileInputRef = useRef<HTMLInputElement>(null);
  
  // Small image state
  const [smallImageFile, setSmallImageFile] = useState<File | null>(null);
  const [smallImagePreview, setSmallImagePreview] = useState<string | null>(null);
  const smallFileInputRef = useRef<HTMLInputElement>(null);

  // Check if we're in edit mode
  const isEditMode = bannerId !== null;

  useEffect(() => {
    // If we have a banner ID, fetch the banner data for editing
    if (bannerId) {
      fetchBannerDetails();
    }
  }, [bannerId]);

  const fetchBannerDetails = async () => {
    try {
      const bannerData = await apiService.getHeroBannerById(bannerId);
      
      // Set form data
      setUrl(bannerData.url || '');
      setStatus(bannerData.status);
      
      // Set image previews if images exist
      if (bannerData.big_image) {
        setBigImagePreview(`${process.env.NEXT_PUBLIC_API_BASE_URL}${bannerData.big_image}`);
      }
      
      if (bannerData.small_image) {
        setSmallImagePreview(`${process.env.NEXT_PUBLIC_API_BASE_URL}${bannerData.small_image}`);
      }
    } catch (err) {
      console.error('Error fetching banner details:', err);
      setError('Failed to load banner details. Please try again.');
    }
  };

  const handleBigImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create a preview
    const reader = new FileReader();
    reader.onload = () => {
      setBigImagePreview(reader.result as string);
      setBigImageFile(file);
      setError(null); // Clear any existing errors
    };
    reader.readAsDataURL(file);
  };

  const handleSmallImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create a preview
    const reader = new FileReader();
    reader.onload = () => {
      setSmallImagePreview(reader.result as string);
      setSmallImageFile(file);
      setError(null); // Clear any existing errors
    };
    reader.readAsDataURL(file);
  };


const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form inputs
    if (!isEditMode && (!bigImageFile || !smallImageFile)) {
      setError("Please upload both big and small hero images");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Create FormData object for file uploads
      const formData = new FormData();
      
      // Add form fields to FormData
      if (url) formData.append('url', url);
      formData.append('status', status.toString());
      
      // Add ID if in edit mode
      if (isEditMode) {
        formData.append('id', bannerId || '');
      }
      
      if (bigImageFile) {
        formData.append('big_image', bigImageFile);
      }
      
      if (smallImageFile) {
        formData.append('small_image', smallImageFile);
      }
      
      // Use the same API function for both create and edit
      await apiService.createHeroBanner(formData);
      
      // Show appropriate success message
      alert(isEditMode ? 'Hero banner updated successfully!' : 'Hero banner created successfully!');
      router.push('/admin/hero/list');
    } catch (err) {
      console.error('Error saving hero banner:', err);
      setError('Failed to save hero banner. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Link href="/admin/hero/list" className="text-blue-600 hover:text-blue-800">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-2xl font-bold">
          {isEditMode ? 'Edit Hero Banner' : 'Add New Hero Banner'}
        </h2>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-6">
          <div className="bg-blue-100 p-3 rounded-full mr-4">
            <ImageIcon className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium">Banner Details</h3>
            <p className="text-gray-500">
              {isEditMode ? 'Update existing hero banner' : 'Create a new hero banner'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Big Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Big Image *
            </label>
            
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50"
              onClick={() => bigFileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={bigFileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleBigImageChange}
                disabled={isSubmitting}
              />
              
              {bigImagePreview ? (
                <div className="flex flex-col items-center">
                <div className="w-full max-w-md h-48 mb-3 overflow-hidden">
                  <Image 
                    src={bigImagePreview} 
                    alt="Big hero image preview" 
                    width={500}
                    height={300}
                    className="w-full h-full object-contain"
                  />
                </div>
                <button 
                  type="button"
                  className="text-blue-600 cursor-pointer hover:text-blue-800"
                  onClick={(e) => {
                    e.stopPropagation();
                    setBigImagePreview(null);
                    setBigImageFile(null);
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
                    <span className="text-sm text-blue-600">Upload big hero image</span>
                  </div>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              This image will be displayed on larger screens.
            </p>
          </div>

          {/* Small Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Small Image *
            </label>
            
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50"
              onClick={() => smallFileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={smallFileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleSmallImageChange}
                disabled={isSubmitting}
              />
              
              {smallImagePreview ? (
                <div className="flex flex-col items-center">
                    <div className="w-full max-w-md h-48 mb-3 overflow-hidden">
                    <Image 
                        src={smallImagePreview} 
                        alt="Small hero image preview" 
                        width={500}
                        height={300}
                        className="w-full h-full object-contain"
                    />
                    </div>
                    <button 
                    type="button"
                    className="text-blue-600 cursor-pointer hover:text-blue-800"
                    onClick={(e) => {
                        e.stopPropagation();
                        setSmallImagePreview(null);
                        setSmallImageFile(null);
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
                    <span className="text-sm text-blue-600">Upload small hero image</span>
                  </div>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              This image will be displayed on mobile devices and smaller screens.
            </p>
          </div>

          {/* URL Field */}
          <div className="mb-6">
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
              URL (Optional)
            </label>
            <input
              type="text"
              id="url"
              className="w-full p-2 border border-gray-300 rounded"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isSubmitting}
              placeholder="e.g., /products/featured"
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter the URL where users will be directed when they click on this banner.
            </p>
          </div>

          {/* Status Toggle */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <div className="flex items-center">
              <label className="inline-flex cursor-pointer items-center mr-6">
                <input
                  type="radio"
                  className="form-radio h-4 w-4 text-blue-600"
                  checked={status === true}
                  onChange={() => setStatus(true)}
                  disabled={isSubmitting}
                />
                <span className="ml-2">Active</span>
              </label>
              <label className="inline-flex cursor-pointer items-center">
                <input
                  type="radio"
                  className="form-radio h-4 w-4 text-blue-600"
                  checked={status === false}
                  onChange={() => setStatus(false)}
                  disabled={isSubmitting}
                />
                <span className="ml-2">Inactive</span>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end mt-6 space-x-3">
            <button
              type="button"
              className="px-4 py-2 border cursor-pointer border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              onClick={() => router.push('/admin/hero/list')}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded ${
                isSubmitting 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 cursor-pointer hover:bg-blue-700'
              } text-white`}
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? (isEditMode ? 'Updating...' : 'Creating...') 
                : (isEditMode ? 'Update Banner' : 'Create Banner')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}