'use client';
import { useEffect } from 'react';
import Image from 'next/image';
import { X, ShoppingBag, Info } from 'lucide-react';
import apiService from '@/utils/api/apiService';

interface ProductItem {
  id: string;
  images: {
    id: string;
    product_image: string;
    product: string;
  }[];
  product_name: string;
  product_price: string;
  strike_price: string;
  product_status: boolean;
}

interface OfferData {
  id: string;
  offer_name: string;
  buy_count: number;
  get_count: number;
  start_date: string;
  end_date: string;
  offer_image: string;
  products: ProductItem[];
}

interface OfferSlot {
  id: string;
  product: ProductItem | null;
  slotIndex: number;
}

interface OfferMobileSliderProps {
  isOpen: boolean;
  onClose: () => void;
  offerData: OfferData;
  slots: OfferSlot[];
  onSlotClear: (slotId: string) => void;
}

export default function OfferMobileSlider({ 
  isOpen, 
  onClose, 
  offerData, 
  slots,
  onSlotClear
}: OfferMobileSliderProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const calculateTotals = () => {
    const filledSlots = slots.filter(slot => slot.product);
    // Always return freeItems as an array, even when empty
    if (filledSlots.length === 0) {
      return { payableTotal: 0, savings: 0, freeItems: [] };
    }

    // Sort products by price (highest first)
    const sortedProducts = filledSlots
      .map(slot => ({ ...slot.product!, slotId: slot.id }))
      .sort((a, b) => parseFloat(b.product_price) - parseFloat(a.product_price));

    // Calculate payable total (highest-priced buy_count items)
    const itemsToCharge = Math.min(offerData.buy_count, sortedProducts.length);
    const payableTotal = sortedProducts
      .slice(0, itemsToCharge)
      .reduce((sum, product) => sum + parseFloat(product.product_price), 0);

    // Calculate savings (free items total)
    const savings = sortedProducts
      .slice(itemsToCharge)
      .reduce((sum, product) => sum + parseFloat(product.product_price), 0);

    return { payableTotal, savings, freeItems: sortedProducts.slice(itemsToCharge) };
  };

  const isOfferComplete = () => {
    const totalRequiredItems = offerData.buy_count + offerData.get_count;
    return slots.filter(slot => slot.product !== null).length === totalRequiredItems;
  };

  const handleBuyNow = async () => {
  if (isOfferComplete()) {
    try {
      const product_ids = slots
        .filter(slot => slot.product)
        .map(slot => slot.product!.id.replace(/-/g, ''));
      await apiService.addToCartOffer({
        product_ids,
        offer_id: offerData.id.replace(/-/g, ''),
      });
      // Add any additional logic here (e.g., redirect, show success message)
    } catch (error) {
      console.error('Failed to add to cart:', error);
      // Optionally handle error (e.g., show error message to user)
    }
  }
};

  if (!isOpen) return null;

  const filledSlots = slots.filter(slot => slot.product !== null);
  const totalRequiredItems = offerData.buy_count + offerData.get_count;
  const { payableTotal, savings, freeItems } = calculateTotals();

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/70 z-51"
        onClick={onClose}
      />
      
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-xl z-52 p-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Your Selection</h3>
          <button className='cursor-pointer' onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 rounded-lg bg-gray-50 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag size={16} className="text-gray-700" />
            <h4 className="font-medium">Selected Items ({filledSlots.length}/{totalRequiredItems})</h4>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {slots.map((slot) => (
              <div key={slot.id} className="bg-white rounded-lg p-2 min-h-[65px] border-2 border-dashed border-gray-300">
                {slot.product ? (
                  <div className="relative">
                    <button
                      onClick={() => onSlotClear(slot.id)}
                      className="absolute -top-1 -right-1 bg-red-500 cursor-pointer text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600 z-10"
                    >
                      <X size={10} />
                    </button>
                    <div className="flex items-center gap-2">
                      <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden">
                        <Image
                          src={slot.product.images?.[0]?.product_image ? 
                            `${process.env.NEXT_PUBLIC_API_BASE_URL}${slot.product.images[0].product_image}` : 
                            '/images/placeholder.png'
                          }
                          alt={slot.product.product_name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium line-clamp-2">{slot.product.product_name}</p>
                        {freeItems.some(item => item.slotId === slot.id) ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 line-through">₹{parseFloat(slot.product.product_price).toLocaleString()}</span>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">FREE</span>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-600">₹{parseFloat(slot.product.product_price).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-xs text-center">
                    Empty Slot {slot.slotIndex + 1}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {filledSlots.length > 0 && (
          <div className="pt-4 pb-12 mt-4">
            <div className="space-y-2 text-sm mb-4">
              {savings > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>You Save ({freeItems.length} free item{freeItems.length > 1 ? 's' : ''}):</span>
                  <span className="font-medium">₹{savings.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-lg border-t border-gray-200 pt-2">
                <span>Final Total:</span>
                <span>₹{payableTotal.toLocaleString()}</span>
              </div>
            </div>
            
            <button 
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  isOfferComplete() 
                    ? 'bg-[#175e7a] cursor-pointer text-white hover:bg-[#0f4c67]' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!isOfferComplete()}
                onClick={handleBuyNow}
              >
                {isOfferComplete() ? 'Buy Now' : `Select ${totalRequiredItems - filledSlots.length} More Item${totalRequiredItems - filledSlots.length > 1 ? 's' : ''}`}
              </button>
          </div>
        )}
      </div>
    </>
  );
}