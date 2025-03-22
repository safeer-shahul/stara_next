// app/admin/login/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiService from '@/utils/api/apiService';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Check if already logged in - with proper error handling
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          // Verify if user is admin
          const userProfile = await apiService.getUserProfile();
          if (userProfile.is_admin) {
            // Already logged in, redirect to admin dashboard
            router.push('/admin');
          }
        } catch (error) {
          // Token invalid, clear it
          console.error('Auth check failed:', error);
          // localStorage.removeItem('accessToken');
        }
      }
    };
   
    // Only run the check if there's a token
    if (localStorage.getItem('accessToken')) {
      checkAuth();
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
   
    try {
      // Call the login API to get token
      console.log('Logging in with:', username);
      const tokenResponse = await apiService.getAuthorizationToken(username, password);
     
      // Store the access token in localStorage - using the access token for authorization
      localStorage.setItem('accessToken', tokenResponse.access);
      
      // Optionally store the refresh token if you need it for token refresh later
      localStorage.setItem('refreshToken', tokenResponse.refresh);
      
      console.log('Token saved:', tokenResponse.access);
     
      // Need to wait a moment to ensure the token is available
      // for the next API call through the interceptor
      setTimeout(async () => {
        try {
          // Fetch user details to check if user is admin
          const userDetails = await apiService.getUserProfile();
          console.log('User profile:', userDetails);
         
          if (userDetails.is_superuser) {
            // User is an admin, redirect to admin dashboard
            console.log('User is superuser, redirecting to admin');
            router.push('/admin');
          } else {
            // User is not an admin
            console.log('User is not superuser:', userDetails);
            setError('You do not have admin privileges');
            if (typeof window !== 'undefined') {
              window.localStorage.removeItem('accessToken');
              window.localStorage.removeItem('refreshToken');
            }
            setIsLoading(false);
          }
        } catch (profileError) {
          console.error('Profile fetch failed:', profileError);
          setError('Failed to verify admin privileges');
          localStorage.removeItem('accessToken');
          setIsLoading(false);
        }
      }, 100); // Small delay to ensure token is saved
    } catch (error) {
      console.error('Login failed:', error);
      setError('Invalid username or password');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">STARA Admin Login</h1>
       
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
       
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              className="w-full p-2 border border-gray-300 rounded"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
         
          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full p-2 border border-gray-300 rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
         
          <button
            type="submit"
            className="w-full bg-gray-800 text-white py-2 px-4 rounded hover:bg-gray-700 disabled:bg-gray-400"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}