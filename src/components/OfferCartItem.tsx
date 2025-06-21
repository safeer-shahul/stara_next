// src/components/OfferCartItem.tsx
'use client';

import Image from 'next/image';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
// apiService is kept here, but the getValidOffers call inside useEffect is removed
import apiService from '@/utils/api/apiService'; 
import { useState, useEffect } from 'react';
// Import the specific CartOfferItem and ProductItemDetails types
import { CartOfferItem, ProductItemDetails } from '@/context/cartContext'; 

interface OfferCartItemProps {
  offerSet: CartOfferItem; // FIX: Now expects the structured CartOfferItem
  onRemove?: (setId: string) => void;
  fromProductSummary?: boolean; // Indicates if it's rendered in ProductSummary
}

export default function OfferCartItem({ offerSet, onRemove, fromProductSummary = false }: OfferCartItemProps) {
  // FIX: Offer name is now directly available on offerSet.offer_name
  const offerName = offerSet.offer_name?.offer_name || 'Special Offer';
  const [isCollapsed, setIsCollapsed] = useState(true);

  // FIX: Removed useEffect for fetching offer name as it's now part of the offerSet prop
  // The offerSet should already be fully enriched from cartService.fetchCartFromBackend
  // No need for additional API calls here.

  console.log('OfferCartItem: offerSet:', offerSet);

  const calculateOfferTotals = () => {
    // FIX: Flatten main_product and offer_products_extra for calculation
    const allProducts: ProductItemDetails[] = [];
    if (offerSet.main_product) {
      allProducts.push(offerSet.main_product);
    }
    if (offerSet.offer_products_extra) {
      allProducts.push(...offerSet.offer_products_extra);
    }

    if (allProducts.length === 0) {
      return { payableTotal: 0, savings: 0, freeItems: [] };
    }

    const sortedProducts = [...allProducts].sort(
      (a, b) => parseFloat(b.product_price) - parseFloat(a.product_price)
    );
    
    // Assuming offerSet.buy_count applies to the highest priced items
    const itemsToCharge = Math.min(offerSet.buy_count || 1, sortedProducts.length);
    const payableTotal = sortedProducts
      .slice(0, itemsToCharge)
      .reduce((sum, product) => sum + parseFloat(product.product_price), 0);
    
    // Savings are the sum of the remaining items' prices (the free items)
    const savings = sortedProducts
      .slice(itemsToCharge)
      .reduce((sum, product) => sum + parseFloat(product.product_price), 0);
    const freeItems = sortedProducts.slice(itemsToCharge);

    return { payableTotal, savings, freeItems };
  };

  const { payableTotal, savings, freeItems } = calculateOfferTotals();

  const handleRemove = () => {
    if (onRemove) {
      onRemove(offerSet.id); // Pass the cart item ID of the offer set
    }
  };

  // Ensure main_product exists before rendering to prevent errors
  if (!offerSet.main_product) {
      console.warn('OfferCartItem: main_product is missing for offerSet:', offerSet);
      return null; // Or render a placeholder/error message for a malformed offer
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
        {/* FIX: Render main_product separately */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
          <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden">
            <Image
              src={offerSet.main_product.images[0]?.product_image
                ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${offerSet.main_product.images[0].product_image}`
                : '/images/placeholder.png'}
              alt={offerSet.main_product.product_name}
              fill
              className="object-cover"
              sizes="48px"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium line-clamp-2">{offerSet.main_product.product_name}</p>
            {!fromProductSummary && freeItems.some((item) => item.id === offerSet.main_product.id) ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 line-through">
                  ₹{parseFloat(offerSet.main_product.product_price).toLocaleString()}
                </span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                  FREE
                </span>
              </div>
            ) : (
              <p className="text-xs text-gray-600">
                ₹{parseFloat(offerSet.main_product.product_price).toLocaleString()}
              </p>
            )}
          </div>
          {/* Only show collapse/expand icon if there are additional products */}
          {offerSet.offer_products_extra.length > 0 && (isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />)}
        </div>
        {/* FIX: Render offer_products_extra only when expanded */}
        {!isCollapsed && offerSet.offer_products_extra.length > 0 && (
          <div className="space-y-2 pl-4 border-l border-gray-200 ml-4 pt-2"> {/* Added some styling for indentation */}
            {offerSet.offer_products_extra.map((product) => (
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
                  <p className="text-xs font-medium line-clamp-2">{product.product_name}</p>
                  {!fromProductSummary && freeItems.some((item) => item.id === product.id) ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 line-through">
                        ₹{parseFloat(product.product_price).toLocaleString()}
                      </span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                        FREE
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600">
                      ₹{parseFloat(product.product_price).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {!fromProductSummary && (
        <div className="mt-2 text-sm">
          {savings > 0 && (
            <div className="flex justify-between text-green-600">
              <span>You Save ({freeItems.length} free item{freeItems.length > 1 ? 's' : ''}):</span>
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