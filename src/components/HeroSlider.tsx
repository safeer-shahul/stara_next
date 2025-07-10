'use client'; // Required for interactivity

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import apiService from '@/utils/api/apiService';

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchBanners = async () => {
      setLoading(true);
      try {
        const response = await apiService.getHeroBanners();
        // Filter banners to only show active ones (status = true)
        const activeBanners = response.filter((banner:any) => banner.status === true);
        setBanners(activeBanners);
        setError(null);
      } catch (err) {
        // console.error('Failed to fetch hero banners:', err);
        setError('Failed to load hero banners. Please try again.');
        setBanners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  // Auto-slide functionality
  useEffect(() => {
    if (banners.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000); // Change slide every 5 seconds
    
    return () => clearInterval(interval);
  }, [banners.length]);

  const goToSlide = (index:any) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    if (banners.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    if (banners.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleImageClick = (url:any) => {
    if (url) {
      router.push(url);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[300px] md:h-[450px] lg:h-[670px] flex items-center justify-center bg-gray-100">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[300px] md:h-[450px] lg:h-[670px] flex items-center justify-center bg-gray-100">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  // Don't render slider if no banners available
  if (banners.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full h-[600px] md:h-[450px] lg:h-[670px] overflow-hidden">
      {/* Slides */}
      {banners.map((banner:any, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            currentSlide === index ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Desktop Image */}
          <div className="hidden md:block">
            <Image
              src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${banner.big_image}`}
              alt={`Slide ${index + 1}`}
              fill
              className="object-cover cursor-pointer"
              onClick={() => banner.url && handleImageClick(banner.url)}
              style={{ cursor: banner.url ? 'pointer' : 'default' }}
            />
          </div>

          {/* Mobile Image */}
          <div className="block md:hidden">
            <Image
              src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${banner.small_image}`}
              alt={`Slide ${index + 1}`}
              fill
              className="object-cover cursor-pointer"
              onClick={() => banner.url && handleImageClick(banner.url)}
              style={{ cursor: banner.url ? 'pointer' : 'default' }}
            />
          </div>
        </div>
      ))}

      {/* Only show navigation buttons if there are multiple banners */}
      {banners.length > 1 && (
        <>
          {/* Left Navigation Button */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-opacity"
          >
            <ChevronLeft />
          </button>

          {/* Right Navigation Button */}
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-opacity"
          >
            <ChevronRight />
          </button>

          {/* Dot Navigation */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full ${
                  currentSlide === index ? 'bg-white' : 'bg-gray-400'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}