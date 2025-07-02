// app/admin/products/add-category/page.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from 'react'; // Added useCallback
import { useRouter, useSearchParams } from 'next/navigation';
import { Folder, ArrowLeft, Upload, Image as ImageIcon, XCircle } from 'lucide-react'; // Added CheckCircle, XCircle for validation feedback
import Link from 'next/link';
import apiService from '@/utils/api/apiService';
import Image from 'next/image';

export default function AddEditCategoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get('id');
  const isEditMode = !!categoryId;

  const [categoryName, setCategoryName] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null); // Renamed to avoid conflict with Image error
  const [imageError, setImageError] = useState<string | null>(null); // Specific error for image aspect ratio
  // const [existingImagePath, setExistingImagePath] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memoize fetchCategoryDetails for better performance if used in dependency arrays
  const fetchCategoryDetails = useCallback(async () => {
    if (!categoryId) return;

    setIsLoading(true);
    try {
      const category = await apiService.getCategoryById(categoryId);
      setCategoryName(category.category_name);
      if (category.category_image) {
        // setExistingImagePath(category.category_image);
        setImagePreview(`${process.env.NEXT_PUBLIC_API_BASE_URL}${category.category_image}`);
      }
      setFormError(null);
    } catch (err) {
      console.error('Error fetching category:', err);
      setFormError('Failed to load category details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [categoryId]); // Depend on categoryId

  // Fetch category data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchCategoryDetails();
    }
  }, [isEditMode, fetchCategoryDetails]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImagePreview(null);
      setImageFile(null);
      // setExistingImagePath(null);
      setImageError(null);
      return;
    }

    // Clear previous image errors and existing path when new file is selected
    setImageError(null);
    // setExistingImagePath(null);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);

      // Check image dimensions to ensure 1:1 ratio
      const img = new window.Image(); // Use window.Image to avoid conflict with Next.js Image
      img.onload = () => {
        const width = img.width;
        const height = img.height;
        const ratio = width / height;

        // Allow for a small tolerance, e.g., 5% deviation from 1:1
        if (ratio < 0.95 || ratio > 1.05) {
          setImageError("Image should have a 1:1 aspect ratio (square image).");
          setImageFile(null); // Do not set file if invalid ratio
        } else {
          setImageError(null);
          setImageFile(file);
        }
      };
      img.onerror = () => { // Handle potential errors loading image data URL
        setImageError("Failed to load image for preview.");
        setImageFile(null);
        setImagePreview(null);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic form validation
    if (!categoryName.trim()) {
      setFormError("Category Name is required.");
      return;
    }

    if (!isEditMode && !imageFile) {
      setFormError("Please upload a category image.");
      return;
    }

    if (imageError) { // Do not submit if there's an image error
      setFormError("Please correct the image issues before submitting.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null); // Clear form-level errors

    try {
      if (isEditMode) {
        // If no new image file is selected, but an existing image path exists, pass null for imageFile
        // This assumes apiService.createCategory can handle `null` for image in update
        await apiService.createCategory(categoryName, imageFile || null, categoryId);
        // Note: Your apiService.createCategory currently assumes `imageFile` for update.
        // If it sends a new image even if `imageFile` is null, consider a separate update method in apiService.
        // For now, assuming `null` means "don't change image"
        alert(`Category "${categoryName}" updated successfully!`);
      } else {
        await apiService.createCategory(categoryName, imageFile, ''); // Pass empty string or null for categoryId for new creation
        alert(`Category "${categoryName}" created successfully!`);
      }

      router.push('/admin/products/categories');
    } catch (err) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} category:`, err);
      // More user-friendly error messages based on API response if possible
      setFormError(`Failed to ${isEditMode ? 'update' : 'create'} category. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []); // No dependencies, so can be memoized

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-xl shadow-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary-950)]"></div>
        <p className="mt-4 text-lg text-gray-600">Loading category details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products/categories"
          className="text-gray-600 hover:text-[var(--color-primary-950)] transition-colors duration-200"
          aria-label="Back to Categories"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h2 className="text-3xl font-extrabold text-gray-800">
          {isEditMode ? 'Edit Category' : 'Add New Category'}
        </h2>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-xl shadow-lg p-8"> {/* Increased padding */}
        <div className="flex items-center mb-8 pb-4 border-b border-gray-200"> {/* Added border-b */}
          <div className="bg-blue-50 p-4 rounded-full mr-5"> {/* Larger, softer icon background */}
            <Folder className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Category Details</h3>
            <p className="text-gray-600 text-sm">
              {isEditMode ? 'Update existing category information and image.' : 'Enter the details for a new product category.'}
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Name Input */}
          <div>
            <label htmlFor="categoryName" className="block text-base font-medium text-gray-700 mb-2">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="categoryName"
              className="w-full p-3 border border-gray-300 rounded-md text-gray-800
                         focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent
                         transition-all duration-200"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Category Image Upload */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              Category Image {!isEditMode && <span className="text-red-500">*</span>}
            </label>

            <div
              className={`border-2 border-dashed ${imageError ? 'border-red-400' : 'border-gray-300'} rounded-xl p-6 text-center cursor-pointer transition-all duration-200
                          hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary-950)]`}
              onClick={triggerFileInput}
              tabIndex={0} // Make div focusable
              role="button" // Indicate it's an interactive element
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg, image/gif" // More specific MIME types
                onChange={handleImageChange}
                disabled={isSubmitting}
              />

              {imagePreview ? (
                <div className="flex flex-col items-center">
                  <div className="w-48 h-48 sm:w-60 sm:h-60 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center mb-4 shadow-sm">
                    <Image
                      src={imagePreview}
                      alt="Category preview"
                      width={240}
                      height={240}
                      className="w-full h-full object-cover"
                      style={{ filter: imageError ? 'grayscale(100%)' : 'none' }}
                      unoptimized={imagePreview.startsWith('data:')} // Use unoptimized for data URLs
                    />
                  </div>
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 flex items-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent re-triggering file input
                      setImagePreview(null);
                      setImageFile(null);
                      // setExistingImagePath(null);
                      setImageError(null); // Clear image error on removal
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''; // Clear file input
                      }
                    }}
                    disabled={isSubmitting}
                  >
                    <Upload className="w-5 h-5" /> Change image
                  </button>
                </div>
              ) : (
                <div className="py-6">
                  <ImageIcon className="mx-auto h-16 w-16 text-gray-400 mb-3" /> {/* Larger icon */}
                  <div className="mt-2 flex flex-col items-center">
                    <span className="text-lg font-medium text-[var(--color-primary-950)]">Upload category image</span>
                    <p className="text-sm text-gray-500 mt-1">Drag and drop or click to browse</p>
                  </div>
                </div>
              )}
            </div>

            {/* Image specific error message */}
            {imageError && (
              <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                <XCircle className="w-4 h-4" /> {imageError}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-2">
              Recommended: a square image (1:1 aspect ratio), e.g., 500x500 pixels.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end pt-6 border-t border-gray-200 mt-8 space-x-4">
            <button
              type="button"
              className="px-6 py-3 border border-gray-300 rounded-md text-gray-700
                         hover:bg-gray-100 transition-colors duration-200
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
              onClick={() => router.push('/admin/products/categories')}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 py-3 rounded-md text-white shadow-md transition-all duration-200
                         flex items-center justify-center gap-2
                         ${isSubmitting || imageError
                           ? 'bg-gray-400 cursor-not-allowed opacity-80'
                           : 'bg-[var(--color-primary-950)] hover:bg-[color:var(--color-primary-950)]/90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary-950)]'
                         }`}
              disabled={isSubmitting || !!imageError}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditMode ? 'Update Category' : 'Create Category'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}