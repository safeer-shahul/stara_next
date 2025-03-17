'use client';

import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, DollarSign, Heart, ShoppingBag, Star, Tag, Truck } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import Image from "next/image";

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';


interface DeliveryInfo {
  deliveryDate?: string;
  cashOnDelivery?: boolean;
  error?: string;
}

// Mock data for now, replace with API call later
const product = {
  id: '1',
  name: 'Crystal Love Bangle Bracelet',
  price: '₹2,346',
  originalPrice: '₹3,799',
  discount: '38%',
  description: 'Inclusive of all taxes',
  offer: 'Buy 1 Get 1 Free Use Code: BIG1 at checkout',
  inStock: true,
  isGift: false,
  giftSpecialPrice: '₹399.00',
  details: 'Bracelets',
  material: 'GOLD',
  delivery: 'Typically arrives in 3-4 Days',
  returnPolicy: '2 Days Return',
  exchangePolicy: '10 Days Exchange',
  paymentOptions: 'Cash On Delivery',
  rating: 5,
  reviewCount: 236,
  features: [
    { name: 'Lifetime Warranty', icon: '/images/icons/warranty.svg' },
    { name: 'Skin Safe Jewellery', icon: '/images/icons/skin-safe.svg' },
    { name: '18k Gold Tone Plated', icon: '/images/icons/gold-plated.svg' },
  ],
  images: [
    '/images/productslider/PM-EARRINGS-037_3.webp', 
    '/images/productslider/PM-EARRINGS-037_1_0040.webp',
    '/images/productslider/PM-EARRINGS-037_3.webp', 
    '/images/productslider/PM-EARRINGS-037_1_0040.webp',
  ],
};

export default function ProductPage() {
  const [isGift, setIsGift] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Function to open the modal
  const openModal = () => {
    setIsModalOpen(true);
    console.log('clicked view more')
  }
  // const [selectedColor, setSelectedColor] = useState(product.colors[0]);

  const [pincode, setPincode] = useState<string>('');
  const [showPincodeInput, setShowPincodeInput] = useState<boolean>(false);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);

  const handlePincodeCheck = (): void => {
    // Simulate pincode check - in a real app, this would be an API call
    if (pincode && pincode.length === 6 && !isNaN(Number(pincode))) {
      setDeliveryInfo({
        deliveryDate: `22nd and 25th Mar`,
        cashOnDelivery: true
      });
    } else {
      setDeliveryInfo({
        error: "Please enter a valid 6-digit pincode"
      });
    }
  };

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setPincode(e.target.value.slice(0, 6));
  };

  const [isShaking, setIsShaking] = useState<boolean>(false);
  
  useEffect(() => {
    setIsShaking(true);
    
    const intervalId = setInterval(() => {
      setIsShaking(true);
      
      setTimeout(() => {
        setIsShaking(false);
      }, 800); 
    }, 2500);
    
    return () => clearInterval(intervalId);
  }, []);


  return (
    <div className="container mx-auto p-2 md:p-12">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative">
          <div className="absolute top-4 left-4 z-10">
            <Link href="/">
              <button className="bg-white rounded-full p-2 shadow">
                <ChevronLeft className="h-5 w-5 text-gray-700" />
              </button>
            </Link>
          </div>

          <div className="absolute top-4 right-4 z-10">
            <div className="bg-white text-black text-xs font-medium px-3 py-1 rounded-sm">
              BUY 1 GET 1
            </div>
          </div>

          <div className="absolute bottom-4 right-4 z-10">
            <button className="bg-white p-2 rounded-full shadow-md">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 5.12548 15.0077 5.24916 15.0227 5.37061L8.08059 9.13419C7.54431 8.43539 6.7976 8 5.94999 8C4.34314 8 3 9.34314 3 11C3 12.6569 4.34314 14 5.94999 14C6.7976 14 7.54431 13.5646 8.08059 12.8658L15.0227 16.6294C15.0077 16.7508 15 16.8745 15 17C15 18.6569 16.3431 20 18 20C19.6569 20 21 18.6569 21 17C21 15.3431 19.6569 14 18 14C17.1524 14 16.4057 14.4354 15.8694 15.1342L8.92727 11.3706C8.94231 11.2492 8.94999 11.1255 8.94999 11C8.94999 10.8745 8.94231 10.7508 8.92727 10.6294L15.8694 6.86581C16.4057 7.56461 17.1524 8 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Swiper Slider */}
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
            {product.images.map((image, index) => (
              <SwiperSlide key={index}>
              <Image
                src={image}
                alt={`${product.name} - Image ${index + 1}`}
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
              <button className="swiper-button-nextpro_d absolute right-4 top-1/2 z-10 bg-transparent p-1 rounded-full flex items-center justify-center">
                <ChevronRight className="h-7 w-7" />
              </button>
            </div>
          </Swiper>
          
          {/* Custom Pagination - matches the dots in screenshot */}
          <div className="custom-pagination absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1 z-10"></div>
        </div>

        <div className="space-y-4  pl-0 md:pl-24">
       
        <div className="flex items-center justify-between">
          {/* Product Name */}
          <h1 className="text-2xl font-normal">{product.name}</h1>

          {/* Rating Section */}
          <div className="flex items-center space-x-1">
            <div className="flex text-[#36454F]">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3" fill="currentColor" />
              ))}
            </div>
            <span className="text-[12px] text-gray-500">({product.reviewCount})</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <p className="text-[12px] line-through">MRP: {product.originalPrice}</p>
          <p className="text-lg font-semibold text-[15px]">{product.price}</p>
          <div className="bg-black text-white text-xs px-2 py-1 rounded-md flex items-center">
            SAVE {product.discount}
          </div>
        </div>


          <p className="text-sm text-gray-500">{product.description}</p>

          <div className="flex items-center text-sm border-t py-5 border-b border-gray-200 gap-2">
            <Tag size={16}  className="text-green-700"/>
            <div>
            <span className="text-green-700">
              Buy 1 Get 1 Free Use Code: <span className="font-bold">BIG1</span> at checkout.
            </span>
            <a href="#"  className="text-green-700 underline ml-1 font-bold">See All Offers</a>
            </div>
          </div>


          {product.inStock && (
            <div className="flex items-center text-sm space-x-2">
              <CheckCircle2 className='text-[#2e7e52]'/>
              <span className='text-[14px]'>In stock - ready to ship</span>
            </div>
          )}

          {/* Material */}
          {/* <p className="text-sm font-semibold uppercase">{product.material}</p> */}

          {/* Color Options
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {product.colors.map((color) => (
                <button 
                  key={color.name}
                  className={`w-8 h-8 rounded-full border-2 ${selectedColor.name === color.name ? 'border-gray-800' : 'border-gray-200'}`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setSelectedColor(color)}
                ></button>
              ))}
            </div>
          </div> */}

          {/* Gift Option */}
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="giftOption"
              checked={isGift}
              onChange={() => setIsGift(!isGift)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="giftOption" className="text-sm">
              Is it a gift? Make it Special <span className="font-semibold">{product.giftSpecialPrice}</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-1 pt-2">
          <button 
            className={`flex-1 bg-black text-white py-3 flex items-center justify-center gap-2 ${
              isShaking ? 'shake-animation' : ''
            }`}
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="text-sm flex items-center gap-1">
              ADD TO BAG
              <ArrowRight className="h-4 w-4" />
            </span>
          </button>
            <button className="w-12 h-12 bg-black text-white flex items-center justify-center">
              <Heart className="h-5 w-5" />
            </button>
          </div>
          
          <button className="w-full bg-black text-white text-sm py-3 -mt-[24px]">
            BUY IT NOW
          </button>


          <div className="flex items-center justify-between pt-4 cursor-point cursor-pointer" onClick={openModal}>
            <p className="text-sm">Details: {product.details}</p>
            <span className="text-[#C69A7F] text-sm underline">View More</span>
          </div>

          <div className="flex flex-row justify-center items-center gap-12 bg-[#F1EEE4] px-8 py-6 rounded-md">
            <div className="flex flex-col items-center text-center">
              <div className="w-9 h-9 mb-2 relative">
                <Image
                  src="/images/icons/warranty1.webp"
                  alt="Lifetime Warranty"
                  fill
                  className="object-contain"
                />
              </div>
              <p className="text-[12px] font-medium">Lifetime Warranty</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-9 h-9 mb-2 relative">
                <Image
                  src="/images/icons/organic1.webp"
                  alt="Skin Safe Jewellery"
                  fill
                  className="object-contain"
                />
              </div>
              <p className="text-[12px] font-medium">Skin Safe Jewellery</p>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="w-full">
            {/* Typical delivery time */}
            <div className="pt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm">
                  Typically arrives in <span className="font-medium bg-[#C69A7F] px-2 py-1 text-white rounded-sm">3-4 Days</span>
                </p>
                <button 
                  className="text-[#C69A7F] text-sm underline cursor-pointer"
                  onClick={() => setShowPincodeInput(!showPincodeInput)}
                >
                  CHECK PINCODE
                </button>
              </div>
            </div>

            {/* Pincode Input Section */}
            {showPincodeInput && (
              <div className="mt-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#C69A7F]"
                    placeholder="Pin Code"
                    value={pincode}
                    onChange={handlePincodeChange}
                    maxLength={6}
                  />
                  <button 
                    className="bg-[#C69A7F] text-white px-4 py-2 rounded-md"
                    onClick={handlePincodeCheck}
                  >
                    Check
                  </button>
                </div>
                
                {/* Error message if invalid pincode */}
                {deliveryInfo && deliveryInfo.error && (
                  <p className="text-red-500 text-sm mt-2">{deliveryInfo.error}</p>
                )}
              </div>
            )}

            {/* Delivery Information - Only shown after successful pincode check */}
            {deliveryInfo && !deliveryInfo.error && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Truck className="text-[#C69A7F]" size={20} />
                  <div className='text-[14px]'>
                    Delivery between <span className='text-green-600'>
                        <span className="font-medium">22<sup>nd</sup></span> and <span className="font-medium">25<sup>th</sup></span> Mar
                      </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <DollarSign className="text-[#C69A7F]" size={20} />
                  <div className='text-[14px]'>
                    Cash on delivery <span className="text-green-600">available</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Return Policy */}
          <div className="grid grid-cols-3 pt-4 border-t">
            <div className="flex flex-col items-center text-center">
              <div className="w-8 h-8 mb-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-full h-full">
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
              <p className="text-xs">{product.returnPolicy}</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-8 h-8 mb-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-full h-full">
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
              <p className="text-xs">{product.exchangePolicy}</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-8 h-8 mb-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-full h-full">
                  <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
              <p className="text-xs">{product.paymentOptions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* CSS for Swiper pagination to match screenshot */}
      <style jsx global>{`
        .custom-pagination {
          display: flex;
          justify-content: center;
          gap: 4px;
        }
        .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 50%;
          cursor: pointer;
        }
        .swiper-pagination-bullet-active {
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