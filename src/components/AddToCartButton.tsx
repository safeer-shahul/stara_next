'use client';

import { useWishlist } from '@/app/context/WishlistProvider';
import { ArrowRight, Heart, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react'; 

interface AddToCartButtonProps {
  productId: string;
  onAddToBag?: () => void;
  onBuyNow?: () => void;
}

export default function AddToCartButton({
  productId,
  onAddToBag,
  onBuyNow
}: AddToCartButtonProps) {
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isFavorite = isInWishlist(productId);
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

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    await toggleWishlist(productId);
  };
  
  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        <button
          className={`flex-1 bg-black hover:bg-[#4A4A4A] text-white py-3 flex items-center justify-center gap-2 cursor-pointer ${
            isShaking ? 'shake-animation' : ''
          }`}
          onClick={onAddToBag}
        >
          <ShoppingBag className="h-5 w-5" />
          <span className="text-sm flex items-center gap-1">
            ADD TO BAG
            <ArrowRight className="h-4 w-4" />
          </span>
        </button>
        <button
          className="w-12 h-12 bg-black hover:bg-[#4A4A4A] text-white flex items-center justify-center cursor-pointer"
          onClick={handleWishlistClick}
        >
          <Heart className={`h-5 w-5 ${isFavorite ? 'fill-white' : ''}`} />
        </button>
      </div>
      
      <button
        className="w-full bg-black hover:bg-[#4A4A4A] text-white text-sm py-3 cursor-pointer"
        onClick={onBuyNow}
      >
        BUY IT NOW
      </button>
    </div>
  );
}