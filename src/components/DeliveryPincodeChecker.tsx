'use client';

import { DollarSign, Truck } from 'lucide-react';
import { useState } from 'react';

interface DeliveryInfo {
  deliveryDate?: string;
  cashOnDelivery?: boolean;
  error?: string;
}

interface DeliveryPincodeCheckerProps {
  defaultDeliveryTime?: string;
  checkPincodeHandler?: (pincode: string) => Promise<DeliveryInfo>;
}

export default function DeliveryPincodeChecker({ 
  defaultDeliveryTime = "3-4 Days",
  checkPincodeHandler
}: DeliveryPincodeCheckerProps) {
  const [pincode, setPincode] = useState<string>('');
  const [showPincodeInput, setShowPincodeInput] = useState<boolean>(false);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);

  // If no custom handler provided, use a default one
  const handlePincodeCheck = async (): Promise<void> => {
    if (checkPincodeHandler) {
      const result = await checkPincodeHandler(pincode);
      setDeliveryInfo(result);
      return;
    }

    // Default implementation
    if (pincode && pincode.length === 6 && !isNaN(Number(pincode))) {
      setDeliveryInfo({
        deliveryDate: `22nd and 25th Mar`,
        cashOnDelivery: true
      });
    } else {
      setDeliveryInfo({
        error: "Please enter a valid 6-digit pincode"
      });
    }
  };

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setPincode(e.target.value.slice(0, 6));
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
              className="bg-[#C69A7F] text-white px-4 py-2 rounded-md"
              onClick={handlePincodeCheck}
            >
              Check
            </button>
          </div>
          
          {deliveryInfo && deliveryInfo.error && (
            <p className="text-red-500 text-sm mt-2">{deliveryInfo.error}</p>
          )}
        </div>
      )}

      {deliveryInfo && !deliveryInfo.error && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <Truck className="text-[#C69A7F]" size={20} />
            <div className='text-[14px]'>
              Delivery between <span className='text-green-600'>
                  <span className="font-medium">22<sup>nd</sup></span> and <span className="font-medium">25<sup>th</sup></span> Mar
                </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="text-[#C69A7F]" size={20} />
            <div className='text-[14px]'>
              Cash on delivery <span className="text-green-600">available</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}