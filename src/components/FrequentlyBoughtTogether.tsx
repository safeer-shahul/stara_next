'use client';

import Image from 'next/image';
import { SAMPLE_PRODUCTS } from './type';

const FrequentlyBoughtTogether = () => {
  const handleAddToCart = (productId: string) => {
    try {
      const storedCartIds = JSON.parse(localStorage.getItem('cartItems') || '[]') as string[];
      if (!storedCartIds.includes(productId)) {
        const newCartIds = [...storedCartIds, productId];
        localStorage.setItem('cartItems', JSON.stringify(newCartIds));
      }
    } catch (error) {
      console.error('Error adding item to cart:', error);
    }
  };

  return (
    <div className="pb-2 pt-1 px-4 bg-white rounded-lg shadow-sm mb-4">
      <h3 className="text-[16px] font-medium mb-3">Frequently Bought Together</h3>
      
      <div className="flex overflow-x-auto space-x-2 pb-2">
        {['1','2', '3',].map(id => {
          const product = SAMPLE_PRODUCTS[id];
          return (
            <div key={id} className="min-w-[125px] p-2 border border-gray-300 rounded-lg">
              <div className="w-full h-25 relative mb-1 bg-gray-50 rounded">
                <Image 
                  src={product.image} 
                  alt={product.name}
                  fill
                  className="object-contain p-2"
                />
              </div>
              
              <h4 className="text-xs font-medium truncate">{product.name}</h4>
              
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-bold">₹{product.price.toLocaleString()}</p>
                <p className="text-[12px] text-gray-500 line-through ml-2">
                  ₹{product.originalPrice.toLocaleString()}
                </p>
              </div>
              
              <div className="flex items-center justify-between mt-1">
                <span className="bg-green-100 text-green-800 text-[10px] px-1.5 py-0.5 rounded">
                  {product.discount}
                </span>
                <button 
                  className="text-[10px] bg-[#175e7a] text-white px-2 py-1 rounded-full"
                  onClick={() => handleAddToCart(product.id)}
                >
                  Add
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FrequentlyBoughtTogether;