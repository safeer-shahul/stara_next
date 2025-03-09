'use client'; // Required for interactivity

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();

  // Slider images and their corresponding category links
  const slides = [
    {
      desktopImage: '/images/slider/desktop/Slide1.webp',
      mobileImage: '/images/slider/mobile/Slide1.webp',
      link: '/shop/collections/best-seller', // Redirect to Best Seller category
    },
    {
      desktopImage: '/images/slider/desktop/Slide2.webp',
      mobileImage: '/images/slider/mobile/Slide2.webp',
      link: '/shop/collections/new-arrivals', // Redirect to New Arrivals category
    },
    {
      desktopImage: '/images/slider/desktop/Slide3.webp',
      mobileImage: '/images/slider/mobile/Slide3.webp',
      link: '/shop/collections/lab-grown-silver', 
    },
  ];

  // Auto-slide functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [slides.length]);

  // Handle slide change on button click
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Handle next slide
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  // Handle previous slide
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Handle image click to redirect
  const handleImageClick = (link: string) => {
    router.push(link);
  };

  return (
    <div className="relative w-full h-[600px] md:h-[300px] lg:h-[670px] overflow-hidden">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            currentSlide === index ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Desktop Image */}
          <div className="hidden md:block">
            <Image
              src={slide.desktopImage}
              alt={`Slide ${index + 1}`}
              fill
              className="object-cover cursor-pointer"
              onClick={() => handleImageClick(slide.link)}
            />
          </div>

          {/* Mobile Image */}
          <div className="block md:hidden">
            <Image
              src={slide.mobileImage}
              alt={`Slide ${index + 1}`}
              fill
              className="object-cover cursor-pointer"
              onClick={() => handleImageClick(slide.link)}
            />
          </div>
        </div>
      ))}

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
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full ${
              currentSlide === index ? 'bg-white' : 'bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
}