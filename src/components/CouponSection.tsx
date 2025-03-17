'use client';

import { ChevronRight } from 'lucide-react';
import { CouponType } from './type';

type CouponSectionProps = {
  couponCode: string;
  setCouponCode: (code: string) => void;
  appliedCoupon: CouponType | null;
  onApply: () => void;
  onViewCoupons: () => void;
};

const CouponSection = ({
  couponCode,
  setCouponCode,
  appliedCoupon,
  onApply,
  onViewCoupons
}: CouponSectionProps) => {
  return (
    <div className="bg-gray-50 pb-2 rounded-lg mb-4">
      <div className="flex items-center border-b border-gray-200 pb-2">
        <input 
          type="text" 
          placeholder="Enter Coupon Code"
          className="flex-1 text-sm border-none bg-transparent focus:outline-none"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
        />
        <button 
          className="text-[#175e7a] font-medium text-sm"
          onClick={onApply}
        >
          Apply
        </button>
      </div>
      
      <div className="flex justify-between mt-1">
        <button 
          className="text-[#175e7a] font-medium text-[12px] flex items-center"
          onClick={onViewCoupons}
        >
          View Coupons <ChevronRight size={16} />
        </button>
        
        {appliedCoupon && (
          <div className="text-green-600 text-[12px]">
            {appliedCoupon.code} Applied
          </div>
        )}
      </div>
    </div>
  );
};

export default CouponSection;