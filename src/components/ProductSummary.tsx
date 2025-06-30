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
      <div className="py-4 text-center">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Loading product details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 text-center">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="mb-6 bg-white p-4 rounded-[12px]">
      <h4 className="font-medium text-[15px] text-[#494949] mb-2">Order Summary</h4>

      <div className="rounded-lg mb-4 max-h-64 overflow-y-auto">
        {normalItems.length === 0 && offerSets.length === 0 && (
          <div className="text-center py-4 text-gray-500">No items in summary.</div>
        )}
        
        {/* Normal Items */}
        {normalItems.map((item) => (
          <CartItem
            key={`${item.id}-${item.selectedVariant?.id || 'no-variant'}`}
            product={item}
            onRemove={() => {}} // No remove functionality in summary
            onQuantityChange={() => {}} // No quantity change in summary
            fromProductSummary={true}
            maxAllowedQuantity={item.selectedVariant?.quantity ?? item.stock_quantity}
          />
        ))}

        {/* Offer Items */}
        {offerSets.map((offerSet) => (
          <OfferCartItem
            key={offerSet.id}
            offerSet={offerSet}
            onRemove={undefined} // No remove functionality in summary
            fromProductSummary={true}
          />
        ))}
      </div>

      {/* Summary Totals */}
      <div className="py-4 px-2">
        <div className="space-y-2">
          {/* Normal Items Subtotal */}
          {totals.normalSubtotal > 0 && (
            <div className="flex justify-between text-[13px] text-gray-600">
              <span>Regular Items</span>
              <span className="font-semibold">₹{totals.normalSubtotal.toFixed(2)}</span>
            </div>
          )}

          {/* Offer Items Subtotal */}
          {totals.offerSubtotal > 0 && (
            <div className="flex justify-between text-[13px] text-gray-600">
              <span>Offer Items</span>
              <span className="font-semibold">₹{totals.offerSubtotal.toFixed(2)}</span>
            </div>
          )}

          {/* Offer Savings */}
          {totals.offerSavings > 0 && (
            <div className="flex justify-between text-[13px] text-green-600">
              <span>You Save (Free Items)</span>
              <span className="font-semibold">-₹{totals.offerSavings.toFixed(2)}</span>
            </div>
          )}
          
          {/* Total */}
          <div className="flex justify-between text-[16px] pt-2 border-t border-gray-200">
            <span className="text-gray-500">Total ({totals.totalItems} items)</span>
            <span className="font-semibold">₹{totals.grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(ProductSummary);