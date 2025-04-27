// app/admin/hero/list/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Image as ImageIcon, Plus, Edit, ArrowLeft } from 'lucide-react';
import apiService from '@/utils/api/apiService';
import Image from 'next/image';

export default function HeroBannersListPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      // Using the new getHeroBanners function from apiService
      const response = await apiService.getHeroBanners();
      setBanners(response);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch hero banners:', err);
      setError('Failed to load hero banners. Please try again.');
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Link href="/admin/products" className="text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-2xl font-bold">Hero Banners</h2>
        </div>
        <Link href="/admin/hero/create-hero">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Add Banner
          </button>
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center">
            <ImageIcon className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="font-semibold">All Hero Banners</h3>
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
            <p className="mt-2 text-gray-600">Loading banners...</p>
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {banners?.length > 0 ? (
                  banners.map((banner) => (
                    <tr key={banner.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{banner.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {banner.big_image ?  (
                            <Image 
                                src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${banner.big_image}`}
                                alt={banner.big_image}
                                width={48}
                                height={48}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <ImageIcon className="h-6 w-6 text-gray-400" />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${banner.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {banner.status ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <Link href={`/admin/hero/create-hero?id=${banner.id}`}>
                            <button className="text-blue-600 hover:text-blue-800">
                              <Edit className="w-4 h-4" />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                      No hero banners found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}