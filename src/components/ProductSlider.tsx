'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';
import { isMobile } from 'react-device-detect';
import WishlistButton from '@/components/WishlistButton';
import CartDrawer from '@/components/CartDrawer';
import { useCart, CartNormalItem, ProductItemDetails, ProductVariant } from '@/context/cartContext';
import { v4 as uuidv4 } from 'uuid';
import VariantSelectionModal from '@/components/VariantSelectionModal';
import { showToast } from '@/utils/toast';

interface Product extends ProductItemDetails {}

interface ProductSliderProps {
  title: string;
  categoryId: string;
  products: Product[];
}

export default function ProductSlider({ title, categoryId, products }: ProductSliderProps) {
  const router = useRouter();
  const [swiperInstance, setSwiperInstance] = useState<any>(null);
  const [windowWidth, setWindowWidth] = useState<number>(0);
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isNavigating, setIsNavigating] = useState<string | null>(null);

  // NEW STATES FOR VARIANT SELECTION POPUP
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [productForVariantSelection, setProductForVariantSelection] = useState<ProductItemDetails | null>(null);

  const { dispatchCart, getEffectiveProductStock } = useCart();

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    handleResize();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (swiperInstance) {
      swiperInstance.update();
    }
  }, [windowWidth, swiperInstance]);

  const handleProductClick = useCallback(async (productId: string): Promise<void> => {
    try {
      setIsNavigating(productId);
      await router.push(`/shop/products/${productId}`);
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      setTimeout(() => setIsNavigating(null), 100);
    }
  }, [router]);

  const handleProductHover = useCallback((productId: string) => {
    setHoveredProduct(productId);
    router.prefetch(`/shop/products/${productId}`);
  }, [router]);

  // FIXED: No manual delays - let CartContext handle everything
  const handleAddProductToCart = useCallback((productToAdd: ProductItemDetails, selectedVariantToAdd: ProductVariant | null = null): void => {
    const effectiveStock = getEffectiveProductStock(productToAdd, selectedVariantToAdd?.id);
    
    if (effectiveStock <= 0) {
      const variantText = selectedVariantToAdd ? ` (${selectedVariantToAdd.variant_name})` : '';
      showToast.warning(`${productToAdd.product_name}${variantText} is currently out of stock or you have reached the maximum quantity allowed.`);
      return;
    }

    const tempCartItemId = uuidv4();

    const cartItem: CartNormalItem = {
      id: tempCartItemId,
      product_id: productToAdd.id,
      quantity: 1,
      type: 'normal',
      isSynced: false,
      product_name: productToAdd.product_name,
      product_price: productToAdd.product_price,
      strike_price: productToAdd.strike_price,
      images: productToAdd.images,
      isInStock: selectedVariantToAdd ? selectedVariantToAdd.quantity > 0 : (productToAdd.isInStock || (productToAdd.product_status && productToAdd.quantity > 0)),
      stock_quantity: selectedVariantToAdd?.quantity ?? productToAdd.quantity,
      ...(selectedVariantToAdd && { selectedVariant: selectedVariantToAdd }),
      productDetails: productToAdd,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // FIXED: Just dispatch - no manual delays
    dispatchCart({
      type: 'ADD_NORMAL_ITEM',
      payload: cartItem,
    });

    const variantText = selectedVariantToAdd ? ` (${selectedVariantToAdd.variant_name})` : '';
    showToast.success(`${productToAdd.product_name}${variantText} added to cart!`);

    // FIXED: Open cart immediately - CartContext handles the sync
    setIsCartOpen(true);
    setIsVariantModalOpen(false);
    setProductForVariantSelection(null);
  }, [dispatchCart, getEffectiveProductStock]);

  // UPDATED: handleAddToBag to check for variants
  const handleAddToBag = useCallback((e: React.MouseEvent, product: Product): void => {
    e.stopPropagation();

    if (product.have_variants && product.product_variant && product.product_variant.length > 0) {
      setProductForVariantSelection(product);
      setIsVariantModalOpen(true);
    } else {
      handleAddProductToCart(product);
    }
  }, [handleAddProductToCart]);

  const handleCartClose = useCallback(() => {
    setIsCartOpen(false);
  }, []);

  const goNext = useCallback(() => {
    if (swiperInstance) {
      swiperInstance.slideNext();
    }
  }, [swiperInstance]);

  const goPrev = useCallback(() => {
    if (swiperInstance) {
      swiperInstance.slidePrev();
    }
  }, [swiperInstance]);

  const calculateDiscount = useCallback((price: string, strikePrice: string): string => {
    if (!strikePrice || parseFloat(strikePrice) <= 0) return '';

    const currentPrice = parseFloat(price);
    const originalPrice = parseFloat(strikePrice);

    if (currentPrice >= originalPrice) return '';

    const discount = ((originalPrice - currentPrice) / originalPrice) * 100;
    return `${Math.round(discount)}% OFF`;
  }, []);

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="w-full mx-auto py-8 relative px-2 lg:px-8 xl:px-14">
      <h2 className="text-2xl md:text-3xl font-medium text-center mb-8">
        {title}
      </h2>

      <div className="relative">
        <Swiper
          spaceBetween={20}
          slidesPerView={2}
          slidesPerGroup={1}
          loop={products.length > 4}
          autoplay={{
            delay: 3500,
            disableOnInteraction: false
          }}
          modules={[Autoplay, Navigation]}
          navigation={{
            prevEl: `.product-swiper-prev-${categoryId}`,
            nextEl: `.product-swiper-next-${categoryId}`,
            enabled: true,
          }}
          watchOverflow={true}
          observer={true}
          observeParents={true}
          updateOnWindowResize={true}
          onSwiper={(swiper) => setSwiperInstance(swiper)}
          className={`product-swiper-${categoryId}`}
          breakpoints={{
            0: {
              slidesPerView: 2,
              spaceBetween: 10,
            },
            640: {
              slidesPerView: 2,
              spaceBetween: 15,
            },
            768: {
              slidesPerView: 3,
              spaceBetween: 20,
            },
            1024: {
              slidesPerView: 4,
              spaceBetween: 20,
            },
            1280: {
              slidesPerView: 4,
              spaceBetween: 25,
            },
            1536: {
              slidesPerView: 4,
              spaceBetween: 30,
            }
          }}
        >
          {products.map((product) => {
            const discount = calculateDiscount(product.product_price, product.strike_price);
            const mainImage = product.images[0]?.product_image || "";
            const hoverImage = product.images[1]?.product_image || product.images[0]?.product_image || "";
            
            // Calculate if product is in stock based on the data structure
            let inStock = false;
            if (product.have_variants && product.product_variant && product.product_variant.length > 0) {
              // For variant products, check if any variant has stock
              inStock = product.product_status && product.product_variant.some(v => v.quantity > 0);
            } else {
              // For non-variant products, check regular stock
              inStock = product.product_status && product.quantity > 0;
            }
            
            const isCurrentlyNavigating = isNavigating === product.id;
            
            // Check effective stock - for variant products, check if any variant has stock
            let effectiveStock = 0;
            let hasAvailableVariant = false;
            
            if (product.have_variants && product.product_variant && product.product_variant.length > 0) {
              // For variant products, check if any variant has effective stock
              hasAvailableVariant = product.product_variant.some(variant => {
                const variantEffectiveStock = getEffectiveProductStock(product, variant.id);
                return variant.quantity > 0 && variantEffectiveStock > 0;
              });
              effectiveStock = hasAvailableVariant ? 1 : 0; // Set to 1 if any variant is available
            } else {
              // For non-variant products, check regular effective stock
              effectiveStock = getEffectiveProductStock(product, undefined);
            }
            
            const isEffectivelyOutOfStock = effectiveStock <= 0;

            return (
              <SwiperSlide key={product.id}>
                <div
                  className="relative group"
                  onMouseEnter={() => handleProductHover(product.id)}
                  onMouseLeave={() => setHoveredProduct(null)}
                >
                  <div
                    className={`relative w-full aspect-square cursor-pointer overflow-hidden transition-opacity duration-200 ${
                      isCurrentlyNavigating ? 'opacity-75' : 'opacity-100'
                    }`}
                    onClick={() => handleProductClick(product.id)}
                  >
                    {isCurrentlyNavigating && (
                      <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-20">
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin"></div>
                      </div>
                    )}

                    <Image
                      src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${mainImage}`}
                      alt={product.product_name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
                      className={`object-cover object-center transition-all duration-500 ease-in-out transform ${
                        hoveredProduct === product.id ? 'scale-110 opacity-0' : 'scale-100 opacity-100'
                      }`}
                      priority={false}
                      loading="lazy"
                    />

                    <Image
                      src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${hoverImage}`}
                      alt={`${product.product_name} - model view`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
                      className={`object-cover object-center transition-all duration-500 ease-in-out transform ${
                        hoveredProduct === product.id ? 'scale-100 opacity-100' : 'scale-110 opacity-0'
                      }`}
                      loading="lazy"
                    />

                    {/* Top left badge - Always show discount if available, otherwise show out of stock */}
                    {discount ? (
                      <div className="absolute top-2 left-2 bg-green-100 text-green-800 px-2 py-1 text-xs font-medium z-10">
                        {discount}
                      </div>
                    ) : (!inStock || isEffectivelyOutOfStock) && (
                      <div className="absolute top-2 left-2 bg-red-100 text-red-800 px-2 py-1 text-xs font-medium z-10">
                        Out of Stock
                      </div>
                    )}

                    <div
                      className={`absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 shadow-sm transition-opacity ${
                        hoveredProduct === product.id ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      <WishlistButton
                        productId={product.id}
                        size={16}
                      />
                    </div>

                    {/* Shopping Cart Button or Out of Stock Text */}
                    {(!inStock || isEffectivelyOutOfStock) ? (
                      <div className={`absolute bottom-3 right-3 px-3 py-2 bg-red-500 text-white text-xs font-medium rounded-md transition-opacity ${
                        hoveredProduct === product.id ? 'opacity-100' : 'opacity-0'
                      }`}>
                        Out of Stock
                      </div>
                    ) : (
                      <button
                        className={`absolute bottom-3 cursor-pointer right-3 w-10 h-10 flex items-center justify-center rounded-full bg-gray-800 text-white shadow-sm transition-opacity hover:bg-gray-700 ${
                          hoveredProduct === product.id ? 'opacity-100' : 'opacity-0'
                        }`}
                        onClick={(e) => handleAddToBag(e, product)}
                        aria-label="Add to bag"
                      >
                        <ShoppingCart size={18} />
                      </button>
                    )}
                  </div>

                  <div className="mt-4">
                    <h3
                      className={`text-sm md:text-base font-medium cursor-pointer hover:text-blue-500 transition-colors ${
                        isCurrentlyNavigating ? 'text-gray-500' : ''
                      }`}
                      onClick={() => handleProductClick(product.id)}
                    >
                      {product.product_name}
                      {isCurrentlyNavigating && (
                        <span className="ml-2 text-xs text-gray-400">Loading...</span>
                      )}
                    </h3>
                    <div className="flex items-center mt-1 gap-2">
                      <span className="text-sm font-semibold">₹ {parseFloat(product.product_price).toLocaleString()}</span>
                      {parseFloat(product.strike_price) > 0 && (
                        <>
                          <span className="text-xs text-gray-500 line-through">₹ {parseFloat(product.strike_price).toLocaleString()}</span>
                          {discount && <span className="text-xs text-green-600">({discount})</span>}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>

        <button
          onClick={goPrev}
          className={`product-swiper-prev-${categoryId} absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-full bg-black text-white hover:bg-white hover:text-black transition-colors`}
        >
          <ChevronLeft size={isMobile ? 20 : 24} />
        </button>
        <button
          onClick={goNext}
          className={`product-swiper-next-${categoryId} absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-full bg-black text-white hover:bg-white hover:text-black transition-colors`}
        >
          <ChevronRight size={isMobile ? 20 : 24} />
        </button>
      </div>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={handleCartClose}
      />

      <VariantSelectionModal
        isOpen={isVariantModalOpen}
        onClose={() => setIsVariantModalOpen(false)}
        product={productForVariantSelection}
        onVariantSelected={handleAddProductToCart}
      />
    </div>
  );
}