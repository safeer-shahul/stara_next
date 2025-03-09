// app/admin/layout.tsx
import { ReactNode } from 'react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white">
        <div className="p-4 text-xl font-bold">STARA Admin</div>
        
        <nav className="mt-8">
          <ul>
            <li className="mb-2">
              <Link href="/admin" className="block py-2 px-4 hover:bg-gray-700">
                Dashboard
              </Link>
            </li>
            <li className="mb-2">
              <Link href="/admin/products" className="block py-2 px-4 hover:bg-gray-700">
                Products
              </Link>
            </li>
            <li className="mb-2">
              <Link href="/admin/orders" className="block py-2 px-4 hover:bg-gray-700">
                Orders
              </Link>
            </li>
            <li className="mb-2">
              <Link href="/admin/users" className="block py-2 px-4 hover:bg-gray-700">
                Users
              </Link>
            </li>
            <li className="mb-2">
              <Link href="/admin/settings" className="block py-2 px-4 hover:bg-gray-700">
                Settings
              </Link>
            </li>
            <li className="mt-8">
              <Link href="/" className="block py-2 px-4 hover:bg-gray-700">
                View Site
              </Link>
            </li>
            <li>
              <button className="block w-full text-left py-2 px-4 hover:bg-gray-700">
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow">
          <div className="p-4 flex justify-between items-center">
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <div>
              <span>Admin User</span>
            </div>
          </div>
        </header>
        
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}