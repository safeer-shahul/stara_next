'use client';

import { useState, useEffect } from 'react';
import { Mail, Phone, Clock, Send, X, Eye, Upload, MessageSquare, List, Plus, Calendar } from 'lucide-react';
import apiService from '@/utils/api/apiService';

interface ImageFile {
  id: string;
  file: File;
  preview: string;
}

interface Complaint {
  id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  images?: string[];
}

export default function Support() {
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
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
      setComplaints(response.data || response); // Handle different response structures
    } catch (error) {
      console.error('Error fetching complaints:', error);
      setFormError('Failed to load complaints. Please try again.');
    } finally {
      setIsLoadingComplaints(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const maxImages = 5;
    const currentImageCount = images.length;
    const filesToAdd = Math.min(files.length, maxImages - currentImageCount);

    if (filesToAdd === 0) {
      setFormError(`Maximum ${maxImages} images allowed`);
      return;
    }

    const newImages: ImageFile[] = [];
    for (let i = 0; i < filesToAdd; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const imageFile: ImageFile = {
          id: Date.now().toString() + i,
          file: file,
          preview: URL.createObjectURL(file)
        };
        newImages.push(imageFile);
      }
    }

    setImages(prev => [...prev, ...newImages]);
    setFormError(null);
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim()) {
      setFormError('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    setFormError(null);
    
    try {
      const formData = new FormData();
      formData.append('subject', subject);
      formData.append('message', message);
      
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'in progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
          <h2 className="text-[16px] font-semibold">Customer Support</h2>
          <div className="flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('form')}
              className={`flex-1 sm:flex-none flex items-center justify-center px-3 sm:px-4 py-2 rounded-md text-[14px] font-medium transition-colors ${
                activeTab === 'form'
                  ? 'bg-white text-[var(--color-primary-950)] shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <MessageSquare size={16} className="mr-1 sm:mr-2" />
              <span className="hidden sm:inline">New Complaint</span>
              <span className="sm:hidden">New</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 sm:flex-none flex items-center justify-center px-3 sm:px-4 py-2 rounded-md text-[14px] font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-white text-[var(--color-primary-950)] shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <List size={16} className="mr-1 sm:mr-2" />
              <span className="hidden sm:inline">My Complaints</span>
              <span className="sm:hidden">History</span>
            </button>
          </div>
        </div>

        {activeTab === 'form' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4 order-2 lg:order-1">
              <div className="flex items-start">
                <div className="bg-gray-100 p-2 rounded-full mr-3">
                  <Mail size={18} className="text-gray-600" />
                </div>
                <div className='text-[14px]'>
                  <p className="font-medium">Email</p>
                  <p className="text-[14px] text-gray-500">starajewels@gmail.com</p>
                  <p className="text-[14px] text-gray-500">We respond within 24 hours</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-gray-100 p-2 rounded-full mr-3">
                  <Phone size={18} className="text-gray-600" />
                </div>
                <div className='text-[14px]'>
                  <p className="font-medium">Phone</p>
                  <p className="text-[14px] text-gray-500">+91 80869 25925</p>
                  <p className="text-[14px] text-gray-500">Mon-Sun, 9am-9pm IST</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-gray-100 p-2 rounded-full mr-3">
                  <Clock size={18} className="text-gray-600" />
                </div>
                <div className='text-[14px]'>
                  <p className="font-medium">Response Time</p>
                  <p className="text-[14px] text-gray-500">We aim to respond to all inquiries within 24 hours during business days.</p>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <h3 className="font-medium text-[14px] mb-4">Send us a message</h3>
              
              {success ? (
                <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-center">
                  <h4 className="font-medium text-green-800 mb-2">Message Sent!</h4>
                  <p className="text-green-700 text-[14px]">We've received your message and will get back to you shortly.</p>
                  <button 
                    onClick={() => setSuccess(false)}
                    className="mt-3 text-[14px] font-medium text-green-700 hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {formError && (
                    <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-red-700 text-[14px]">
                      {formError}
                    </div>
                  )}
                  
                  <div>
                    <label htmlFor="subject" className="block text-[14px] font-medium text-gray-700 mb-1">
                      Subject *
                    </label>
                    <input
                      id="subject"
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#175e7a] focus:border-[var(--color-primary-950)] outline-none"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-[14px] font-medium text-gray-700 mb-1">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#175e7a] focus:border-[var(--color-primary-950)] outline-none"
                      required
                    ></textarea>
                  </div>
                  
                  <div>
                    <label className="block text-[14px] font-medium text-gray-700 mb-2">
                      Attach Images (Max 5)
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-gray-400 transition-colors"
                    >
                      <Upload size={20} className="text-gray-400 mr-2" />
                      <span className="text-[14px] text-gray-500">Click to upload images</span>
                    </label>
                    
                    {images.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {images.map((image) => (
                          <div key={image.id} className="relative group">
                            <img
                              src={image.preview}
                              alt="Preview"
                              className="w-full h-12 sm:h-16 object-cover rounded-md border"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => setFullScreenImage(image.preview)}
                                className="text-white p-1 hover:bg-white hover:bg-opacity-20 rounded"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeImage(image.id)}
                                className="text-white p-1 hover:bg-white hover:bg-opacity-20 rounded ml-1"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full bg-[var(--color-primary-950)] text-[14px] text-white py-2 px-4 rounded-md font-medium hover:bg-opacity-90 transition-colors flex items-center justify-center ${
                      isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? 'Sending...' : (
                      <>
                        Send Message <Send size={16} className="ml-2" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {isLoadingComplaints ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary-950)] mx-auto"></div>
                <p className="text-[14px] text-gray-500 mt-2">Loading your complaints...</p>
              </div>
            ) : complaints.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-[14px] text-gray-500">No complaints found</p>
                <button
                  onClick={() => setActiveTab('form')}
                  className="mt-2 text-[14px] font-medium text-[var(--color-primary-950)] hover:underline"
                >
                  Submit your first complaint
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {complaints.map((complaint) => (
                  <div key={complaint.id} className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 space-y-2 sm:space-y-0">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-[14px] mb-1 truncate">{complaint.subject}</h4>
                        <p className="text-[14px] text-gray-600 line-clamp-2 sm:line-clamp-3">{complaint.message}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-[12px] font-medium whitespace-nowrap ${getStatusColor(complaint.status)}`}>
                        {complaint.status}
                      </span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                      <div className="flex items-center text-[12px] text-gray-500">
                        <Calendar size={12} className="mr-1" />
                        <span className="truncate">{formatDate(complaint.created_at)}</span>
                      </div>
                      
                      {complaint.images && complaint.images.length > 0 && (
                        <div className="flex items-center text-[12px] text-gray-500">
                          <span className="mr-2 hidden sm:inline">{complaint.images.length} image(s)</span>
                          <span className="mr-2 sm:hidden">{complaint.images.length} img</span>
                          <div className="flex space-x-1">
                            {complaint.images.slice(0, 2).map((image, index) => (
                              <img
                                key={index}
                                src={image}
                                alt="Complaint"
                                className="w-5 h-5 sm:w-6 sm:h-6 object-cover rounded cursor-pointer hover:opacity-80"
                                onClick={() => setFullScreenImage(image)}
                              />
                            ))}
                            {complaint.images.length > 2 && (
                              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-100 rounded flex items-center justify-center text-[10px] text-gray-500">
                                +{complaint.images.length - 2}
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
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="relative max-w-full max-h-full w-full">
            <button
              onClick={() => setFullScreenImage(null)}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-colors z-10"
            >
              <X size={20} />
            </button>
            <img
              src={fullScreenImage}
              alt="Full screen"
              className="max-w-full max-h-full object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}