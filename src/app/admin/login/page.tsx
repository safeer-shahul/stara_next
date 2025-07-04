// app/admin/login/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/components/auth/firebase/config';
import apiService from '@/utils/api/apiService';
import { showToast } from '@/utils/toast';
import { LogIn, Loader2, XCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'login' | 'forgot-password'>('login');
  
  // Forgot password states
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Verify OTP, 3: Set New Password
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const router = useRouter();

  // Check if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const userProfile = await apiService.getUserProfile();
          if (userProfile.is_superuser) {
            router.push('/admin');
          } else {
            console.warn('User is logged in but not a superuser. Clearing tokens.');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setError('You do not have admin privileges. Please log in with an admin account.');
            showToast.error('You do not have admin privileges.');
          }
        } catch (authError) {
          console.error('Auth check failed:', authError);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setError('Your session expired or is invalid. Please log in again.');
          showToast.warning('Your session expired. Please log in again.');
        }
      }
    };

    checkAuth();
  }, [router]);

  const handleSuccessfulLogin = async () => {
    try {
      const userDetails = await apiService.getUserProfile();
      
      if (userDetails.is_superuser) {
        showToast.success('Welcome back, Admin!');
        router.push('/admin');
      } else {
        setError('You do not have admin privileges');
        showToast.error('You do not have admin privileges');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setIsLoading(false);
      }
    } catch (profileError) {
      console.error('Profile fetch failed:', profileError);
      const errorMsg = 'Failed to verify admin privileges. Please try again.';
      setError(errorMsg);
      showToast.error(errorMsg);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const tokenResponse = await apiService.getAuthorizationToken(username, password);
      
      localStorage.setItem('accessToken', tokenResponse.access);
      localStorage.setItem('refreshToken', tokenResponse.refresh);

      setTimeout(async () => {
        await handleSuccessfulLogin();
      }, 100);
    } catch (apiError: any) {
      console.error('Login request failed:', apiError);
      const errorMessage = apiError.response?.data?.detail || 'Invalid username or password. Please try again.';
      setError(errorMessage);
      showToast.error(errorMessage);
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      const response = await apiService.googleKeyVerify({ idToken });

      localStorage.setItem('accessToken', response.access_token);
      localStorage.setItem('refreshToken', response.refresh_token);

      // Fetch and store user profile
      try {
        const userProfile = await apiService.getUserProfile();
        localStorage.setItem('me', JSON.stringify(userProfile));
      } catch (profileError) {
        console.warn('Failed to fetch user profile:', profileError);
      }

      setTimeout(async () => {
        await handleSuccessfulLogin();
      }, 100);

    } catch (err) {
      console.error('Google login error:', err);
      let errorMessage = 'Failed to login with Google.';
      if (err instanceof Error) {
        if ((err as any).code === 'auth/popup-closed-by-user') {
          errorMessage = 'Google login window closed.';
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
      showToast.error(errorMessage);
      setIsLoading(false);
    }
  };

  // Forgot Password Functions
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const response = await apiService.requestPasswordResetOtp({ email_or_username: emailOrUsername });
      const message = response.message || 'OTP sent successfully. Please check your email/phone.';
      setSuccessMessage(message);
      showToast.success(message);
      setStep(2);
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
      const response = await apiService.verifyPasswordResetOtp({ email_or_username: emailOrUsername, otp: otp });
      const message = response.message || 'OTP verified. You can now set your new password.';
      setSuccessMessage(message);
      showToast.success(message);
      setStep(3);
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
      const response = await apiService.confirmPasswordReset({
        email_or_username: emailOrUsername,
        otp: otp,
        new_password: newPassword,
      });
      const message = response.message || 'Your password has been successfully reset. You can now log in.';
      setSuccessMessage(message);
      showToast.success(message);
      
      setTimeout(() => {
        setView('login');
        setStep(1);
        setEmailOrUsername('');
        setOtp('');
        setNewPassword('');
        setConfirmNewPassword('');
        setError('');
        setSuccessMessage('');
      }, 1500);
    } catch (err: any) {
      const errorMessage = err.detail || err.message || 'Failed to reset password. Please try again.';
      setError(errorMessage);
      showToast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForgotPasswordState = () => {
    setStep(1);
    setEmailOrUsername('');
    setOtp('');
    setNewPassword('');
    setConfirmNewPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setError('');
    setSuccessMessage('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200">
        <div className="text-center mb-8">
          <LogIn className="w-16 h-16 text-[var(--color-primary-950)] mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800">
            {view === 'login' ? 'Admin Login' : 'Reset Password'}
          </h1>
          <p className="text-gray-600 text-sm mt-2">
            {view === 'login' ? 'Access your STARA admin panel' : 'Reset your admin password'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md border-l-4 border-red-500 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md border-l-4 border-green-500">
            <p className="font-medium">{successMessage}</p>
          </div>
        )}

        {view === 'login' ? (
          <>
            {/* Google Login Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-50 mb-4 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                  <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                  <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                  <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
                </g>
              </svg>
              {isLoading ? 'Signing In...' : 'Sign in with Google'}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or sign in with username</span>
              </div>
            </div>

            {/* Username/Password Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="username">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-md text-gray-800
                             focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent
                             transition-all duration-200"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="w-full p-3 pr-12 border border-gray-300 rounded-md text-gray-800
                               focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent
                               transition-all duration-200"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setView('forgot-password');
                    resetForgotPasswordState();
                  }}
                  className="text-sm text-[var(--color-primary-950)] hover:underline mt-2 block text-right focus:outline-none"
                  disabled={isLoading}
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                className={`w-full py-3 px-4 rounded-md text-white font-semibold shadow-md transition-all duration-200
                           flex items-center justify-center gap-2
                           ${isLoading
                             ? 'bg-gray-400 cursor-not-allowed opacity-80'
                             : 'bg-[var(--color-primary-950)] hover:bg-[color:var(--color-primary-950)]/90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary-950)]'
                           }`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5" />
                    Logging in...
                  </>
                ) : (
                  'Login to Dashboard'
                )}
              </button>
            </form>
          </>
        ) : (
          /* Forgot Password View */
          <>
            <button
              onClick={() => {
                setView('login');
                resetForgotPasswordState();
              }}
              className="flex items-center gap-2 text-[var(--color-primary-950)] hover:underline mb-4 focus:outline-none"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>

            {step === 1 && (
              <form onSubmit={handleRequestOtp} className="space-y-5">
                <div>
                  <label htmlFor="emailOrUsername" className="block text-sm font-medium text-gray-700 mb-2">
                    Email or Username
                  </label>
                  <input
                    id="emailOrUsername"
                    name="emailOrUsername"
                    type="text"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent transition duration-200"
                    placeholder="Enter your email or username"
                    required
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[var(--color-primary-950)] text-white py-3 px-4 rounded-md hover:bg-[#124a62] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:ring-opacity-50 transition duration-200 flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 mr-3" />
                      Sending OTP...
                    </>
                  ) : (
                    'Send Reset OTP'
                  )}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <p className="text-center text-sm text-gray-600 mb-4">
                  An OTP has been sent to {emailOrUsername}. Please enter it below.
                </p>
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                    Enter OTP
                  </label>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent transition duration-200"
                    required
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[var(--color-primary-950)] text-white py-3 px-4 rounded-md hover:bg-[#124a62] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:ring-opacity-50 transition duration-200 flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 mr-3" />
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
              <form onSubmit={handleSetNewPassword} className="space-y-5">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-3 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent transition duration-200"
                      required
                      disabled={isLoading}
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

                <div>
                  <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmNewPassword"
                      name="confirmNewPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full p-3 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent transition duration-200"
                      required
                      disabled={isLoading}
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
                  className="w-full bg-[var(--color-primary-950)] text-white py-3 px-4 rounded-md hover:bg-[#124a62] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:ring-opacity-50 transition duration-200 flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 mr-3" />
                      Setting Password...
                    </>
                  ) : (
                    'Set New Password'
                  )}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}