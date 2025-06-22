'use client';
import { useEffect, useState } from 'react'; 
import Image from 'next/image';
import { ShoppingBag, X } from 'lucide-react';
import apiService from '@/utils/api/apiService';
import { v4 as uuidv4 } from 'uuid';
import { useCart, CartOfferItem, ProductItemDetails } from '@/context/cartContext';

interface ProductItem {
    id: string;
    images: {
        id: string;
        product_image: string;
        product: string;
    }[];
    product_name: string;
    product_price: string;
    strike_price: string;
    product_status: boolean;
    product_code?: string;
    product_description?: string;
    quantity?: number; 
    product_weight?: string;
    product_box_weight?: string;
    created_at?: string;
    updated_at?: string;
    sub_category?: string;
    isInStock?: boolean;
}


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
    slotIndex: number;
}

interface OfferCartSidebarProps {
    offerData: OfferData;
    slots: OfferSlot[];
    onSlotClear: (slotId: string) => void;
    onOpenCartDrawer: () => void;
    isAuthenticated?: boolean;
}

export default function OfferCartSidebar({
    offerData,
    slots,
    onSlotClear,
    onOpenCartDrawer,
    isAuthenticated = false
}: OfferCartSidebarProps) {
    const { dispatchCart } = useCart();
    const [loading, setLoading] = useState(false);

    const calculateTotals = () => {
        const filledSlots = slots.filter(slot => slot.product);
        if (filledSlots.length === 0) {
            return { payableTotal: 0, savings: 0, freeItems: [] };
        }

        const allIndividualProductsInSlots: (ProductItemDetails & { uniqueSlotId: string })[] = filledSlots.map(slot => {
            const product = slot.product!; 
            return {
                id: product.id,
                images: product.images || [],
                product_name: product.product_name,
                product_price: product.product_price,
                strike_price: product.strike_price,
                product_status: product.product_status,
                product_code: product.product_code || '',
                product_description: product.product_description || '',
                quantity: 1, 
                product_weight: product.product_weight || '',
                product_box_weight: product.product_box_weight || '',
                created_at: product.created_at || new Date().toISOString(),
                updated_at: product.updated_at || new Date().toISOString(),
                sub_category: product.sub_category || '',
                isInStock: product.product_status && (product.quantity || 1) > 0,
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
    };

    const isOfferComplete = () => {
        const totalRequiredItems = offerData.buy_count + offerData.get_count;
        return slots.filter(slot => slot.product !== null).length === totalRequiredItems;
    };

    const handleBuyNow = async () => {
        if (!isOfferComplete()) return;

        setLoading(true);

        const filledSlots = slots.filter(slot => slot.product);

        const aggregatedOfferItemsMap = new Map<string, ProductItemDetails>();

        filledSlots.forEach(slot => {
            if (slot.product) {
                const product = slot.product; 
                const productDetails: ProductItemDetails = {
                    id: product.id,
                    images: product.images || [],
                    product_name: product.product_name,
                    product_price: product.product_price,
                    strike_price: product.strike_price,
                    product_status: product.product_status,
                    product_code: product.product_code || '',
                    product_description: product.product_description || '',
                    quantity: 1, 
                    product_weight: product.product_weight || '',
                    product_box_weight: product.product_box_weight || '',
                    created_at: product.created_at || new Date().toISOString(),
                    updated_at: product.updated_at || new Date().toISOString(),
                    sub_category: product.sub_category || '',
                    isInStock: product.product_status && (product.quantity || 1) > 0,
                };

                if (aggregatedOfferItemsMap.has(productDetails.id)) {
                    const existingProduct = aggregatedOfferItemsMap.get(productDetails.id)!;
                    aggregatedOfferItemsMap.set(productDetails.id, {
                        ...existingProduct,
                        quantity: existingProduct.quantity + 1, 
                    });
                } else {
                    aggregatedOfferItemsMap.set(productDetails.id, productDetails);
                }
            }
        });

        const aggregatedOfferItems: ProductItemDetails[] = Array.from(aggregatedOfferItemsMap.values());

        // FIX: Generate a temporary ID for the offer set if it's not synced yet.
        // This temporary ID is crucial for the reducer to remove it locally if API call fails.
        const temporaryId = uuidv4(); 

        const offerSetPayload: CartOfferItem = {
            id: temporaryId, // FIX: Assign a temporary ID here. It will be replaced by backend ID after sync.
            offer: offerData.id,
            offer_name: { id: offerData.id, offer_name: offerData.offer_name },
            buy_count: offerData.buy_count,
            get_count: offerData.get_count,
            isSynced: isAuthenticated, // This will be true if user is logged in, false if guest
            type: 'offer',
            offer_items: aggregatedOfferItems, 
        };

        const productIdsForBackend = filledSlots.map(slot => slot.product!.id.replace(/-/g, ''));

        try {
            dispatchCart({ type: 'ADD_OFFER_SET', payload: offerSetPayload }); // Optimistic UI update

            if (isAuthenticated) {
                const response = await apiService.addToCartOffer({
                    offer_id: offerData.id.replace(/-/g, ''),
                    product_ids: productIdsForBackend, 
                });
                console.log(`Backend responded with ID: ${response.id}`);
                // No need to dispatch another SET_CART_ITEMS here.
                // The CartProvider's useEffect, triggered by isSynced: false,
                // will eventually call fetchCartFromBackend to reconcile.
            }
            onOpenCartDrawer(); 
        } catch (error) {
            console.error('Failed to add to cart:', error);
            // Revert optimistic update if API call fails
            // FIX: Pass the temporaryId for removal
            dispatchCart({ type: 'REMOVE_ITEM', payload: temporaryId }); 
            alert('Failed to add offer. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const filledSlots = slots.filter(slot => slot.product !== null);
    const totalRequiredItems = offerData.buy_count + offerData.get_count;
    const { payableTotal, savings, freeItems } = calculateTotals();

    return (
        <div className="w-1/3 bg-gray-50 rounded-lg p-6 h-fit sticky top-6">
            <h3 className="text-lg font-semibold mb-4">Your Offer Selection</h3>
            <div className="p-4 rounded-lg bg-gray-50">
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
                                        className="absolute -top-1 -right-1 cursor-pointer bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600 z-10"
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
                                            <p className="text-xs font-medium line-clamp-2">{slot.product.product_name}</p>
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
                <div className="pt-4">
                    <div className="space-y-2 text-sm mb-4">
                        {savings > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>You Save ({freeItems.length} free item{freeItems.length > 1 ? 's' : ''}):</span>
                                <span className="font-medium">₹{savings.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-semibold text-lg border-t border-gray-300 pt-2">
                            <span>Final Total:</span>
                            <span>₹{payableTotal.toLocaleString()}</span>
                        </div>
                    </div>
                    <button
                        className={`w-full mt-4 py-3 rounded-lg font-medium transition-colors ${
                            isOfferComplete()
                                ? 'bg-[#175e7a] cursor-pointer text-white hover:bg-[#0f4c67]'
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
    );
}