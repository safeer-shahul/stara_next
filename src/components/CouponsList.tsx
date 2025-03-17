'use client';

import { X } from 'lucide-react';

type CouponsListProps = {
  onBack: () => void;
  onApplyCoupon: (code: string) => void;
};

const CouponsList = ({ onBack, onApplyCoupon }: CouponsListProps) => {
  return (
    <div className="p-4">
      <button 
        onClick={onBack}
        className="flex items-center text-gray-600 mb-4"
      >
        <X size={16} className="mr-2" /> Back to Cart
      </button>
      
      <h3 className="text-lg font-medium mb-4">Available Coupons</h3>
      
      <div className="border rounded-md p-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-bold">B1G1</p>
            <p className="text-sm text-gray-600">Buy 1 Get 1 Free</p>
          </div>
          <button 
            onClick={() => onApplyCoupon('B1G1')}
            className="px-3 py-1 bg-[#175e7a] text-white rounded-full text-sm"
          >
            Apply
          </button>
        </div>
      </div>

      <div className="border rounded-md p-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-bold">TANK</p>
            <p className="text-sm text-gray-600">10% off on all jewelry</p>
          </div>
          <button 
            className="px-3 py-1 bg-[#175e7a] text-white rounded-full text-sm"
            onClick={() => onApplyCoupon('TANK')}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default CouponsList;