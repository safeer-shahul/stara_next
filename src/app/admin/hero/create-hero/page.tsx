// app/admin/hero/create-hero/page.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Image as ImageIcon, ArrowLeft, Upload, Info, Loader2, XCircle, Trash2 } from 'lucide-react';
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
      // console.error('Error fetching banner details:', err);
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
      // console.error('Error saving hero banner:', err);
      setError('Failed to save hero banner. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pageTitle = isEditMode ? 'Edit Hero Banner' : 'Add New Hero Banner';
  const submitButtonText = isEditMode ? 'Update Banner' : 'Create Banner';

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/hero/list"
          className="text-gray-600 hover:text-[var(--color-primary-950)] transition-colors duration-200"
          aria-label="Back to Hero Banners List"
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
          <div className="bg-blue-50 p-4 rounded-full mr-5">
            <ImageIcon className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Banner Details</h3>
            <p className="text-gray-600 text-sm">
              {isEditMode ? 'Update existing hero banner properties and images.' : 'Enter details and upload images for a new hero banner.'}
            </p>
          </div>
        </div>

        {/* Form-level Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md border-l-4 border-red-500 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section: Banner Images */}
          <div>
            <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <Info className="w-5 h-5 mr-2 text-orange-500" /> Banner Images <span className="text-red-500 ml-2">*</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Big Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Big Image (Desktop) <span className="text-red-500">*</span>
                </label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer transition-all duration-200 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary-950)]"
                  onClick={() => bigFileInputRef.current?.click()}
                  tabIndex={0}
                  role="button"
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
                      <div className="w-full max-w-sm h-36 mb-4 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
                        <Image
                          src={bigImagePreview}
                          alt="Big hero image preview"
                          width={400}
                          height={144}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <button
                        type="button"
                        className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBigImagePreview(null);
                          setBigImageFile(null);
                          if (bigFileInputRef.current) bigFileInputRef.current.value = '';
                        }}
                        disabled={isSubmitting}
                      >
                        <Trash2 className="w-5 h-5" /> Change Image
                      </button>
                    </div>
                  ) : (
                    <div className="py-6">
                      <Upload className="mx-auto h-16 w-16 text-gray-400 mb-3" />
                      <p className="text-lg font-medium text-[var(--color-primary-950)]">Upload Desktop Banner</p>
                      <p className="text-sm text-gray-500 mt-1">Drag & drop or click to browse</p>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  This image will be displayed on larger screens.
                </p>
              </div>

              {/* Small Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Small Image (Mobile) <span className="text-red-500">*</span>
                </label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer transition-all duration-200 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary-950)]"
                  onClick={() => smallFileInputRef.current?.click()}
                  tabIndex={0}
                  role="button"
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
                      <div className="w-full max-w-xs h-36 mb-4 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
                        <Image
                          src={smallImagePreview}
                          alt="Small hero image preview"
                          width={300}
                          height={144}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <button
                        type="button"
                        className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSmallImagePreview(null);
                          setSmallImageFile(null);
                          if (smallFileInputRef.current) smallFileInputRef.current.value = '';
                        }}
                        disabled={isSubmitting}
                      >
                        <Trash2 className="w-5 h-5" /> Change Image
                      </button>
                    </div>
                  ) : (
                    <div className="py-6">
                      <Upload className="mx-auto h-16 w-16 text-gray-400 mb-3" />
                      <p className="text-lg font-medium text-[var(--color-primary-950)]">Upload Mobile Banner</p>
                      <p className="text-sm text-gray-500 mt-1">Drag & drop or click to browse</p>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  This image will be displayed on mobile devices and smaller screens.
                </p>
              </div>
            </div>
          </div>

          {/* Section: Banner Properties */}
          <div>
            <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center mt-6 border-t pt-6">
              <Info className="w-5 h-5 mr-2 text-blue-500" /> Banner Properties
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* URL Field */}
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                  URL (Optional)
                </label>
                <input
                  type="text"
                  id="url"
                  className="w-full p-3 border border-gray-300 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent transition-all duration-200"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="e.g., /products/featured"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Enter the URL where users will be directed when they click on this banner.
                </p>
              </div>

              {/* Status Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-6">
                  <label className="inline-flex cursor-pointer items-center">
                    <input
                      type="radio"
                      className="form-radio h-5 w-5 text-blue-600 border-gray-300 focus:ring-[var(--color-primary-950)]"
                      checked={status === true}
                      onChange={() => setStatus(true)}
                      disabled={isSubmitting}
                      name="bannerStatus"
                    />
                    <span className="ml-2 text-gray-800 font-medium">Active</span>
                  </label>
                  <label className="inline-flex cursor-pointer items-center">
                    <input
                      type="radio"
                      className="form-radio h-5 w-5 text-blue-600 border-gray-300 focus:ring-[var(--color-primary-950)]"
                      checked={status === false}
                      onChange={() => setStatus(false)}
                      disabled={isSubmitting}
                      name="bannerStatus"
                    />
                    <span className="ml-2 text-gray-800 font-medium">Inactive</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end pt-8 border-t border-gray-200 mt-8 space-x-4">
            <button
              type="button"
              className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
              onClick={() => router.push('/admin/hero/list')}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 py-3 rounded-md text-white font-semibold shadow-md transition-all duration-200 flex items-center justify-center gap-2 ${
                isSubmitting 
                  ? 'bg-gray-400 cursor-not-allowed opacity-80' 
                  : 'bg-[var(--color-primary-950)] hover:bg-[color:var(--color-primary-950)]/90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary-950)]'
              }`}
              disabled={isSubmitting}
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