'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, Home, X, ShoppingBag, Gift, ChevronUp, Plus, Minus } from 'lucide-react';
import apiService from '@/utils/api/apiService';
import Link from 'next/link';

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
  product_code: string;
  product_description: string;
  quantity: number;
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

// New structure to handle individual slots
interface OfferSlot {
  id: string; // unique identifier for this slot
  type: 'buy' | 'get';
  product: ProductItem | null;
  slotIndex: number; // 0-based index within the type (buy slots: 0,1,2... get slots: 0,1,2...)
}

export default function OfferProductsPage() {
  const params = useParams();
  const router = useRouter();
  const offerId = params?.id as string;
  
  const [loading, setLoading] = useState(true);
  const [offerData, setOfferData] = useState<OfferData | null>(null);
  const [offerSlots, setOfferSlots] = useState<OfferSlot[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileSlider, setShowMobileSlider] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize slots when offer data is loaded
  useEffect(() => {
    if (offerData) {
      const slots: OfferSlot[] = [];
      
      // Create buy slots
      for (let i = 0; i < offerData.buy_count; i++) {
        slots.push({
          id: `buy-${i}`,
          type: 'buy',
          product: null,
          slotIndex: i
        });
      }
      
      // Create get slots
      for (let i = 0; i < offerData.get_count; i++) {
        slots.push({
          id: `get-${i}`,
          type: 'get',
          product: null,
          slotIndex: i
        });
      }
      
      setOfferSlots(slots);
    }
  }, [offerData]);

  useEffect(() => {
    const fetchOfferData = async () => {
      if (!offerId) return;
      
      try {
        setLoading(true);
        const response = await apiService.offerByID(offerId);
        setOfferData(response);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch offer data:', err);
        setError('Failed to load offer details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOfferData();
  }, [offerId]);

  // Get count of how many times a product is selected in a specific type
  const getProductCountInType = useCallback((productId: string, type: 'buy' | 'get') => {
    return offerSlots.filter(slot => 
      slot.type === type && slot.product?.id === productId
    ).length;
  }, [offerSlots]);

  // Get total count of how many times a product is selected (both buy and get)
  const getTotalProductCount = useCallback((productId: string) => {
    return offerSlots.filter(slot => slot.product?.id === productId).length;
  }, [offerSlots]);

  // Check if we can add more of this product
  const canAddProduct = useCallback((productId: string, type: 'buy' | 'get') => {
    const emptySlots = offerSlots.filter(slot => slot.type === type && !slot.product);
    return emptySlots.length > 0;
  }, [offerSlots]);

  // Add product to next available slot of specified type
  const handleProductAdd = useCallback((product: ProductItem, type: 'buy' | 'get') => {
    const emptySlot = offerSlots.find(slot => slot.type === type && !slot.product);
    if (!emptySlot) return;

    setOfferSlots(prev => 
      prev.map(slot => 
        slot.id === emptySlot.id 
          ? { ...slot, product }
          : slot
      )
    );
  }, [offerSlots]);

  // Remove one instance of product from specified type
  const handleProductRemove = useCallback((productId: string, type: 'buy' | 'get') => {
    const filledSlot = offerSlots.find(slot => 
      slot.type === type && slot.product?.id === productId
    );
    if (!filledSlot) return;

    setOfferSlots(prev => 
      prev.map(slot => 
        slot.id === filledSlot.id 
          ? { ...slot, product: null }
          : slot
      )
    );
  }, [offerSlots]);

  // Remove product from specific slot
  const handleSlotClear = useCallback((slotId: string) => {
    setOfferSlots(prev => 
      prev.map(slot => 
        slot.id === slotId 
          ? { ...slot, product: null }
          : slot
      )
    );
  }, []);

  // Move product from one slot to another
  const handleProductMove = useCallback((fromSlotId: string, toSlotId: string) => {
    const fromSlot = offerSlots.find(slot => slot.id === fromSlotId);
    const toSlot = offerSlots.find(slot => slot.id === toSlotId);
    
    if (!fromSlot || !toSlot || !fromSlot.product || toSlot.product) return;

    setOfferSlots(prev => 
      prev.map(slot => {
        if (slot.id === fromSlotId) return { ...slot, product: null };
        if (slot.id === toSlotId) return { ...slot, product: fromSlot.product };
        return slot;
      })
    );
  }, [offerSlots]);

  const getBuySlots = useCallback(() => {
    return offerSlots.filter(slot => slot.type === 'buy');
  }, [offerSlots]);

  const getGetSlots = useCallback(() => {
    return offerSlots.filter(slot => slot.type === 'get');
  }, [offerSlots]);

  const getFilledSlots = useCallback(() => {
    return offerSlots.filter(slot => slot.product !== null);
  }, [offerSlots]);

  const isOfferComplete = useCallback(() => {
    return offerSlots.every(slot => slot.product !== null);
  }, [offerSlots]);

  const calculateTotals = useCallback(() => {
    const buySlots = offerSlots.filter(slot => slot.type === 'buy' && slot.product);
    const getSlots = offerSlots.filter(slot => slot.type === 'get' && slot.product);
    
    const buyTotal = buySlots.reduce((sum, slot) => 
      sum + parseFloat(slot.product!.product_price), 0
    );
    const getTotal = getSlots.reduce((sum, slot) => 
      sum + parseFloat(slot.product!.product_price), 0
    );
    
    return { buyTotal, getTotal, savings: getTotal };
  }, [offerSlots]);

  const calculateDiscount = useCallback((price: string, strikePrice: string): string => {
    if (!strikePrice || parseFloat(strikePrice) <= 0) return '';
    
    const currentPrice = parseFloat(price);
    const originalPrice = parseFloat(strikePrice);
    
    if (currentPrice >= originalPrice) return '';
    
    const discount = ((originalPrice - currentPrice) / originalPrice) * 100;
    return `${Math.round(discount)}% OFF`;
  }, []);

  // Component for displaying product selection controls
  const ProductSelectionControls = ({ product }: { product: ProductItem }) => {
    const buyCount = getProductCountInType(product.id, 'buy');
    const getCount = getProductCountInType(product.id, 'get');
    const canAddToBuy = canAddProduct(product.id, 'buy');
    const canAddToGet = canAddProduct(product.id, 'get');

    return (
      <div className="mt-2 space-y-2">
        {/* Buy Controls */}
        <div className="flex items-center justify-between bg-blue-50 rounded-lg p-2">
          <div className="flex items-center gap-2">
            <ShoppingBag size={14} className="text-blue-600" />
            <span className="text-sm font-medium">Buy: {buyCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleProductRemove(product.id, 'buy')}
              disabled={buyCount === 0}
              className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-200 text-xs"
            >
              <Minus size={12} />
            </button>
            <button
              onClick={() => handleProductAdd(product, 'buy')}
              disabled={!canAddToBuy}
              className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-200 text-xs"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>

        {/* Get Controls */}
        <div className="flex items-center justify-between bg-green-50 rounded-lg p-2">
          <div className="flex items-center gap-2">
            <Gift size={14} className="text-green-600" />
            <span className="text-sm font-medium">Get: {getCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleProductRemove(product.id, 'get')}
              disabled={getCount === 0}
              className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-200 text-xs"
            >
              <Minus size={12} />
            </button>
            <button
              onClick={() => handleProductAdd(product, 'get')}
              disabled={!canAddToGet}
              className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-200 text-xs"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Component for displaying slots
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
          <div key={slot.id} className="bg-white rounded-lg p-2 min-h-[80px] border-2 border-dashed border-gray-300">
            {slot.product ? (
              <div className="relative">
                <button
                  onClick={() => handleSlotClear(slot.id)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600 z-10"
                >
                  <X size={10} />
                </button>
                <div className="flex gap-2">
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
                    <p className="text-xs text-gray-600">₹{parseFloat(slot.product.product_price).toLocaleString()}</p>
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

  if (loading) {
    return (
      <div className="container mx-auto p-6 min-h-[500px] flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error || !offerData) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4">Error</h1>
        <p className="text-gray-500">{error || 'Offer not found.'}</p>
        <Link href="/" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          Return to Home
        </Link>
      </div>
    );
  }

  const buySlots = getBuySlots();
  const getSlots = getGetSlots();
  const filledSlots = getFilledSlots();
  const { buyTotal, getTotal, savings } = calculateTotals();

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-6 justify-center">
        <Link href="/" className="text-gray-500 hover:text-gray-700 flex items-center">
          <Home size={14} className="mr-1" />
          Home
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900">{offerData.offer_name}</span>
      </div>

      {/* Offer Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">{offerData.offer_name}</h1>
        <p className="text-gray-600 mb-2">
          Buy {offerData.buy_count} Get {offerData.get_count} Free
        </p>
        <p className="text-sm text-red-600">
          Valid until {new Date(offerData.end_date).toLocaleDateString()}
        </p>
      </div>

      <div className={`${isMobile ? 'block' : 'flex gap-8'}`}>
        {/* Products Grid */}
        <div className={`${isMobile ? 'w-full mb-6' : 'w-2/3'}`}>
          <h2 className="text-xl font-semibold mb-4">Select Products for Your Offer</h2>
          
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-6`}>
            {offerData.products.map((product) => {
              const discount = calculateDiscount(product.product_price, product.strike_price);
              const mainImage = product.images?.[0]?.product_image || '';
              const totalSelected = getTotalProductCount(product.id);
              
              return (
                <div key={product.id} className="border rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex gap-4 mb-3">
                    <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                      <Image
                        src={mainImage ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${mainImage}` : '/images/placeholder.png'}
                        alt={product.product_name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                      
                      {!product.product_status && (
                        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">Out of Stock</span>
                        </div>
                      )}
                      
                      {discount && (
                        <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded">
                          {discount}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium line-clamp-2 mb-2">{product.product_name}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">₹{parseFloat(product.product_price).toLocaleString()}</span>
                        {parseFloat(product.strike_price) > 0 && (
                          <span className="text-sm text-gray-500 line-through">₹{parseFloat(product.strike_price).toLocaleString()}</span>
                        )}
                      </div>
                      {totalSelected > 0 && (
                        <div className="text-sm text-blue-600 font-medium">
                          Selected: {totalSelected} time{totalSelected > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {product.product_status && <ProductSelectionControls product={product} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Desktop Sidebar */}
        {!isMobile && (
          <div className="w-1/3 bg-gray-50 rounded-lg p-6 h-fit sticky top-6">
            <h3 className="text-lg font-semibold mb-4">Your Offer Selection</h3>
            
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
            
            {/* Summary */}
            {filledSlots.length > 0 && (
              <div className="border-t pt-4">
                <div className="space-y-2 text-sm">
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
                  className={`w-full mt-4 py-3 rounded-lg font-medium transition-colors ${
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
            
            {filledSlots.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <ShoppingBag size={32} className="mx-auto" />
                </div>
                <p className="text-gray-500 text-sm">Start selecting products to see your offer</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Bottom Bar */}
      {isMobile && filledSlots.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#175e7a] rounded-tr-2xl rounded-tl-2xl shadow-lg px-4 pt-4 pb-12 z-50">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowMobileSlider(true)}
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <ShoppingBag size={22} className="text-white" />
                <span className="text-xl text-white font-medium">
                  Buy: {buySlots.filter(s => s.product).length}/{offerData.buy_count}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Gift size={22} className="text-white" />
                <span className="text-xl text-white font-medium">
                  Get: {getSlots.filter(s => s.product).length}/{offerData.get_count}
                </span>
              </div>
            </div>
            <ChevronUp size={20} className="text-gray-400" />
          </div>
        </div>
      )}

      {/* Mobile Slider - simplified version for demo */}
      {isMobile && showMobileSlider && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowMobileSlider(false)}
          />
          
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-xl z-50 p-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Your Selection</h3>
              <button onClick={() => setShowMobileSlider(false)}>
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
      )}
    </div>
  );
}