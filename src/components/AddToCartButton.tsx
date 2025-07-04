'use client';

import { ArrowRight, Heart, ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useWishlist } from '@/app/context/WishlistProvider';

interface AddToCartButtonProps {
  productId: string;
  onAddToBag?: () => void;
  onBuyNow?: () => void;
  disabled?: any;
}

export default function AddToCartButton({
  productId,
  onAddToBag,
  onBuyNow,
  disabled = false
}: AddToCartButtonProps) {
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isWishlistAnimating, setIsWishlistAnimating] = useState<boolean>(false);
  
  // Use the wishlist context
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isFavorite = isInWishlist(productId);

  useEffect(() => {
    // Shaking animation effect for Add to Bag button
    setIsShaking(true);

    const intervalId = setInterval(() => {
      setIsShaking(true);

      setTimeout(() => {
        setIsShaking(false);
      }, 800);
    }, 2500);

    return () => clearInterval(intervalId);
  }, [productId]);

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled || isWishlistAnimating) return;

    setIsWishlistAnimating(true);

    try {
      await toggleWishlist(productId);
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      // Reset animation state after a short delay
      setTimeout(() => setIsWishlistAnimating(false), 300);
    }
  };

  const handleAddToBag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    if (onAddToBag) {
      onAddToBag();
    }
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    if (onBuyNow) {
      onBuyNow();
    }
  };

  return (
    <div className="space-y-3">
      {/* Add to Bag and Wishlist Row */}
      <div className="flex gap-1">
        <button
          className={`flex-1 py-3 flex items-center justify-center gap-2 cursor-pointer transition-colors ${
            disabled
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : `bg-[var(--color-primary-950)] hover:bg-[#0f4c67] text-white ${isShaking ? 'shake-animation' : ''}`
          }`}
          onClick={handleAddToBag}
          disabled={disabled}
          type="button"
        >
          <ShoppingCart className="h-5 w-5" />
          <span className="text-sm flex items-center gap-1">
            ADD TO BAG
            <ArrowRight className="h-4 w-4" />
          </span>
        </button>

        <button
          className={`w-12 h-12 flex items-center justify-center cursor-pointer transition-all duration-200 ${
            disabled
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-[var(--color-primary-950)] hover:bg-[#0f4c67] text-white hover:scale-105'
          } ${isWishlistAnimating ? 'scale-110' : ''}`}
          onClick={handleWishlistClick}
          disabled={disabled || isWishlistAnimating}
          type="button"
          aria-label={isFavorite ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart 
            className={`h-5 w-5 transition-all duration-200 ${
              isFavorite 
                ? 'fill-current text-red-500' 
                : 'text-white'
            } ${isWishlistAnimating ? 'animate-pulse' : ''}`} 
          />
        </button>
      </div>

      {/* Buy Now Button */}
      <button
        className={`w-full py-3 text-sm cursor-pointer transition-colors ${
          disabled
            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
            : 'bg-[var(--color-primary-950)] hover:bg-[#0f4c67] text-white'
        }`}
        onClick={handleBuyNow}
        disabled={disabled}
        type="button"
      >
        BUY NOW
      </button>

      {/* Add CSS for shake animation */}
      <style jsx>{`
        .shake-animation {
          animation: shake 0.8s ease-in-out;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
      `}</style>
    </div>
  );
}