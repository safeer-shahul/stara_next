'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/autoplay';

interface FashionItem {
  image: string;
  title?: string;
  link?: string;
}

export default function FashionPortraitSlider() {
  const router = useRouter();

  const fashionItems: FashionItem[] = [
    { image: '/images/fashionSlider/valnt-web_cat_5.webp', link: '/collections/spring' },
    { image: '/images/fashionSlider/valnt-web_cat_5.webp', link: '/collections/spring' },
    { image: '/images/fashionSlider/valnt-web_cat_5.webp', link: '/collections/spring' },
    { image: '/images/fashionSlider/valnt-web_cat_5.webp', link: '/collections/spring' },
  ];

  const handleItemClick = (link: string): void => {
    if (link) router.push(link);
  };

  return (
    <div className="w-full mx-auto py-12 px-2 lg:px-8 xl:px-14 relative">
      <Swiper
        spaceBetween={10}
        slidesPerView={2}
        slidesPerGroup={1}
        autoplay={{ delay: 3500, disableOnInteraction: false }}
        modules={[Autoplay]}
        loop={true}
        className="fashion-portrait-swiper" // Unique class name
        breakpoints={{
          768: {
            slidesPerView: 3,
          },
        }}
      >
        {fashionItems.map((item, index) => (
          <SwiperSlide key={`fashion-item-${index}`}>
            <div
              className="cursor-pointer group transition-all duration-300 hover:opacity-95"
              onClick={() => item.link && handleItemClick(item.link)}
            >
              <div className="relative overflow-hidden" style={{ width: '100%', height: 'auto', borderRadius: '4%' }}>
                <Image
                  src={item.image}
                  alt={item.title || `Fashion portrait ${index + 1}`}
                  width={600}
                  height={880}
                  style={{ objectFit: 'cover', objectPosition: 'center', width: '100%', height: 'auto' }}
                  sizes="(max-width: 768px) 50vw, 33vw"
                  priority
                />
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}