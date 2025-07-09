'use client';

import { useState, useEffect } from 'react';
import { Mail, Phone, Clock, Send, X, Eye, Upload, MessageSquare, List, Plus, Calendar, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import apiService from '@/utils/api/apiService';

interface ImageFile {
  id: string;
  file: File;
  preview: string;
}

interface ComplaintImage {
  id: string;
  image: string;
  created_at: string;
  updated_at: string;
  enquiry: string;
}

interface Complaint {
  id: string;
  subject: string;
  message: string;
  created_at: string;
  updated_at: string;
  user: number;
  images: ComplaintImage[];
}

// Image validation constants
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

export default function Support() {
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(false);

  // Load complaints when switching to history tab
  useEffect(() => {
    if (activeTab === 'history') {
      fetchComplaints();
    }
  }, [activeTab]);

  const fetchComplaints = async () => {
    setIsLoadingComplaints(true);
    try {
      const response = await apiService.getMyEnquiry();
      setComplaints(Array.isArray(response) ? response : response.data || []);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      setFormError('Failed to load complaints. Please try again.');
    } finally {
      setIsLoadingComplaints(false);
    }
  };

  // Image validation functions
  const validateImageFile = (file: File): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Check file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      errors.push(`Only JPEG, PNG, and WebP images are allowed`);
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`File size must be less than 5MB`);
    }
    
    // Additional check for file extension
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      errors.push(`File must have a valid image extension (.jpg, .jpeg, .png, .webp)`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const validateImageFiles = (files: FileList | File[]): { isValid: boolean; errors: string[]; validFiles: File[] } => {
    const allErrors: string[] = [];
    const validFiles: File[] = [];
    const fileArray = Array.from(files);
    
    if (fileArray.length === 0) {
      return { isValid: true, errors: [], validFiles: [] };
    }
    
    fileArray.forEach(file => {
      const validation = validateImageFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        allErrors.push(`${file.name}: ${validation.errors.join(', ')}`);
      }
    });
    
    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      validFiles
    };
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const maxImages = 5;
    const currentImageCount = images.length;
    const availableSlots = maxImages - currentImageCount;

    if (availableSlots === 0) {
      setFormError(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Validate the selected files
    const validation = validateImageFiles(files);
    
    // Set file validation errors
    setFileErrors(validation.errors);
    
    // Process valid files
    const filesToAdd = Math.min(validation.validFiles.length, availableSlots);
    const newImages: ImageFile[] = [];
    
    for (let i = 0; i < filesToAdd; i++) {
      const file = validation.validFiles[i];
      const imageFile: ImageFile = {
        id: Date.now().toString() + i,
        file: file,
        preview: URL.createObjectURL(file)
      };
      newImages.push(imageFile);
    }

    if (newImages.length > 0) {
      setImages(prev => [...prev, ...newImages]);
      setFormError(null);
    }

    // Show warning if some files were rejected or couldn't fit
    if (validation.errors.length > 0) {
      console.warn('File validation errors:', validation.errors);
    }
    
    if (validation.validFiles.length > filesToAdd) {
      setFormError(`Only ${filesToAdd} images could be added due to the ${maxImages} image limit`);
    }
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const updatedImages = prev.filter(img => img.id !== id);
      // Clean up object URL
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return updatedImages;
    });
    
    // Clear file errors if all images are removed
    if (images.length === 1) {
      setFileErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation for required fields
    if (!subject.trim()) {
      setFormError('Subject is required');
      return;
    }
    
    if (!message.trim()) {
      setFormError('Message is required');
      return;
    }
    
    // Check if there are any file validation errors
    if (fileErrors.length > 0) {
      setFormError('Please fix the image validation errors before submitting');
      return;
    }
    
    setIsSubmitting(true);
    setFormError(null);
    
    try {
      const formData = new FormData();
      formData.append('subject', subject.trim());
      formData.append('message', message.trim());
      
      // Add images to form data with the key 'enquiry_images'
      images.forEach((image) => {
        formData.append('enquiry_images', image.file);
      });
      
      // Use your API service
      await apiService.createEnquiry(formData);
      
      setSuccess(true);
      setSubject('');
      setMessage('');
      setImages([]);
      setFileErrors([]);
      
      // Clean up image URLs
      images.forEach(image => {
        URL.revokeObjectURL(image.preview);
      });
      
    } catch (err: any) {
      console.error('Error submitting complaint:', err);
      setFormError(err.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return formatDate(dateString);
  };

  const truncateMessage = (message: string, maxLength: number = 120) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Customer Support</h2>
            <p className="text-sm text-gray-500">We're here to help you with any questions or concerns</p>
          </div>
          <div className="flex bg-gray-50 rounded-lg p-1 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('form')}
              className={`flex-1 sm:flex-none flex items-center justify-center px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'form'
                  ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <MessageSquare size={16} className="mr-2" />
              <span className="hidden sm:inline">New Complaint</span>
              <span className="sm:hidden">New</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 sm:flex-none flex items-center justify-center px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'history'
                  ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <List size={16} className="mr-2" />
              <span className="hidden sm:inline">My Complaints</span>
              <span className="sm:hidden">History</span>
            </button>
          </div>
        </div>

        {activeTab === 'form' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6 order-2 lg:order-1">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="bg-blue-100 p-2.5 rounded-full mr-4">
                      <Mail size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Email Support</p>
                      <p className="text-sm text-gray-600">starajewels@gmail.com</p>
                      <p className="text-sm text-gray-500">Response within 24 hours</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-green-100 p-2.5 rounded-full mr-4">
                      <Phone size={18} className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Phone Support</p>
                      <p className="text-sm text-gray-600">+91 80869 25925</p>
                      <p className="text-sm text-gray-500">Mon-Sun, 9am-9pm IST</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-purple-100 p-2.5 rounded-full mr-4">
                      <Clock size={18} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Response Time</p>
                      <p className="text-sm text-gray-600">We aim to respond to all inquiries within 24 hours during business days.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-6">Send us a message</h3>
                
                {success ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4">
                      <MessageSquare size={28} className="text-green-600 mx-auto" />
                    </div>
                    <h4 className="font-semibold text-green-800 mb-2">Message Sent Successfully!</h4>
                    <p className="text-green-700 text-sm mb-4">We've received your message and will get back to you shortly.</p>
                    <button 
                      onClick={() => setSuccess(false)}
                      className="text-sm font-medium text-green-700 hover:text-green-800 hover:underline transition-colors"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {formError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm flex items-start">
                        <AlertTriangle size={16} className="mr-3 mt-0.5 flex-shrink-0" />
                        <span>{formError}</span>
                      </div>
                    )}
                    
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                        Subject <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="subject"
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-[var(--color-primary-950)] outline-none transition-colors ${
                          !subject.trim() && formError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        required
                        placeholder="Enter the subject of your inquiry"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                        Message <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="message"
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-[var(--color-primary-950)] outline-none transition-colors resize-none ${
                          !message.trim() && formError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        required
                        placeholder="Describe your issue or inquiry in detail"
                      ></textarea>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Attach Images (Optional, Max 5)
                      </label>
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
                      >
                        <Upload size={20} className="text-gray-400 mr-3" />
                        <span className="text-sm text-gray-500">Click to upload images (JPEG, PNG, WebP only, max 5MB each)</span>
                      </label>
                      
                      {/* Display file validation errors */}
                      {fileErrors.length > 0 && (
                        <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start">
                            <AlertTriangle size={16} className="text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-red-600">
                              <p className="font-medium mb-2">Some files were rejected:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {fileErrors.map((error, index) => (
                                  <li key={index}>{error}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {images.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-600 mb-3">Selected images ({images.length}/5):</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {images.map((image) => (
                              <div key={image.id} className="relative group">
                                <img
                                  src={image.preview}
                                  alt="Preview"
                                  className="w-full h-20 object-cover rounded-lg border border-gray-200"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => setFullScreenImage(image.preview)}
                                    className="text-white p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                                    title="View image"
                                  >
                                    <Eye size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeImage(image.id)}
                                    className="text-white p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                                    title="Remove image"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                                {/* File size display */}
                                <p className="text-xs text-gray-500 mt-1 truncate" title={image.file.name}>
                                  {(image.file.size / 1024 / 1024).toFixed(1)} MB
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isSubmitting || fileErrors.length > 0}
                      className={`w-full bg-[var(--color-primary-950)] text-white py-3 px-4 rounded-lg font-medium hover:bg-opacity-90 transition-colors flex items-center justify-center ${
                        isSubmitting || fileErrors.length > 0 ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          Send Message <Send size={16} className="ml-2" />
                        </>
                      )}
                    </button>
                    
                    <p className="text-xs text-gray-500 text-center">
                      <span className="text-red-500">*</span> Required fields
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {isLoadingComplaints ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary-950)] mx-auto"></div>
                <p className="text-sm text-gray-500 mt-4">Loading your complaints...</p>
              </div>
            ) : complaints.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-4">
                  <MessageSquare size={48} className="text-gray-400 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints found</h3>
                <p className="text-sm text-gray-500 mb-6">You haven't submitted any complaints yet.</p>
                <button
                  onClick={() => setActiveTab('form')}
                  className="bg-[var(--color-primary-950)] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-opacity-90 transition-colors"
                >
                  Submit your first complaint
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {complaints.map((complaint) => (
                  <div key={complaint.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 space-y-3 sm:space-y-0">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-base mb-2">{complaint.subject}</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{truncateMessage(complaint.message)}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar size={14} className="mr-2" />
                        <span>{getRelativeTime(complaint.created_at)}</span>
                        {complaint.updated_at !== complaint.created_at && (
                          <span className="ml-2 text-xs">• Updated {getRelativeTime(complaint.updated_at)}</span>
                        )}
                      </div>
                      
                      {complaint.images && complaint.images.length > 0 && (
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center text-sm text-gray-500">
                            <ImageIcon size={14} className="mr-1" />
                            <span>{complaint.images.length} image{complaint.images.length > 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex space-x-2">
                            {complaint.images.slice(0, 3).map((image, index) => (
                              <img
                                key={image.id}
                                src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${image.image}`}
                                alt="Complaint attachment"
                                className="w-8 h-8 object-cover rounded-md border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setFullScreenImage(`${process.env.NEXT_PUBLIC_API_BASE_URL}${image.image}`)}
                              />
                            ))}
                            {complaint.images.length > 3 && (
                              <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center text-xs text-gray-500 border border-gray-200">
                                +{complaint.images.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Full screen image modal */}
      {fullScreenImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-full max-h-full w-full">
            <button
              onClick={() => setFullScreenImage(null)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-60 rounded-full p-3 hover:bg-opacity-80 transition-colors z-10"
            >
              <X size={20} />
            </button>
            <img
              src={fullScreenImage}
              alt="Full screen"
              className="max-w-full max-h-full object-contain mx-auto rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}