// middleware.ts (in project root)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  
  // Define public paths that don't require authentication
  const publicPaths = [
    '/account/login',
    '/account/register',
    '/account/forgot-password',
  ];
  
  // Define admin paths
  const isAdminPath = path.startsWith('/admin');
  const isAdminLoginPath = path === '/admin/login';
  
  // Check if user is authenticated
  const isAuthenticated = request.cookies.has('auth-token');
  
  // Check if admin is authenticated
  const isAdminAuthenticated = request.cookies.has('admin-auth-token');

  // Redirect logic for user account pages
  if (
    path.startsWith('/account') && 
    !publicPaths.includes(path) && 
    !isAuthenticated
  ) {
    return NextResponse.redirect(new URL('/account/login', request.url));
  }
  
  // Redirect logic for admin pages
  if (isAdminPath && !isAdminLoginPath && !isAdminAuthenticated) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

// Define paths that should be checked by the middleware
export const config = {
  matcher: ['/account/:path*', '/admin/:path*'],
};