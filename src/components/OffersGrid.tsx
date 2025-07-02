'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/autoplay';

interface OfferItem {
  id: string;
  offer_name: string;
  buy_count: number;
  get_count: number;
  start_date: string;
  end_date: string;
  offer_image: string;
  products: string[];
}

interface OffersGridProps {
  offers: OfferItem[];
}

export default function OffersGrid({ offers }: OffersGridProps) {
  const router = useRouter();

  const handleOfferClick = (offer: OfferItem): void => {
    // You can customize this navigation logic based on your requirements
    // For now, I'll create a generic offers page route
    router.push(`/shop/offers/${offer.id}`);
  };

  // Don't render the component if there are no offers
  if (!offers || offers.length === 0) {
    return null;
  }

  return (
    <div className="w-full mx-auto py-8 relative">
      <h2 className="text-2xl md:text-3xl font-medium text-center mb-8">
        Special Offers
      </h2>
      
      <Swiper
        style={{ padding: '18px 0 0 0' }}
        spaceBetween={10}
        slidesPerView={2}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        modules={[Autoplay]}
        loop={true}
        className="offers-swiper"
        breakpoints={{
          768: {
            slidesPerView: 4,
          },
        }}
      >
        {offers.map((offer) => (
          <SwiperSlide key={offer.id}>
            <div
              className="flex flex-col items-center cursor-pointer group px-2 md:px-4"
              onClick={() => handleOfferClick(offer)}
            >
              {/* Rounded Rectangle Image Container */}
              <div className="relative w-full aspect-square max-w-80 rounded-md overflow-hidden transition-transform group-hover:scale-105 shadow-lg">
                <Image
                  src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${offer.offer_image}`}
                  alt={offer.offer_name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover object-center"
                  unoptimized={process.env.NODE_ENV === 'development'}
                />
              </div>
              
              {/* Offer Details */}
              <div className="mt-4 text-center">
                <h3 className="text-sm md:text-base font-medium text-gray-900 mb-1">
                  {offer.offer_name}
                </h3>
                <p className="text-xs md:text-sm text-gray-600">
                  Buy {offer.buy_count} Get {offer.get_count} Free
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Valid till {new Date(offer.end_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}