import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig, AxiosError } from 'axios';
import Swal from 'sweetalert2';
import { showToast } from '../toast';

// Configuration
const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000',
  TIMEOUT: 30000,
};

// User profile interface (updated for is_superuser and is_staff)
interface UserProfile {
  id?: string;
  name?: string;
  email?: string;
  username?: string;
  is_superuser?: boolean; // Reflects Django's is_superuser
  is_staff?: boolean;     // Reflects Django's is_staff
  [key: string]: any;
}

// Interfaces for new auth flows
interface TokenResponse {
  refresh: string;
  access: string;
}

interface MessageResponse {
  message: string;
}

class ApiService {
  private static instance: ApiService;
  private apiClient: AxiosInstance;
  private publicApiClient: AxiosInstance; // For unauthenticated requests
  private isRefreshing = false;
  private failedQueue: { resolve: (value: unknown) => void; reject: (reason?: any) => void; config: InternalAxiosRequestConfig }[] = [];

  private constructor() {
    this.apiClient = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    this.publicApiClient = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    this.setupInterceptors();
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('accessToken');
    }
    return null;
  }

  private getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('refreshToken');
    }
    return null;
  }

  private processQueue(error: any | null = null): void {
    while (this.failedQueue.length) {
      const promise = this.failedQueue.shift();
      if (promise) {
        if (error) {
          promise.reject(error);
        } else {
          // If no error, resolve with the new token or re-run the request
          promise.resolve(null); // This 'null' will eventually be replaced by the retried request's response
        }
      }
    }
  }

  private setupInterceptors(): void {
    // Request interceptor for authenticated requests (apiClient)
    this.apiClient.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const accessToken = this.getAccessToken();
        if (accessToken && config.headers) {
          config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        // Handle FormData specific headers if not already set by Axios
        if (config.data instanceof FormData && config.headers) {
          delete config.headers['Content-Type']; // Browser sets this automatically for FormData
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for authenticated requests (apiClient)
    this.apiClient.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;

        // If no response or no config, reject
        if (!error.response || !originalRequest) {
          return Promise.reject(error);
        }

        const status = error.response.status;
        const refreshToken = this.getRefreshToken();

        // Handle 401 Unauthorized for token refresh
        if (status === 401 && originalRequest.url !== '/api/token/refresh/') {
          if (this.isRefreshing) {
            // Add original request to queue if a refresh is already in progress
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ config: originalRequest, resolve, reject });
            })
            .then(() => axios.request(originalRequest)) // Re-attempt original request
            .catch((err) => Promise.reject(err));
          }

          this.isRefreshing = true; // Mark refresh in progress

          return new Promise(async (resolve, reject) => {
            if (refreshToken) {
              try {
                // Attempt to refresh the token
                const refreshResponse = await this.publicApiClient.post<TokenResponse>('/api/token/refresh/', { refresh: refreshToken });
                const newAccessToken = refreshResponse.data.access;
                localStorage.setItem('accessToken', newAccessToken);

                // Update original request with new token and retry
                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

                this.processQueue(null); // Resolve all pending requests
                resolve(axios.request(originalRequest)); // Resolve with the retried original request
              } catch (refreshError: any) {
                console.error('Token refresh failed:', refreshError);
                this.logout(true); // Forced logout without Swal, triggered by error
                this.processQueue(refreshError); // Reject all pending requests
                reject(refreshError); // Reject the current request
              } finally {
                this.isRefreshing = false; // Reset refresh flag
              }
            } else {
              // No refresh token available, logout the user
              this.logout(true); // Forced logout without Swal
              this.processQueue(error); // Reject all pending requests with the original error
              reject(error); // Reject the current request
            }
          });
        }
        // Handle other 401s or 403s if not related to token expiration or for other specific cases
        else if (status === 403) {
            Swal.fire({
                icon: 'error',
                title: 'Access Denied',
                text: 'You do not have permission to perform this action.',
                showConfirmButton: true,
            });
            // If it's a 403 and not a token issue, just reject the promise
            return Promise.reject(error);
        }
        // For other errors, just reject the promise
        return Promise.reject(error);
      }
    );

    // Request interceptor for public requests (publicApiClient)
    this.publicApiClient.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (config.data instanceof FormData && config.headers) {
          delete config.headers['Content-Type'];
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    // No response interceptor for publicApiClient needed for token refresh
  }

  // Unified logout method
 // Don't forget to import your toast utility and router at the top of your file
// import { showToast } from '@/utils/toast';
// import { useRouter } from 'next/router'; // or 'next/navigation' for App Router

public async logout(silent: boolean = false, router?: any): Promise<void> {
  if (typeof window !== 'undefined') {
    // 🔄 STEP 1: Save current cart to localStorage before logout
    try {
      console.log('💾 Preserving cart state before logout...');
      
      // Trigger cart context to save current state
      window.dispatchEvent(new CustomEvent('beforeLogout'));
      
      // Give time for cart context to respond
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('✅ Cart state preserved for guest mode');
    } catch (error) {
      console.error('❌ Error preserving cart state:', error);
    }

    // 🗑️ STEP 2: Clear authentication tokens and conditionally clear admin data
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    const adminUserData = localStorage.getItem('adminUserData');
    if (adminUserData) {
      try {
        const userData = JSON.parse(adminUserData);
        if (userData.is_superuser) {
          console.log('🔧 Clearing admin user data for admin user');
          localStorage.removeItem('adminUserData');
        }
      } catch (error) {
        console.error('Error parsing admin user data during logout:', error);
        localStorage.removeItem('adminUserData');
      }
    }
    
    // Clear regular user data
    localStorage.removeItem('me');
    
    // 📢 STEP 3: Notify components about logout
    window.dispatchEvent(new Event('userLoggedOut'));

    // 🎉 STEP 4: Show success toast (only if not silent)
    if (!silent) {
      showToast.success('Successfully logged out!');
    }

    const currentPath = window.location.pathname;

    // Small delay to let the toast show before redirect
    setTimeout(() => {
      if (currentPath.startsWith('/admin') && currentPath !== '/admin/login') {
        router?.push('/admin/login') || (window.location.href = '/admin/login');
      } else {
        router?.push('/') || (window.location.href = '/');
      }
    }, 500);
  }
}

  // Optional: Add method to check if user can logout safely
  public async canLogoutSafely(): Promise<boolean> {
    try {
      // Check if cart has unsaved changes
      const cartItems = localStorage.getItem('cartItems');
      const hasUnsavedCart = cartItems && JSON.parse(cartItems).length > 0;
      
      if (hasUnsavedCart) {
        console.log('🛒 Cart has items that will be preserved during logout');
      }
      
      return true; // Always allow logout, but inform user
    } catch (error) {
      console.error('❌ Error checking logout safety:', error);
      return true; // Default to allowing logout
    }
  }

  // Optional: Add method to restore cart after login
  public async restoreCartAfterLogin(): Promise<void> {
    try {
      console.log('🔄 Checking for cart restoration after login...');
      
      // This is handled automatically by cartContext, but can be called manually
      window.dispatchEvent(new CustomEvent('afterLogin'));
      
      console.log('✅ Cart restoration event dispatched');
    } catch (error) {
      console.error('❌ Error dispatching cart restoration event:', error);
    }
  }

  // --- Core API Request Methods ---

  public async getAuthorizationToken(username: string, password: string): Promise<TokenResponse> {
    try {
      const payload = { username, password };
      const response = await this.publicApiClient.post<TokenResponse>('/api/token/', payload);
      return response.data;
    } catch (error) {
      console.error('Error in getAuthorizationToken:', error);
      throw error;
    }
  }

  public async getUserProfile(): Promise<UserProfile> {
    try {
      const token = this.getAccessToken();
      // console.log('Fetching user profile with token:', token ? 'Token exists' : 'No token');
      
      if (!token) {
        throw new Error('No access token available');
      }
      
      const response = await this.get<UserProfile>('/user/me');
      // console.log('User profile response:', response);
      return response;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  public async get<T>(url: string, propagation: number = 0): Promise<T> {
    try {
      const response = await this.apiClient.get<T>(url, {
        headers: propagation > 0 ? { propagation: propagation.toString() } : undefined,
      });
      return response.data;
    } catch (error) {
      console.error(`Error in GET request to ${url}:`, error);
      throw error;
    }
  }

  public async getPublic<T>(url: string, propagation: number = 0): Promise<T> {
    try {
      const response = await this.publicApiClient.get<T>(url, {
        headers: propagation > 0 ? { propagation: propagation.toString() } : undefined,
      });
      return response.data;
    } catch (error) {
      console.error(`Error in public GET request to ${url}:`, error);
      throw error;
    }
  }

  public async post<T>(url: string, data: any, isFormData: boolean = false): Promise<T> {
    try {
      const headers: Record<string, string> = {};
      if (isFormData) {
        // Axios sets Content-Type for FormData automatically
      } else {
        headers['Content-Type'] = 'application/json';
      }

      const response = await this.apiClient.post<T>(url, data, { headers });
      return response.data;
    } catch (error) {
      console.error('Error in POST request:', error);
      throw error;
    }
  }

  public async postPublic<T>(url: string, data: any, isFormData: boolean = false): Promise<T> {
    try {
      const headers: Record<string, string> = {};
      if (isFormData) {
        // Axios sets Content-Type for FormData automatically
      } else {
        headers['Content-Type'] = 'application/json';
      }

      const response = await this.publicApiClient.post<T>(url, data, { headers });
      return response.data;
    } catch (error) {
      console.error('Error in public POST request:', error);
      throw error;
    }
  }

  public async put<T>(url: string, data: any, propagation: number = 0): Promise<T> {
    try {
      const response = await this.apiClient.put<T>(url, data, {
        headers: propagation > 0 ? { propagation: propagation.toString() } : undefined,
      });
      return response.data;
    } catch (error) {
      console.error('Error in PUT request:', error);
      throw error;
    }
  }

  public async delete<T>(url: string, propagation: number = 0): Promise<T> {
    try {
      const response = await this.apiClient.delete<T>(url, {
        headers: propagation > 0 ? { propagation: propagation.toString() } : undefined,
      });
      return response.data;
    } catch (error) {
      console.error('Error in DELETE request:', error);
      throw error;
    }
  }

  // --- New User Authentication/Registration/Password Reset Methods ---

  // Login (renamed for clarity with getAuthorizationToken)
  public async login(username: string, password: string): Promise<TokenResponse> {
    return this.getAuthorizationToken(username, password);
  }

  // Registration: Send OTP
  public async sendOtp(data: { contact: string }): Promise<MessageResponse> {
    const response = await this.postPublic<MessageResponse>('/user/send-otp/', data);
    return response;
  }

  // Registration: Verify OTP
  public async verifyOtp(data: { contact: string; otp: string }): Promise<{ username: string } & MessageResponse> {
    const response = await this.postPublic<{ username: string } & MessageResponse>('/user/verify-otp/', data);
    return response;
  }

  // Registration: Set Password (final step, also logs in)
  public async setPassword(data: { username: string; password: string }): Promise<TokenResponse> {
    const response = await this.postPublic<TokenResponse>('/user/set-password/', data);
    return response;
  }

  // Password Reset: Request OTP
  public async requestPasswordResetOtp(data: { email_or_username: string }): Promise<MessageResponse> {
    const response = await this.postPublic<MessageResponse>('/user/request-password-reset-otp/', data); // Use public as unauthenticated
    return response;
  }

  // Password Reset: Verify OTP
  public async verifyPasswordResetOtp(data: { email_or_username: string; otp: string }): Promise<MessageResponse> {
    const response = await this.postPublic<MessageResponse>('/user/verify-password-reset-otp/', data); // Use public as unauthenticated
    return response;
  }

  // Password Reset: Confirm New Password
  public async confirmPasswordReset(data: { email_or_username: string; otp: string; new_password: string }): Promise<MessageResponse> {
    const response = await this.postPublic<MessageResponse>('/user/confirm-password-reset/', data); // Use public as unauthenticated
    return response;
  }

  // --- Existing Methods ---

  public async createCategory(categoryName: string, categoryImage: File | null, categoryId?: string): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('category_name', categoryName);
      
      // Only append image if it exists
      if (categoryImage) {
        formData.append('category_image', categoryImage);
      }
      
      if (categoryId) {
        formData.append('id', categoryId);
      }
      
      return await this.post<any>('/category/create_category', formData, true);
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  public async getPaginatedCategories(
    page: number = 1,
    pageSize: number = 10,
    searchQuery?: string
  ): Promise<any> {
    try {
      let url = `/category/get_paginated_category?page=${page}&page_size=${pageSize}`;
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      return await this.get<any>(url);
    } catch (error) {
      console.error('Error fetching paginated categories:', error);
      throw error;
    }
  }

  public async getAllCategories(): Promise<Array<{
    sub_categories?: any;
    id: string;
    category_name: string;
    category_image: string | null;
    slug: string;
  }>> {
    try {
      const response = await this.get<any>(`/category/get_paginated_category?page=1&page_size=1000&get_sub_category=true`);
      return response.results;
    } catch (error) {
      console.error('Error fetching all categories:', error);
      throw error;
    }
  }

  public async getAllCategoriesPublic(): Promise<Array<{
    id: string;
    category_name: string;
    category_image: string | null;
    slug: string;
    sub_categories: any[]
  }>> {
    try {
      const response = await this.getPublic<any>(`/category/get_paginated_category?page=1&page_size=1000&get_sub_category=true`);
      return response.results;
    } catch (error) {
      console.error('Error fetching all categories (public):', error);
      throw error;
    }
  }


  public async getPaginatedProducts(
    page: number = 1,
    pageSize: number = 10,
    searchQuery?: string,
    productIds?: string[],
    filters?: {
      subcategory_id?: string | number,
      min_price?: number,
      max_price?: number,
      sort_by?: string
    }
  ): Promise<any> {
    try {
      let url = `/products/get_all_products?page=${page}&page_size=${pageSize}`;
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      if (productIds && productIds.length > 0) {
        url += `&ids=${productIds.join(',')}`;
      }
      if (filters) {
        if (filters.subcategory_id) {
          url += `&sub_category=${filters.subcategory_id}`;
        }
        if (filters.min_price) {
          url += `&min_price=${filters.min_price}`;
        }
        if (filters.max_price) {
          url += `&max_price=${filters.max_price}`;
        }
        if (filters.sort_by) {
          url += `&sort_by=${filters.sort_by}`;
        }
      }
      return await this.getPublic<any>(url);
    } catch (error) {
      console.error('Error fetching paginated products:', error);
      throw error;
    }
  }

  public async createHomeCategory(data: any): Promise<any> {
    try {
      return await this.post<any>('/home_category/create', data);
    } catch (error) {
      throw error;
    }
  }

  public async getHomeCategories(): Promise<any> {
    try {
      return await this.getPublic<any>(`/home_category/get_all_product`);
    } catch (error) {
      throw error;
    }
  }

  public async getProductByID(id: any): Promise<any> {
    try {
      return await this.getPublic<any>(`/products/get_by_id/${id}`);
    } catch (error) {
      throw error;
    }
  }

  public async googleKeyVerify(data: any): Promise<any> {
    try {
      return await this.post<any>('/user/firebase-login', data);
    } catch (error) {
      throw error;
    }
  }


  public async getAddresses(): Promise<any> {
    try {
      return await this.get<any>(`/address/get_address`);
    } catch (error) {
      throw error;
    }
  }

  public async addAddress(data: any): Promise<any> {
    try {
      return await this.post<any>('/address/add_address', data);
    } catch (error) {
      throw error;
    }
  }

  public async getUserCart(): Promise<any> {
    try {
      return await this.get<any>(`/cart/get_my_cart`);
    } catch (error) {
      throw error;
    }
  }

  public async addToCart(data: any): Promise<any> {
    try {
      return await this.post<any>('/cart/add_to_cart', data);
    } catch (error) {
      throw error;
    }
  }

  public async getProductAmountDetailed(data: any): Promise<any> {
    try {
      return await this.post<any>('/products/get_product_amount', data);
    } catch (error) {
      throw error;
    }
  }

  public async createProductsOrder(data: any): Promise<any> {
    try {
      return await this.post<any>('/order/place_order', data);
    } catch (error) {
      throw error;
    }
  }

  public async verifyPayment(data: any): Promise<any> {
    try {
      return await this.post<any>('/order/verify_payment', data);
    } catch (error) {
      throw error;
    }
  }

  public async getMyOrders(): Promise<any> {
    try {
      return await this.get<any>(`/order/get_my_orders`);
    } catch (error) {
      throw error;
    }
  }

  public async addToWishlist(data: any): Promise<any> {
    try {
      return await this.post<any>('/wishlist/create_wishlist', data);
    } catch (error) {
      throw error;
    }
  }

  public async getWishlist(): Promise<any> {
    try {
      return await this.get<any>(`/wishlist/get_all_wishlist_on_product`);
    } catch (error) {
      throw error;
    }
  }

  public async homeCategoryByID(id: any): Promise<any> {
    try {
      return await this.get<any>(`/home_category/get_home_category_by_id/${id}`);
    } catch (error) {
      throw error;
    }
  }

  public async getPaginatedOrders(
    page: number = 1,
    pageSize: number = 10,
    options?: {
      order_mode?: string; // New: for staff/admin filters
      sort_order?: 'asc' | 'desc'; // New: 'asc' or 'desc'
      start_date?: string; // New: YYYY-MM-DD
      end_date?: string; // New: YYYY-MM-DD
      order_id?: string; // New: for search
      phone_number?: string; // New: for search
    }
  ): Promise<any> {
    try {
      let url = `/order/get_all_orders?page=${page}&page_size=${pageSize}`;

      if (options?.order_mode) {
        url += `&order_mode=${options.order_mode}`;
      }
      if (options?.sort_order) {
        url += `&sort_order=${options.sort_order}`;
      }
      if (options?.start_date) {
        url += `&start_date=${options.start_date}`;
      }
      if (options?.end_date) {
        url += `&end_date=${options.end_date}`;
      }
      if (options?.order_id) {
        url += `&order_id=${options.order_id}`;
      }
      if (options?.phone_number) {
        url += `&phone_number=${options.phone_number}`;
      }

      return await this.get<any>(url);
    } catch (error) {
      console.error('Error fetching paginated orders:', error);
      throw error;
    }
  }

  public async assignOrdersToMe(orderIds: string[]): Promise<any> {
    return this.post('/order/claim_orders', { order_ids: orderIds });
  }

  public async markOrderAsPacked(orderId: string,packing_status:boolean): Promise<any> {
    return this.post(`/order/update_order_packing_status/${orderId}`, { packing_status: packing_status });
  }

  public async updateOrderStatus(orderId: string,packing_status:any): Promise<any> {
    return this.put(`/order/order_status_update/${orderId}`, { status: packing_status.status });
  }

  public async getOrderById(id: any): Promise<any> {
    try {
      return await this.get<any>(`/order/get_order_by_id/${id}`);
    } catch (error) {
      throw error;
    }
  }

  public async getHeroBanners(): Promise<any> {
    try {
      return await this.getPublic<any>(`/hero/get_hero`);
    } catch (error) {
      throw error;
    }
  }

  public async createHeroBanner(data: any): Promise<any> {
    try {
      return await this.post<any>('/hero/create_hero', data, true);
    } catch (error) {
      throw error;
    }
  }

  public async getHeroBannerById(id: any): Promise<any> {
    try {
      return await this.get<any>(`/hero/get_hero_by_id/${id}`);
    } catch (error) {
      throw error;
    }
  }

  public async getMyWishlist(): Promise<any> {
    try {
      return await this.get<any>(`/wishlist/get_all_wishlist`);
    } catch (error) {
      throw error;
    }
  }

  public async getCategoryById(id: any): Promise<any> {
    try {
      return await this.get<any>(`/category/get_category/${id}`);
    } catch (error) {
      throw error;
    }
  }

  public async getAllOffers(): Promise<any> {
    try {
      return await this.get<any>(`/offers/offers/all`);
    } catch (error) {
      throw error;
    }
  }

  public async getValidOffers(): Promise<any> {
    try {
      return await this.get<any>(`/offers/offers/valid`);
    } catch (error) {
      throw error;
    }
  }

  public async offerByID(id: any): Promise<any> {
    try {
      return await this.get<any>(`/offers/get_offers/${id}`);
    } catch (error) {
      throw error;
    }
  }

  public async createOffer(data: any): Promise<any> {
    try {
      return await this.post<any>('/offers/create_offer', data, true);
    } catch (error) {
      throw error;
    }
  }

  public async getAllCoupons(): Promise<any> {
    try {
      return await this.get<any>(`/coupon/get_all_coupons`);
    } catch (error) {
      throw error;
    }
  }

  public async createCoupon(data: any): Promise<any> {
    try {
      return await this.post<any>('/coupon/add_coupon', data, true);
    } catch (error) {
      throw error;
    }
  }

  public async couponByID(id: any): Promise<any> {
    try {
      return await this.get<any>(`/coupon/get_coupon/${id}`);
    } catch (error) {
      throw error;
    }
  }

  public async addToCartOffer(data: any): Promise<any> {
    try {
      return await this.post<any>('/cart/add_to_cart_by_offer', data);
    } catch (error) {
      throw error;
    }
  }

  public async getAllStaffes(): Promise<any> {
    try {
      return await this.get<any>(`/user/get_all_staff_users`);
    } catch (error) {
      throw error;
    }
  }

  public async saveStaff(data: any): Promise<any> {
    try {
      return await this.post<any>('/user/create_staff_user', data);
    } catch (error) {
      throw error;
    }
  }

  public async getStaffById(id: any): Promise<any> {
    try {
      return await this.get<any>(`/user/get_staff_user_by_id/${id}`);
    } catch (error) {
      throw error;
    }
  }

  public async updateStaffStatus(id: any, data: any): Promise<any> {
    try {
      return await this.put<any>(`/user/update_user_is_active/${id}`, data);
    } catch (error) {
      throw error;
    }
  }

  public async getOrderByIdUser(id: any): Promise<any> {
    try {
      return await this.get<any>(`/order/get_order_by_id_user/${id}`);
    } catch (error) {
      throw error;
    }
  }

  public async cancelOrder(id: any, data: any): Promise<any> {
    try {
      return await this.put<any>(`/order/order_cancel/${id}`, data);
    } catch (error) {
      throw error;
    }
  }

  public async requestReplacement(data: any): Promise<any> {
    try {
      return await this.post<any>('/order/create_replacement_request', data,true);
    } catch (error) {
      throw error;
    }
  }

  public async adminDashboardData(): Promise<any> {
    try {
      return await this.get<any>(`/dashboard/admin_dashboard`);
    } catch (error) {
      throw error;
    }
  }


public async getPaginatedReplacementRequests(
  page: number = 1,
  pageSize: number = 10,
  options?: {
    status?: string | null;
  }
): Promise<any> {
  try {
    let url = `/order/get_all_replacements?page=${page}&page_size=${pageSize}`;
    
    // Add status parameter if it exists and is not null
    if (options?.status && options.status !== 'all') {
      url += `&status=${encodeURIComponent(options.status)}`;
    }
    
    return await this.get<any>(url);
  } catch (error) {
    console.error('Error fetching paginated replacement requests:', error);
    throw error;
  }
}

public async getByReplacementId(id: any): Promise<any> {
    try {
      return await this.get<any>(`/order/get_replacement_req_by_id/${id}`);
    } catch (error) {
      throw error;
    }
}

public async replacementStatusUpdate(id: string, selectedStatus: string, adminNotes: string): Promise<any> {
  try {
    const data = {
      status: selectedStatus,
      admin_notes: adminNotes,
    };
    
    return await this.put<any>(`/order/replacement_status_update/${id}`, data);
  } catch (error) {
    throw error;
  }
}

public async getMyEnquiry(): Promise<any> {
  try {
    return await this.get<any>(`/enquiry/get_my_enquiries`);
  } catch (error) {
    throw error;
  }
}

  public async createEnquiry(data: any): Promise<any> {
    try {
      return await this.post<any>('/enquiry/create_enquiry', data,true);
    } catch (error) {
      throw error;
    }
  }

}

const apiService = ApiService.getInstance();
export default apiService;