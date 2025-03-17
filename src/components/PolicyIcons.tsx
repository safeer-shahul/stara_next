import React from "react";
import Image from "next/image";

const PolicyIcons = () => {
  return (
    <div className="grid grid-cols-3 pt-4">
      <div className="flex flex-col items-center text-center border border-gray-200 py-2">
        <div className="w-7 h-7 mb-2 relative">
          <Image
            src="/images/icons/Return_1.webp"
            alt="Return Policy"
            fill
            sizes="32px"
            style={{ objectFit: "contain" }}
          />
        </div>
        <p className="text-[10px]">2 Days Return</p>
      </div>

      <div className="flex flex-col items-center text-center border border-gray-200 py-2">
        <div className="w-7 h-7 mb-2 relative">
          <Image
            src="/images/icons/Exchange_1.webp"
            alt="Exchange Policy"
            fill
            sizes="32px"
            style={{ objectFit: "contain" }}
          />
        </div>
        <p className="text-[10px]">10 Days Exchange</p>
      </div>

      <div className="flex flex-col items-center text-center border border-gray-200 py-2">
        <div className="w-7 h-7 mb-2 relative">
          <Image
            src="/images/icons/Cash_on_delivery.webp"
            alt="Cash On Delivery"
            fill
            sizes="32px"
            style={{ objectFit: "contain" }}
          />
        </div>
        <p className="text-[10px]">Cash On Delivery</p>
      </div>
    </div>
  );
};

export default PolicyIcons;
