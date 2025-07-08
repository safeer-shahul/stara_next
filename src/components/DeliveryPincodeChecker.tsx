'use client';

import { CheckCircle2, XCircle, Truck } from 'lucide-react';
import { useState } from 'react';
import apiService from '@/utils/api/apiService';

interface DeliveryPincodeCheckerProps {
  defaultDeliveryTime?: string;
}

export default function DeliveryPincodeChecker({ 
  defaultDeliveryTime = "3-4 Days"
}: DeliveryPincodeCheckerProps) {
  const [pincode, setPincode] = useState<string>('');
  const [showPincodeInput, setShowPincodeInput] = useState<boolean>(false);
  const [isDeliveryAvailable, setIsDeliveryAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handlePincodeCheck = async (): Promise<void> => {
    if (!pincode || !/^\d{6}$/.test(pincode)) {
      setError("Please enter a valid 6-digit pincode");
      setIsDeliveryAvailable(null);
      return;
    }

    setLoading(true);
    setError(null);
    setIsDeliveryAvailable(null);

    try {
      const response = await apiService.checkPincode(pincode);
      
      if (response && response.delivery_codes && response.delivery_codes.length > 0) {
        setIsDeliveryAvailable(true);
      } else {
        setIsDeliveryAvailable(false);
      }
    } catch (error) {
      console.error('Error checking pincode:', error);
      setError("Failed to check pincode. Please try again.");
      setIsDeliveryAvailable(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setPincode(e.target.value.slice(0, 6));
    // Clear previous results when user types
    setError(null);
    setIsDeliveryAvailable(null);
  };

  return (
    <div className="w-full">
      <div className="pt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm">
            Typically arrives in <span className="font-medium bg-[#C69A7F] px-2 py-1 text-white rounded-sm">{defaultDeliveryTime}</span>
          </p>
          <button 
            className="text-[#C69A7F] text-sm underline cursor-pointer"
            onClick={() => setShowPincodeInput(!showPincodeInput)}
          >
            CHECK PINCODE
          </button>
        </div>
      </div>

      {showPincodeInput && (
        <div className="mt-4">
          <div className="flex gap-2">
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#C69A7F]"
              placeholder="Pin Code"
              value={pincode}
              onChange={handlePincodeChange}
              maxLength={6}
            />
            <button 
              className={`bg-[#C69A7F] text-white px-4 py-2 rounded-md ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              onClick={handlePincodeCheck}
              disabled={loading}
            >
              {loading ? 'Checking...' : 'Check'}
            </button>
          </div>
                    
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}

          {isDeliveryAvailable !== null && !error && (
            <div className="mt-4">
              <div className="flex items-center gap-2">
                {isDeliveryAvailable ? (
                  <>
                    <CheckCircle2 className="text-green-600" size={20} />
                    <div className='text-[14px] text-green-600'>
                      Delivery available for this pincode
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="text-red-500" size={20} />
                    <div className='text-[14px] text-red-500'>
                      Delivery not available for this pincode
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}