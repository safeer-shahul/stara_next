// app/admin/staff/create/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users, ArrowLeft, Info, Loader2, Mail, Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import apiService from '@/utils/api/apiService';

// Define interface for staff data (for fetching and submission)
interface StaffDetail {
  id?: string;
  username: string; // Added username
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean; // Remains in payload for update
  password?: string;
}

export default function AddEditStaffPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const staffId = searchParams.get('id');
  const isEditMode = !!staffId;

  // Form states
  const [username, setUsername] = useState(''); // New state for username
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isActive, setIsActive] = useState(true); // Default for creation, managed by toggle in edit mode
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isFetchingInitialData, setIsFetchingInitialData] = useState(isEditMode);

  // Fetch staff details if in edit mode (memoized)
  const fetchStaffDetails = useCallback(async () => {
    if (!staffId) return;

    setIsFetchingInitialData(true);
    setFormError(null);
    try {
      const staffData: StaffDetail = await apiService.getStaffById(staffId);
      setUsername(staffData.username || ''); // Pre-fill username
      setFirstName(staffData.first_name || '');
      setLastName(staffData.last_name || '');
      setEmail(staffData.email || '');
      setIsActive(staffData.is_active ?? true); // Use fetched status for edit mode
    } catch (err) {
      // console.error('Error fetching staff details:', err);
      setFormError('Failed to load staff details. Please try again.');
    } finally {
      setIsFetchingInitialData(false);
    }
  }, [staffId]);

  useEffect(() => {
    if (isEditMode) {
      fetchStaffDetails();
    } else {
      setIsFetchingInitialData(false); // No data to fetch for new staff
    }
  }, [isEditMode, fetchStaffDetails]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic form validation
    if (!username.trim() || !firstName.trim() || !lastName.trim() || !email.trim()) {
      setFormError('All fields marked with * are required.');
      return;
    }

    if (!isEditMode) { // Password required for create mode
      if (!password || password.length < 6) {
        setFormError('Password is required and must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setFormError("Passwords do not match.");
        return;
      }
    }
    
    // Basic email format validation
    if (!/\S+@\S+\.\S+/.test(email)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload: StaffDetail = {
        username: username, // Include username in payload
        email: email,
        first_name: firstName,
        last_name: lastName,
        is_active: isActive, // Always include for update, defaults to true for create
      };

      if (isEditMode) {
        payload.id = staffId; // Add ID to payload for update
        // If password was entered in edit mode, include it
        if (password.trim()) {
          payload.password = password;
        }
      } else {
        payload.password = password; // Password is required for create
        // is_active for new staff will default to true from useState, no need to explicitly set here
      }

      // Use the single saveStaff method
      await apiService.saveStaff(payload);

      alert(`Staff member "${firstName} ${lastName}" ${isEditMode ? 'updated' : 'created'} successfully!`);
      router.push('/admin/staff/list');
    } catch (err: any) {
      // console.error(`Error ${isEditMode ? 'updating' : 'creating'} staff:`, err);
      let errorMessage = `Failed to ${isEditMode ? 'update' : 'create'} staff member. Please try again.`;
      if (err.response?.data?.detail) {
          errorMessage = `Error: ${err.response.data.detail}`;
      } else if (err.response?.data?.email && Array.isArray(err.response.data.email)) {
          errorMessage = `Error: ${err.response.data.email.join(', ')}`;
      } else if (err.response?.data?.username && Array.isArray(err.response.data.username)) { // Handle username specific errors
          errorMessage = `Error: ${err.response.data.username.join(', ')}`;
      } else if (err.message) {
          errorMessage = `Error: ${err.message}`;
      }
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pageTitle = isEditMode ? 'Edit Staff Member' : 'Add New Staff Member';
  const submitButtonText = isSubmitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Staff' : 'Create Staff');

  // Show loading state while fetching initial data
  if (isFetchingInitialData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-xl shadow-lg">
        <Loader2 className="animate-spin h-12 w-12 text-[var(--color-primary-950)]" />
        <p className="mt-4 text-lg text-gray-600">Loading staff details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/staff/list"
          className="text-gray-600 hover:text-[var(--color-primary-950)] transition-colors duration-200"
          aria-label="Back to Staff List"
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
          <div className="bg-purple-50 p-4 rounded-full mr-5">
            <Users className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Staff Member Details</h3>
            <p className="text-gray-600 text-sm">
              {isEditMode ? 'Update existing staff member information.' : 'Fill in the details to create a new staff account.'}
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
          {/* Section: Personal Information */}
          <div>
            <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <Info className="w-5 h-5 mr-2 text-blue-500" /> Personal Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="username"
                  className="w-full p-3 border border-gray-300 rounded-md text-gray-800
                             focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent
                             transition-all duration-200"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isSubmitting || isEditMode} // Username is typically not editable after creation
                  placeholder="e.g., john.doe"
                />
                {isEditMode && (
                    <p className="text-xs text-gray-500 mt-1">Username cannot be changed in edit mode.</p>
                )}
              </div>
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  className="w-full p-3 border border-gray-300 rounded-md text-gray-800
                             focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent
                             transition-all duration-200"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={isSubmitting}
                  placeholder="e.g., John"
                />
              </div>
              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  className="w-full p-3 border border-gray-300 rounded-md text-gray-800
                             focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent
                             transition-all duration-200"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={isSubmitting}
                  placeholder="e.g., Doe"
                />
              </div>
              {/* Email */}
              <div> {/* Keep email in its own div as it spans 2 columns in previous version. Now it's a single column field. */}
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <input
                        type="email"
                        id="email"
                        className="w-full p-3 border border-gray-300 rounded-md pl-10 text-gray-800
                                   focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent
                                   transition-all duration-200"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isSubmitting || isEditMode}
                        placeholder="e.g., john.doe@example.com"
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                {isEditMode && (
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed in edit mode.</p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Security (Password) - Only for new staff */}
          {!isEditMode && (
            <div>
              <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center mt-6 border-t pt-6">
                <Lock className="w-5 h-5 mr-2 text-red-500" /> Security
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      className="w-full p-3 border border-gray-300 rounded-md pl-10 pr-10 text-gray-800
                                 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent
                                 transition-all duration-200"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required={!isEditMode}
                      disabled={isSubmitting}
                      placeholder="Minimum 6 characters"
                      autoComplete="new-password"
                    />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        title={showPassword ? "Hide password" : "Show password"}
                        disabled={isSubmitting}
                    >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="confirmPassword"
                      className="w-full p-3 border border-gray-300 rounded-md pl-10 pr-10 text-gray-800
                                 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent
                                 transition-all duration-200"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required={!isEditMode}
                      disabled={isSubmitting}
                      placeholder="Re-enter password"
                      autoComplete="new-password"
                    />
                     <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        title={showPassword ? "Hide password" : "Show password"}
                        disabled={isSubmitting}
                    >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section: Account Status - Only for edit mode */}
          {isEditMode && (
            <div>
              <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center mt-6 border-t pt-6">
                <CheckCircle className="w-5 h-5 mr-2 text-green-500" /> Account Status
              </h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Active Status <span className="text-red-500">*</span>
                </label>
                {/* Toggle switch for active/inactive status */}
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                                ${isActive ? 'bg-green-500' : 'bg-gray-300'} focus:ring-green-500`}
                  role="switch"
                  aria-checked={isActive}
                  aria-label={isActive ? "Deactivate staff" : "Activate staff"}
                  disabled={isSubmitting}
                >
                  <span className="sr-only">Toggle staff status</span>
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200
                                 ${isActive ? 'translate-x-[22px]' : 'translate-x-1'}`}
                  />
                </button>
                <span className={`ml-3 text-base font-medium ${isActive ? 'text-green-600' : 'text-gray-600'}`}>
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end pt-8 border-t border-gray-200 mt-8 space-x-4">
            <Link href="/admin/staff/list" passHref>
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
                         ${isSubmitting || !!formError || (!isEditMode && (!password || password !== confirmPassword || password.length < 6)) || !username.trim()
                           ? 'bg-gray-400 cursor-not-allowed opacity-80'
                           : 'bg-[var(--color-primary-950)] hover:bg-[color:var(--color-primary-950)]/90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary-950)]'
                         }`}
              // Disable based on submission, general errors, and password/username validation in create mode
              disabled={isSubmitting || !!formError || (!isEditMode && (!password || password !== confirmPassword || password.length < 6)) || !username.trim()}
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