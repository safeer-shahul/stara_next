// components/VariantSelectionModal.tsx
'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { ProductItemDetails, ProductVariant } from '@/context/cartContext';
import { useCart } from '@/context/cartContext';
import { showToast } from '@/utils/toast';

interface VariantSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductItemDetails | null; // The product that has variants
  onVariantSelected: (product: ProductItemDetails, selectedVariant: ProductVariant) => void;
}

export default memo(function VariantSelectionModal({
  isOpen,
  onClose,
  product,
  onVariantSelected,
}: VariantSelectionModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const { getEffectiveProductStock } = useCart();

  useEffect(() => {
    if (!isOpen) {
      setSelectedVariant(null);
    } else if (product && product.product_variant && product.product_variant.length > 0) {
      // Find first variant with both regular stock AND effective stock > 0
      const firstAvailableVariant = product.product_variant.find(v => {
        const effectiveStock = getEffectiveProductStock(product, v.id);
        return v.quantity > 0 && effectiveStock > 0;
      });
      setSelectedVariant(firstAvailableVariant || null);
    }
  }, [isOpen, product, getEffectiveProductStock]);

  const handleVariantSelect = useCallback((variant: ProductVariant) => {
    if (!product) return;
    
    const effectiveStock = getEffectiveProductStock(product, variant.id);
    
    if (variant.quantity === 0 || effectiveStock <= 0) {
      showToast.warning(`${variant.variant_name} is currently out of stock or you have reached the maximum quantity allowed.`);
      return;
    }
    setSelectedVariant(variant);
  }, [product, getEffectiveProductStock]);

  const handleConfirm = useCallback(() => {
    if (!product) {
      showToast.error('Product information is missing.');
      return;
    }

    if (!selectedVariant) {
      showToast.warning('Please select a variant to continue.');
      return;
    }

    const effectiveStock = getEffectiveProductStock(product, selectedVariant.id);
    
    if (selectedVariant.quantity <= 0 || effectiveStock <= 0) {
      showToast.warning(`${selectedVariant.variant_name} is currently out of stock or you have reached the maximum quantity allowed.`);
      return;
    }

    onVariantSelected(product, selectedVariant);
    onClose();
  }, [product, selectedVariant, onVariantSelected, onClose, getEffectiveProductStock]);

  if (!isOpen || !product) return null;

  // Show all variants together but with different styling for out-of-stock
  const allVariants = product.product_variant || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Select Variant</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 flex-grow overflow-y-auto">
          <div className="flex items-center mb-4">
            <div className="relative w-20 h-20 flex-shrink-0 mr-4 rounded overflow-hidden">
              <Image
                src={product.images[0]?.product_image ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${product.images[0].product_image}` : '/images/placeholder.png'}
                alt={product.product_name}
                fill
                className="object-contain p-1"
                sizes="80px"
              />
            </div>
            <div>
              <h4 className="font-medium text-base line-clamp-2">{product.product_name}</h4>
              <p className="text-sm text-gray-700">₹{parseFloat(product.product_price).toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* All Variants with Different Styling */}
          {allVariants.length > 0 && (
            <>
              <h5 className="font-medium text-sm mb-2">Select Size:</h5>
              <div className="flex flex-wrap gap-2 mb-4">
                {allVariants.map((variant) => {
                  const effectiveStock = getEffectiveProductStock(product, variant.id);
                  const isOutOfStock = variant.quantity === 0 || effectiveStock <= 0;
                  const isSelected = selectedVariant?.id === variant.id;
                  
                  return (
                    <button
                      key={variant.id}
                      className={`px-4 py-2 text-sm rounded-md border transition-all duration-200 ${
                        isOutOfStock
                          ? 'border-red-200 bg-red-50 text-red-400 cursor-not-allowed opacity-50 line-through'
                          : isSelected
                          ? 'border-black bg-black text-white shadow-md'
                          : 'border-gray-300 text-gray-700 hover:border-gray-500 hover:bg-gray-50'
                      }`}
                      onClick={() => handleVariantSelect(variant)}
                      disabled={isOutOfStock}
                    >
                      <span className={isOutOfStock ? 'line-through' : ''}>
                        {variant.variant_name}
                      </span>
                      <span className={`ml-1 text-xs ${isOutOfStock ? 'text-red-400' : 'opacity-75'}`}>
                        ({effectiveStock > 0 ? effectiveStock : 'Out'})
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Selected Variant Info */}
          {selectedVariant && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 size={16} className="text-green-500" />
                <span className="font-medium text-sm">Selected: {selectedVariant.variant_name}</span>
              </div>
              <span className="text-green-700 text-sm">
                Available ({getEffectiveProductStock(product, selectedVariant.id)} can be added to cart)
              </span>
            </div>
          )}

          {/* No Available Variants */}
          {allVariants.every(v => {
            const effectiveStock = getEffectiveProductStock(product, v.id);
            return v.quantity === 0 || effectiveStock <= 0;
          }) && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500" />
                <span className="text-red-700 text-sm font-medium">All variants are currently out of stock or unavailable</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t">
          <button
            className={`w-full py-3 rounded-md font-medium transition-colors ${
              selectedVariant && getEffectiveProductStock(product, selectedVariant.id) > 0
                ? 'bg-[var(--color-primary-950)] text-white hover:bg-[#0f4c67] cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            onClick={handleConfirm}
            disabled={!selectedVariant || getEffectiveProductStock(product, selectedVariant?.id) <= 0}
          >
            {selectedVariant && getEffectiveProductStock(product, selectedVariant.id) > 0 ? 'Add to Cart' : 'Select Available Variant'}
          </button>
        </div>
      </div>
    </div>
  );
});