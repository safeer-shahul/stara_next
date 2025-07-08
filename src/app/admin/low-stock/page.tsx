// app/admin/inventory/low-stock/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// Import all necessary icons for consistent design
import { Package, AlertTriangle, ArrowLeft, Info, Eye, Edit } from 'lucide-react';
import apiService from '@/utils/api/apiService';

// Define interface for Low Stock Item
interface LowStockItem {
  product_id: string;
  product_name: string;
  variant_id: string | null;
  variant_name: string | null;
  quantity: number;
  type: 'product' | 'variant';
}

// Define API response interface
interface LowStockResponse {
  success: boolean;
  data: LowStockItem[];
  total_items: number;
  message: string;
}

export default function LowStockListPage() {
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const router = useRouter();

  // Memoize fetchLowStock for better performance
  const fetchLowStock = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response: LowStockResponse = await apiService.getLowStock();
      if (response.success) {
        setLowStockItems(response.data);
        setTotalItems(response.total_items);
      } else {
        throw new Error(response.message || 'Failed to fetch low stock items');
      }
    } catch (err) {
      console.error('Failed to fetch low stock items:', err);
      setError('Failed to load low stock items. Please try again.');
      setLowStockItems([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLowStock();
  }, [fetchLowStock]);

  // Get display name for the item
  const getItemDisplayName = (item: LowStockItem) => {
    if (item.type === 'variant' && item.variant_name) {
      return `${item.product_name} - ${item.variant_name}`;
    }
    return item.product_name;
  };

  // Get stock status color
  const getStockStatusColor = (quantity: number) => {
    if (quantity === 0) return 'bg-red-100 text-red-800';
    if (quantity <= 5) return 'bg-orange-100 text-orange-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  // Get stock status text
  const getStockStatusText = (quantity: number) => {
    if (quantity === 0) return 'Out of Stock';
    if (quantity <= 5) return 'Critical Low';
    return 'Low Stock';
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
            
        <Link
            href="/admin"
            className="text-gray-600 hover:text-[var(--color-primary-950)] transition-colors duration-200"
            aria-label="Back to Product List"
            >
            <ArrowLeft className="w-6 h-6" />
        </Link>
          <div>
            <h2 className="text-3xl font-extrabold text-gray-800">
              Low Stock Items
            </h2>
            <p className="text-gray-600 mt-1">
              {totalItems} items need attention
            </p>
          </div>
        </div>
        <button
          onClick={fetchLowStock}
          className="bg-[var(--color-primary-950)] text-white px-6 py-3 rounded-lg flex items-center shadow-md
                     hover:bg-[color:var(--color-primary-950)]/90 transition-colors duration-200
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-950)] focus-visible:ring-offset-2"
        >
          <Package className="w-5 h-5 mr-2" />
          Refresh Stock
        </button>
      </div>

      {/* Main Content Area: Low Stock Items Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        {/* Table Header/Toolbar */}
        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-orange-500 mr-3" />
            <h3 className="font-semibold text-lg text-gray-800">Items Running Low</h3>
          </div>
          <div className="text-sm text-gray-600">
            Total: {totalItems} items
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-6 text-red-700 bg-red-50 border-l-4 border-red-500">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="p-10 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--color-primary-950)] mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600">Loading low stock items...</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Current Stock
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lowStockItems?.length > 0 ? (
                    lowStockItems.map((item, index) => (
                      <tr key={`${item.product_id}-${item.variant_id || index}`} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <div className="text-base font-medium text-gray-900">
                              {getItemDisplayName(item)}
                            </div>
                            <div className="text-sm text-gray-500 font-mono">
                              ID: {item.product_id.substring(0, 8)}...
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full
                            ${item.type === 'product' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                            {item.type === 'product' ? 'Product' : 'Variant'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-base font-bold text-gray-900">
                            {item.quantity}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full
                            ${getStockStatusColor(item.quantity)}`}>
                            {getStockStatusText(item.quantity)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                       
                            {/* Alternative using Link if you prefer */}
                            <Link
                              href={`/admin/products/add-product?id=${item.product_id}`}
                              className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                              title="Edit Product"
                            >
                              <Edit className="w-5 h-5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                        <Info className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-lg">No low stock items found.</p>
                        <p className="text-sm text-gray-400 mt-2">
                          All your products are well-stocked!
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary Footer */}
            {lowStockItems.length > 0 && (
              <div className="p-5 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>
                    Showing {lowStockItems.length} of {totalItems} low stock items
                  </span>
                  <span>
                    {lowStockItems.filter(item => item.quantity === 0).length} out of stock
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}