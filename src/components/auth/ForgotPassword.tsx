// src/components/auth/ForgotPassword.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import apiService from '@/utils/api/apiService';
import { showToast } from '@/utils/toast';
import { Eye, EyeOff } from 'lucide-react';

interface ForgotPasswordProps {
  onClose?: () => void; // Optional if used as a modal
  switchToLogin?: () => void; // Optional if used within AuthModal
}

const ForgotPassword = ({ onClose, switchToLogin }: ForgotPasswordProps) => {
  const router = useRouter();

  const [step, setStep] = useState(1); // 1: Request OTP, 2: Verify OTP, 3: Set New Password
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      // API call to request OTP for password reset
      // Your backend should send an OTP to the provided email/username
      const response = await apiService.requestPasswordResetOtp({ email_or_username: emailOrUsername });
      const message = response.message || 'OTP sent successfully. Please check your email/phone.';
      setSuccessMessage(message);
      showToast.success(message);
      setStep(2); // Move to OTP verification step
    } catch (err: any) {
      const errorMessage = err.detail || err.message || 'Failed to send OTP. Please check the provided email/username.';
      setError(errorMessage);
      showToast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      // API call to verify the OTP
      const response = await apiService.verifyPasswordResetOtp({ email_or_username: emailOrUsername, otp: otp });
      const message = response.message || 'OTP verified. You can now set your new password.';
      setSuccessMessage(message);
      showToast.success(message);
      setStep(3); // Move to set new password step
    } catch (err: any) {
      const errorMessage = err.detail || err.message || 'OTP verification failed. Invalid OTP or request expired.';
      setError(errorMessage);
      showToast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    if (newPassword !== confirmNewPassword) {
      const errorMessage = 'Passwords do not match.';
      setError(errorMessage);
      showToast.error(errorMessage);
      setIsLoading(false);
      return;
    }

    try {
      // API call to set the new password
      const response = await apiService.confirmPasswordReset({
        email_or_username: emailOrUsername,
        otp: otp, // Pass OTP again to ensure the reset context is maintained
        new_password: newPassword,
      });
      const message = response.message || 'Your password has been successfully reset. You can now log in.';
      setSuccessMessage(message);
      showToast.success(message);
      
      // Optionally, automatically switch to login view and close modal if applicable
      if (switchToLogin) {
        setTimeout(() => {
          switchToLogin();
          if (onClose) onClose();
        }, 1500); // Give time for user to see the success message
      } else {
        // If not in a modal, redirect to login page
        setTimeout(() => {
          router.push('/login'); // Assuming you have a dedicated login page
        }, 1500);
      }
    } catch (err: any) {
      const errorMessage = err.detail || err.message || 'Failed to reset password. Please try again.';
      setError(errorMessage);
      showToast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6"> {/* Added padding for standalone use */}
      <h2 className="text-2xl font-bold text-center text-[var(--color-primary-950)] mb-6">
        Forgot Password
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
          {successMessage}
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handleRequestOtp}>
          <div className="mb-4">
            <label htmlFor="emailOrUsername" className="block text-sm font-medium text-gray-700 mb-1">
              Email or Username
            </label>
            <input
              id="emailOrUsername"
              name="emailOrUsername"
              type="text"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent transition duration-200"
              placeholder="Enter your email or username"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[var(--color-primary-950)] text-white py-2 px-4 rounded-md hover:bg-[#124a62] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:ring-opacity-50 transition duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending OTP...
              </>
            ) : (
              'Send Reset OTP'
            )}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyOtp}>
          <p className="text-center text-sm text-gray-600 mb-4">
            An OTP has been sent to {emailOrUsername}. Please enter it below.
          </p>
          <div className="mb-4">
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
              Enter OTP
            </label>
            <input
              id="otp"
              name="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent transition duration-200"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[var(--color-primary-950)] text-white py-2 px-4 rounded-md hover:bg-[#124a62] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:ring-opacity-50 transition duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying OTP...
              </>
            ) : (
              'Verify OTP'
            )}
          </button>
          <button
            type="button"
            onClick={() => { setStep(1); setError(''); setSuccessMessage(''); }}
            className="w-full mt-2 text-sm text-[var(--color-primary-950)] hover:underline"
          >
            Change Email/Username
          </button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleSetNewPassword}>
          <div className="mb-4">
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                id="newPassword"
                name="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent transition duration-200"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                disabled={isLoading}
              >
                {showNewPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirmNewPassword"
                name="confirmNewPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent transition duration-200"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[var(--color-primary-950)] text-white py-2 px-4 rounded-md hover:bg-[#124a62] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:ring-opacity-50 transition duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Setting Password...
              </>
            ) : (
              'Set New Password'
            )}
          </button>
        </form>
      )}

      {step !== 3 && ( // Only show "Back to Login" if not on the final step
        <p className="mt-6 text-center text-sm text-gray-600">
          <button
            onClick={switchToLogin || (() => router.push('/login'))} // Fallback if no switchToLogin prop
            className="text-[var(--color-primary-950)] hover:underline focus:outline-none font-medium"
          >
            Back to Login
          </button>
        </p>
      )}
    </div>
  );
};

export default ForgotPassword;