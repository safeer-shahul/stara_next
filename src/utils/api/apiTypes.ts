// src/utils/apiTypes.ts

// Generic request data type
export type RequestData = Record<string, any>;

// Auth related types
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// User related types
export interface UserData {
  id: string;
  name: string;
  email: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Event related types
export interface EventData {
  id: string;
  title: string;
  description: string;
  date?: string;
  location?: string;
  organizer?: string;
  status?: 'upcoming' | 'ongoing' | 'completed';
  participants?: number;
}

export interface EventCreateRequest {
  title: string;
  description: string;
  date?: string;
  location?: string;
}

// Product related types
export interface ProductData {
  id: string;
  name: string;
  price: number;
  description?: string;
  category?: string;
  inStock: boolean;
  imageUrl?: string;
}

export interface ProductCreateRequest {
  name: string;
  price: number;
  description?: string;
  category?: string;
  inStock?: boolean;
}

// File related types
export interface FileUploadResponse {
  url: string;
  filename: string;
  size?: number;
  mimeType?: string;
}

// Error response type
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Pagination types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}