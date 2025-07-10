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
      
      // Fix: Check isPaid correctly - it should be explicitly true for paid items
      if (item.isPaid === true) {
        payableTotal += itemTotal;
        totalPaidItems += item.quantity;
      } else {
        // isPaid is false or undefined - these are free items
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
      // console.log('🗑️ OfferCartItem: Removing offer item with ID:', offerSet);
      // console.log('🗑️ OfferCartItem: Offer details:', {
      //   offerId: offerSet.offer,
      //   offerName: offerSet.offer_name.offer_name,
      //   itemId: offerSet.id
      // });
      await onRemove(offerSet.id);
    }
  };

  if (offerSet.offer_items.length === 0) {
    // console.warn('⚠️ OfferCartItem: offer_items is empty for offerSet:', offerSet);
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
    // Fix: Check isPaid flag correctly
    // console.log('💳 OfferCartItem: Product isPaid status:', product.product_name, 'isPaid:', product.isPaid);
    return {
      isPaid: product.isPaid === true, // Explicitly check for true
      quantity: product.quantity
    };
  };

  // console.log('🎁 OfferCartItem: Rendering offer with items:', offerSet.offer_items.map(item => ({
  //   name: item.product_name,
  //   isPaid: item.isPaid,
  //   quantity: item.quantity
  // })));

  return (
    <div className={`relative rounded-xl border-2 transition-all duration-300 overflow-hidden ${
      fromProductSummary 
        ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50' 
        : 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg hover:shadow-xl hover:border-green-400'
    } p-4 mb-4`}>
      
      {/* Sparkle effects */}
      <div className="absolute top-2 left-4 w-2 h-2 bg-yellow-400 rounded-full animate-ping" style={{ animationDelay: '0s' }}></div>
      <div className="absolute bottom-4 right-8 w-1 h-1 bg-amber-300 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-6 right-12 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-bounce" style={{ animationDelay: '2s' }}></div>

      {/* Enhanced Offer Header */}
      <div className="flex justify-between items-start mb-4 relative">
        <div className="flex-1">
          {/* <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">🎁</span>
            </div>
            <h4 className="font-bold text-lg text-green-800">{offerName}</h4>
          </div> */}
          
          <div className="flex items-center gap-4">
            <p className="text-sm font-semibold text-green-700 bg-white px-3 py-1 rounded-full shadow-sm">
              Buy {offerSet.buy_count} Get {offerSet.get_count} Free
            </p>
            
            {savings > 0 && (
              <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm animate-pulse">
                Save ₹{savings.toLocaleString('en-IN')}
              </div>
            )}
          </div>
        </div>
        
        {!fromProductSummary && onRemove && (
          <button
            onClick={handleRemove}
            className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full flex items-center justify-center text-xs hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-110 shadow-md relative z-10"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Enhanced Offer Items Grid */}
      <div className="space-y-3 mb-4">
        {offerSet.offer_items.map((product, index) => {
          const discountText = calculateDiscountPercentage(product.product_price, product.strike_price);
          const { isPaid, quantity } = getProductStatus(product);
          
          return (
            <div key={`${product.id}-${product.selectedVariant?.id || 'no-variant'}-${index}`} 
                 className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
              
              <div className="flex items-center gap-3">
                {/* Enhanced Product Image */}
                <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                  <Image
                    src={product.images[0]?.product_image
                      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${product.images[0].product_image}`
                      : '/images/placeholder.png'}
                    alt={product.product_name}
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-110"
                    sizes="64px"
                  />
                  
                  {/* Enhanced Status Badges */}
                  {!isPaid ? (
                    <div className="absolute -top-1 -right-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg animate-bounce">
                      FREE
                    </div>
                  ) : (
                    <div className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                      PAID
                    </div>
                  )}
                  
                  {/* Sparkle effect on image */}
                  <div className="absolute top-1 left-1 w-2 h-2 bg-yellow-400 rounded-full opacity-60 animate-pulse"></div>
                </div>
                
                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-tight">
                    {product.product_name}
                    {product.selectedVariant && (
                      <span className="block text-xs text-[var(--color-primary-950)] font-medium mt-1 bg-blue-50 px-2 py-0.5 rounded-full inline-block">
                        Size: {product.selectedVariant.variant_name}
                      </span>
                    )}
                  </p>
                  
                  {/* Quantity and Status */}
                  <div className="flex items-center gap-3 mt-2">
                    <div className={`text-xs font-bold px-2 py-1 rounded-full ${
                      isPaid 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {isPaid ? `Paid: ${quantity}` : `Free: ${quantity}`}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Qty: {quantity}
                    </div>

                     {/* Show discount only for paid items */}
                    {discountText && isPaid && (
                      <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-2 py-1 rounded-full font-bold shadow-sm">
                        {discountText}
                      </span>
                    )}
                  </div>

                  {/* FIXED: Enhanced Pricing Display */}
                  <div className="flex items-center gap-2 mt-2">
                    {!isPaid ? (
                      // For FREE items, show FREE prominently
                      <div className="flex items-center gap-2">
                        {/* <p className="text-lg font-bold text-green-600">FREE</p>
                        <span className="text-xs text-green-500">🎉</span> */}
                        {quantity > 1 && (
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            {quantity} items
                          </span>
                        )}
                      </div>
                    ) : (
                      // For PAID items, show total price for quantity
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-[var(--color-primary-950)]">
                          ₹{(parseFloat(product.product_price) * quantity).toLocaleString('en-IN')}
                        </p>
                        {quantity > 1 && (
                          <span className="text-xs text-gray-500">
                            (₹{parseFloat(product.product_price).toLocaleString('en-IN')} each)
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Show strike price only for paid items */}
                    {isPaid && parseFloat(product.strike_price || '0') > parseFloat(product.product_price || '0') && (
                      <p className="text-xs text-gray-500 line-through">
                        ₹{(parseFloat(product.strike_price) * quantity).toLocaleString('en-IN')}
                      </p>
                    )}
                    
                   
                  </div>

                  {/* ADDED: Value breakdown for clarity */}
                  {!fromProductSummary && (
                    <div className="text-xs text-gray-500 mt-1">
                      {!isPaid ? (
                        <span className="text-green-600 font-medium">
                          💰 Saves ₹{(parseFloat(product.product_price) * quantity).toLocaleString('en-IN')}
                        </span>
                      ) : quantity > 1 && (
                        <span>
                          Total for {quantity} items
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enhanced Offer Summary */}
      {/* <div className="bg-white rounded-xl p-4 border-2 border-green-200 shadow-inner"> */}
        {/* <div className="space-y-2"> */}
          {/* Savings Display */}
          {/* {savings > 0 && (
            <div className="flex justify-between items-center p-2 bg-green-100 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎊</span>
                <span className="text-sm font-semibold text-green-700">
                  You Save ({totalFreeItems} free item{totalFreeItems !== 1 ? 's' : ''}):
                </span>
              </div>
              <span className="text-lg font-bold text-green-700">
                ₹{savings.toLocaleString('en-IN')}
              </span>
            </div>
          )} */}
          
          {/* Payment Summary */}
          {/* <div className="flex justify-between items-center p-2 bg-gradient-to-r from-[var(--color-primary-950)]/10 to-indigo-100 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-lg">💳</span>
              <span className="text-base font-bold text-[var(--color-primary-950)]">You Pay:</span>
            </div>
            <span className="text-xl font-bold text-[var(--color-primary-950)]">
              ₹{payableTotal.toLocaleString('en-IN')}
            </span>
          </div> */}
          
          {/* Item Count Summary */}
          {/* {totalPaidItems > 0 && (
            <div className="text-center text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
              <span className="font-medium">
                {totalPaidItems} paid item{totalPaidItems !== 1 ? 's' : ''}{totalFreeItems > 0 ? ` + ${totalFreeItems} free item${totalFreeItems !== 1 ? 's' : ''}` : ''}
              </span>
            </div>
          )} */}
        {/* </div> */}
      {/* </div> */}

      {/* Decorative bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-green-400 opacity-50"></div>
    </div>
  );
}