// app/components/WishlistButton.tsx
'use client';

import { useWishlist } from '@/app/context/WishlistProvider';
import { Heart } from 'lucide-react';

interface WishlistButtonProps {
  productId: string;
  className?: string;
  size?: number;
}

export default function WishlistButton({ productId, className = '', size = 16 }: WishlistButtonProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isFavorite = isInWishlist(productId);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleWishlist(productId);
  };

  return (
    <button
      className={`cursor-pointer flex items-center justify-center transition-all ${className}`}
      onClick={handleClick}
      aria-label={isFavorite ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart 
        size={size} 
        className={`transition-colors ${
          isFavorite 
            ? 'text-red-500 fill-red-500' 
            : 'text-gray-700 hover:text-red-500'
        }`} 
      />
    </button>
  );
}