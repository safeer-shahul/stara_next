'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/autoplay';

interface CategoryItem {
  image: string;
  title: string;
  link: string;
}

export default function CategoryGrid() {
  const router = useRouter();

  const categories: CategoryItem[] = [
    { image: '/images/categories/silverneckl.png', title: 'NECKLACES', link: '/shop/categories/necklaces' },
    { image: '/images/categories/silverring.png', title: 'RINGS', link: '/shop/categories/rings' },
    { image: '/images/categories/silverbracelets.png', title: 'BRACELETS', link: '/shop/categories/bracelets' },
    { image: '/images/categories/silverear.png', title: 'EARRINGS', link: '/shop/categories/earrings' },
    { image: '/images/categories/silverear.png', title: 'EARRINGS', link: '/shop/categories/earrings' },
    { image: '/images/categories/silverear.png', title: 'EARRINGS', link: '/shop/categories/earrings' },
    { image: '/images/categories/silverear.png', title: 'EARRINGS', link: '/shop/categories/earrings' },
  ];

  const handleCategoryClick = (link: string): void => {
    router.push(link);
  };

  return (
    <div className="w-full mx-auto py-8 relative">
      <h2 className="text-2xl md:text-3xl font-medium text-center mb-8">
        Everyday Demi-fine Jewellery
      </h2>

      <Swiper
        style={{ padding: '18px 0 0 0' }}
        spaceBetween={10}
        slidesPerView={2}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        modules={[Autoplay]}
        loop={true}
        className="category-swiper" // Unique class name
        breakpoints={{
          768: {
            slidesPerView: 4,
          },
        }}
      >
        {categories.map((category, index) => (
          <SwiperSlide key={`${category.title}-${index}`}>
            <div
              className="flex flex-col items-center cursor-pointer group px-2 md:px-4"
              onClick={() => handleCategoryClick(category.link)}
            >
              {/* Round Image Container */}
              <div className="relative w-40 h-40 lg:w-60 lg:h-60 xl:w-70 xl:h-70 rounded-full overflow-hidden transition-transform group-hover:scale-105">
                <Image
                  src={category.image}
                  alt={category.title}
                  fill
                  sizes="(max-width: 768px) 160px, (max-width: 1024px) 240px, 320px"
                  className="object-cover object-center"
                />
              </div>
              <h3 className="mt-4 text-sm md:text-base font-medium">{category.title}</h3>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}