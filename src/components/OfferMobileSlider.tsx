'use client';
import { useEffect, useState, useCallback, memo } from 'react';
import Image from 'next/image';
import { X, ShoppingBag } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useCart, CartOfferItem, ProductItemDetails, ProductVariant } from '@/context/cartContext';

interface ProductItem extends ProductItemDetails {}

interface OfferData {
    id: string;
    offer_name: string;
    buy_count: number;
    get_count: number;
    start_date: string;
    end_date: string;
    offer_image: string;
    products: ProductItem[];
}

interface OfferSlot {
    id: string;
    product: ProductItem | null;
    selectedVariant?: ProductVariant | null;
    slotIndex: number;
}

interface OfferMobileSliderProps {
    isOpen: boolean;
    onClose: () => void;
    offerData: OfferData;
    slots: OfferSlot[];
    onSlotClear: (slotId: string) => void;
    onOpenCartDrawer: () => void;
    isAuthenticated?: boolean;
}

export default memo(function OfferMobileSlider({
    isOpen,
    onClose,
    offerData,
    slots,
    onSlotClear,
    onOpenCartDrawer,
    isAuthenticated = false
}: OfferMobileSliderProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            console.log("OfferMobileSlider: Body overflow hidden.");
        } else {
            document.body.style.overflow = 'unset';
            console.log("OfferMobileSlider: Body overflow unset.");
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const { dispatchCart } = useCart();
    const [loading, setLoading] = useState(false);

    const calculateTotals = useCallback(() => {
        const filledSlots = slots.filter(slot => slot.product);
        if (filledSlots.length === 0) {
            return { payableTotal: 0, savings: 0, freeItems: [] };
        }

        const allIndividualProductsInSlots: (ProductItemDetails & { uniqueSlotId: string; selectedVariant?: ProductVariant })[] = filledSlots.map(slot => {
            const product = slot.product!;
            return {
                ...product,
                quantity: 1,
                ...(slot.selectedVariant && { selectedVariant: slot.selectedVariant }),
                uniqueSlotId: slot.id,
            };
        });

        const sortedProductsDesc = [...allIndividualProductsInSlots]
            .sort((a, b) => parseFloat(b.product_price) - parseFloat(a.product_price));

        const itemsToCharge = Math.min(offerData.buy_count, sortedProductsDesc.length);
        const payableTotal = sortedProductsDesc
            .slice(0, itemsToCharge)
            .reduce((sum, product) => sum + parseFloat(product.product_price), 0);

        const freeItemsActualCount = Math.min(offerData.get_count, sortedProductsDesc.length - itemsToCharge);

        const freeItemsForDisplay = sortedProductsDesc.slice(itemsToCharge, itemsToCharge + freeItemsActualCount);

        const savings = freeItemsForDisplay.reduce((sum, product) => sum + parseFloat(product.product_price), 0);

        return { payableTotal, savings, freeItems: freeItemsForDisplay };
    }, [slots, offerData]);

    const isOfferComplete = useCallback(() => {
        const totalRequiredItems = offerData.buy_count + offerData.get_count;
        return slots.filter(slot => slot.product !== null).length === totalRequiredItems;
    }, [slots, offerData]);

    const handleBuyNow = useCallback(async () => {
        if (!isOfferComplete()) return;

        setLoading(true);

        const filledSlots = slots.filter(slot => slot.product);

        const aggregatedOfferItemsMap = new Map<string, ProductItemDetails>();

        filledSlots.forEach(slot => {
            if (slot.product) {
                const productKey = `${slot.product.id}-${slot.selectedVariant?.id || ''}`;

                const productDetailsForCartOfferItem: ProductItemDetails & { quantity: number; selectedVariant?: ProductVariant } = {
                    ...slot.product,
                    quantity: 1,
                    ...(slot.selectedVariant && { selectedVariant: slot.selectedVariant }),
                };

                if (aggregatedOfferItemsMap.has(productKey)) {
                    const existingProduct = aggregatedOfferItemsMap.get(productKey)!;
                    aggregatedOfferItemsMap.set(productKey, {
                        ...existingProduct,
                        quantity: existingProduct.quantity + 1,
                    });
                } else {
                    aggregatedOfferItemsMap.set(productKey, productDetailsForCartOfferItem);
                }
            }
        });

        const aggregatedOfferItems: (ProductItemDetails & { quantity: number; selectedVariant?: ProductVariant })[] = Array.from(aggregatedOfferItemsMap.values());
        const temporaryId = uuidv4();

        const offerSetPayload: CartOfferItem = {
            id: temporaryId,
            offer: offerData.id,
            offer_name: { id: offerData.id, offer_name: offerData.offer_name },
            buy_count: offerData.buy_count,
            get_count: offerData.get_count,
            isSynced: false,
            type: 'offer',
            offer_items: aggregatedOfferItems,
            updated_at: '',
            created_at: ''
        };

        try {
            dispatchCart({ type: 'ADD_OFFER_SET', payload: offerSetPayload });
            console.log("OfferMobileSlider: Dispatched ADD_OFFER_SET with aggregated items:", aggregatedOfferItems);

            onOpenCartDrawer();
        } catch (error) {
            console.error('OfferMobileSlider: Failed to add to cart (local dispatch failed?):', error);
            alert('Failed to add offer. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [dispatchCart, offerData, isOfferComplete, onOpenCartDrawer, slots]);

    const filledSlots = slots.filter(slot => slot.product !== null);
    const totalRequiredItems = offerData.buy_count + offerData.get_count;
    const { payableTotal, savings, freeItems } = calculateTotals();

    return (
        <div style={{ display: isOpen ? 'block' : 'none' }}>
            <div
                className="fixed inset-0 bg-black/70 z-51"
                onClick={onClose}
            />
            <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-xl z-52 p-4 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Your Selection</h3>
                    <button className='cursor-pointer' onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                        <ShoppingBag size={16} className="text-gray-700" />
                        <h4 className="font-medium">Selected Items ({filledSlots.length}/{totalRequiredItems})</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {slots.map((slot) => (
                            <div key={slot.id} className="bg-white rounded-lg p-2 min-h-[65px] border-2 border-dashed border-gray-300">
                                {slot.product ? (
                                    <div className="relative">
                                        <button
                                            onClick={() => onSlotClear(slot.id)}
                                            className="absolute -top-1 -right-1 bg-red-500 cursor-pointer text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600 z-10"
                                        >
                                            <X size={10} />
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden">
                                                <Image
                                                    src={slot.product.images?.[0]?.product_image ?
                                                        `${process.env.NEXT_PUBLIC_API_BASE_URL}${slot.product.images[0].product_image}` :
                                                        '/images/placeholder.png'
                                                    }
                                                    alt={slot.product.product_name}
                                                    fill
                                                    className="object-cover"
                                                    sizes="48px"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium line-clamp-2">
                                                  {slot.product.product_name}
                                                  {slot.selectedVariant && (
                                                    <span className="text-gray-500 text-[10px] ml-1"> ({slot.selectedVariant.variant_name})</span>
                                                  )}
                                                </p>
                                                {freeItems.some(freeItem => freeItem.uniqueSlotId === slot.id) ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-gray-500 line-through">₹{parseFloat(slot.product.product_price).toLocaleString()}</span>
                                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">FREE</span>
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-gray-600">₹{parseFloat(slot.product.product_price).toLocaleString()}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400 text-xs text-center">
                                        Empty Slot {slot.slotIndex + 1}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                {filledSlots.length > 0 && (
                    <div className="pt-4 pb-12 mt-4">
                        <div className="space-y-2 text-sm mb-4">
                            {savings > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>You Save ({freeItems.length} free item{freeItems.length > 1 ? 's' : ''}):</span>
                                    <span className="font-medium">₹{savings.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-semibold text-lg border-t border-gray-200 pt-2">
                                <span>Final Total:</span>
                                <span>₹{payableTotal.toLocaleString()}</span>
                            </div>
                        </div>
                        <button
                            className={`w-full py-3 rounded-lg font-medium transition-colors ${
                                isOfferComplete()
                                    ? 'bg-[var(--color-primary-950)] cursor-pointer text-white hover:bg-[#0f4c67]'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                            disabled={!isOfferComplete()}
                            onClick={handleBuyNow}
                        >
                            {isOfferComplete() ? 'Buy Now' : `Select ${totalRequiredItems - filledSlots.length} More Item${totalRequiredItems - filledSlots.length > 1 ? 's' : ''}`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
});