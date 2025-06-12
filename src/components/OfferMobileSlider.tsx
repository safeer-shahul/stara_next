'use client';
import { useEffect } from 'react';
import Image from 'next/image';
import { X, ShoppingBag, Gift, ChevronUp } from 'lucide-react';

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
  type: 'buy' | 'get';
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
    const buySlots = slots.filter(slot => slot.type === 'buy' && slot.product);
    const getSlots = slots.filter(slot => slot.type === 'get' && slot.product);
    
    const buyTotal = buySlots.reduce((sum, slot) => 
      sum + parseFloat(slot.product!.product_price), 0
    );
    const getTotal = getSlots.reduce((sum, slot) => 
      sum + parseFloat(slot.product!.product_price), 0
    );
    
    return { buyTotal, getTotal, savings: getTotal };
  };

  const isOfferComplete = () => {
    return slots.every(slot => slot.product !== null);
  };

  const SlotDisplay = ({ slots, title, icon, bgColor }: { 
    slots: OfferSlot[], 
    title: string, 
    icon: React.ReactNode,
    bgColor: string 
  }) => (
    <div className={`p-4 rounded-lg ${bgColor} mb-4`}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h4 className="font-medium">{title}</h4>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {slots.map((slot) => (
          <div key={slot.id} className="bg-white rounded-lg p-2 min-h-[65px] border-2 border-dashed border-gray-300">
            {slot.product ? (
              <div className="relative">
                <button
                  onClick={() => onSlotClear(slot.id)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600 z-10"
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
                    {slot.type === 'buy' && (
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
  );

  if (!isOpen) return null;

  const buySlots = slots.filter(slot => slot.type === 'buy');
  const getSlots = slots.filter(slot => slot.type === 'get');
  const filledSlots = slots.filter(slot => slot.product !== null);
  const { buyTotal, getTotal, savings } = calculateTotals();

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-xl z-50 p-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Your Selection</h3>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <SlotDisplay 
          slots={buySlots}
          title={`Buy (${buySlots.filter(s => s.product).length}/${offerData.buy_count})`}
          icon={<ShoppingBag size={16} className="text-blue-600" />}
          bgColor="bg-blue-50"
        />
        
        <SlotDisplay 
          slots={getSlots}
          title={`Get Free (${getSlots.filter(s => s.product).length}/${offerData.get_count})`}
          icon={<Gift size={16} className="text-green-600" />}
          bgColor="bg-green-50"
        />
        
        {filledSlots.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span>Buy Total:</span>
                <span className="font-medium">₹{buyTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>You Save:</span>
                <span className="font-medium">₹{savings.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Final Total:</span>
                <span>₹{buyTotal.toLocaleString()}</span>
              </div>
            </div>
            
            <button 
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                isOfferComplete() 
                  ? 'bg-black text-white hover:bg-gray-800' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!isOfferComplete()}
            >
              {isOfferComplete() ? 'Buy Now' : 'Complete Your Selection'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}