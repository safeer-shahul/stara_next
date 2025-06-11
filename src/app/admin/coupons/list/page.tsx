// app/admin/coupons/list/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Ticket, Plus, Edit, ArrowLeft, Calendar, Clock, Percent, Hash } from 'lucide-react';
import apiService from '@/utils/api/apiService';

export default function CouponListPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      // Using the getAllCoupons function from apiService
      const response = await apiService.getAllCoupons();
      setCoupons(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch coupons:', err);
      setError('Failed to load coupons. Please try again.');
      setCoupons([]);
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

  // Get coupon status based on dates
  const getCouponStatus = (startDate: string, endDate: string) => {
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

  // Format discount value
  const formatDiscount = (discountType: string, discountValue: number) => {
    if (discountType === 'percentage') {
      return `${discountValue}%`;
    } else {
      return `$${discountValue}`;
    }
  };

  // Get discount icon
  const getDiscountIcon = (discountType: string) => {
    return discountType === 'percentage' ? (
      <Percent className="w-4 h-4 text-green-600" />
    ) : (
      <span className="text-green-600 font-bold text-sm">$</span>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Coupons</h2>
        </div>
        <Link href="/admin/coupons/create">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Add Coupon
          </button>
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center">
            <Ticket className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="font-semibold">All Coupons</h3>
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
            <p className="mt-2 text-gray-600">Loading coupons...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Coupon Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <Hash className="w-4 h-4 mr-1" />
                        Quantity
                      </div>
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
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {coupons?.length > 0 ? (
                    coupons.map((coupon) => {
                      const { status, color } = getCouponStatus(coupon.start_date, coupon.end_date);
                      return (
                        <tr key={coupon.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{coupon.coupon_name}</div>
                              {coupon.coupon_code && (
                                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded mt-1 inline-block font-mono">
                                  {coupon.coupon_code}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900">
                              {getDiscountIcon(coupon.discount_type)}
                              <span className="ml-1 font-medium">
                                {formatDiscount(coupon.discount_type, coupon.discount_value)}
                              </span>
                              <span className="ml-1 text-xs text-gray-500 capitalize">
                                {coupon.discount_type}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 font-medium">
                              {coupon.quantity}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(coupon.start_date)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(coupon.end_date)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-medium ${color}`}>
                              {status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex space-x-2">
                              <Link href={`/admin/coupons/create?id=${coupon.id}`}>
                                <button className="text-blue-600 hover:text-blue-800">
                                  <Edit className="w-4 h-4" />
                                </button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        No coupons found
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