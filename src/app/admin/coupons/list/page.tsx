"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Ticket, Plus, Edit, Calendar, Clock, Percent, Hash, Info, Trash2, DollarSign } from 'lucide-react';
import apiService from '@/utils/api/apiService';

// Define a more specific interface for Coupon
interface Coupon {
  id: string; // Assuming unique ID for the coupon
  coupon_name: string;
  coupon_code: string;
  discount_type: 'percentage' | 'fixed_amount'; // Or 'fixed_amount'
  discount_value: number;
  start_date: string; // ISO date string
  end_date: string;   // ISO date string
  // Add other properties if your API returns them (e.g., usage_limit, min_cart_value)
}

export default function CouponListPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]); // Use specific type
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize fetchCoupons for better performance
  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      // Assuming apiService.getAllCoupons() returns an object with a 'data' array
      const response = await apiService.getAllCoupons();
      setCoupons(response.data || []); // Ensure 'data' property is used and default to empty array
    } catch (err) {
      // console.error('Failed to fetch coupons:', err);
      setError('Failed to load coupons. Please try again.');
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies as it fetches all data on mount

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]); // Depend on memoized fetchCoupons

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

  // Get coupon status based on dates
  const getCouponStatus = useCallback((startDate: string, endDate: string) => {
    if (!startDate || !endDate) return { status: 'No dates', colorClass: 'bg-gray-100 text-gray-800' };

    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Reset time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (today < start) {
      return { status: 'Upcoming', colorClass: 'bg-blue-100 text-blue-800' };
    } else if (today > end) {
      return { status: 'Expired', colorClass: 'bg-red-100 text-red-800' };
    } else {
      return { status: 'Active', colorClass: 'bg-green-100 text-green-800' };
    }
  }, []);

  // Format discount value
  const formatDiscount = useCallback((discountType: string, discountValue: number) => {
    if (discountType === 'percentage') {
      return `${discountValue}%`;
    } else {
      return `₹${discountValue}`; // Changed to ₹ for Indian Rupee
    }
  }, []);

  // Get discount icon
  const getDiscountIcon = useCallback((discountType: string) => {
    return discountType === 'percentage' ? (
      <Percent className="w-5 h-5 mr-1 text-green-600" /> // Slightly larger icon
    ) : (
      <DollarSign className="w-5 h-5 mr-1 text-green-600" /> // Using DollarSign as closest for fixed amount
    );
  }, []);

  // Placeholder for delete functionality
  const handleDeleteCoupon = useCallback((couponId: string) => {
    if (confirm(`Are you sure you want to delete coupon "${couponId}"?`)) {
      // console.log(`Deleting coupon with ID: ${couponId}`);
      alert('Delete functionality not yet implemented in API.');
    }
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Header and Add Button */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4"> {/* Increased gap for better spacing */}
          {/* No explicit back link, as per the original code's absence */}
          <h2 className="text-3xl font-extrabold text-gray-800 flex items-center">
            <Ticket className="w-8 h-8 mr-3 text-[var(--color-primary-950)]" /> {/* Larger, branded icon */}
            Coupons
          </h2>
        </div>
        <Link
          href="/admin/coupons/create"
          className="bg-[var(--color-primary-950)] text-white px-6 py-3 rounded-lg flex items-center shadow-md
                     hover:bg-[color:var(--color-primary-950)]/90 transition-colors duration-200
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-950)] focus-visible:ring-offset-2"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Coupon
        </Link>
      </div>

      {/* Main Content Area: Coupons Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        {/* Table Header/Toolbar */}
        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center">
            <Ticket className="w-6 h-6 text-[var(--color-primary-950)] mr-3" /> {/* Consistent icon for toolbar */}
            <h3 className="font-semibold text-lg text-gray-800">All Available Coupons</h3>
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
            <p className="mt-4 text-lg text-gray-600">Loading coupons...</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto"> {/* Ensures table is scrollable on small screens */}
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Coupon Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Discount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1 text-gray-500" /> {/* Icon styling */}
                        Start Date
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1 text-gray-500" /> {/* Icon styling */}
                        End Date
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1 text-gray-500" /> {/* Icon styling */}
                        Status
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {coupons?.length > 0 ? (
                    coupons.map((coupon) => {
                      const { status, colorClass } = getCouponStatus(coupon.start_date, coupon.end_date);
                      return (
                        <tr key={coupon.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-base font-medium text-gray-900">{coupon.coupon_name}</div>
                            {coupon.coupon_code && (
                              <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded mt-1 inline-flex items-center font-mono">
                                <Hash className="w-3 h-3 mr-1 text-gray-500" /> {/* Hashtag icon for code */}
                                {coupon.coupon_code}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-base font-medium text-gray-900">
                              {getDiscountIcon(coupon.discount_type)}
                              {formatDiscount(coupon.discount_type, coupon.discount_value)}
                              <span className="ml-2 text-xs text-gray-500 capitalize">
                                ({coupon.discount_type})
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {formatDate(coupon.start_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {formatDate(coupon.end_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}>
                              {status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-3">
                              <Link
                                href={`/admin/coupons/create?id=${coupon.id}`}
                                className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                                title="Edit Coupon"
                              >
                                <Edit className="w-5 h-5" />
                              </Link>
                              <button
                                onClick={() => handleDeleteCoupon(coupon.id)}
                                className="text-red-600 hover:text-red-800 transition-colors duration-200"
                                title="Delete Coupon"
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
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-500"> {/* Adjusted colSpan */}
                        <Info className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-lg">No coupons found.</p>
                        <Link href="/admin/coupons/create" className="block mt-4 text-[var(--color-primary-950)] hover:underline">
                          Click here to add a new coupon.
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