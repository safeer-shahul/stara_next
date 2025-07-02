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
    <div className={`relative rounded-xl border-2 transition-all duration-300 ${
      fromProductSummary 
        ? 'border-gray-100 bg-white shadow-sm hover:shadow-md' 
        : 'border-gray-200 bg-white shadow-lg hover:shadow-xl hover:border-[var(--color-primary-950)]/30'
    } p-3 overflow-hidden`}>
      
      {/* Decorative corner accent */}
      {!fromProductSummary && (
        <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-[var(--color-primary-950)]/10 to-transparent rounded-bl-2xl"></div>
      )}

      <div className="flex items-start gap-4">
        {/* Enhanced Product Image */}
        <div className={`relative ${fromProductSummary ? 'w-16 h-16' : 'w-20 h-20'} bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden shadow-inner flex-shrink-0`}>
          <Image
            src={product.images[0]?.product_image ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${product.images[0].product_image}` : '/placeholder.jpg'}
            alt={product.product_name}
            fill
            className="object-contain p-2 transition-transform duration-300 hover:scale-110"
            sizes={fromProductSummary ? "64px" : "80px"}
          />
          
          {/* Jewelry sparkle effect */}
          <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full opacity-60 animate-pulse"></div>
          <div className="absolute bottom-1 left-1 w-1 h-1 bg-amber-300 rounded-full opacity-80 animate-ping" style={{ animationDelay: '0.5s' }}></div>
        </div>

        <div className="flex-1 min-w-0">
          {/* Product Header */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className={`font-semibold leading-tight text-gray-800 ${fromProductSummary ? 'text-sm' : 'text-base'}`}>
                {product.product_name}
                {product.selectedVariant && (
                  <span className="block text-xs text-[var(--color-primary-950)] font-medium mt-1 bg-blue-50 px-2 py-0.5 rounded-full inline-block">
                    Size: {product.selectedVariant.variant_name}
                  </span>
                )}
              </h3>
            </div>
            
            {!fromProductSummary && (
              <button
                onClick={() => onRemove(product.id)}
                className="ml-3 w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full flex items-center justify-center text-xs hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-110 shadow-md"
                aria-label="Remove item"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Enhanced Pricing */}
          <div className="flex items-center flex-wrap gap-2 mb-3">
            <p className={`font-bold text-[var(--color-primary-950)] ${fromProductSummary ? 'text-base' : 'text-lg'}`}>
              ₹{parseFloat(product.product_price).toLocaleString('en-IN')}
            </p>
            
            {parseFloat(product.strike_price) > parseFloat(product.product_price) && (
              <p className={`text-gray-500 line-through ${fromProductSummary ? 'text-sm' : 'text-base'}`}>
                ₹{parseFloat(product.strike_price).toLocaleString('en-IN')}
              </p>
            )}
            
            {discountText && (
              <span className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs px-2 py-1 rounded-full font-bold shadow-sm animate-pulse">
                {discountText}
              </span>
            )}
          </div>

          {/* Stock Status */}
          {!fromProductSummary ? (
            isOutOfStockOverall ? (
              <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-200 mb-3">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <span className="text-red-600 text-sm font-medium">Out of Stock</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200 mb-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-700 text-sm font-medium">
                  Available: {currentMaxLimit} units
                </span>
              </div>
            )
          ) : (
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-[var(--color-primary-950)] text-xs font-medium">
                Quantity: {product.quantity}
              </span>
            </div>
          )}

          {/* Enhanced Quantity Controls */}
          {!fromProductSummary && (
            <div className="flex items-center justify-between">
              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                <button
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    product.quantity <= 1 || isOutOfStockOverall 
                      ? 'opacity-50 cursor-not-allowed bg-gray-200' 
                      : 'bg-white hover:bg-[var(--color-primary-950)] hover:text-white cursor-pointer shadow-sm hover:shadow-md transform hover:scale-105'
                  }`}
                  onClick={handleDecrement}
                  disabled={product.quantity <= 1 || isOutOfStockOverall}
                >
                  <Minus size={14} />
                </button>

                <span className="mx-4 text-lg font-bold text-[var(--color-primary-950)] min-w-[2rem] text-center">
                  {product.quantity}
                </span>

                <button
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    product.quantity >= currentMaxLimit || isOutOfStockOverall 
                      ? 'opacity-50 cursor-not-allowed bg-gray-200' 
                      : 'bg-white hover:bg-[var(--color-primary-950)] hover:text-white cursor-pointer shadow-sm hover:shadow-md transform hover:scale-105'
                  }`}
                  onClick={handleIncrement}
                  disabled={product.quantity >= currentMaxLimit || isOutOfStockOverall}
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Total for this item */}
              <div className="text-right">
                <div className="text-sm text-gray-500">Total</div>
                <div className="text-lg font-bold text-[var(--color-primary-950)]">
                  ₹{(parseFloat(product.product_price) * product.quantity).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          )}

          {/* Product Summary Total */}
          {/* {fromProductSummary && (
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-xs text-gray-600">Item Total:</span>
              <span className="text-sm font-bold text-[var(--color-primary-950)]">
                ₹{(parseFloat(product.product_price) * product.quantity).toLocaleString('en-IN')}
              </span>
            </div>
          )} */}
        </div>
      </div>

      {/* Jewelry accent border */}
      {!fromProductSummary && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-30"></div>
      )}
    </div>
  );
};

export default CartItem;