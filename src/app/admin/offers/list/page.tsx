// app/admin/offers/list/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Tag, Plus, Edit, ArrowLeft, Calendar, Clock } from 'lucide-react';
import apiService from '@/utils/api/apiService';
import Image from 'next/image';

export default function OfferListPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      // Using the getAllOffers function from apiService
      const response = await apiService.getAllOffers();
      setOffers(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch offers:', err);
      setError('Failed to load offers. Please try again.');
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get offer status based on dates
  const getOfferStatus = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return { status: 'No dates', color: 'text-gray-500' };
    
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Reset time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    if (today < start) {
      return { status: 'Upcoming', color: 'text-blue-600' };
    } else if (today > end) {
      return { status: 'Expired', color: 'text-red-600' };
    } else {
      return { status: 'Active', color: 'text-green-600' };
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          {/* <Link href="/admin/products" className="text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-5 h-5" />
          </Link> */}
          <h2 className="text-2xl font-bold">Offers</h2>
        </div>
        <Link className="bg-blue-600 text-white cursor-pointer px-4 py-2 rounded-lg flex items-center" href="/admin/offers/create">
            <Plus className="w-5 h-5 mr-2" />
            Add Offer
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center">
            <Tag className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="font-semibold">All Offers</h3>
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
            <p className="mt-2 text-gray-600">Loading offers...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Offer Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Buy/Get Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Start Date
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        End Date
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Status
                      </div>
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
                  {offers?.length > 0 ? (
                    offers.map((offer) => {
                      const { status, color } = getOfferStatus(offer.start_date, offer.end_date);
                      return (
                        <tr key={offer.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{offer.offer_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <span className="font-medium">Buy {offer.buy_count}</span>
                              <span className="text-gray-500 mx-1">•</span>
                              <span className="font-medium">Get {offer.get_count}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(offer.start_date)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(offer.end_date)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-medium ${color}`}>
                              {status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {offer.offer_image ? (
                              <Image 
                                src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${offer.offer_image}`}
                                alt={offer.offer_name || 'Offer image'}
                                width={48}
                                height={48}
                                className="h-12 w-12 object-cover rounded"
                              />
                            ) : (
                              <Tag className="h-6 w-6 text-gray-400" />
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex space-x-2">
                              <Link className="text-blue-600 cursor-pointer hover:text-blue-800" href={`/admin/offers/create?id=${offer.id}`}>
                                  <Edit className="w-4 h-4" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        No offers found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}