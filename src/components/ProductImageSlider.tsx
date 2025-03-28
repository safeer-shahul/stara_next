'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import Image from "next/image";

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface ProductImageSliderProps {
  images: string[];
  productName: string;
  hasOffer?: boolean;
  offerLabel?: string;
}

export default function ProductImageSlider({ 
  images, 
  productName, 
  hasOffer = false, 
  offerLabel = "BUY 1 GET 1" 
}: ProductImageSliderProps) {
  return (
    <div className="relative">
      <div className="absolute top-4 left-4 z-10">
        <Link href="/">
          <button className="bg-white rounded-full p-2 shadow">
            <ChevronLeft className="h-5 w-5 text-gray-700" />
          </button>
        </Link>
      </div>

      {/* {hasOffer && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-white text-black text-xs font-medium px-3 py-1 rounded-sm">
            {offerLabel}
          </div>
        </div>
      )} */}

      <div className="absolute bottom-4 md:bottom-15 right-4 z-10">
        <button className="bg-white p-2 rounded-full shadow-md">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 5.12548 15.0077 5.24916 15.0227 5.37061L8.08059 9.13419C7.54431 8.43539 6.7976 8 5.94999 8C4.34314 8 3 9.34314 3 11C3 12.6569 4.34314 14 5.94999 14C6.7976 14 7.54431 13.5646 8.08059 12.8658L15.0227 16.6294C15.0077 16.7508 15 16.8745 15 17C15 18.6569 16.3431 20 18 20C19.6569 20 21 18.6569 21 17C21 15.3431 19.6569 14 18 14C17.1524 14 16.4057 14.4354 15.8694 15.1342L8.92727 11.3706C8.94231 11.2492 8.94999 11.1255 8.94999 11C8.94999 10.8745 8.94231 10.7508 8.92727 10.6294L15.8694 6.86581C16.4057 7.56461 17.1524 8 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={0}
        slidesPerView={1}
        loop={true}
        navigation={{
          prevEl: '.swiper-button-prevpro_d',
          nextEl: '.swiper-button-nextpro2_d',
        }}
        pagination={{
          clickable: true,
          el: '.custom-pagination',
          type: 'bullets',
          bulletClass: 'swiper-pagination-bullet',
          bulletActiveClass: 'swiper-pagination-bullet-active',
        }}
        className="rounded-lg product-swiper"
      >
        {images.map((image, index) => (
          <SwiperSlide key={index}>
            <Image
              src={image}
              alt={`${productName} - Image ${index + 1}`}
              width={500} 
              height={300}
              className="w-full h-auto"
              priority 
            />
          </SwiperSlide>
        ))}
        
        <div className="hidden lg:block">
          <button className="swiper-button-prevpro_d absolute left-4 top-1/2 z-10 bg-transparent p-1 rounded-fullflex items-center justify-center">
            <ChevronLeft className="h-7 w-7" />
          </button>
          <button className="swiper-button-nextpro2_d absolute right-4 top-1/2 z-10 bg-transparent p-1 rounded-full flex items-center justify-center">
            <ChevronRight className="h-7 w-7" />
          </button>
        </div>
      </Swiper>
      
      <div className="custom-pagination absolute flex space-x-1 z-10"></div>

      <style jsx global>{`
        .custom-pagination {
          display: flex;
          justify-content: left;
          gap: 4px;
          margin-left:15px;
          margin-top:-20px
        }
        .custom-pagination .swiper-pagination-bullet {
          width: 10px;
          height: 10px;
          background: rgba(0, 0, 0, 0.2);
          border:2px solid #000;
          border-radius: 50%;
          cursor: pointer;
        }
        .custom-pagination .swiper-pagination-bullet-active {
          background: rgba(0, 0, 0, 0.8);
        }
        .swiper-button-prev, .swiper-button-next {
          width: 40px;
          height: 40px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #000;
        }
        .swiper-button-prev:after, .swiper-button-next:after {
          display: none;
        }
      `}</style>
    </div>
  );
}