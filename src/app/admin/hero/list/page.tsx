// app/admin/hero/list/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react'; // Added useCallback
import Link from 'next/link';
// Import all necessary icons for consistent design
import { Image as ImageIcon, Plus, Edit, ArrowLeft, Info, LayoutGrid } from 'lucide-react';
import apiService from '@/utils/api/apiService';
import Image from 'next/image';

// Define a more specific interface for HeroBanner
interface HeroBanner {
  id: any;// Unique ID for the banner
  big_image: string | null; // Path to the large image
  status: boolean; // Assuming boolean for active/inactive
  // Add other properties if your API returns them (e.g., small_image, link_url, title, description)
}

export default function HeroBannersListPage() {
  const [banners, setBanners] = useState<HeroBanner[]>([]); // Use specific type
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize fetchBanners for better performance
  const fetchBanners = useCallback(async () => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      // Assuming apiService.getHeroBanners() returns an array of HeroBanner
      const response: HeroBanner[] = await apiService.getHeroBanners();
      setBanners(response);
    } catch (err) {
      // console.error('Failed to fetch hero banners:', err);
      setError('Failed to load hero banners. Please try again.');
      setBanners([]);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies as it fetches all data on mount

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]); // Depend on memoized fetchBanners

  // Placeholder for delete functionality
//   const handleDeleteBanner = useCallback((bannerId: string) => {
//   if (confirm(`Are you sure you want to delete banner "${bannerId}"?`)) {
//     console.log(`Deleting banner with ID: ${bannerId}`);
//     // await apiService.deleteHeroBanner(bannerId);
//     // await fetchBanners();
//     alert('Delete functionality not yet implemented in API.');
//   }
// }, []);


  return (
    <div className="space-y-8">
      {/* Page Header and Add Button */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/products" // Link back to Products Dashboard as per original code
            className="text-gray-600 hover:text-[var(--color-primary-950)] transition-colors duration-200"
            aria-label="Back to Products Dashboard"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h2 className="text-3xl font-extrabold text-gray-800">
            Hero Banners
          </h2>
        </div>
        <Link
          href="/admin/hero/create-hero"
          className="bg-[var(--color-primary-950)] text-white px-6 py-3 rounded-lg flex items-center shadow-md
                     hover:bg-[color:var(--color-primary-950)]/90 transition-colors duration-200
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-950)] focus-visible:ring-offset-2"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Banner
        </Link>
      </div>

      {/* Main Content Area: Hero Banners Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        {/* Table Header/Toolbar */}
        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center">
            <LayoutGrid className="w-6 h-6 text-[var(--color-primary-950)] mr-3" /> {/* Changed icon to LayoutGrid */}
            <h3 className="font-semibold text-lg text-gray-800">Website Hero Section Banners</h3>
          </div>
          {/* No search/filter in original, so keeping it out for now */}
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
            <p className="mt-4 text-lg text-gray-600">Loading banners...</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto"> {/* Ensures table is scrollable on small screens */}
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Banner Image
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
                  {banners?.length > 0 ? (
                    banners.map((banner) => (
                      <tr key={banner.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-base font-medium text-gray-900">{banner.id ? banner.id.toString().substring(0, 8) + '...' : 'N/A'}</div> 
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-24 w-40 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
                            {banner.big_image ? (
                              <Image
                                src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${banner.big_image}`}
                                alt={`Hero banner ${banner.id}`}
                                width={160} // Matches w-40
                                height={96} // Matches h-24
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-8 w-8 text-gray-400" /> 
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full
                            ${banner.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {banner.status ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <Link
                              href={`/admin/hero/create-hero?id=${banner.id}`}
                              className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                              title="Edit Banner"
                            >
                              <Edit className="w-5 h-5" />
                            </Link>
                            {/* <button
                              onClick={() => handleDeleteBanner(banner.id)}
                              className="text-red-600 hover:text-red-800 transition-colors duration-200"
                              title="Delete Banner"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button> */}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                        <Info className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-lg">No hero banners found.</p>
                        <Link href="/admin/hero/create-hero" className="block mt-4 text-[var(--color-primary-950)] hover:underline">
                          Click here to add a new banner.
                        </Link>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination is omitted as per original component logic (fetches all data) */}
            {/* If you need pagination, your apiService.getHeroBanners() would need to be updated to support it */}
          </>
        )}
      </div>
    </div>
  );
}