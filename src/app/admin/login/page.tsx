// app/admin/login/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiService from '@/utils/api/apiService';
import { LogIn, Loader2, XCircle } from 'lucide-react'; // Added LogIn, Loader2, XCircle icons

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // For form submission
  const router = useRouter();

  // Check if already logged in - with proper error handling and immediate redirect for admin
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          // Verify if user is admin
          const userProfile = await apiService.getUserProfile();
          if (userProfile.is_superuser) { // Changed from is_admin to is_superuser for consistency with previous components
            // Already logged in, redirect to admin dashboard
            router.push('/admin');
          } else {
            // User is logged in but not an admin, clear token and stay on login
            console.warn('User is logged in but not a superuser. Clearing tokens.');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setError('You do not have admin privileges. Please log in with an admin account.');
          }
        } catch (authError) {
          // Token invalid or API error, clear it and remain on login page
          console.error('Auth check failed:', authError);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setError('Your session expired or is invalid. Please log in again.');
        }
      }
    };

    // Run the check when the component mounts
    checkAuth();
  }, [router]); // Dependency on router to avoid lint warnings

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Call the login API to get token
      const tokenResponse = await apiService.getAuthorizationToken(username, password);

      // Store the access token in localStorage
      localStorage.setItem('accessToken', tokenResponse.access);
      localStorage.setItem('refreshToken', tokenResponse.refresh); // Store refresh token

      // Use a small timeout to allow localStorage to fully sync
      setTimeout(async () => {
        try {
          // Fetch user details to check if user is admin
          const userDetails = await apiService.getUserProfile();

          if (userDetails.is_superuser) { // Ensure consistency with is_superuser
            // User is a superuser, redirect to admin dashboard
            router.push('/admin');
          } else {
            // User is authenticated but not a superuser
            setError('You do not have admin privileges');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setIsLoading(false);
          }
        } catch (profileError) {
          console.error('Profile fetch failed or token invalid after login:', profileError);
          setError('Failed to verify admin privileges. Please try again.');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setIsLoading(false);
        }
      }, 100); // Small delay
    } catch (apiError: any) { // Catch API errors specifically
      console.error('Login request failed:', apiError);
      // More specific error message based on API response if possible
      if (apiError.response && apiError.response.data && apiError.response.data.detail) {
        setError(apiError.response.data.detail); // e.g., "No active account found with the given credentials"
      } else {
        setError('Invalid username or password. Please try again.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4"> {/* Added p-4 for mobile padding */}
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200"> {/* Increased padding, rounded-xl, shadow-lg, border */}
        <div className="text-center mb-8">
          <LogIn className="w-16 h-16 text-[var(--color-primary-950)] mx-auto mb-4" /> {/* Larger, branded icon */}
          <h1 className="text-3xl font-bold text-gray-800">Admin Login</h1> {/* Larger title */}
          <p className="text-gray-600 text-sm mt-2">Access your STARA admin panel</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md border-l-4 border-red-500 flex items-center gap-3"> {/* Consistent error styling */}
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5"> {/* Increased space between form elements */}
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
            <input
              id="password"
              type="password"
              className="w-full p-3 border border-gray-300 rounded-md text-gray-800
                         focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-950)] focus:border-transparent
                         transition-all duration-200" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="current-password" 
            />
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
      </div>
    </div>
  );
}