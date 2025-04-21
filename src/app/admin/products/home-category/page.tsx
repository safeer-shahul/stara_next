"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Plus, Edit, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import apiService from '@/utils/api/apiService';

export default function HomeCategoryListPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);

  useEffect(() => {
    fetchCategories();
  }, [currentPage]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await apiService.getHomeCategories();
      console.log(response);
      setCategories(response);
      setTotalItems(response.length);
      setTotalPages(Math.ceil(response.length / pageSize));
      setError(null);
    } catch (err) {
      console.error('Failed to fetch home categories:', err);
      setError('Failed to load home categories. Please try again.');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Calculate pagination
  const indexOfLastCategory = currentPage * pageSize;
  const indexOfFirstCategory = indexOfLastCategory - pageSize;
  const currentCategories = categories.slice(indexOfFirstCategory, indexOfLastCategory);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Link href="/admin/products" className="text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-2xl font-bold">Home Categories</h2>
        </div>
        <Link href="/admin/products/add-home-category">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Add Category
          </button>
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center">
            <Package className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="font-semibold">All Home Categories</h3>
          </div>
        </div>

        {error && (
          <div className="p-4 text-red-700 bg-red-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading categories...</p>
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentCategories?.length > 0 ? (
                  currentCategories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{category.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          {/* <Link href={`/admin/products/home-category/view/${category.id}`}>
                            <button className="text-gray-600 hover:text-gray-800">
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link> */}
                          <Link href={`/admin/products/add-home-category?id=${category.id}`}>
                            <button className="text-blue-600 hover:text-blue-800">
                              <Edit className="w-4 h-4" />
                            </button>
                          </Link>
                          {/* <button className="text-red-600 hover:text-red-800">
                            <Trash2 className="w-4 h-4" />
                          </button> */}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-6 py-8 text-center text-gray-500">
                      No categories found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="px-6 py-4 border-t flex justify-between items-center">
              <p className="text-sm text-gray-500">
                Showing {currentCategories?.length} of {totalItems} categories
              </p>
              <div className="flex space-x-2">
                <button 
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded border ${currentPage === 1 ? 'text-gray-400 border-gray-200' : 'text-blue-600 border-blue-600'}`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button 
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded border ${currentPage === totalPages ? 'text-gray-400 border-gray-200' : 'text-blue-600 border-blue-600'}`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}