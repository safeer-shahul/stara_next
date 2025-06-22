'use client';

import Image from 'next/image';
import { X } from 'lucide-react'; 
import { CartOfferItem, ProductItemDetails } from '@/context/cartContext'; 

interface OfferCartItemProps {
  offerSet: CartOfferItem; 
  onRemove?: (id: string) => Promise<void>; // FIX: Changed parameter type to string
  fromProductSummary?: boolean; 
}

export default function OfferCartItem({ offerSet, onRemove, fromProductSummary = false }: OfferCartItemProps) {
  const offerName = offerSet.offer_name?.offer_name || 'Special Offer';

  console.log('OfferCartItem: offerSet:', offerSet);

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
    // FIX: Simplified: offerSet.id is now always a string.
    // The responsibility to decide if it's a local-only removal or needs backend API call
    // lies with the `onRemove` handler passed from `CartDrawer.tsx`.
    if (onRemove) { 
      await onRemove(offerSet.id); 
    }
  };

  if (offerSet.offer_items.length === 0) {
      console.warn('OfferCartItem: offer_items is empty for offerSet:', offerSet);
      return null; 
  }

  return (
    <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-medium text-sm">{offerName}</h4>
        {!fromProductSummary && onRemove && (
          <button
            onClick={handleRemove}
            className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
          >
            <X size={12} />
          </button>
        )}
      </div>
      <div className="space-y-2">
        {offerSet.offer_items.map((product, index) => ( 
          // FIX: product.id is guaranteed string here
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
              <p className="text-xs text-gray-600">
                ₹{parseFloat(product.product_price).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
      {!fromProductSummary && (
        <div className="mt-2 text-sm">
          {savings > 0 && (
            <div className="flex justify-between text-green-600">
              <span>You Save ({freeItems.length} free item{freeItems.length !== 1 ? 's' : ''}):</span>
              <span className="font-medium">₹{savings.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-base">
            <span>Offer Total:</span>
            <span>₹{payableTotal.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
