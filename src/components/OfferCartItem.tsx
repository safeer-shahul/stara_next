'use client';

import Image from 'next/image';
import { X } from 'lucide-react';
import { CartOfferItem, ProductItemDetails } from '@/context/cartContext';

interface OfferCartItemProps {
  offerSet: CartOfferItem;
  onRemove?: (id: string) => Promise<void>;
  fromProductSummary?: boolean; // Keep this prop for conditional rendering of remove button
}

export default function OfferCartItem({ offerSet, onRemove, fromProductSummary = false }: OfferCartItemProps) {
  const offerName = offerSet.offer_name?.offer_name || 'Special Offer';

  const calculateOfferTotals = () => {
    const allIndividualProducts: ProductItemDetails[] = [];
    offerSet.offer_items.forEach(product => {
      for (let i = 0; i < product.quantity; i++) {
        allIndividualProducts.push({ ...product, quantity: 1 });
      }
    });

    if (allIndividualProducts.length === 0) {
      return { payableTotal: 0, savings: 0, freeItems: [] };
    }

    const sortedProductsDesc = [...allIndividualProducts].sort(
      (a, b) => parseFloat(b.product_price) - parseFloat(a.product_price)
    );

    const itemsToCharge = Math.min(offerSet.buy_count || 0, sortedProductsDesc.length);
    let payableTotal = 0;
    for (let i = 0; i < itemsToCharge; i++) {
      payableTotal += parseFloat(sortedProductsDesc[i].product_price);
    }

    const freeItemsActualCount = Math.min(offerSet.get_count || 0, sortedProductsDesc.length - itemsToCharge);
    const freeItemsForDisplay = sortedProductsDesc.slice(itemsToCharge, itemsToCharge + freeItemsActualCount);

    const savings = freeItemsForDisplay.reduce((sum, product) => sum + parseFloat(product.product_price), 0);

    return { payableTotal, savings, freeItems: freeItemsForDisplay };
  };

  const { payableTotal, savings, freeItems } = calculateOfferTotals();

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

  return (
    <div className="bg-white rounded-lg py-2 px-4 mb-4 border border-gray-200">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-medium text-sm">{offerName}</h4>
        {!fromProductSummary && onRemove && ( // Conditionally render remove button
          <button
            onClick={handleRemove}
            className="bg-red-500 text-white cursor-pointer rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
          >
            <X size={12} />
          </button>
        )}
      </div>
      <div className="space-y-2">
        {offerSet.offer_items.map((product) => {
          const discountText = calculateDiscountPercentage(product.product_price, product.strike_price);
          return (
            <div key={product.id} className="flex items-center gap-2">
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
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium line-clamp-2">{product.product_name} (Qty: {product.quantity})</p>
                <div className="flex items-center mt-1">
                  <p className="text-xs font-bold mr-1">₹{parseFloat(product.product_price).toLocaleString('en-IN')}</p>
                  {parseFloat(product.strike_price) > parseFloat(product.product_price) && (
                    <p className="text-[10px] text-gray-500 line-through mr-1">
                      ₹{parseFloat(product.strike_price).toLocaleString('en-IN')}
                    </p>
                  )}
                  {discountText && (
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
      {/* The offer summary totals remain visible, as requested */}
      <div className="mt-2 text-sm">
        {savings > 0 && (
          <div className="flex justify-between text-green-600">
            <span className="text-xs">You Save ({freeItems.length} free item{freeItems.length !== 1 ? 's' : ''}):</span>
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