'use client';

import { CheckCircle2, Star, Tag } from 'lucide-react';
import { useState } from 'react';
import Image from "next/image";
import ProductImageSlider from '@/components/ProductImageSlider';
import AddToCartButton from '@/components/AddToCartButton';
import DeliveryPincodeChecker from '@/components/DeliveryPincodeChecker';
import PolicyIcons from '@/components/PolicyIcons';
import CartDrawer from '@/components/CartDrawer';

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
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  const openModal = () => {
    setIsModalOpen(true);
    console.log('clicked view more');
  };

  const handleAddToBag = () => {

    const storedCartIds = JSON.parse(localStorage.getItem('cartItems') || '[]');
    if (!storedCartIds.includes(product.id)) {
      const updatedCart = [...storedCartIds, product.id];
      localStorage.setItem('cartItems', JSON.stringify(updatedCart));
    }
    
    setIsCartOpen(true);
  };

  const handleAddToWishlist = () => {
    console.log('Add to wishlist clicked');
  };

  const handleBuyNow = () => {
    console.log('Buy now clicked');
  };

  const checkPincode = async (pincode: string) => {
    console.log(`Checking pincode: ${pincode}`);
    
    if (pincode && pincode.length === 6 && !isNaN(Number(pincode))) {
      return {
        deliveryDate: `22nd and 25th Mar`,
        cashOnDelivery: true
      };
    } else {
      return {
        error: "Please enter a valid 6-digit pincode"
      };
    }
  };

  return (
    <div className="container mx-auto p-2 md:p-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProductImageSlider 
          images={product.images} 
          productName={product.name}
          hasOffer={true}
          offerLabel="BUY 1 GET 1"
        />

        <div className="space-y-4 pl-0 md:pl-24">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-normal">{product.name}</h1>

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
            <Tag size={16} className="text-green-700"/>
            <div>
              <span className="text-green-700">
                Buy 1 Get 1 Free Use Code: <span className="font-bold">B1G1</span> at checkout.
              </span>
              <a href="#" className="text-green-700 underline ml-1 font-bold">See All Offers</a>
            </div>
          </div>

          {product.inStock && (
            <div className="flex items-center text-sm space-x-2">
              <CheckCircle2 className='text-[#2e7e52]'/>
              <span className='text-[14px]'>In stock - ready to ship</span>
            </div>
          )}

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

          <AddToCartButton 
            onAddToBag={handleAddToBag}
            onAddToWishlist={handleAddToWishlist}
            onBuyNow={handleBuyNow}
          />

          <div className="flex items-center justify-between pt-4 cursor-pointer" onClick={openModal}>
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

          <DeliveryPincodeChecker 
            defaultDeliveryTime="3-4 Days"
            checkPincodeHandler={checkPincode}
          />

          <PolicyIcons/>
        </div>
      </div>
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}