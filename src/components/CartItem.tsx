'use client';

import { Plus, Minus, X, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { CartNormalItem } from '@/context/cartContext';

type CartItemProps = {
  product: CartNormalItem;
  onRemove: (id: string) => void;
  onQuantityChange: (id: string, change: number) => void;
  fromProductSummary?: boolean;
  maxAllowedQuantity?: number;
};

const CartItem = ({ product, onRemove, onQuantityChange, fromProductSummary = false, maxAllowedQuantity }: CartItemProps) => {
  const currentMaxLimit = typeof maxAllowedQuantity === 'number' ? maxAllowedQuantity : product.stock_quantity;

  const isOutOfStockOverall = product.stock_quantity <= 0 || !product.isInStock;

  const handleIncrement = () => {
    if (product.quantity < currentMaxLimit && !isOutOfStockOverall) {
      onQuantityChange(product.id, 1);
    } else if (product.quantity >= currentMaxLimit) {
      console.log(`Cannot add more of ${product.product_name}. Max available for your cart: ${currentMaxLimit}`);
    }
  };

  const handleDecrement = () => {
    if (product.quantity > 1) {
      onQuantityChange(product.id, -1);
    }
  };

  const calculateDiscountPercentage = () => {
    const price = parseFloat(product.product_price);
    const strikePrice = parseFloat(product.strike_price);
    if (strikePrice > price && strikePrice > 0) {
      return `${Math.round(((strikePrice - price) / strikePrice) * 100)}% OFF`;
    }
    return '';
  };

  const discountText = calculateDiscountPercentage();

  return (
    <div className="flex rounded-md border border-gray-200 py-2 px-4 bg-white mb-3">
      <div className="w-20 h-20 relative mr-3 bg-gray-100 rounded">
        <Image
          src={product.images[0]?.product_image ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${product.images[0].product_image}` : '/placeholder.jpg'}
          alt={product.product_name}
          fill
          className="object-contain p-2"
          sizes="80px"
        />
      </div>

      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h3 className="text-sm font-medium pr-2">
            {product.product_name}
            {product.selectedVariant && (
              <span className="text-gray-500 text-xs ml-1"> (Size: {product.selectedVariant.variant_name})</span>
            )}
          </h3>
          {!fromProductSummary && (
            <button
              onClick={() => onRemove(product.id)}
              className="bg-red-500 text-white cursor-pointer rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
              aria-label="Remove item"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex items-center mt-1">
          <p className="text-sm font-bold">₹{parseFloat(product.product_price).toLocaleString('en-IN')}</p>
          {parseFloat(product.strike_price) > parseFloat(product.product_price) && (
            <p className="text-xs text-gray-500 line-through ml-2">
              ₹{parseFloat(product.strike_price).toLocaleString('en-IN')}
            </p>
          )}
          {discountText && (
            <span className="ml-2 bg-black text-white text-xs px-1.5 py-0.5 rounded">
              {discountText}
            </span>
          )}
        </div>

    {!fromProductSummary ? (
      isOutOfStockOverall ? (
        <div className="flex items-center mt-2 text-red-500 text-xs">
          <AlertCircle size={14} className="mr-1" />
          Out of Stock
        </div>
      ) : (
        <div className="flex items-center mt-2 text-xs text-gray-600">
          Available Stock: {currentMaxLimit}
        </div>
      )
    ) : (
      <div className="flex items-center mt-2 text-xs text-gray-600">
        Quantity: {product.quantity}
      </div>
    )}


        {!fromProductSummary && (
          <div className="flex items-center mt-2">
            <button
              className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                product.quantity <= 1 || isOutOfStockOverall ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
              onClick={handleDecrement}
              disabled={product.quantity <= 1 || isOutOfStockOverall}
            >
              <Minus size={12} />
            </button>

            <span className="mx-2 text-sm font-medium">{product.quantity}</span>

            <button
              className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                product.quantity >= currentMaxLimit || isOutOfStockOverall ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
              onClick={handleIncrement}
              disabled={product.quantity >= currentMaxLimit || isOutOfStockOverall}
            >
              <Plus size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartItem;