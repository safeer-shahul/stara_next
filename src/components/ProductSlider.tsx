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

interface ProductItem {
  id: string;
  image: string;
  hoverImage: string;
  title: string;
  price: number;
  originalPrice: number;
  discount: string;
  link: string;
  promo?: string;
}

export default function ProductSlider() {
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
  
  // Sample product data based on the images, now with hover images
  const products: ProductItem[] = [
    {
      id: 'p1',
      image: '/images/productslider/PM-EARRINGS-037_1_0040.webp',
      hoverImage: '/images/productslider/PM-EARRINGS-037_3.webp',
      title: 'Small Heart Hoop Earrings',
      price: 2580,
      originalPrice: 3686,
      discount: '30%',
      link: '/products/small-heart-hoop-earrings',
      promo: 'BUY 1 GET 1'
    },
    {
      id: 'p2',
      image: '/images/productslider/PM-EARRINGS-037_1_0040.webp',
      hoverImage: '/images/productslider/PM-EARRINGS-037_3.webp',
      title: 'Green Baguette Tennis Bracelet',
      price: 3010,
      originalPrice: 4300,
      discount: '30%',
      link: '/products/green-baguette-tennis-bracelet',
      promo: 'BUY 1 GET 1'
    },
    {
      id: 'p3',
      image: '/images/productslider/PM-EARRINGS-037_1_0040.webp',
      hoverImage: '/images/productslider/PM-EARRINGS-037_3.webp',
      title: 'Black Onyx Ring',
      price: 2687,
      originalPrice: 3839,
      discount: '30%',
      link: '/products/black-onyx-ring',
      promo: 'BUY 1 GET 1'
    },
    {
      id: 'p5',
      image: '/images/productslider/PM-EARRINGS-037_1_0040.webp',
      hoverImage: '/images/productslider/PM-EARRINGS-037_3.webp',
      title: 'Peripheral Heart Earrings',
      price: 2164,
      originalPrice: 3091,
      discount: '29%',
      link: '/products/peripheral-heart-earrings',
      promo: 'BUY 1 GET 1'
    },
    // Adding more products to ensure we have enough for large screens
    {
      id: 'p6',
      image: '/images/productslider/PM-EARRINGS-037_1_0040.webp',
      hoverImage: '/images/productslider/PM-EARRINGS-037_3.webp',
      title: 'Silver Chain Necklace',
      price: 3500,
      originalPrice: 5000,
      discount: '30%',
      link: '/products/silver-chain-necklace',
      promo: 'BUY 1 GET 1'
    },
    {
      id: 'p7',
      image: '/images/productslider/PM-EARRINGS-037_1_0040.webp',
      hoverImage: '/images/productslider/PM-EARRINGS-037_3.webp',
      title: 'Gold Plated Bangle',
      price: 4200,
      originalPrice: 6000,
      discount: '30%',
      link: '/products/gold-plated-bangle',
      promo: 'BUY 1 GET 1'
    },
  ];

  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);

  const handleProductClick = (link: string): void => {
    router.push(link);
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

  return (
    <div className="w-full mx-auto py-8 relative px-2 lg:px-8 xl:px-14">
      <h2 className="text-2xl md:text-3xl font-medium text-center mb-8">
        Date Night
      </h2>
      
      <div className="relative">
        <Swiper
          spaceBetween={20}
          slidesPerView={2}
          slidesPerGroup={1}
          loop={true}
          autoplay={{ 
            delay: 3500, 
            disableOnInteraction: false 
          }}
          modules={[Autoplay, Navigation]}
          navigation={{
            prevEl: '.product-swiper-prev',
            nextEl: '.product-swiper-next',
            enabled: true,
          }}
          watchOverflow={true}
          observer={true}
          observeParents={true}
          updateOnWindowResize={true}
          onSwiper={(swiper) => setSwiperInstance(swiper)}
          className="product-swiper"
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
          {products.map((product) => (
            <SwiperSlide key={product.id}>
              <div 
                className="relative group"
                onMouseEnter={() => setHoveredProduct(product.id)}
                onMouseLeave={() => setHoveredProduct(null)}
              >
                {/* Promo Tag */}
                {product.promo && (
                  <div className="absolute top-2 left-2 bg-gray-100 text-gray-800 px-2 py-1 text-xs font-medium z-10">
                    {product.promo}
                  </div>
                )}
                
                {/* Product Image Container */}
                <div 
                  className="relative w-full aspect-square cursor-pointer overflow-hidden"
                  onClick={() => handleProductClick(product.link)}
                >
                  {/* Main image */}
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
                    className={`object-cover object-center transition-all duration-500 ease-in-out transform ${
                      hoveredProduct === product.id ? 'scale-110 opacity-0' : 'scale-100 opacity-100'
                    }`}
                  />
                  
                  {/* Hover image */}
                  <Image
                    src={product.hoverImage}
                    alt={`${product.title} - model view`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
                    className={`object-cover object-center transition-all duration-500 ease-in-out transform ${
                      hoveredProduct === product.id ? 'scale-100 opacity-100' : 'scale-110 opacity-0'
                    }`}
                  />
                  
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
                  >
                    <ShoppingBag size={18} />
                  </button>
                </div>
                
                {/* Product Info */}
                <div className="mt-4">
                  <h3 
                    className="text-sm md:text-base font-medium cursor-pointer hover:text-blue-500 transition-colors"
                    onClick={() => handleProductClick(product.link)}
                  >
                    {product.title}
                  </h3>
                  <div className="flex items-center mt-1 gap-2">
                    <span className="text-sm font-semibold">₹ {product.price.toLocaleString()}</span>
                    <span className="text-xs text-gray-500 line-through">₹ {product.originalPrice.toLocaleString()}</span>
                    <span className="text-xs text-green-600">({product.discount})</span>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        
        {/* Lucide Navigation Buttons - Direct onClick handlers for better reliability */}
        <button 
          onClick={goPrev}
          className="product-swiper-prev absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-full bg-black text-white hover:bg-white hover:text-black transition-colors"
        >
          <ChevronLeft size={isMobile ? 20 : 24} />
        </button>
        <button 
          onClick={goNext}
          className="product-swiper-next absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-full bg-black text-white hover:bg-white hover:text-black transition-colors"
        >
          <ChevronRight size={isMobile ? 20 : 24} />
        </button>
      </div>
    </div>
  );
}