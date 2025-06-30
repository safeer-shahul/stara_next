// components/VariantSelectionModal.tsx
'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { ProductItemDetails, ProductVariant } from '@/context/cartContext';

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedVariant(null);
      setErrorMessage(null);
    } else if (product && product.product_variant && product.product_variant.length > 0) {
      const firstInStockVariant = product.product_variant.find(v => v.quantity > 0);
      if (firstInStockVariant) {
        setSelectedVariant(firstInStockVariant);
      } else {
        setSelectedVariant(null);
        setErrorMessage('All variants are out of stock.');
      }
    } else {
      setErrorMessage('No variants available for this product.');
    }
  }, [isOpen, product]);

  const handleConfirm = () => {
    if (product && selectedVariant) {
      if (selectedVariant.quantity > 0) {
        onVariantSelected(product, selectedVariant);
        onClose();
      } else {
        setErrorMessage('The selected variant is out of stock. Please choose another.');
      }
    } else {
      setErrorMessage('Please select a variant to continue.');
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Select Variant</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
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

          <h5 className="font-medium text-sm mb-2">Available Variants:</h5>
          <div className="flex flex-wrap gap-2 mb-4">
            {product.product_variant && product.product_variant.length > 0 ? (
              product.product_variant.map((variant) => (
                <button
                  key={variant.id}
                  className={`px-4 py-2 text-sm rounded-md border ${
                    selectedVariant?.id === variant.id
                      ? 'border-black bg-black text-white'
                      : 'border-gray-300 text-gray-700'
                  } ${variant.quantity === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => {
                    setSelectedVariant(variant);
                    setErrorMessage(null);
                  }}
                  disabled={variant.quantity === 0}
                >
                  {variant.variant_name} {variant.quantity === 0 && '(Out of Stock)'}
                </button>
              ))
            ) : (
              <p className="text-sm text-gray-500">No variants found.</p>
            )}
          </div>

          {selectedVariant && (
            <div className="mt-4 text-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">Selected:</span>
                <span>{selectedVariant.variant_name}</span>
              </div>
              <div className="flex items-center gap-2">
                {selectedVariant.quantity > 0 ? (
                  <>
                    <CheckCircle2 size={16} className="text-green-500" />
                    <span className="text-green-700">In Stock ({selectedVariant.quantity})</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={16} className="text-red-500" />
                    <span className="text-red-700">Out of Stock</span>
                  </>
                )}
              </div>
            </div>
          )}

          {errorMessage && (
            <p className="text-red-500 text-sm mt-4 flex items-center">
              <AlertCircle size={16} className="mr-1" /> {errorMessage}
            </p>
          )}
        </div>

        <div className="p-4 border-t">
          <button
            className={`w-full py-3 rounded-md text-white font-medium ${
              selectedVariant && selectedVariant.quantity > 0
                ? 'bg-[var(--color-primary-950)] hover:bg-[#0f4c67] cursor-pointer'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
            onClick={handleConfirm}
            disabled={!selectedVariant || selectedVariant.quantity === 0}
          >
            Add to Bag
          </button>
        </div>
      </div>
    </div>
  );
});