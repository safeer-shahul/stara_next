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

interface ProductImage {
  id: string;
  product_image: string;
  product: string;
}

interface Product {
  id: string;
  images: ProductImage[];
  product_code: string;
  product_name: string;
  product_description: string;
  product_price: string;
  strike_price: string;
  quantity: number;
  product_status: boolean;
  created_at: string;
  updated_at: string;
  sub_category: string;
}

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
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState<string | null>(null);
  
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    // Set initial width
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Effect to reinitialize swiper when window size changes significantly
  useEffect(() => {
    if (swiperInstance) {
      swiperInstance.update();
    }
  }, [windowWidth, swiperInstance]);

  // Optimized product click handler with loading state
  const handleProductClick = useCallback(async (productId: string): Promise<void> => {
    try {
      setIsNavigating(productId);
      
      // Use replace for faster navigation and avoid back button issues
      await router.push(`/shop/products/${productId}`);
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      // Reset loading state after a delay to prevent flashing
      setTimeout(() => setIsNavigating(null), 100);
    }
  }, [router]);

  // Prefetch product pages on hover for better UX
  const handleProductHover = useCallback((productId: string) => {
    setHoveredProduct(productId);
    
    // Prefetch the product page for faster navigation
    router.prefetch(`/shop/products/${productId}`);
  }, [router]);

  // Updated handleAddToBag function with the same logic as ProductDetail page
  const handleAddToBag = useCallback((e: React.MouseEvent, productId: string): void => {
    e.stopPropagation();
    
    // Set the selected product ID to pass to CartDrawer
    setSelectedProductId(productId);
    
    // Open the cart drawer
    setIsCartOpen(true);
    
    // For backward compatibility, also update localStorage
    // Get current cart items
    const storedCartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    
    // Check if we're dealing with the old format (array of strings)
    if (storedCartItems.length > 0 && typeof storedCartItems[0] === 'string') {
      // Convert old format items, removing hyphens
      const formattedCartIds = storedCartItems.map((id: any) => id.replace(/-/g, ''));
      
      // Add new product ID
      const productIdWithoutHyphens = productId.replace(/-/g, '');
      const updatedCart = [...formattedCartIds, productIdWithoutHyphens];
      
      // Count occurrences and convert to new format
      const productCounts: any = {};
      updatedCart.forEach(id => {
        productCounts[id] = (productCounts[id] || 0) + 1;
      });
      
      // Convert to new format with quantities
      const newFormatCart = Object.keys(productCounts).map(id => ({
        id,
        quantity: productCounts[id]
      }));
      
      localStorage.setItem('cartItems', JSON.stringify(newFormatCart));
    } else {
      // Already using new format
      const productIdWithoutHyphens = productId.replace(/-/g, '');
      
      // Find if product already exists in cart
      const existingItemIndex = storedCartItems.findIndex(
        (item: any) => item.id === productIdWithoutHyphens
      );
      
      let updatedCartItems;
      
      if (existingItemIndex >= 0) {
        // Product already exists, increase quantity
        updatedCartItems = [...storedCartItems];
        updatedCartItems[existingItemIndex] = {
          ...updatedCartItems[existingItemIndex],
          quantity: updatedCartItems[existingItemIndex].quantity + 1
        };
      } else {
        // Product doesn't exist in cart, add it with quantity 1
        updatedCartItems = [
          ...storedCartItems, 
          { id: productIdWithoutHyphens, quantity: 1 }
        ];
      }
      
      localStorage.setItem('cartItems', JSON.stringify(updatedCartItems));
    }
  }, []);

  // Handle cart drawer close
  const handleCartClose = useCallback(() => {
    setIsCartOpen(false);
    // Reset selected product ID when cart is closed
    setSelectedProductId(null);
  }, []);

  // Navigation handlers for manual control
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

  // Calculate discount percentage
  const calculateDiscount = useCallback((price: string, strikePrice: string): string => {
    if (!strikePrice || parseFloat(strikePrice) <= 0) return '';
    
    const currentPrice = parseFloat(price);
    const originalPrice = parseFloat(strikePrice);
    
    if (currentPrice >= originalPrice) return '';
    
    const discount = ((originalPrice - currentPrice) / originalPrice) * 100;
    return `${Math.round(discount)}% OFF`;
  }, []);

  // Check if products exist and have length
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
            const inStock = product.quantity > 0;
            const isCurrentlyNavigating = isNavigating === product.id;
            
            return (
              <SwiperSlide key={product.id}>
                <div 
                  className="relative group"
                  onMouseEnter={() => handleProductHover(product.id)}
                  onMouseLeave={() => setHoveredProduct(null)}
                >
                  {/* Product Image Container */}
                  <div 
                    className={`relative w-full aspect-square cursor-pointer overflow-hidden transition-opacity duration-200 ${
                      isCurrentlyNavigating ? 'opacity-75' : 'opacity-100'
                    }`}
                    onClick={() => handleProductClick(product.id)}
                  >
                    {/* Loading overlay */}
                    {isCurrentlyNavigating && (
                      <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-20">
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin"></div>
                      </div>
                    )}
                    
                    {/* Main image */}
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
                    
                    {/* Hover image */}
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
                    
                    {/* Stock badge */}
                    {!inStock && (
                      <div className="absolute top-2 left-2 bg-red-100 text-red-800 px-2 py-1 text-xs font-medium z-10">
                        Out of Stock
                      </div>
                    )}
                    
                    {/* Discount badge */}
                    {discount && inStock && (
                      <div className="absolute top-2 left-2 bg-green-100 text-green-800 px-2 py-1 text-xs font-medium z-10">
                        {discount}
                      </div>
                    )}
                    
                    {/* Wishlist button */}
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
                    
                    {/* Add to Bag button - Only show for in-stock items */}
                    {inStock && (
                      <button
                        className={`absolute bottom-3 cursor-pointer right-3 w-10 h-10 flex items-center justify-center rounded-full bg-gray-800 text-white shadow-sm transition-opacity ${
                          hoveredProduct === product.id ? 'opacity-100' : 'opacity-0'
                        }`}
                        onClick={(e) => handleAddToBag(e, product.id)}
                        aria-label="Add to bag"
                      >
                        <ShoppingCart size={18} />
                      </button>
                    )}
                  </div>
                  
                  {/* Product Info */}
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
        
        {/* Navigation Buttons - Each slider gets unique class names based on categoryId */}
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
      
      {/* Cart Drawer */}
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={handleCartClose} 
        productId={selectedProductId} 
      />
    </div>
  );
}