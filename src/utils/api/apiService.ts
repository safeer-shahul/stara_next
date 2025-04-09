import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Configuration
const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000',
  TIMEOUT: 10000,
};

// User profile interface
interface UserProfile {
  id?: string;
  name?: string;
  email?: string;
  username?: string;
  is_admin: boolean;
  [key: string]: any;
}

class ApiService {
  private static instance: ApiService;
  private apiClient: AxiosInstance;
  private publicApiClient: AxiosInstance;

  private constructor() {
    this.apiClient = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
    });

    this.publicApiClient = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
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
      const token = window.localStorage.getItem('accessToken');
      console.log('Retrieved access token from localStorage:', token ? `${token.substring(0, 10)}...` : 'null');
      return token;
    }
    return null;
  }

  private setupInterceptors(): void {
    // Request interceptor for authenticated requests
    this.apiClient.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const accessToken = this.getAccessToken();
        
        // Only add authorization header if token exists
        if (accessToken && config.headers) {
          console.log('Adding token to request:', config.url);
          config.headers['Authorization'] = `Bearer ${accessToken}`;
        } else {
          console.log('No token available for request:', config.url);
        }
  
        if (config.headers) {
          config.headers['X-Requested-With'] = 'XMLHttpRequest';
          
          // Don't set content-type for FormData
          if (!config.headers['Content-Type'] && !(config.data instanceof FormData)) {
            config.headers['Content-Type'] = 'application/json';
          }
        }
  
        return config;
      },
      (error) => Promise.reject(error)
    );
  
    this.apiClient.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        if (error.config) {
          const started = Date.now();
          const elapsed = Date.now() - started;
          console.log(`Request for ${error.config?.url} failed after ${elapsed} ms.`);
        }

        if (error.response?.status === 401) {
          // Handle unauthorized access
          if (typeof window !== 'undefined') {
            if (window.location.pathname.startsWith('/admin') && 
                window.location.pathname !== '/admin/login') {
              console.log('Unauthorized access, redirecting to login');
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              window.location.href = '/admin/login';
            } else {
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
            }
          }
        }
        return Promise.reject(error);
      }
    );

    this.publicApiClient.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (config.headers) {
          config.headers['X-Requested-With'] = 'XMLHttpRequest';
          
          if (!config.headers['Content-Type'] && !(config.data instanceof FormData)) {
            config.headers['Content-Type'] = 'application/json';
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  private getHeaders(isFormData: boolean = false, propagation: number = 0): Record<string, string> {
    const headers: Record<string, string> = {
      'X-Requested-With': 'XMLHttpRequest',
    };

    if (propagation > 0) {
      headers['propagation'] = propagation.toString();
    }

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const accessToken = this.getAccessToken();
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    return headers;
  }

  private getPublicHeaders(isFormData: boolean = false, propagation: number = 0): Record<string, string> {
    const headers: Record<string, string> = {
      'X-Requested-With': 'XMLHttpRequest',
    };

    if (propagation > 0) {
      headers['propagation'] = propagation.toString();
    }

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    
    return headers;
  }

  public async getAuthorizationToken(username: string, password: string): Promise<{ refresh: string, access: string }> {
    try {
      const payload = {
        username: username,
        password: password
      };
      
      console.log('Requesting token with payload:', { username });
      
      const response = await this.publicApiClient.post<{ refresh: string, access: string }>(
        '/api/token/', 
        payload
      );
      
      console.log('Token response received:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in getAuthorizationToken:', error);
      throw error;
    }
  }

  public async getUserProfile(): Promise<UserProfile> {
    try {
      const token = this.getAccessToken();
      console.log('Fetching user profile with token:', token ? 'Token exists' : 'No token');
      
      if (!token) {
        throw new Error('No access token available');
      }
      
      const response = await this.get<UserProfile>('/user/me');
      console.log('User profile response:', response);
      return response;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  public logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/admin/login';
    }
  }

  public async get<T>(url: string, propagation: number = 0): Promise<T> {
    try {
      console.log(`Making GET request to ${url}`);
      const response = await this.apiClient.get<T>(url, {
        headers: this.getHeaders(false, propagation),
      });
      return response.data;
    } catch (error) {
      console.error(`Error in GET request to ${url}:`, error);
      throw error;
    }
  }

  public async getPublic<T>(url: string, propagation: number = 0): Promise<T> {
    try {
      console.log(`Making public GET request to ${url}`);
      const response = await this.publicApiClient.get<T>(url, {
        headers: this.getPublicHeaders(false, propagation),
      });
      return response.data;
    } catch (error) {
      console.error(`Error in public GET request to ${url}:`, error);
      throw error;
    }
  }

  public async post<T>(url: string, data: any, propagation: number = 0, isFormData: boolean = false): Promise<T> {
    try {
      const response = await this.apiClient.post<T>(url, data, {
        headers: this.getHeaders(isFormData, propagation),
      });
      return response.data;
    } catch (error) {
      console.error('Error in POST request:', error);
      throw error;
    }
  }

  public async postPublic<T>(url: string, data: any, propagation: number = 0, isFormData: boolean = false): Promise<T> {
    try {
      const response = await this.publicApiClient.post<T>(url, data, {
        headers: this.getPublicHeaders(isFormData, propagation),
      });
      return response.data;
    } catch (error) {
      console.error('Error in public POST request:', error);
      throw error;
    }
  }

  public async put<T>(url: string, data: any, propagation: number = 0): Promise<T> {
    try {
      const response = await this.apiClient.put<T>(url, data, {
        headers: this.getHeaders(false, propagation),
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
        headers: this.getHeaders(false, propagation),
      });
      return response.data;
    } catch (error) {
      console.error('Error in DELETE request:', error);
      throw error;
    }
  }

  public async createCategory(categoryName: string, categoryImage: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('category_name', categoryName);
      formData.append('category_image', categoryImage);
      
      const response = await this.post<any>('/category/create_category', formData, 0, true);
      return response;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  public async getPaginatedCategories(page: number = 1, pageSize: number = 10): Promise<{
    results: Array<{
      id: string; 
      category_name: string;
      category_image: string | null; 
      slug: string;
    }>;
    count: number;
    next: string | null;
    previous: string | null;
  }> {
    try {
      const response = await this.get<any>(`/category/get_paginated_category?page=${page}&page_size=${pageSize}`);
      return response;
    } catch (error) {
      console.error('Error fetching paginated categories:', error);
      throw error;
    }
  }

  public async getAllCategories(): Promise<Array<{
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
    sub_categories:any[]
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
      
      if (productIds && productIds.length > 0) {
        url += `&ids=${productIds}`;
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
      
      const response = await this.getPublic<any>(url);
      return response;
    } catch (error) {
      console.error('Error fetching paginated products:', error);
      throw error;
    }
  }

  public async createHomeCategory(categoryName: string, products: any[]): Promise<any> {
    try {
      const data = {
        name:categoryName,
        product_ids:products
      }
      
      const response = await this.post<any>('/home_category/create', data);
      return response;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  public async getHomeCategories(): Promise<any> {
    try {
      const response = await this.getPublic<any>(`/home_category/get_all_product`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  public async getProductByID(id:any): Promise<any> {
    try {
      const response = await this.getPublic<any>(`/products/get_by_id/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  public async googleKeyVerify(data:any): Promise<any> {
    try {
      const response = await this.post<any>('/user/firebase-login', data);
      return response;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }


  public async getAddresses(): Promise<any> {
    try {
      const response = await this.get<any>(`/address/get_address`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  public async addAddress(data:any): Promise<any> {
    try {
      const response = await this.post<any>('/address/add_address', data);
      return response;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  public async getUserCart(): Promise<any> {
    try {
      const response = await this.get<any>(`/cart/get_my_cart`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  public async addToCart(data:any): Promise<any> {
    try {
      const response = await this.post<any>('/cart/add_to_cart', data);
      return response;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  public async getProductAmountDetailed(data:any): Promise<any> {
    try {
      const response = await this.post<any>('/products/get_product_amount', data);
      return response;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

}

const apiService = ApiService.getInstance();
export default apiService;