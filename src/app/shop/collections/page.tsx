import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Heart, ShoppingBag } from 'lucide-react';

const ProductDetailPage = () => {
  const productData = {
    id: "rose-gold-pendant",
    name: "Crystal Love Bangle Bracelet",
    price: 2346,
    originalPrice: 3799,
    discountPercentage: 38,
    images: [
      "/api/placeholder/500/500",
      "/api/placeholder/500/500",
      "/api/placeholder/500/500",
      "/api/placeholder/500/500",
      "/api/placeholder/500/500"
    ],
    rating: 4.9,
    reviewCount: 236,
    colors: [
      { name: "Gold", value: "#d4af37" },
      { name: "Rose Gold", value: "#b76e79" }
    ],
    inStock: true,
    details: "Bracelets",
    features: [
      "Lifetime Warranty",
      "Skin Safe Jewellery",
      "18k Gold Tone Plated"
    ],
    promotions: [
      "Buy 1 Get 1 Free Use Code: B1G1 at checkout"
    ],
    giftOption: {
      available: true,
      price: 399
    }
  };

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(productData.colors[0]);
  
  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === productData.images.length - 1 ? 0 : prev + 1
    );
  };
  
  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? productData.images.length - 1 : prev - 1
    );
  };
  
  const setImageByIndex = (index) => {
    setCurrentImageIndex(index);
  };
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Back button */}
      <div className="mb-6">
        <button className="flex items-center text-gray-600 hover:text-gray-900">
          <ChevronLeft className="w-5 h-5" />
          <span>Back to Products</span>
        </button>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left section - Image slider */}
        <div className="w-full lg:w-1/2 relative">
          <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <img 
              src={productData.images[currentImageIndex]} 
              alt={`${productData.name} - view ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
            />
            
            {/* Navigation arrows */}
            <button 
              onClick={prevImage} 
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-md"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={nextImage} 
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-md"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          {/* Image dots navigation */}
          <div className="flex justify-center mt-4 space-x-2">
            {productData.images.map((_, index) => (
              <button
                key={index}
                onClick={() => setImageByIndex(index)}
                className={`w-3 h-3 rounded-full ${
                  currentImageIndex === index ? 'bg-black' : 'bg-gray-300'
                }`}
                aria-label={`View image ${index + 1}`}
              />
            ))}
          </div>
        </div>
        
        {/* Right section - Product details */}
        <div className="w-full lg:w-1/2">
          <h1 className="text-3xl font-bold mb-2">{productData.name}</h1>
          
          {/* Ratings */}
          <div className="flex items-center mb-4">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <svg 
                  key={i} 
                  className={`w-5 h-5 ${i < Math.floor(productData.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="ml-2 text-gray-600">({productData.reviewCount})</span>
          </div>
          
          {/* Price */}
          <div className="flex items-center mb-4">
            <span className="text-xl font-bold mr-2">₹{productData.price}</span>
            <span className="text-gray-500 line-through mr-2">₹{productData.originalPrice}</span>
            <span className="bg-black text-white text-xs px-2 py-1">SAVE {productData.discountPercentage}%</span>
          </div>
          
          <p className="text-gray-500 mb-4">Inclusive of all taxes</p>
          
          {/* Promotion */}
          <div className="mb-4">
            {productData.promotions.map((promo, index) => (
              <div key={index} className="flex items-center text-green-600">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                </svg>
                <span>{promo}</span>
                <button className="ml-1 text-green-600 font-semibold">See All Offers</button>
              </div>
            ))}
          </div>
          
          {/* Stock status */}
          <div className="mb-4 flex items-center text-green-600">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>In stock - ready to ship</span>
          </div>
          
          {/* Color selection */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2">GOLD</h3>
            <div className="flex space-x-2">
              {productData.colors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    selectedColor.name === color.name ? 'border-black' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color.value }}
                  aria-label={`Select ${color.name} color`}
                />
              ))}
            </div>
          </div>
          
          {/* Gift option */}
          <div className="mb-6">
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" className="form-checkbox h-4 w-4 text-black" />
              <span className="ml-2 mr-2">Is it a gift? Make it Special</span>
              <span className="text-gray-700">₹{productData.giftOption.price}</span>
            </label>
          </div>
          
          {/* Action buttons */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
            <button className="md:col-span-5 bg-black text-white py-3 px-4 rounded flex items-center justify-center hover:bg-gray-800 transition-colors">
              <ShoppingBag className="w-5 h-5 mr-2" />
              <span>ADD TO BAG</span>
            </button>
            <button className="md:col-span-1 border border-gray-300 py-3 px-4 rounded flex items-center justify-center hover:bg-gray-100 transition-colors">
              <Heart className="w-5 h-5" />
            </button>
          </div>
          
          <button className="w-full bg-black text-white py-3 px-4 rounded mb-6 hover:bg-gray-800 transition-colors">
            BUY IT NOW
          </button>
          
          {/* Product details */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Details: {productData.details}</h3>
              <button className="text-gray-500 hover:text-gray-700">View More</button>
            </div>
          </div>
          
          {/* Features */}
          <div className="grid grid-cols-3 gap-4 bg-gray-100 p-6 rounded-lg">
            {productData.features.map((feature, index) => (
              <div key={index} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm">
                  {index === 0 && (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  )}
                  {index === 1 && (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path>
                    </svg>
                  )}
                  {index === 2 && (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path>
                    </svg>
                  )}
                </div>
                <p className="text-sm">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;