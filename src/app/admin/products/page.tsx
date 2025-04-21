// app/admin/products/page.tsx
"use client";

import Link from 'next/link';
import { Folder, Package } from 'lucide-react';

export default function ProductsPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Products Management</h2>

      {/* Admin Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
        {/* Categories Card */}
        <Link href="/admin/products/categories">
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center justify-center h-48 cursor-pointer hover:shadow-lg transition-shadow">
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <Folder className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-blue-600">Categories</h3>
            <p className="text-gray-500 text-center mt-2">Manage product categories</p>
          </div>
        </Link>

        {/* Products List Card */}
        <Link href="/admin/products/list">
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center justify-center h-48 cursor-pointer hover:shadow-lg transition-shadow">
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <Package className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-blue-600">Products</h3>
            <p className="text-gray-500 text-center mt-2">Manage product inventory</p>
          </div>
        </Link>

        <Link href="/admin/products/home-category">
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center justify-center h-48 cursor-pointer hover:shadow-lg transition-shadow">
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <Package className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-blue-600">Home Categories</h3>
            <p className="text-gray-500 text-center mt-2">Manage Home Categories</p>
          </div>
        </Link>

        <Link href="/admin/hero/list">
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center justify-center h-48 cursor-pointer hover:shadow-lg transition-shadow">
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <Package className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-blue-600">Hero Section</h3>
            <p className="text-gray-500 text-center mt-2">Manage Hero Section</p>
          </div>
        </Link>
      </div>

      {/* Dashboard Summary */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Inventory Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <p className="text-gray-500">Total Products</p>
            <p className="text-2xl font-bold">125</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-gray-500">Total Categories</p>
            <p className="text-2xl font-bold">18</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-gray-500">Low Stock Items</p>
            <p className="text-2xl font-bold text-orange-500">7</p>
          </div>
        </div>
      </div>
    </div>
  );
}