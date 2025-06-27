// app/admin/hero/create-hero/page.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from 'react'; // Added useCallback
import { useRouter, useSearchParams } from 'next/navigation';
// Import all necessary icons for consistent design
import { Image as ImageIcon, ArrowLeft, Upload, Info, Loader2, XCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import apiService from '@/utils/api/apiService';
import Image from 'next/image';

// Define more specific interfaces for clarity and type safety
interface HeroBannerData {
  id: string;
  url: string | null;
  status: boolean;
  big_image: string | null; // URL path
  small_image: string | null; // URL path
  // Add any other properties your API returns
}

export default function CreateHeroBannerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bannerId = searchParams.get('id');

  // Check if we're in edit mode
  const isEditMode = !!bannerId; // Use !! for proper boolean conversion

  // Form state
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState(true); // Default to active
  const [isSubmitting, setIsSubmitting] = useState(false); // For form submission
  const [formError, setFormError] = useState<string | null>(null); // General form error message
  const [isFetching, setIsFetching] = useState(isEditMode); // For initial data fetch in edit mode

  // Big image state
  const [bigImageFile, setBigImageFile] = useState<File | null>(null);
  const [bigImagePreview, setBigImagePreview] = useState<string | null>(null);
  const [bigImageError, setBigImageError] = useState<string | null>(null); // Specific error for big image
  const bigFileInputRef = useRef<HTMLInputElement>(null);

  // Small image state
  const [smallImageFile, setSmallImageFile] = useState<File | null>(null);
  const [smallImagePreview, setSmallImagePreview] = useState<string | null>(null);
  const [smallImageError, setSmallImageError] = useState<string | null>(null); // Specific error for small image
  const smallFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch banner data if in edit mode
  const fetchBannerDetails = useCallback(async () => {
    if (!bannerId) return; // Should not happen if isEditMode is true

    setIsFetching(true);
    setFormError(null); // Clear any previous errors on fetch start
    try {
      const bannerData: HeroBannerData = await apiService.getHeroBannerById(bannerId);

      // Set form data
      setUrl(bannerData.url || '');
      setStatus(bannerData.status);

      // Set image previews if images exist
      if (bannerData.big_image) {
        setBigImagePreview(`${process.env.NEXT_PUBLIC_API_BASE_URL}${bannerData.big_image}`);
        // No file object for existing images
      } else {
        setBigImagePreview(null);
      }

      if (bannerData.small_image) {
        setSmallImagePreview(`${process.env.NEXT_PUBLIC_API_BASE_URL}${bannerData.small_image}`);
        // No file object for existing images
      } else {
        setSmallImagePreview(null);
      }

    } catch (err) {
      console.error('Error fetching banner details:', err);
      setFormError('Failed to load banner details. Please try again.');
    } finally {
      setIsFetching(false);
    }
  }, [bannerId]); // Depend on bannerId

  useEffect(() => {
    if (isEditMode) {
      fetchBannerDetails();
    }
  }, [isEditMode, fetchBannerDetails]);

  // Cleanup object URLs when component unmounts or image files change
  useEffect(() => {
    return () => {
      if (bigImagePreview && bigImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(bigImagePreview);
      }
      if (smallImagePreview && smallImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(smallImagePreview);
      }
    };
  }, [bigImagePreview, smallImagePreview]); // Re-run cleanup if previews change

  const handleImageChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement>,
    setImageFile: React.Dispatch<React.SetStateAction<File | null>>,
    setImagePreview: React.Dispatch<React.SetStateAction<string | null>>,
    setImageError: React.Dispatch<React.SetStateAction<string | null>>,
    aspectRatioCheck?: { minRatio: number; maxRatio: number; message: string }
  ) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      setImageError(null);
      return;
    }

    setImageError(null); // Clear previous error
    setImageFile(file); // Set the file immediately

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);

      if (aspectRatioCheck) {
        const img = new window.Image();
        img.onload = () => {
          const width = img.width;
          const height = img.height;
          const ratio = width / height;

          if (ratio < aspectRatioCheck.minRatio || ratio > aspectRatioCheck.maxRatio) {
            setImageError(aspectRatioCheck.message);
            setImageFile(null); // Invalidate file if aspect ratio is wrong
          } else {
            setImageError(null);
          }
        };
        img.onerror = () => {
          setImageError("Failed to load image for preview.");
          setImageFile(null);
          setImagePreview(null);
        };
        img.src = result;
      }
    };
    reader.readAsDataURL(file);

    // Clear input value to allow re-selection of the same file
    if (e.target) {
        e.target.value = '';
    }
  }, []);

  const handleBigImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleImageChange(e, setBigImageFile, setBigImagePreview, setBigImageError, {
      minRatio: 1.8, // Example: for 1920x1080 (1.77) to 2.5:1 (ultrawide)
      maxRatio: 2.5,
      message: "Big image should have a wide aspect ratio (e.g., 2:1 or 16:9 to 21:9)."
    });
  }, [handleImageChange]);

  const handleSmallImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleImageChange(e, setSmallImageFile, setSmallImagePreview, setSmallImageError, {
      minRatio: 0.8, // Example: for square (1:1) to slightly wider/taller
      maxRatio: 1.2,
      message: "Small image should be close to a square aspect ratio (e.g., 1:1)."
    });
  }, [handleImageChange]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Form validation
    if (!url.trim() && !isEditMode) { // URL is optional if editing an existing banner
        // If not edit mode and URL is empty, decide if it's an error or just optional
        // For now, making it required in create mode
        // setFormError("URL is required for new banners.");
        // return;
    }

    if (!isEditMode && (!bigImageFile || !smallImageFile)) {
      setFormError("Please upload both big and small hero images.");
      return;
    }

    if (bigImageError || smallImageError) {
      setFormError("Please correct image errors before submitting.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setBigImageError(null);
    setSmallImageError(null);

    try {
      const formData = new FormData();

      if (url) formData.append('url', url); // Only append if URL is provided
      formData.append('status', status.toString());

      // Only append image files if new ones are selected (or if in create mode)
      if (bigImageFile) {
        formData.append('big_image', bigImageFile);
      }
      if (smallImageFile) {
        formData.append('small_image', smallImageFile);
      }

      // Add ID if in edit mode
      if (isEditMode && bannerId) {
        formData.append('id', bannerId); // Assuming API handles ID directly without hyphen removal
      }

      // Use the same API function for both create and edit
      await apiService.createHeroBanner(formData); // This function should handle both cases internally

      alert(isEditMode ? 'Hero banner updated successfully!' : 'Hero banner created successfully!');
      router.push('/admin/hero/list');
    } catch (err: any) {
      console.error('Error saving hero banner:', err);
      // Attempt to get more specific error from API response
      let errorMessage = `Failed to save hero banner. Please try again.`;
      if (err.response && err.response.data && err.response.data.detail) {
          errorMessage = `Error: ${err.response.data.detail}`;
      } else if (err.message) {
          errorMessage = `Error: ${err.message}`;
      }
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pageTitle = isEditMode ? 'Edit Hero Banner' : 'Add New Hero Banner';
  const submitButtonText = isEditMode ? 'Update Banner' : 'Create Banner';

  // Show loading state while fetching initial data (only in edit mode)
  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-xl shadow-lg">
        <Loader2 className="animate-spin h-12 w-12 text-[var(--color-primary-950)]" />
        <p className="mt-4 text-lg text-gray-600">Loading banner details...</p>
      </div>
    );
  }

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
        {formError && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md border-l-4 border-red-500 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="font-medium">{formError}</p>
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
                  className={`border-2 border-dashed ${bigImageError ? 'border-red-400' : 'border-gray-300'} rounded-xl p-6 text-center cursor-pointer transition-all duration-200
                              hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary-950)]`}
                  onClick={() => bigFileInputRef.current?.click()}
                  tabIndex={0}
                  role="button"
                >
                  <input
                    type="file"
                    ref={bigFileInputRef}
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleBigImageChange}
                    disabled={isSubmitting}
                  />

                  {bigImagePreview ? (
                    <div className="flex flex-col items-center">
                      <div className="w-full max-w-sm h-36 mb-4 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
                        <Image
                          src={bigImagePreview}
                          alt="Big hero image preview"
                          width={400} // Example max width for preview
                          height={144} // Corresponding height for 16:9 if that's the desired ratio, adjust as needed
                          className="w-full h-full object-contain" // Use object-contain to fit wide images
                        />
                      </div>
                      <button
                        type="button"
                        className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBigImagePreview(null);
                          setBigImageFile(null);
                          setBigImageError(null); // Clear error on removal
                          if (bigFileInputRef.current) bigFileInputRef.current.value = '';
                        }}
                        disabled={isSubmitting}
                      >
                        <Trash2 className="w-5 h-5" /> Remove Image
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
                {bigImageError && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> {bigImageError}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  Recommended: Wide image (e.g., 1920x1080 or 2:1 aspect ratio).
                </p>
              </div>

              {/* Small Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Small Image (Mobile) <span className="text-red-500">*</span>
                </label>
                <div
                  className={`border-2 border-dashed ${smallImageError ? 'border-red-400' : 'border-gray-300'} rounded-xl p-6 text-center cursor-pointer transition-all duration-200
                              hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary-950)]`}
                  onClick={() => smallFileInputRef.current?.click()}
                  tabIndex={0}
                  role="button"
                >
                  <input
                    type="file"
                    ref={smallFileInputRef}
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleSmallImageChange}
                    disabled={isSubmitting}
                  />

                  {smallImagePreview ? (
                    <div className="flex flex-col items-center">
                      <div className="w-full max-w-xs h-36 mb-4 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
                        <Image
                          src={smallImagePreview}
                          alt="Small hero image preview"
                          width={300} // Example max width for preview
                          height={144} // Corresponding height
                          className="w-full h-full object-contain" // Use object-contain
                        />
                      </div>
                      <button
                        type="button"
                        className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSmallImagePreview(null);
                          setSmallImageFile(null);
                          setSmallImageError(null); // Clear error on removal
                          if (smallFileInputRef.current) smallFileInputRef.current.value = '';
                        }}
                        disabled={isSubmitting}
                      >
                        <Trash2 className="w-5 h-5" /> Remove Image
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
                {smallImageError && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> {smallImageError}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  Recommended: Squarish image (e.g., 500x500 or 1:1 aspect ratio).
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
                  className="w-full p-3 border border-gray-300 rounded-md text-gray-800
                             focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent
                             transition-all duration-200"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="e.g., /products/featured"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Optional: Link to a specific page when the banner is clicked.
                </p>
              </div>

              {/* Status Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-6"> {/* Increased space */}
                  <label className="inline-flex cursor-pointer items-center">
                    <input
                      type="radio"
                      className="form-radio h-5 w-5 text-blue-600 border-gray-300 focus:ring-[var(--color-primary-950)]" // Larger, branded radio
                      checked={status === true}
                      onChange={() => setStatus(true)}
                      disabled={isSubmitting}
                      name="bannerStatus" // Name for radio group
                    />
                    <span className="ml-2 text-gray-800 font-medium">Active</span>
                  </label>
                  <label className="inline-flex cursor-pointer items-center">
                    <input
                      type="radio"
                      className="form-radio h-5 w-5 text-blue-600 border-gray-300 focus:ring-[var(--color-primary-950)]" // Larger, branded radio
                      checked={status === false}
                      onChange={() => setStatus(false)}
                      disabled={isSubmitting}
                      name="bannerStatus" // Name for radio group
                    />
                    <span className="ml-2 text-gray-800 font-medium">Inactive</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end pt-8 border-t border-gray-200 mt-8 space-x-4">
            <Link href="/admin/hero/list" passHref>
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
                         ${isSubmitting || !!formError || !!bigImageError || !!smallImageError || (!isEditMode && (!bigImageFile || !smallImageFile))
                           ? 'bg-gray-400 cursor-not-allowed opacity-80'
                           : 'bg-[var(--color-primary-950)] hover:bg-[color:var(--color-primary-950)]/90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary-950)]'
                         }`}
              disabled={isSubmitting || !!formError || !!bigImageError || !!smallImageError || (!isEditMode && (!bigImageFile || !smallImageFile))}
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