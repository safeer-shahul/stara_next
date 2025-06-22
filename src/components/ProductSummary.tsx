// components/ProductSummary.tsx
'use client';

import { useState, useEffect, memo } from 'react'; // Removed useRef

import { CartNormalItem, CartOfferItem, CartItemType } from '@/context/cartContext';
import CartItem from './CartItem';
import OfferCartItem from './OfferCartItem';
import { cartUtils } from '@/utils/cartUtils';

interface ProductSummaryProps {
  normalItems: CartNormalItem[];
  offerSets: CartOfferItem[];
  parentLoading?: boolean;
}

const ProductSummary: React.FC<ProductSummaryProps> = ({ normalItems, offerSets = [], parentLoading = false }) => {
  // const [subtotal, setSubtotal] = useState(0);
  const [offerSavings, setOfferSavings] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Removed isMounted ref and its useEffect

  useEffect(() => {
    const performCalculations = () => {
      console.log("[ProductSummary useEffect] Starting calculation...");
      try {
        setError(null);

        const allCartItems: CartItemType[] = [...normalItems, ...offerSets];

        console.log(allCartItems, "allCartItems");
        const currentFinalTotal = cartUtils.calculateSubtotal(allCartItems);
        const currentOfferSavings = cartUtils.calculateTotalOfferSavings(allCartItems);
        // const currentFinalTotal = currentSubtotal - currentOfferSavings;

        setOfferSavings(currentOfferSavings);
        setFinalTotal(currentFinalTotal);
        console.log("[ProductSummary useEffect] Calculations finished and state updated.");

      } catch (e: any) {
        console.error('ProductSummary: Error performing calculations:', e);
        setError(`Failed to calculate totals: ${e.message || 'Unknown error'}`);
      }
    };

    // Only perform calculations if the parent indicates it's NOT loading.
    if (!parentLoading) {
      performCalculations();
    } else {
      // Optionally reset values or show a different loading state if needed
      // when parentLoading becomes true again.
      setOfferSavings(0);
      setFinalTotal(0);
      setError(null);
      console.log("[ProductSummary useEffect] Waiting for parentLoading to resolve to false before calculating.");
    }

  }, [normalItems, offerSets, parentLoading]); // Depend on normalItems, offerSets, and parentLoading

  // Display loading or error messages. Prioritize parentLoading if true.
  if (parentLoading) return <div className="py-4 text-center">Loading product details...</div>;
  if (error) return <div className="py-4 text-center text-red-500">{error}</div>;

  // Render the summary content once loading is complete and no errors
  return (
    <div className="mb-6 bg-white p-4 rounded-[12px]">
      <h4 className="font-medium text-[15px] text-[#494949] mb-2">Order Summary</h4>

      <div className="rounded-lg mb-4">
        {/* Render Normal Items using the CartItem component */}
        {normalItems.map((item) => (
          <CartItem
            key={item.id}
            product={item}
            onRemove={() => { }}
            onQuantityChange={() => { }}
            fromProductSummary={true}
          />
        ))}

        {/* Render Offer Sets using the OfferCartItem component */}
        {offerSets.map((offerSet) => (
          <OfferCartItem
            key={offerSet.id}
            offerSet={offerSet}
            onRemove={undefined}
            fromProductSummary={true}
          />
        ))}

        {/* Display a message if there are no items in the cart */}
        {normalItems.length === 0 && offerSets.length === 0 && (
          <div className="text-center py-4 text-gray-500">No items in summary.</div>
        )}
      </div>

      <div className="py-4 px-2">
        <div className="space-y-2">
          {offerSavings > 0 && (
            <div className="flex justify-between text-[13px] text-green-600">
              <span>Offer Savings</span>
              <span className="font-semibold">₹{offerSavings.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-[16px] pt-2 border-t border-gray-200">
            <span className="text-gray-500">Total</span>
            <span className="font-semibold">₹{finalTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(ProductSummary);