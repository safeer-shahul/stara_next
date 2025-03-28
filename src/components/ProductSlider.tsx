'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import { Heart, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';
import { isMobile } from 'react-device-detect';

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
  
  // Effect to update window width state on mount and resize
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

  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);

  const handleProductClick = (productId: string): void => {
    router.push(`/shop/products/${productId}`);
  };

  const handleAddToWishlist = (e: React.MouseEvent, productId: string): void => {
    e.stopPropagation();
    console.log('Added to wishlist:', productId);
    // Implement wishlist functionality here
  };

  const handleAddToBag = (e: React.MouseEvent, productId: string): void => {
    e.stopPropagation();
    console.log('Added to bag:', productId);
    // Implement add to bag functionality here
  };

  // Navigation handlers for manual control
  const goNext = () => {
    if (swiperInstance) {
      swiperInstance.slideNext();
    }
  };

  const goPrev = () => {
    if (swiperInstance) {
      swiperInstance.slidePrev();
    }
  };

  // Calculate discount percentage
  const calculateDiscount = (price: string, strikePrice: string): string => {
    if (!strikePrice || parseFloat(strikePrice) <= 0) return '';
    
    const currentPrice = parseFloat(price);
    const originalPrice = parseFloat(strikePrice);
    
    if (currentPrice >= originalPrice) return '';
    
    const discount = ((originalPrice - currentPrice) / originalPrice) * 100;
    return `${Math.round(discount)}% OFF`;
  };
  

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
            
            return (
              <SwiperSlide key={product.id}>
                <div 
                  className="relative group"
                  onMouseEnter={() => setHoveredProduct(product.id)}
                  onMouseLeave={() => setHoveredProduct(null)}
                >
                  {/* Product Image Container */}
                  <div 
                    className="relative w-full aspect-square cursor-pointer overflow-hidden"
                    onClick={() => handleProductClick(product.id)}
                  >
                    {/* Main image */}
                    <Image
                      src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${mainImage}`}
                      alt={product.product_name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
                      className={`object-cover object-center transition-all duration-500 ease-in-out transform ${
                        hoveredProduct === product.id ? 'scale-110 opacity-0' : 'scale-100 opacity-100'
                      }`}
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
                    />
                    
                    {/* Stock badge */}
                    {product.quantity <= 0 && (
                      <div className="absolute top-2 left-2 bg-red-100 text-red-800 px-2 py-1 text-xs font-medium z-10">
                        Out of Stock
                      </div>
                    )}
                    
                    {/* Discount badge */}
                    {discount && (
                      <div className="absolute top-2 left-2 bg-green-100 text-green-800 px-2 py-1 text-xs font-medium z-10">
                        {discount}
                      </div>
                    )}
                    
                    {/* Wishlist button */}
                    <button
                      className={`absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 shadow-sm transition-opacity ${
                        hoveredProduct === product.id ? 'opacity-100' : 'opacity-0'
                      }`}
                      onClick={(e) => handleAddToWishlist(e, product.id)}
                      aria-label="Add to wishlist"
                    >
                      <Heart size={16} className="text-gray-700 hover:text-red-500 transition-colors" />
                    </button>
                    
                    {/* Add to Bag button */}
                    <button
                      className={`absolute bottom-3 right-3 w-10 h-10 flex items-center justify-center rounded-full bg-gray-800 text-white shadow-sm transition-opacity ${
                        hoveredProduct === product.id ? 'opacity-100' : 'opacity-0'
                      }`}
                      onClick={(e) => handleAddToBag(e, product.id)}
                      aria-label="Add to bag"
                      disabled={product.quantity <= 0}
                    >
                      <ShoppingBag size={18} />
                    </button>
                  </div>
                  
                  {/* Product Info */}
                  <div className="mt-4">
                    <h3 
                      className="text-sm md:text-base font-medium cursor-pointer hover:text-blue-500 transition-colors"
                      onClick={() => handleProductClick(product.id)}
                    >
                      {product.product_name}
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
    </div>
  );
}