// app/components/WishlistButton.tsx
'use client';

import { useWishlist } from '@/app/context/WishlistProvider';
import { Heart } from 'lucide-react';
import { useState } from 'react';

interface WishlistButtonProps {
  productId: string;
  className?: string;
  size?: number;
}

export default function WishlistButton({ productId, className = '', size = 16 }: WishlistButtonProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [isAnimating, setIsAnimating] = useState(false);
  const isFavorite = isInWishlist(productId);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Prevent multiple rapid clicks
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    try {
      await toggleWishlist(productId);
    } catch (error) {
      // console.error('Error toggling wishlist:', error);
    } finally {
      // Reset animation state after a short delay
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  return (
    <button
      className={`cursor-pointer flex items-center justify-center transition-all duration-200 hover:scale-110 ${className} ${
        isAnimating ? 'scale-125' : ''
      }`}
      onClick={handleClick}
      disabled={isAnimating}
      aria-label={isFavorite ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart
        size={size}
        className={`transition-all duration-200 ${
          isFavorite
            ? 'text-red-500 fill-red-500 scale-110'
            : 'text-gray-700 hover:text-red-500'
        } ${isAnimating ? 'animate-pulse' : ''}`}
      />
    </button>
  );
}