// app/admin/offers/list/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
// Import necessary icons for consistent design
import { Tag, Plus, Edit, Calendar, Clock, Info, Trash2, Percent } from 'lucide-react';
import apiService from '@/utils/api/apiService';
import Image from 'next/image';

// Define a more specific interface for Offer
interface Offer {
  id: string; // Assuming unique ID for the offer
  offer_name: string;
  buy_count: number;
  get_count: number;
  start_date: string; // ISO date string
  end_date: string;   // ISO date string
  offer_image: string | null; // Path to the offer image
  // Add other properties if your API returns them
}

export default function OfferListPage() {
  const [offers, setOffers] = useState<Offer[]>([]); // Use specific type
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize fetchOffers for better performance
  const fetchOffers = useCallback(async () => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      // Assuming apiService.getAllOffers() returns an object with a 'data' array
      const response = await apiService.getAllOffers();
      setOffers(response.data || []); // Ensure 'data' property is used and default to empty array
    } catch (err) {
      // console.error('Failed to fetch offers:', err);
      setError('Failed to load offers. Please try again.');
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies as it fetches all data on mount

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]); // Depend on memoized fetchOffers

  // Format date to readable format
  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      // console.error("Invalid date string:", dateString, e);
      return dateString; // Return original if invalid
    }
  }, []);

  // Get offer status based on dates
  const getOfferStatus = useCallback((startDate: string, endDate: string) => {
    if (!startDate || !endDate) return { status: 'No dates', colorClass: 'text-gray-500' };

    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Reset time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (today < start) {
      return { status: 'Upcoming', colorClass: 'text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-xs font-semibold' };
    } else if (today > end) {
      return { status: 'Expired', colorClass: 'text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-semibold' };
    } else {
      return { status: 'Active', colorClass: 'text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-semibold' };
    }
  }, []);

  // Placeholder for delete functionality
  const handleDeleteOffer = useCallback((offerId: string) => {
    if (confirm(`Are you sure you want to delete offer "${offerId}"?`)) {
      // Implement actual API call for deletion here
      // console.log(`Deleting offer with ID: ${offerId}`);
      // After successful deletion, refetch offers to update the list
      // apiService.deleteOffer(offerId).then(() => fetchOffers());
      alert('Delete functionality not yet implemented in API.');
    }
  }, [fetchOffers]); // Depend on fetchOffers to re-run it after deletion

  return (
    <div className="space-y-8">
      {/* Page Header and Add Button */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          {/* Removed explicit back link as per the original code's absence */}
          <h2 className="text-3xl font-extrabold text-gray-800 flex items-center">
            <Percent className="w-8 h-8 mr-3 text-[var(--color-primary-950)]" /> {/* Icon change */}
            Special Offers
          </h2>
        </div>
        <Link
          href="/admin/offers/create"
          className="bg-[var(--color-primary-950)] text-white px-6 py-3 rounded-lg flex items-center shadow-md
                     hover:bg-[color:var(--color-primary-950)]/90 transition-colors duration-200
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-950)] focus-visible:ring-offset-2"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Offer
        </Link>
      </div>

      {/* Main Content Area: Offers Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        {/* Table Header/Toolbar */}
        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center">
            <Tag className="w-6 h-6 text-[var(--color-primary-950)] mr-3" />
            <h3 className="font-semibold text-lg text-gray-800">All Available Offers</h3>
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
            <p className="mt-4 text-lg text-gray-600">Loading offers...</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto"> {/* Ensures table is scrollable on small screens */}
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Offer Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Start Date
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        End Date
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Status
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {offers?.length > 0 ? (
                    offers.map((offer) => {
                      const { status, colorClass } = getOfferStatus(offer.start_date, offer.end_date);
                      return (
                        <tr key={offer.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-base font-medium text-gray-900">{offer.offer_name}</div>
                            <div className="text-xs text-gray-500">ID: {offer.id.substring(0, 8)}...</div> {/* Truncate ID */}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <span className="font-medium">Buy {offer.buy_count}</span>
                              <span className="text-gray-500 mx-1">•</span>
                              <span className="font-medium">Get {offer.get_count}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {formatDate(offer.start_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {formatDate(offer.end_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={colorClass}>
                              {status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-12 w-12 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
                              {offer.offer_image ? (
                                <Image
                                  src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${offer.offer_image}`}
                                  alt={offer.offer_name || 'Offer image'}
                                  width={48}
                                  height={48}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Tag className="h-6 w-6 text-gray-400" /> 
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-3">
                              <Link
                                href={`/admin/offers/create?id=${offer.id}`}
                                className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                                title="Edit Offer"
                              >
                                <Edit className="w-5 h-5" />
                              </Link>
                              <button
                                onClick={() => handleDeleteOffer(offer.id)}
                                className="text-red-600 hover:text-red-800 transition-colors duration-200"
                                title="Delete Offer"
                              >
                                <Trash2 className="w-5 h-5" /> {/* Delete icon */}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                        <Info className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-lg">No offers found.</p>
                        <Link href="/admin/offers/create" className="block mt-4 text-[var(--color-primary-950)] hover:underline">
                          Click here to add a new offer.
                        </Link>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination is omitted as per original component logic (fetches all data) */}
          </>
        )}
      </div>
    </div>
  );
}