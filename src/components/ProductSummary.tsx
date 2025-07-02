'use client';
import { useState, useEffect, memo } from 'react';
import { CartNormalItem, CartOfferItem } from '@/context/cartContext';
import { useCart } from '@/context/cartContext';
import CartItem from './CartItem';
import OfferCartItem from './OfferCartItem';

interface ProductSummaryProps {
  normalItems: CartNormalItem[];
  offerSets: CartOfferItem[];
  parentLoading?: boolean;
}

const ProductSummary: React.FC<ProductSummaryProps> = ({ 
  normalItems, 
  offerSets = [], 
  parentLoading = false 
}) => {
  const { calculateTotals } = useCart();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setError(null);
      // Validate data
      if (!Array.isArray(normalItems) || !Array.isArray(offerSets)) {
        throw new Error('Invalid cart data format');
      }
    } catch (e: any) {
      console.error('ProductSummary: Error validating data:', e);
      setError(`Failed to process cart data: ${e.message || 'Unknown error'}`);
    }
  }, [normalItems, offerSets]);

  if (parentLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="relative">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-[var(--color-primary-950)] rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-8 h-8 border-4 border-transparent border-b-yellow-400 rounded-full animate-spin animation-delay-150"></div>
          </div>
          <p className="ml-4 text-gray-600 font-medium">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-red-200 p-6">
        <div className="text-center py-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-red-500 text-xl">⚠️</span>
          </div>
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-[var(--color-primary-950)] to-[#1a5f7a] p-4">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3">
            <span className="text-white text-sm font-bold">📦</span>
          </div>
          <h4 className="font-semibold text-lg text-white">Order Summary</h4>
        </div>
      </div>

      <div className="p-6">
        {/* Items Container */}
        <div className="max-h-64 overflow-y-auto mb-6 space-y-3">
          {normalItems.length === 0 && offerSets.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-gray-400 text-2xl">🛒</span>
              </div>
              <p className="text-gray-500">No items in summary.</p>
            </div>
          )}
          
          {/* Normal Items Section */}
          {normalItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 px-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <h5 className="text-sm font-semibold text-[var(--color-primary-950)] flex items-center">
                  <span className="w-5 h-5 bg-[var(--color-primary-950)] rounded-full flex items-center justify-center mr-2">
                    <span className="text-white text-xs">🛍️</span>
                  </span>
                  Regular Items
                </h5>
                <span className="text-xs font-bold text-[var(--color-primary-950)] bg-white px-2 py-1 rounded-full">
                  {normalItems.length}
                </span>
              </div>
              
              {normalItems.map((item) => (
                <div key={`${item.id}-${item.selectedVariant?.id || 'no-variant'}`} className="bg-gray-50 rounded-lg p-1">
                  <CartItem
                    product={item}
                    onRemove={() => {}} // No remove functionality in summary
                    onQuantityChange={() => {}} // No quantity change in summary
                    fromProductSummary={true}
                    maxAllowedQuantity={item.selectedVariant?.quantity ?? item.stock_quantity}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Offer Items Section */}
          {offerSets.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 px-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                <h5 className="text-sm font-semibold text-green-700 flex items-center">
                  <span className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center mr-2">
                    <span className="text-white text-xs">🎁</span>
                  </span>
                  Special Offers
                </h5>
                <span className="text-xs font-bold text-green-700 bg-white px-2 py-1 rounded-full">
                  {offerSets.length}
                </span>
              </div>
              
              {offerSets.map((offerSet) => (
                <div key={offerSet.id} className="bg-green-50 rounded-lg p-1">
                  <OfferCartItem
                    offerSet={offerSet}
                    onRemove={undefined} // No remove functionality in summary
                    fromProductSummary={true}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enhanced Summary Totals */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200">
          <div className="space-y-3">
            {/* Normal Items Subtotal */}
            {totals.normalSubtotal > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 flex items-center">
                  <span className="w-4 h-4 bg-blue-500 rounded-full mr-2"></span>
                  Regular Items
                </span>
                <span className="font-bold text-gray-800">₹{totals.normalSubtotal.toFixed(2)}</span>
              </div>
            )}

            {/* Offer Items Subtotal */}
            {totals.offerSubtotal > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 flex items-center">
                  <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
                  Offer Items
                </span>
                <span className="font-bold text-gray-800">₹{totals.offerSubtotal.toFixed(2)}</span>
              </div>
            )}

            {/* Offer Savings */}
            {totals.offerSavings > 0 && (
              <div className="flex justify-between items-center text-sm bg-green-100 -mx-2 px-2 py-2 rounded-lg">
                <span className="text-green-700 font-medium flex items-center">
                  <span className="text-lg mr-2">🎉</span>
                  You Save (Free Items)
                </span>
                <span className="font-bold text-green-700">-₹{totals.offerSavings.toFixed(2)}</span>
              </div>
            )}
            
            {/* Total */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-300">
              <div>
                <span className="text-gray-700 font-semibold">Total</span>
                <span className="text-xs text-gray-500 ml-1">({totals.totalItems} items)</span>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-[var(--color-primary-950)]">
                  ₹{totals.grandTotal.toFixed(2)}
                </div>
                {totals.offerSavings > 0 && (
                  <div className="text-xs text-green-600 font-medium">
                    Saved ₹{totals.offerSavings.toFixed(2)}!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        {(totals.normalSubtotal > 0 || totals.offerSubtotal > 0) && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center">
              <span className="text-yellow-600 text-sm mr-2">💎</span>
              <p className="text-yellow-800 text-xs font-medium">
                Premium jewelry with authentic materials and craftsmanship
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(ProductSummary);