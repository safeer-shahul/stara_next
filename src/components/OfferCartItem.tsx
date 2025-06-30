// components/OfferCartItem.tsx
'use client';

import { X } from 'lucide-react';
import Image from 'next/image';
import { CartOfferItem, ProductItemDetails, ProductVariant } from '@/context/cartContext';

interface OfferCartItemProps {
  offerSet: CartOfferItem;
  onRemove?: (id: string) => Promise<void>;
  fromProductSummary?: boolean;
}

export default function OfferCartItem({ offerSet, onRemove, fromProductSummary = false }: OfferCartItemProps) {
  const offerName = offerSet.offer_name?.offer_name || 'Special Offer';

  const calculateOfferTotals = () => {
    let payableTotal = 0;
    let savings = 0;
    let totalPaidItems = 0;
    let totalFreeItems = 0;

    offerSet.offer_items.forEach(item => {
      const itemTotal = parseFloat(item.product_price || '0') * item.quantity;
      
      if (item.isPaid) {
        payableTotal += itemTotal;
        totalPaidItems += item.quantity;
      } else {
        savings += itemTotal;
        totalFreeItems += item.quantity;
      }
    });

    return { 
      payableTotal, 
      savings, 
      totalPaidItems, 
      totalFreeItems 
    };
  };

  const { payableTotal, savings, totalPaidItems, totalFreeItems } = calculateOfferTotals();

  const handleRemove = async () => {
    if (onRemove) {
      await onRemove(offerSet.id);
    }
  };

  if (offerSet.offer_items.length === 0) {
    console.warn('OfferCartItem: offer_items is empty for offerSet:', offerSet);
    return null;
  }

  // Helper function to calculate discount percentage for individual products
  const calculateDiscountPercentage = (price: string, strikePrice: string) => {
    const p = parseFloat(price);
    const sp = parseFloat(strikePrice);
    if (sp > p && sp > 0) {
      return `${Math.round(((sp - p) / sp) * 100)}% OFF`;
    }
    return '';
  };

  // Helper function to get paid and free quantities for a product
  const getProductStatus = (product: ProductItemDetails & { 
    quantity: number; 
    selectedVariant?: ProductVariant;
    isPaid?: boolean;
  }) => {
    // The isPaid flag comes directly from backend processing of buy_products vs get_products
    return {
      isPaid: product.isPaid || false,
      quantity: product.quantity
    };
  };

  return (
    <div className="bg-white rounded-lg py-2 px-4 mb-4 border border-gray-200">
      {/* Offer Header */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h4 className="font-medium text-sm">{offerName}</h4>
          <p className="text-xs text-gray-500">
            Buy {offerSet.buy_count} Get {offerSet.get_count} Free
          </p>
        </div>
        {!fromProductSummary && onRemove && (
          <button
            onClick={handleRemove}
            className="bg-red-500 text-white cursor-pointer rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Offer Items */}
      <div className="space-y-2">
        {offerSet.offer_items.map((product, index) => {
          const discountText = calculateDiscountPercentage(product.product_price, product.strike_price);
          const { isPaid, quantity } = getProductStatus(product);
          
          return (
            <div key={`${product.id}-${product.selectedVariant?.id || 'no-variant'}-${index}`} className="flex items-center gap-2">
              <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden">
                <Image
                  src={product.images[0]?.product_image
                    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${product.images[0].product_image}`
                    : '/images/placeholder.png'}
                  alt={product.product_name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
                {/* Free badge for free items */}
                {!isPaid && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white text-[8px] px-1 py-0.5 rounded-bl">
                    FREE
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium line-clamp-2">
                  {product.product_name}
                  {product.selectedVariant && (
                    <span className="text-gray-500 text-[10px] ml-1"> (Size: {product.selectedVariant.variant_name})</span>
                  )}
                </p>
                
                {/* Show status and quantity */}
                <div className="text-[10px] mt-1">
                  {isPaid ? (
                    <span className="text-blue-600 font-medium">Paid: {quantity}</span>
                  ) : (
                    <span className="text-green-600 font-medium">Free: {quantity}</span>
                  )}
                </div>

                <div className="flex items-center mt-1">
                  {!isPaid ? (
                    <p className="text-xs font-bold text-green-600 mr-1">FREE</p>
                  ) : (
                    <p className="text-xs font-bold mr-1">₹{parseFloat(product.product_price).toLocaleString('en-IN')}</p>
                  )}
                  
                  {parseFloat(product.strike_price || '0') > parseFloat(product.product_price || '0') && (
                    <p className="text-[10px] text-gray-500 line-through mr-1">
                      ₹{parseFloat(product.strike_price).toLocaleString('en-IN')}
                    </p>
                  )}
                  {discountText && isPaid && (
                    <span className="bg-black text-white text-[9px] px-1 py-0.5 rounded">
                      {discountText}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Offer Summary */}
      <div className="mt-3 pt-2 border-t border-gray-100">
        {savings > 0 && (
          <div className="flex justify-between text-green-600 mb-1">
            <span className="text-xs">
              You Save ({totalFreeItems} free item{totalFreeItems !== 1 ? 's' : ''}):
            </span>
            <span className="text-xs font-medium">₹{savings.toLocaleString('en-IN')}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-sm">
          <span>Offer Total:</span>
          <span>₹{payableTotal.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
}