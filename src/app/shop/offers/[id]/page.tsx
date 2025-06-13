'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, Home, ChevronUp, ShoppingBag, Gift } from 'lucide-react';
import apiService from '@/utils/api/apiService';
import Link from 'next/link';
import OfferMobileSlider from '@/components/OfferMobileSlider';
import OfferCartSidebar from '@/components/OfferCartSidebar';

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

interface OfferSlot {
  id: string;
  type: 'buy' | 'get';
  product: ProductItem | null;
  slotIndex: number;
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
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (offerData) {
      const slots: OfferSlot[] = [];
      for (let i = 0; i < offerData.buy_count; i++) {
        slots.push({
          id: `buy-${i}`,
          type: 'buy',
          product: null,
          slotIndex: i
        });
      }
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

  const getProductCountInType = useCallback((productId: string, type: 'buy' | 'get') => {
    return offerSlots.filter(slot => 
      slot.type === type && slot.product?.id === productId
    ).length;
  }, [offerSlots]);

  const getTotalProductCount = useCallback((productId: string) => {
    return offerSlots.filter(slot => slot.product?.id === productId).length;
  }, [offerSlots]);

  // Fixed: Only check for empty slots of the specific type, regardless of what's in other types
  const canAddProduct = useCallback((productId: string, type: 'buy' | 'get') => {
    const emptySlots = offerSlots.filter(slot => slot.type === type && !slot.product);
    return emptySlots.length > 0;
  }, [offerSlots]);

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

  const handleSlotClear = useCallback((slotId: string) => {
    setOfferSlots(prev => 
      prev.map(slot => 
        slot.id === slotId 
          ? { ...slot, product: null }
          : slot
      )
    );
  }, []);

  const getBuySlots = useCallback(() => {
    return offerSlots.filter(slot => slot.type === 'buy');
  }, [offerSlots]);

  const getGetSlots = useCallback(() => {
    return offerSlots.filter(slot => slot.type === 'get');
  }, [offerSlots]);

  const getFilledSlots = useCallback(() => {
    return offerSlots.filter(slot => slot.product !== null);
  }, [offerSlots]);

  const calculateDiscount = useCallback((price: string, strikePrice: string): string => {
    if (!strikePrice || parseFloat(strikePrice) <= 0) return '';
    const currentPrice = parseFloat(price);
    const originalPrice = parseFloat(strikePrice);
    if (currentPrice >= originalPrice) return '';
    const discount = ((originalPrice - currentPrice) / originalPrice) * 100;
    return `${Math.round(discount)}% OFF`;
  }, []);

  const handleProductClick = useCallback(async (productId: string) => {
    try {
      setIsNavigating(productId);
      await router.push(`/shop/products/${productId}?from=offer&offer_id=${offerId}`);
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      setTimeout(() => setIsNavigating(null), 100);
    }
  }, [router, offerId]);

  const handleProductHover = useCallback((productId: string) => {
    setHoveredProduct(productId);
    router.prefetch(`/shop/products/${productId}`);
  }, [router]);

  const ProductSelectionButtons = ({ product }: { product: ProductItem }) => {
    const buyCount = getProductCountInType(product.id, 'buy');
    const getCount = getProductCountInType(product.id, 'get');
    const canAddToBuy = canAddProduct(product.id, 'buy');
    const canAddToGet = canAddProduct(product.id, 'get');

    return (
      <div className="mt-2 flex gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleProductAdd(product, 'buy');
          }}
          disabled={!canAddToBuy}
          className="flex-1 flex items-center cursor-pointer justify-center gap-1 py-1.5 px-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
        >
          <ShoppingBag size={12} />
          Buy {buyCount > 0 && `(${buyCount})`}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleProductAdd(product, 'get');
          }}
          disabled={!canAddToGet}
          className="flex-1 flex items-center cursor-pointer justify-center gap-1 py-1.5 px-2 bg-green-50 text-green-600 border border-green-200 rounded-md hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
        >
          <Gift size={12} />
          Get {getCount > 0 && `(${getCount})`}
        </button>
      </div>
    );
  };

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

  return (
    <div className="container mx-auto p-2 md:p-6">
      <div className="flex items-center gap-2 text-sm mb-6 justify-center">
        <Link href="/" className="text-gray-500 hover:text-gray-700 flex items-center">
          <Home size={14} className="mr-1" />
          Home
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900">{offerData.offer_name}</span>
      </div>

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
        <div className={`${isMobile ? 'w-full mb-6' : 'w-2/3'}`}>
          <h2 className="text-xl font-semibold mb-4">Select Products for Your Offer</h2>
          
          <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
            {offerData.products.map((product) => {
              const discount = calculateDiscount(product.product_price, product.strike_price);
              const mainImage = product.images?.[0]?.product_image || '';
              const hoverImage = product.images?.[1]?.product_image || product.images?.[0]?.product_image || '';
              const totalSelected = getTotalProductCount(product.id);
              const isCurrentlyNavigating = isNavigating === product.id;
              
              return (
                <div 
                  key={product.id} 
                  className="border border-gray-200 rounded-lg p-2 bg-white shadow-sm group"
                  onMouseEnter={() => handleProductHover(product.id)}
                  onMouseLeave={() => setHoveredProduct(null)}
                >
                  <div 
                    className={`relative w-full aspect-square cursor-pointer overflow-hidden rounded-lg mb-2 transition-opacity duration-200 ${
                      isCurrentlyNavigating ? 'opacity-75' : 'opacity-100'
                    }`}
                    onClick={() => handleProductClick(product.id)}
                  >
                    {isCurrentlyNavigating && (
                      <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-20">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin"></div>
                      </div>
                    )}
                    
                    <Image
                      src={mainImage ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${mainImage}` : '/images/placeholder.png'}
                      alt={product.product_name}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      className={`object-cover object-center transition-all duration-500 ease-in-out transform ${
                        hoveredProduct === product.id ? 'scale-110 opacity-0' : 'scale-100 opacity-100'
                      }`}
                      priority={false}
                      loading="lazy"
                    />
                    
                    <Image
                      src={hoverImage ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${hoverImage}` : '/images/placeholder.png'}
                      alt={`${product.product_name} - alternate view`}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      className={`object-cover object-center transition-all duration-500 ease-in-out transform ${
                        hoveredProduct === product.id ? 'scale-100 opacity-100' : 'scale-110 opacity-0'
                      }`}
                      loading="lazy"
                    />
                    
                    {!product.product_status && (
                      <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">Out of Stock</span>
                      </div>
                    )}
                    
                    {discount && (
                      <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded z-10">
                        {discount}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 
                      className={`font-medium line-clamp-2 mb-1 cursor-pointer hover:text-blue-500 transition-colors text-sm ${
                        isCurrentlyNavigating ? 'text-gray-500' : ''
                      }`}
                      onClick={() => handleProductClick(product.id)}
                    >
                      {product.product_name}
                      {isCurrentlyNavigating && (
                        <span className="ml-2 text-xs text-gray-400">Loading...</span>
                      )}
                    </h3>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">₹{parseFloat(product.product_price).toLocaleString()}</span>
                      {parseFloat(product.strike_price) > 0 && (
                        <>
                          <span className="text-xs text-gray-500 line-through">₹{parseFloat(product.strike_price).toLocaleString()}</span>
                        </>
                      )}
                    </div>
                    {product.product_status && <ProductSelectionButtons product={product} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {!isMobile && (
          <OfferCartSidebar 
            offerData={offerData}
            slots={offerSlots}
            onSlotClear={handleSlotClear}
          />
        )}
      </div>

      {isMobile && filledSlots.length > 0 && (
  <div className="fixed bottom-0 left-0 right-0 bg-[#175e7a] rounded-tr-2xl rounded-tl-2xl shadow-lg px-4 pt-4 pb-14 z-50">
    <div
      className="flex items-center justify-between cursor-pointer"
      onClick={() => setShowMobileSlider(true)}
    >
      <div className="flex items-center gap-6">
        {/* Buy Section */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full border-2 border-white/30 flex items-center justify-center">
              <ShoppingBag size={16} className="text-white" />
            </div>
            <span className="absolute -top-1 -right-1 bg-white text-[#175e7a] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {buySlots.filter(s => s.product).length}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-medium text-sm">Buy Items</span>
            <span className="text-white/80 text-xs">
              {buySlots.filter(s => s.product).length} of {offerData.buy_count} selected
            </span>
          </div>
        </div>
        
        {/* Get Section */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full border-2 border-white/30 flex items-center justify-center">
              <Gift size={16} className="text-white" />
            </div>
            <span className="absolute -top-1 -right-1 bg-white text-[#175e7a] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {getSlots.filter(s => s.product).length}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-medium text-sm">Get Items</span>
            <span className="text-white/80 text-xs">
              {getSlots.filter(s => s.product).length} of {offerData.get_count} selected
            </span>
          </div>
        </div>
      </div>
      <ChevronUp size={23} className="text-white" />
    </div>
  </div>
)}

      {isMobile && (
        <OfferMobileSlider
          isOpen={showMobileSlider}
          onClose={() => setShowMobileSlider(false)}
          offerData={offerData}
          slots={offerSlots}
          onSlotClear={handleSlotClear}
        />
      )}
    </div>
  );
}