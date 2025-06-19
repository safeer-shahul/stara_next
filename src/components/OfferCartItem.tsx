'use client';

import Image from 'next/image';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import apiService from '@/utils/api/apiService';
import { useState, useEffect } from 'react';

interface OfferCartItemProps {
  offerSet: {
    id: string;
    offer_id: string;
    offer_products: Array<{
      id: string;
      product_name: string;
      product_price: string;
      images: { product_image: string }[];
    }>;
  };
  onRemove: (setId: string) => void;
}

export default function OfferCartItem({ offerSet, onRemove }: OfferCartItemProps) {
  const [offerName, setOfferName] = useState<string>('Loading offer...');
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await apiService.getValidOffers();
        if (response && response.data) {
          const offer = response.data.find((o: any) => o.id.replace(/-/g, '') === offerSet.offer_id);
          setOfferName(offer ? offer.offer_name : 'Offer');
        }
      } catch (err) {
        console.error('Failed to fetch offers:', err);
        setOfferName('Offer');
      }
    };
    fetchOffers();
  }, [offerSet.offer_id]);

  console.log('offerSet in OfferCartItem:', offerSet);

  const calculateOfferTotals = () => {
    const sortedProducts = offerSet.offer_products.sort(
      (a, b) => parseFloat(b.product_price) - parseFloat(a.product_price)
    );
    // Assume the first product is paid, and the rest are free as a fallback (adjust logic if needed)
    const itemsToCharge = Math.min(1, sortedProducts.length); // Default to 1 paid item
    const payableTotal = sortedProducts
      .slice(0, itemsToCharge)
      .reduce((sum, product) => sum + parseFloat(product.product_price), 0);
    const savings = sortedProducts
      .slice(itemsToCharge)
      .reduce((sum, product) => sum + parseFloat(product.product_price), 0);
    const freeItems = sortedProducts.slice(itemsToCharge);

    return { payableTotal, savings, freeItems };
  };

  const { payableTotal, savings, freeItems } = calculateOfferTotals();

  const handleRemoveOfferSet = async () => {
    try {
      await apiService.removeOfferSetFromCart(offerSet.id, offerSet.offer_id.replace(/-/g, ''));
      onRemove(offerSet.id);
    } catch (error) {
      console.error('Error removing offer set:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-medium text-sm">{offerName}</h4>
        <button
          onClick={handleRemoveOfferSet}
          className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
        >
          <X size={12} />
        </button>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
          <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden">
            <Image
              src={offerSet.offer_products[0].images?.[0]?.product_image
                ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${offerSet.offer_products[0].images[0].product_image}`
                : '/images/placeholder.png'}
              alt={offerSet.offer_products[0].product_name}
              fill
              className="object-cover"
              sizes="48px"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium line-clamp-2">{offerSet.offer_products[0].product_name}</p>
            {freeItems.some((item) => item.id === offerSet.offer_products[0].id) ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 line-through">
                  ₹{parseFloat(offerSet.offer_products[0].product_price).toLocaleString()}
                </span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                  FREE
                </span>
              </div>
            ) : (
              <p className="text-xs text-gray-600">
                ₹{parseFloat(offerSet.offer_products[0].product_price).toLocaleString()}
              </p>
            )}
          </div>
          {offerSet.offer_products.length > 1 && (isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />)}
        </div>
        {!isCollapsed && offerSet.offer_products.length > 1 && (
          <div className="space-y-2">
            {offerSet.offer_products.slice(1).map((product) => (
              <div key={product.id} className="flex items-center gap-2">
                <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden">
                  <Image
                    src={product.images?.[0]?.product_image
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
                  {freeItems.some((item) => item.id === product.id) ? (
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
    </div>
  );
}