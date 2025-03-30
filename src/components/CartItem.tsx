'use client';

import { Plus, Minus, Trash2 } from 'lucide-react';
import Image from 'next/image';

type CartItemProps = {
  product: any;
  onRemove: (id: string) => void;
  onQuantityChange: (id: string, change: number) => void;
};

const CartItem = ({ product, onRemove, onQuantityChange }: CartItemProps) => {
  // Maximum quantity allowed per item
  const MAX_QUANTITY = 10;
  
  // Handle increment button click
  const handleIncrement = () => {
    if (product.quantity < MAX_QUANTITY) {
      onQuantityChange(product.id, 1);
    }
  };
  
  // Handle decrement button click
  const handleDecrement = () => {
    if (product.quantity > 1) {
      onQuantityChange(product.id, -1);
    }
  };
  
  return (
    <div className="flex rounded-md border border-gray-200 p-2 bg-white">
      <div className="w-20 h-20 relative mr-3 bg-gray-100 rounded">
        <Image
          src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${product.image}`}
          alt={product.name}
          fill
          className="object-contain p-2"
        />
      </div>
      
      <div className="flex-1">
        <div className="flex justify-between">
          <h3 className="text-sm font-medium">{product.name}</h3>
        </div>
        
        <div className="flex items-center mt-1">
          <p className="text-sm font-bold">₹{product.price}</p>
          {product.originalPrice && (
            <p className="text-xs text-gray-500 line-through ml-2">
              ₹{product.originalPrice}
            </p>
          )}
          {product.discount && (
            <span className="ml-2 bg-black text-white text-xs px-1.5 py-0.5 rounded">
              {product.discount}
            </span>
          )}
        </div>
        
        <div className="flex items-center mt-2">
          <button 
            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
              product.quantity <= 1 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={handleDecrement}
            disabled={product.quantity <= 1}
          >
            <Minus size={10} />
          </button>
          
          <span className="mx-2 text-sm">{product.quantity}</span>
          
          <button 
            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
              product.quantity >= MAX_QUANTITY ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={handleIncrement}
            disabled={product.quantity >= MAX_QUANTITY}
          >
            <Plus size={10} />
          </button>
          
          <button 
            onClick={() => onRemove(product.id)} 
            className="ml-2"
            aria-label="Remove item"
          >
            <Trash2 size={16} className="text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartItem;