'use client';
import { v4 as uuidv4, validate } from 'uuid';
import apiService from './apiService';
import { CartItemType, CartNormalItem, CartOfferItem, ProductItemDetails, ProductImage } from '@/context/cartContext';

interface BackendRawCartItem {
    id: string | null;
    quantity: number; // Quantity of the main product in the cart item
    product: string; // UUID of the main product
    offer: string | null; // UUID of the offer, if applicable
    offer_products: Array<{ // Products included in the offer, usually the 'get' items or additional 'buy' items
        id: number; // This 'id' is likely a database ID for the offer_product entry, not a UUID
        product: string; // UUID of the product in the offer_products list
        quantity: number;
        cart_item: string; // UUID of the parent cart_item
    }>;
    created_at: string;
    updated_at: string;
}

interface OfferDetailsFromBackend {
    id: string;
    products: string[]; // List of product UUIDs that are part of this offer
    created_at: string;
    updated_at: string;
    offer_name: string;
    buy_count: number;
    get_count: number;
    offer_image: string;
}

// Type guard for the raw backend item structure for a normal product
function isBackendRawNormalItemStructure(item: any): item is BackendRawCartItem {
    return (
        item &&
        typeof item === 'object' &&
        (typeof item.id === 'string' || item.id === null) && // ID can be string or null for new local items
        typeof item.product === 'string' &&
        typeof item.quantity === 'number' &&
        (!item.offer || item.offer_products.length === 0) // No offer ID OR empty offer_products list
    );
}

// Type guard for the raw backend item structure for an offer product
function isBackendRawOfferItemStructure(item: any): item is BackendRawCartItem {
    return (
        item &&
        typeof item === 'object' &&
        (typeof item.id === 'string' || item.id === null) &&
        typeof item.offer === 'string' && // Has an offer ID
        Array.isArray(item.offer_products) && item.offer_products.length > 0 // Has a non-empty offer_products list
    );
}


const _aggregateOfferProducts = (productsToAggregate: ProductItemDetails[]): ProductItemDetails[] => {
    const aggregatedMap = new Map<string, ProductItemDetails>();
    productsToAggregate.forEach(product => {
        // Use the actual product ID for aggregation, not a cleaned version if it's already a UUID
        const productId = product.id;
        if (aggregatedMap.has(productId)) {
            const existingProduct = aggregatedMap.get(productId)!;
            aggregatedMap.set(productId, {
                ...existingProduct,
                quantity: existingProduct.quantity + (product.quantity || 1),
            });
        } else {
            aggregatedMap.set(productId, {
                ...product,
                quantity: product.quantity || 1,
            });
        }
    });
    return Array.from(aggregatedMap.values());
};


export const cartService = {
    fetchCartFromBackend: async (): Promise<CartItemType[]> => {
        console.log("cartService: Entering fetchCartFromBackend.");
        try {
            const accessToken = localStorage.getItem('accessToken');
            let rawCartDataFromSource: BackendRawCartItem[] = []; // Explicitly type this array

            if (accessToken) {
                console.log("cartService: Fetching cart from backend for authenticated user.");
                const response = await apiService.getUserCart();
                console.log("cartService: Backend getUserCart response:", response);

                // Ensure response.items is an array before mapping
                rawCartDataFromSource = Array.isArray(response?.items) ? response.items.map((item: any) => ({
                    id: item.id,
                    quantity: item.quantity,
                    product: item.product,
                    offer: item.offer,
                    offer_products: item.offer_products || [], // Ensure it's an array, even if empty
                    created_at: item.created_at,
                    updated_at: item.updated_at,
                })) : [];
                console.log("cartService: Raw cart data from backend for processing:", rawCartDataFromSource);
            } else {
                console.log("cartService: Loading cart from local storage for guest user.");
                const storedItems = localStorage.getItem('cartItems');
                if (storedItems) {
                    try {
                        const parsedItems = JSON.parse(storedItems);
                        // Filter for items that conform to the expected CartItemType structure
                        rawCartDataFromSource = parsedItems.filter((item: any) =>
                            typeof item === 'object' && item !== null && (item.type === 'normal' || item.type === 'offer')
                        );
                        console.log("cartService: Parsed raw cart data from local storage:", rawCartDataFromSource);
                    } catch (parseError) {
                        console.error('cartService: Error parsing stored cart items from local storage:', parseError);
                        localStorage.removeItem('cartItems');
                        rawCartDataFromSource = [];
                    }
                }
            }

            const allProductIds = new Set<string>();
            rawCartDataFromSource.forEach((item: BackendRawCartItem) => { // Iterate over BackendRawCartItem
                // Always add the main product ID
                if (item.product && validate(item.product)) {
                    allProductIds.add(item.product.replace(/-/g, ''));
                }
                // Add product IDs from offer_products
                if (Array.isArray(item.offer_products)) {
                    item.offer_products.forEach(p => {
                        if (p.product && validate(p.product)) {
                            allProductIds.add(p.product.replace(/-/g, ''));
                        }
                    });
                }
            });

            console.log("cartService: All unique product IDs collected for enrichment:", Array.from(allProductIds));

            const productIdsArray = Array.from(allProductIds);
            let productsMap = new Map<string, ProductItemDetails>();

            if (productIdsArray.length > 0) {
                console.log("cartService: Fetching product details for IDs:", productIdsArray);
                const productsResponse = await apiService.getPaginatedProducts(1, 100, productIdsArray);
                productsResponse.products.forEach((p: any) => {
                    productsMap.set(p.id.replace(/-/g, ''), { // Store using cleaned UUID as key
                        id: p.id, images: p.images || [], product_code: p.product_code, product_name: p.product_name,
                        product_description: p.product_description, product_price: p.product_price, strike_price: p.strike_price,
                        quantity: p.quantity, product_weight: p.product_weight, product_box_weight: p.product_box_weight,
                        product_status: p.product_status, created_at: p.created_at, updated_at: p.updated_at,
                        sub_category: p.sub_category, isInStock: p.product_status && p.quantity > 0,
                    });
                });
                console.log("cartService: Product details fetched and mapped. Map size:", productsMap.size);
                console.log("cartService: ProductsMap content (keys):", Array.from(productsMap.keys()));
            }

            console.log("cartService: Fetching valid offers.");
            const offersResponse = await apiService.getValidOffers();
            const validOffersMap = new Map<string, OfferDetailsFromBackend>(offersResponse.data.map((o: OfferDetailsFromBackend) => [o.id, o]));
            console.log("cartService: Valid offers fetched. Map size:", validOffersMap.size);

            const enrichedCartItems: CartItemType[] = rawCartDataFromSource.map((item: BackendRawCartItem) => {
                const isOfferItem = item.offer !== null && item.offer_products.length > 0;
                
                if (isOfferItem) {
                    console.log("cartService: Processing offer item based on offer_products and offer ID:", item);
                    const currentOfferId = item.offer!; // Assert non-null after check
                    const currentItemId = item.id || uuidv4(); // Use backend ID or generate temp for new local offer
                    const currentIsSynced = accessToken !== null; // True if authenticated, false if guest (new local item)

                    const offerDetails = validOffersMap.get(currentOfferId);

                    if (!offerDetails) {
                        console.warn(`cartService: Offer details not found for offer ID: ${currentOfferId}. Skipping offer item:`, item);
                        return null; // Skip if offer details can't be found
                    }

                    let productsForAggregation: ProductItemDetails[] = [];

                    // 1. Add the main product linked to the cart_item (the 'buy' product)
                    const mainProductDetail = productsMap.get(item.product.replace(/-/g, ''));
                    if (mainProductDetail) {
                        productsForAggregation.push({ ...mainProductDetail, quantity: item.quantity });
                    } else {
                        console.warn(`cartService: Product detail not found for main product ID: ${item.product} in offer item.`);
                    }

                    // 2. Add products from the nested 'offer_products' array (the 'get' products)
                    item.offer_products.forEach(op => {
                        const offerProductDetail = productsMap.get(op.product.replace(/-/g, ''));
                        if (offerProductDetail) {
                            productsForAggregation.push({ ...offerProductDetail, quantity: op.quantity });
                        } else {
                            console.warn(`cartService: Product detail not found for nested offer_product ID: ${op.product} in offer item.`);
                        }
                    });

                    const aggregatedOfferItems = _aggregateOfferProducts(productsForAggregation);
                    console.log("cartService: Aggregated offer items for CartOfferItem:", aggregatedOfferItems);

                    if (aggregatedOfferItems.length === 0) {
                        console.warn(`cartService: No valid products found for offer item after aggregation. Skipping:`, item);
                        return null;
                    }

                    console.log("cartService: Offer item enriched successfully, CartItemId:", currentItemId);

                    return {
                        id: currentItemId,
                        offer: currentOfferId,
                        offer_name: { id: offerDetails.id, offer_name: offerDetails.offer_name },
                        buy_count: offerDetails.buy_count,
                        get_count: offerDetails.get_count,
                        isSynced: currentIsSynced,
                        type: 'offer',
                        offer_items: aggregatedOfferItems,
                    } as CartOfferItem;

                } else { // It's a normal product
                    console.log("cartService: Processing normal item:", item);
                    const currentItemId = item.id || uuidv4(); // Use backend ID or generate temp for new local item
                    const currentIsSynced = accessToken !== null; // True if authenticated, false if guest (new local item)

                    const productDetail = productsMap.get(item.product.replace(/-/g, ''));

                    if (productDetail && item.quantity !== undefined) {
                        console.log("cartService: Normal item enriched successfully, CartItemId:", currentItemId);
                        return {
                            id: currentItemId,
                            product_id: item.product,
                            quantity: item.quantity,
                            type: 'normal',
                            isSynced: currentIsSynced,
                            product_name: productDetail.product_name,
                            product_price: productDetail.product_price,
                            strike_price: productDetail.strike_price,
                            images: productDetail.images,
                            isInStock: productDetail.isInStock,
                            stock_quantity: productDetail.quantity,
                        } as CartNormalItem;
                    }
                    console.warn(`cartService: Product details missing or invalid for normal item ${item.product}. Skipping.`, item);
                    return null;
                }
            }).filter(Boolean) as CartItemType[]; // Filter out any nulls

            if (!accessToken) {
                console.log("cartService: Saving fetched guest cart items to localStorage:", enrichedCartItems);
                localStorage.setItem('cartItems', JSON.stringify(enrichedCartItems));
            } else {
                console.log("cartService: Not saving to localStorage immediately for authenticated fetch. CartProvider handles reconciliation.");
            }

            return enrichedCartItems;
        } catch (error) {
            console.error('cartService: Critical error in fetchCartFromBackend:', error);
            const storedItems = localStorage.getItem('cartItems');
            if (storedItems) {
                try {
                    console.log("cartService: Attempting fallback to localStorage due to critical error.");
                    const parsedFallbackItems: unknown[] = JSON.parse(storedItems);
                    const validFallbackItems = parsedFallbackItems.filter(item =>
                        typeof item === 'object' && item !== null &&
                        ((item as any).type === 'normal' || (item as any).type === 'offer')
                    ) as CartItemType[];
                    console.log("cartService: Fallback to localStorage successful. Items:", validFallbackItems);
                    return validFallbackItems;
                } catch (parseError) {
                    console.error('cartService: Error parsing stored cart items during critical fallback:', parseError);
                    localStorage.removeItem('cartItems');
                }
            }
            console.log("cartService: Returning empty cart due to no valid data from backend or localStorage fallback.");
            return [];
        }
    },

    pushLocalCartToBackend: async (localUnsyncedItems: CartItemType[]): Promise<CartItemType[]> => {
        console.log("cartService: Entering pushLocalCartToBackend. Items to push:", localUnsyncedItems);
        let success = true;

        for (const item of localUnsyncedItems) {
            // Only push items that are NOT synced and have a valid (local temporary) ID
            // Backend should handle upserting based on product_id/offer_id and user session
            if (item.isSynced === false) { // Removed validate(item.id) because temporary IDs are always valid UUIDs
                try {
                    if (item.type === 'normal') {
                        const normalItem = item as CartNormalItem;
                        console.log(`cartService: Attempting to push normal item to backend: Product ID: ${normalItem.product_id}, Quantity: ${normalItem.quantity}`);
                        // When pushing a locally added item, we should send its full quantity.
                        // The backend 'add' endpoint likely increments.
                        // If it's a new item, we add. If it's an existing item with updated quantity, we might need a "set" quantity API or handle increments/decrements.
                        // Assuming addToCart with '+' mode means increment.
                        // For a local item with quantity N, we need to send N individual '+' calls or a single call with quantity: N.
                        // Given your current apiService.addToCart signature, sending multiple '+' is the way if quantity is > 1
                        for (let q = 0; q < normalItem.quantity; q++) {
                            console.log(`cartService: Sending API call to add product ${normalItem.product_id} (unit ${q + 1}/${normalItem.quantity})`);
                            await apiService.addToCart({ product_id: normalItem.product_id.replace(/-/g, ''), mode: '+' });
                        }
                        console.log(`cartService: Successfully pushed normal item ${normalItem.product_id} to backend.`);
                    } else if (item.type === 'offer') {
                        const offerItem = item as CartOfferItem;
                        console.log(`cartService: Attempting to push offer item to backend: Offer ID: ${offerItem.offer}`);

                        const productIdsForBackend: string[] = [];
                        // Iterate through the aggregated offer_items and collect product IDs based on their quantity
                        offerItem.offer_items.forEach(p => {
                            for (let q = 0; q < p.quantity; q++) {
                                productIdsForBackend.push(p.id.replace(/-/g, ''));
                            }
                        });

                        console.log(`cartService: Sending API call to add offer ${offerItem.offer} with products:`, productIdsForBackend);
                        await apiService.addToCartOffer({
                            offer_id: offerItem.offer.replace(/-/g, ''),
                            product_ids: productIdsForBackend,
                        });
                        console.log(`cartService: Successfully pushed offer item ${offerItem.offer} to backend.`);
                    }
                } catch (error) {
                    console.error(`cartService: Error pushing item to backend (product_id/offer_id: ${item.type === 'normal' ? (item as CartNormalItem).product_id : (item as CartOfferItem).offer}):`, error);
                    success = false;
                }
            } else {
                console.log(`cartService: Skipping push for item ${item.id} (already synced or invalid ID).`);
            }
        }
        console.log("cartService: Finished iterating through unsynced local items to push to backend. Overall success:", success);

        // After attempting to push, fetch the canonical cart state from the backend.
        // This will reconcile the cart, including items that were just pushed.
        console.log("cartService: Fetching canonical cart after push attempt.");
        const canonicalCart = await cartService.fetchCartFromBackend();
        return canonicalCart;
    },

    addToCart: async (payload: { product_id?: string; mode: string; item_id?: string }) => {
        console.log("cartService: Calling apiService.addToCart with payload:", payload);
        const response = await apiService.addToCart(payload);
        console.log("cartService: apiService.addToCart response:", response);
        return response;
    },
};