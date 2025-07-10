'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, Home, ChevronUp, ShoppingBag, Info } from 'lucide-react';
import apiService from '@/utils/api/apiService';
import Link from 'next/link';
import OfferMobileSlider from '@/components/OfferMobileSlider';
import OfferCartSidebar from '@/components/OfferCartSidebar';
import CartDrawer from '@/components/CartDrawer';
import { useCart, ProductItemDetails, ProductVariant } from '@/context/cartContext';
import VariantSelectionModal from '@/components/VariantSelectionModal';
import { v4 as uuidv4 } from 'uuid';
import { showToast } from '@/utils/toast';

type ProductItem = ProductItemDetails;

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
  selectedVariant?: ProductVariant | null;
  slotIndex: number;
}

export default function OfferProductsPage() {
  const params = useParams();
  const router = useRouter();
  const offerId = params?.id as string;

  const { getEffectiveProductStock } = useCart();

  const [loading, setLoading] = useState(true);
  const [offerData, setOfferData] = useState<OfferData | null>(null);
  const [offerSlots, setOfferSlots] = useState<OfferSlot[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileSlider, setShowMobileSlider] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [productForVariantSelection, setProductForVariantSelection] = useState<ProductItemDetails | null>(null);


  const checkAuthentication = useCallback(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      setIsAuthenticated(true);
      return true;
    } else {
      setIsAuthenticated(false);
      return false;
    }
  }, []);

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
      const totalSlots = offerData.buy_count + offerData.get_count;
      const slots: OfferSlot[] = [];
      for (let i = 0; i < totalSlots; i++) {
        slots.push({
          id: `slot-${uuidv4()}`,
          product: null,
          selectedVariant: null,
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
        const response: OfferData = await apiService.offerByID(offerId);
        const productsWithStockStatus: ProductItem[] = response.products.map(p => {
            const hasInStockVariant = p.have_variants && p.product_variant?.some(v => v.quantity > 0);
            return {
                ...p,
                isInStock: p.product_status && (p.have_variants ? hasInStockVariant : p.quantity > 0),
            };
        });
        setOfferData({ ...response, products: productsWithStockStatus });
        setError(null);
      } catch (err) {
        // console.error('Failed to fetch offer data:', err);
        setError('Failed to load offer details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchOfferData();
    checkAuthentication();
  }, [offerId, checkAuthentication]);

  const getTotalProductCount = useCallback((productId: string, variantId?: string) => {
    return offerSlots.filter(slot =>
      slot.product?.id === productId &&
      (variantId ? slot.selectedVariant?.id === variantId : !slot.selectedVariant)
    ).length;
  }, [offerSlots]);

  const canAddProductToOfferSlot = useCallback((product: ProductItem, variant: ProductVariant | null) => {
    const emptySlots = offerSlots.filter(slot => !slot.product);
    if (emptySlots.length === 0) {
        return false;
    }

    const currentEffectiveStock = getEffectiveProductStock(product, variant?.id);

    return (variant ? variant.quantity > 0 : (product.product_status && product.quantity > 0)) && currentEffectiveStock > 0;
  }, [offerSlots, getEffectiveProductStock]);

  const handleAddProductToSlot = useCallback((productToAdd: ProductItem, selectedVariantToAdd: ProductVariant | null = null) => {
    const emptySlot = offerSlots.find(slot => !slot.product);

    if (!emptySlot) {
      showToast.warning('All offer slots are filled. Please remove an item first.');
      return;
    }

    // Check effective stock before adding
    const currentEffectiveStock = getEffectiveProductStock(productToAdd, selectedVariantToAdd?.id);
    
    if (currentEffectiveStock <= 0) {
      const variantText = selectedVariantToAdd ? ` (${selectedVariantToAdd.variant_name})` : '';
      showToast.warning(`${productToAdd.product_name}${variantText} is currently out of stock or you have reached the maximum quantity allowed.`);
      return;
    }

    if (!canAddProductToOfferSlot(productToAdd, selectedVariantToAdd)) {
      showToast.warning('This item cannot be added to the offer at the moment.');
      return;
    }

    setOfferSlots(prev =>
      prev.map(slot =>
        slot.id === emptySlot.id
          ? {
              ...slot,
              product: productToAdd,
              selectedVariant: selectedVariantToAdd,
            }
          : slot
      )
    );
    
    const variantText = selectedVariantToAdd ? ` (${selectedVariantToAdd.variant_name})` : '';
    showToast.success(`${productToAdd.product_name}${variantText} added to offer!`);
    
    setIsVariantModalOpen(false);
    setProductForVariantSelection(null);
  }, [offerSlots, canAddProductToOfferSlot, getEffectiveProductStock]);


  const handleProductAdd = useCallback((product: ProductItem) => {
    if (product.have_variants && product.product_variant && product.product_variant.length > 0) {
      setProductForVariantSelection(product);
      setIsVariantModalOpen(true);
    } else {
      handleAddProductToSlot(product);
    }
  }, [handleAddProductToSlot]);


  const handleOpenCartDrawer = useCallback(() => {
    setShowMobileSlider(false);
    setIsCartDrawerOpen(true); 
  }, []);

  const handleSlotClear = useCallback((slotId: string) => {
    setOfferSlots((prev) =>
      prev.map((slot) =>
        slot.id === slotId ? { ...slot, product: null, selectedVariant: null } : slot
      )
    );
  }, []);

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
      // console.error('Navigation error:', error);
    } finally {
      setTimeout(() => setIsNavigating(null), 100);
    }
  }, [router, offerId]);

  const handleProductHover = useCallback((productId: string) => {
    setHoveredProduct(productId);
    router.prefetch(`/shop/products/${productId}`);
  }, [router]);

  const ProductSelectionButton = ({ product }: { product: ProductItem }) => {
    const selectedCount = getTotalProductCount(product.id);
    const isProductAvailableForOffer = product.isInStock;
    const emptySlots = offerSlots.filter(slot => !slot.product);
    const hasEmptySlots = emptySlots.length > 0;

    // Check effective stock for the product
    const effectiveStock = getEffectiveProductStock(product, undefined);
    const isEffectivelyOutOfStock = effectiveStock <= 0;

    const isDisabled = !isProductAvailableForOffer || !hasEmptySlots || isEffectivelyOutOfStock;

    const getButtonText = () => {
      if (isEffectivelyOutOfStock) return 'Out of Stock';
      if (!hasEmptySlots) return 'Slots Full';
      return `Add ${selectedCount > 0 ? `(${selectedCount})` : ''}`;
    };

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      
      if (isEffectivelyOutOfStock) {
        showToast.warning(`${product.product_name} is currently out of stock or you have reached the maximum quantity allowed.`);
        return;
      }
      
      if (!hasEmptySlots) {
        showToast.info('All offer slots are filled. Please remove an item first to add this product.');
        return;
      }
      
      handleProductAdd(product);
    };

    return (
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
          isDisabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-[var(--color-primary-950)] text-white hover:bg-[#0f4c67] cursor-pointer'
        }`}
      >
        <ShoppingBag size={14} />
        {getButtonText()}
      </button>
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

  const filledSlots = getFilledSlots();
  const totalRequiredItems = offerData.buy_count + offerData.get_count;

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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800">
                <p className="font-medium mb-1">How pricing works:</p>
                <p>Select {totalRequiredItems} items total. You&#39;ll only pay for the {offerData.buy_count} most expensive items. The remaining {offerData.get_count} item{offerData.get_count > 1 ? 's' : ''} will be free!</p>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-4">Select {totalRequiredItems} Products for Your Offer</h2>

          <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
            {offerData.products.map((product) => {
              const discount = calculateDiscount(product.product_price, product.strike_price);
              const mainImage = product.images?.[0]?.product_image || '';
              const hoverImage = product.images?.[1]?.product_image || product.images?.[0]?.product_image || '';
              const isCurrentlyNavigating = isNavigating === product.id;

              const totalSelected = getTotalProductCount(product.id);

              // Check effective stock
              const effectiveStock = getEffectiveProductStock(product, undefined);
              const isProductEffectivelyOutOfStockForOffer = !product.isInStock || effectiveStock <= 0;


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

                    {isProductEffectivelyOutOfStockForOffer ? (
                      <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">Out of Stock</span>
                      </div>
                    ) : null}

                    {discount && !isProductEffectivelyOutOfStockForOffer && (
                      <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded z-10">
                        {discount}
                      </div>
                    )}

                    {totalSelected > 0 && (
                      <div className="absolute top-2 right-2 bg-[var(--color-primary-950)] text-white text-xs px-2 py-1 rounded-full z-10 font-medium">
                        {totalSelected}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3
                      className={`font-medium line-clamp-2 mb-1 cursor-pointer hover:text-blue-500 transition-colors ${
                        isCurrentlyNavigating ? 'text-gray-500' : ''
                      }`}
                      onClick={() => handleProductClick(product.id)}
                    >
                      {product.product_name}
                      {isCurrentlyNavigating && (
                        <span className="ml-2 text-xs text-gray-400">Loading...</span>
                      )}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-sm">₹{parseFloat(product.product_price).toLocaleString()}</span>
                      {parseFloat(product.strike_price) > 0 && (
                        <>
                          <span className="text-xs text-gray-500 line-through">₹{parseFloat(product.strike_price).toLocaleString()}</span>
                        </>
                      )}
                    </div>
                    <ProductSelectionButton product={product} />
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
            onOpenCartDrawer={handleOpenCartDrawer}
            isAuthenticated={isAuthenticated}
          />
        )}
      </div>

      {isMobile && filledSlots.length > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 bg-[var(--color-primary-950)] rounded-tr-2xl rounded-tl-2xl shadow-lg px-4 pt-4 pb-14 z-50"
          onClick={() => setShowMobileSlider(true)}
        >
          <div
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center">
                  <ShoppingBag size={20} className="text-white" />
                </div>
                <span className="absolute -top-1 -right-1 bg-white text-[var(--color-primary-950)] text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {filledSlots.length}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-white font-medium text-lg">Selected Items</span>
                <span className="text-white/80 text-sm">
                  {filledSlots.length} of {totalRequiredItems} selected
                </span>
              </div>
            </div>
            <ChevronUp size={24} className="text-white" />
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
          onOpenCartDrawer={handleOpenCartDrawer}
          isAuthenticated={isAuthenticated}
        />
      )}

      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
      />

      <VariantSelectionModal
        isOpen={isVariantModalOpen}
        onClose={() => setIsVariantModalOpen(false)}
        product={productForVariantSelection}
        onVariantSelected={handleAddProductToSlot}
      />
    </div>
  );
}