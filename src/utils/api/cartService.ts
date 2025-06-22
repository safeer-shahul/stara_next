'use client';
import { v4 as uuidv4 } from 'uuid';
import apiService from './apiService';
// Ensure all necessary types are imported
import { CartItemType, CartNormalItem, CartOfferItem, ProductItemDetails, ProductImage } from '@/context/cartContext'; 

// --- Type Definitions (Refined) ---

// Raw cart item structure as received from your backend API
interface BackendRawCartItem {
  id: string; // Cart Item UUID
  quantity?: number; // Quantity in cart for normal items
  product?: string; // Product ID for normal items
  offer?: string; // Offer ID for offer items
  // This is the flat list of products and their quantities from the backend's perspective for an offer
  offer_products?: Array<{ product: string; quantity: number }>; 
  buy_count?: number;
  get_count?: number;
  type?: 'normal' | 'offer'; // Backend might implicitly determine type, or send it
  isSynced?: boolean; // Backend doesn't send this, but we add it during initial processing if from local storage
}

// Structure of offer details fetched from your /offers API
interface OfferDetailsFromBackend {
  id: string;
  products: string[]; // List of product UUIDs included in the offer (from backend's offer definition)
  created_at: string;
  updated_at: string;
  offer_name: string;
  buy_count: number;
  get_count: number;
  start_date: string;
  end_date: string;
  offer_image: string;
}

// --- Type Guards ---
// These help TypeScript understand the shape of an item, useful for narrowing types

function isBackendRawNormalItem(item: any): item is BackendRawCartItem & { product: string; quantity: number; type?: 'normal' } {
  return item && typeof item === 'object' && typeof item.id === 'string' && typeof item.product === 'string' && typeof item.quantity === 'number';
}

function isBackendRawOfferItem(item: any): item is BackendRawCartItem & { offer: string; offer_products: Array<{ product: string; quantity: number }>; buy_count: number; get_count: number; type?: 'offer' } {
  return item && typeof item === 'object' && typeof item.id === 'string' && typeof item.offer === 'string' &&
    Array.isArray(item.offer_products) && item.offer_products.every((p: any) => typeof p.product === 'string' && typeof p.quantity === 'number') &&
    typeof item.buy_count === 'number' && typeof item.get_count === 'number';
}

// Checks if an item is already in our desired CartOfferItem (structured) format
function isStructuredOfferItem(item: any): item is CartOfferItem {
  return item && typeof item === 'object' && item.type === 'offer' &&
    (typeof item.id === 'string' || item.id === null) && // Allow null ID for unsynced local items
    typeof item.offer === 'string' &&
    Array.isArray(item.offer_items) &&
    typeof item.buy_count === 'number' && typeof item.get_count === 'number';
}

/**
 * Aggregates and combines quantities of identical products within an offer set.
 * This is crucial for the new CartOfferItem.offer_items structure.
 * @param productsToAggregate An array of product details potentially with quantities > 1.
 * @returns An array of ProductItemDetails where identical products are merged and their quantities summed.
 */
const _aggregateOfferProducts = (productsToAggregate: ProductItemDetails[]): ProductItemDetails[] => {
  const aggregatedMap = new Map<string, ProductItemDetails>();

  productsToAggregate.forEach(product => {
    const cleanProductId = product.id.replace(/-/g, ''); // Ensure consistent key for map

    if (aggregatedMap.has(cleanProductId)) {
      // If product already in map, sum quantities
      const existingProduct = aggregatedMap.get(cleanProductId)!;
      aggregatedMap.set(cleanProductId, {
        ...existingProduct,
        quantity: existingProduct.quantity + (product.quantity || 1), // Sum quantities
      });
    } else {
      // If new product, add to map (ensure quantity is at least 1)
      aggregatedMap.set(cleanProductId, {
        ...product,
        quantity: product.quantity || 1, // Ensure quantity is at least 1
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
      let rawCartDataFromSource: unknown[] = []; // Raw data either from backend or local storage

      if (accessToken) {
        // Authenticated user: Fetch from backend
        console.log("cartService: Fetching cart from backend for authenticated user.");
        const response = await apiService.getUserCart();
        console.log("cartService: Backend getUserCart response:", response);
        rawCartDataFromSource = response?.items?.map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
          product: item.product,
          offer: item.offer,
          offer_products: item.offer_products,
          buy_count: item.buy_count,
          get_count: item.get_count,
          type: item.offer ? 'offer' : 'normal', // Determine type based on 'offer' field
          isSynced: true, // Items from backend are always synced
        })) || [];
        console.log("cartService: Raw cart data from backend for processing:", rawCartDataFromSource);
      } else {
        // Guest user: Load from local storage
        console.log("cartService: Loading cart from local storage for guest user.");
        const storedItems = localStorage.getItem('cartItems');
        if (storedItems) {
          try {
            rawCartDataFromSource = JSON.parse(storedItems);
            console.log("cartService: Raw stored items from localStorage:", rawCartDataFromSource);
            // Filter out any non-object or malformed items from local storage
            rawCartDataFromSource = rawCartDataFromSource.filter(item => 
                typeof item === 'object' && item !== null && (item as any).type
            );
            if (!Array.isArray(rawCartDataFromSource)) {
              console.warn('cartService: Local storage cart is not an array, resetting.');
              rawCartDataFromSource = [];
              localStorage.removeItem('cartItems');
            }
          } catch (parseError) {
            console.error('cartService: Error parsing stored cart items from local storage:', parseError);
            localStorage.removeItem('cartItems');
            rawCartDataFromSource = [];
          }
        }
      }

      // Collect all unique product IDs from all cart items (normal and offer)
      const allProductIds = new Set<string>();
      rawCartDataFromSource.forEach((item: unknown) => {
        if (typeof item !== 'object' || item === null) return;

        // Extract product IDs for normal items
        if ((item as {type?:string}).type === 'normal') {
          if (isBackendRawNormalItem(item)) {
            allProductIds.add(item.product.replace(/-/g, ''));
          } else if ((item as CartNormalItem).product_id) { 
            allProductIds.add((item as CartNormalItem).product_id.replace(/-/g, ''));
          }
        } 
        // Extract product IDs for offer items (from raw backend response or existing structured local storage)
        else if ((item as {type?:string}).type === 'offer') {
          if (isBackendRawOfferItem(item)) {
            // Include main product if available in raw form
            const rawOffer = item as BackendRawCartItem & { offer: string; offer_products: Array<{ product: string; quantity: number }>; buy_count: number; get_count: number; type?: 'offer' };
            if (rawOffer.product) { // This `product` field might come from backend's single product representation of an offer item
              allProductIds.add(rawOffer.product.replace(/-/g, ''));
            }
            rawOffer.offer_products.forEach(p => p.product && allProductIds.add(p.product.replace(/-/g, '')));
          } else if (isStructuredOfferItem(item)) {
            item.offer_items.forEach(p => p.id && allProductIds.add(p.id.replace(/-/g, '')));
          }
        }
      });

      console.log("cartService: All unique product IDs collected:", Array.from(allProductIds));

      // Fetch full product details for all unique product IDs
      const productIdsArray = Array.from(allProductIds);
      let productsMap = new Map<string, ProductItemDetails>();

      if (productIdsArray.length > 0) {
        console.log("cartService: Fetching product details for IDs:", productIdsArray);
        const productsResponse = await apiService.getPaginatedProducts(1, 100, productIdsArray); // Assuming 100 products is sufficient
        productsResponse.products.forEach((p: any) => {
          productsMap.set(p.id.replace(/-/g, ''), {
            id: p.id,
            images: p.images || [],
            product_code: p.product_code,
            product_name: p.product_name,
            product_description: p.product_description,
            product_price: p.product_price,
            strike_price: p.strike_price,
            quantity: p.quantity, // This is the STOCK QUANTITY from product details
            product_weight: p.product_weight,
            product_box_weight: p.product_box_weight,
            product_status: p.product_status,
            created_at: p.created_at,
            updated_at: p.updated_at,
            sub_category: p.sub_category,
            isInStock: p.product_status && p.quantity > 0,
          });
        });
        console.log("cartService: Product details fetched and mapped. Map size:", productsMap.size);
      }

      // Fetch all valid offers to enrich offer item names and rules
      console.log("cartService: Fetching valid offers.");
      const offersResponse = await apiService.getValidOffers();
      const validOffersMap = new Map<string, OfferDetailsFromBackend>(offersResponse.data.map((o: OfferDetailsFromBackend) => [o.id, o]));
      console.log("cartService: Valid offers fetched. Map size:", validOffersMap.size);


      // Enriche the raw cart items into the structured CartItemType format
      const enrichedCartItems: CartItemType[] = rawCartDataFromSource.map((item: unknown) => {
        if (typeof item !== 'object' || item === null) {
          console.warn(`cartService: Skipping malformed item (not object or null):`, item);
          return null; // Skip malformed items
        }

        // Process Normal Items
        if ((item as {type?:string}).type === 'normal') {
          console.log("cartService: Processing normal item:", item);
          const normalItemAsRaw = item as BackendRawCartItem & { type: 'normal'; product: string; quantity: number; };
          const normalItemAsStructured = item as CartNormalItem;

          const productIdToUse = isBackendRawNormalItem(item) ? normalItemAsRaw.product : normalItemAsStructured.product_id;
          const quantityInCart = isBackendRawNormalItem(item) ? normalItemAsRaw.quantity : normalItemAsStructured.quantity;
          const isSyncedStatus = isBackendRawNormalItem(item) ? normalItemAsRaw.isSynced : normalItemAsStructured.isSynced;
          const itemId = isBackendRawNormalItem(item) ? normalItemAsRaw.id : normalItemAsStructured.id;

          const productDetail = productsMap.get(productIdToUse.replace(/-/g, ''));

          if (productDetail && quantityInCart !== undefined) {
            console.log("cartService: Normal item enriched successfully.");
            return {
              id: itemId,
              product_id: productIdToUse,
              quantity: quantityInCart, // This is the cart quantity
              type: 'normal',
              isSynced: isSyncedStatus,
              product_name: productDetail.product_name,
              product_price: productDetail.product_price,
              strike_price: productDetail.strike_price,
              images: productDetail.images,
              isInStock: productDetail.isInStock,
              stock_quantity: productDetail.quantity, // Populate with actual stock quantity from product details
            } as CartNormalItem;
          }
          console.warn(`cartService: Product details missing or invalid for normal item ${productIdToUse}. Skipping.`, item);
          return null;
        } 
        // Process Offer Items
        else if ((item as {type?:string}).type === 'offer') {
          console.log("cartService: Processing offer item:", item);
          let currentOfferId: string | undefined | null;
          let currentBuyCount: number | undefined;
          let currentGetCount: number | undefined;
          let currentIsSynced: boolean | undefined;
          let currentItemId: string | null | undefined; 

          let productsForAggregation: ProductItemDetails[] = []; 

          const isRawOffer = isBackendRawOfferItem(item);
          const isStructured = isStructuredOfferItem(item);

          if (isRawOffer) {
            const backendRawOffer = item;
            currentOfferId = backendRawOffer.offer;
            currentBuyCount = backendRawOffer.buy_count;
            currentGetCount = backendRawOffer.get_count;
            currentIsSynced = backendRawOffer.isSynced;
            currentItemId = backendRawOffer.id; 

            const rawOfferProductsCombined: Array<{ product: string; quantity: number }> = [];
            if (backendRawOffer.product && backendRawOffer.quantity !== undefined) { 
              rawOfferProductsCombined.push({ product: backendRawOffer.product, quantity: backendRawOffer.quantity });
            }
            if (backendRawOffer.offer_products) { 
              rawOfferProductsCombined.push(...backendRawOffer.offer_products);
            }

            productsForAggregation = rawOfferProductsCombined
              .map(p => productsMap.get(p.product?.replace(/-/g, '')) ? { ...productsMap.get(p.product?.replace(/-/g, ''))!, quantity: p.quantity } : undefined)
              .filter(Boolean) as ProductItemDetails[];
            console.log("cartService: Raw offer products prepared for aggregation:", productsForAggregation);
            
          } else if (isStructured) {
            const structuredOffer = item;
            currentOfferId = structuredOffer.offer;
            currentBuyCount = structuredOffer.buy_count;
            currentGetCount = structuredOffer.get_count;
            currentIsSynced = structuredOffer.isSynced;
            currentItemId = structuredOffer.id; 

            productsForAggregation = (structuredOffer.offer_items || [])
              .map(p => {
                const productDetail = productsMap.get(p.id?.replace(/-/g, '') || ''); 
                return productDetail ? { ...productDetail, quantity: p.quantity } : p; 
              })
              .filter(Boolean) as ProductItemDetails[];
            console.log("cartService: Structured offer products prepared for aggregation:", productsForAggregation);
            
          } else {
            console.warn(`cartService: Malformed offer item skipped during enrichment:`, item);
            return null;
          }

          const offerDetails = currentOfferId ? validOffersMap.get(currentOfferId) : undefined;

          const aggregatedOfferItems = _aggregateOfferProducts(productsForAggregation);
          console.log("cartService: Aggregated offer items:", aggregatedOfferItems);


          if (currentItemId === undefined || currentOfferId === undefined || currentBuyCount === undefined || currentGetCount === undefined || currentIsSynced === undefined) {
            console.warn(`cartService: Essential data missing for offer item after initial parsing. Skipping:`, item);
            return null;
          }
          if (aggregatedOfferItems.length === 0) {
            console.warn(`cartService: No valid products found for offer item after aggregation. Skipping:`, item);
            return null; 
          }

          console.log("cartService: Offer item enriched successfully.");
          return {
            id: currentItemId, 
            offer: currentOfferId,
            offer_name: offerDetails ? { id: offerDetails.id, offer_name: offerDetails.offer_name } : { id: currentOfferId, offer_name: 'Special Offer' },
            buy_count: offerDetails ? offerDetails.buy_count : currentBuyCount, 
            get_count: offerDetails ? offerDetails.get_count : currentGetCount, 
            isSynced: currentIsSynced,
            type: 'offer',
            offer_items: aggregatedOfferItems, 
          } as CartOfferItem;
        }
        console.warn(`cartService: Item with unknown or invalid type skipped:`, item);
        return null;
      }).filter(Boolean) as CartItemType[]; 

      console.log("cartService: Final enriched cart items before saving to localStorage:", enrichedCartItems);
      localStorage.setItem('cartItems', JSON.stringify(enrichedCartItems));
      console.log("cartService: Enriched cart items saved to localStorage.");

      return enrichedCartItems;
    } catch (error) {
      console.error('cartService: Critical error in fetchCartFromBackend:', error);
      // Fallback: If fetching from backend fails, try to load existing structured data from localStorage
      const storedItems = localStorage.getItem('cartItems');
      if (storedItems) {
        try {
          console.log("cartService: Attempting fallback to localStorage due to critical error.");
          const parsedFallbackItems: unknown[] = JSON.parse(storedItems);
          // Return only valid CartItemType objects
          const validFallbackItems = parsedFallbackItems.filter(item =>
            typeof item === 'object' && item !== null &&
            ((item as {type?:string}).type === 'normal' || isStructuredOfferItem(item))
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

  // FIX: New function to push local unsynced cart items to the backend
  pushLocalCartToBackend: async (localUnsyncedItems: CartItemType[]): Promise<void> => {
    console.log("cartService: Entering pushLocalCartToBackend. Items to push:", localUnsyncedItems);

    for (const item of localUnsyncedItems) {
      if (item.isSynced === false && item.id === null) { // Only push items that are truly new locally
        try {
          if (item.type === 'normal') {
            const normalItem = item as CartNormalItem;
            console.log(`cartService: Pushing new normal item: Product ID: ${normalItem.product_id}, Quantity: ${normalItem.quantity}`);
            // Call addToCart for each unit to simulate adding the full quantity
            // Assuming apiService.addToCart handles adding one unit at a time with '+' mode
            for (let q = 0; q < normalItem.quantity; q++) {
              await apiService.addToCart({ product_id: normalItem.product_id.replace(/-/g, ''), mode: '+' });
            }
            console.log(`cartService: Successfully pushed normal item ${normalItem.product_id} to backend.`);
          } else if (item.type === 'offer') {
            const offerItem = item as CartOfferItem;
            console.log(`cartService: Pushing new offer item: Offer ID: ${offerItem.offer}`);

            const productIdsForBackend: string[] = [];
            offerItem.offer_items.forEach(p => {
              for (let q = 0; q < p.quantity; q++) {
                productIdsForBackend.push(p.id.replace(/-/g, ''));
              }
            });

            await apiService.addToCartOffer({
              offer_id: offerItem.offer.replace(/-/g, ''),
              product_ids: productIdsForBackend,
            });
            console.log(`cartService: Successfully pushed offer item ${offerItem.offer} to backend.`);
          }
        } catch (error) {
          console.error(`cartService: Error pushing item to backend (product_id/offer_id: ${item.type === 'normal' ? (item as CartNormalItem).product_id : (item as CartOfferItem).offer}):`, error);
          // Do not re-throw, continue with other items.
          // The next fetchCartFromBackend will reconcile the state.
        }
      }
    }
    console.log("cartService: Finished pushing all unsynced local items to backend.");
  },

  addToCart: async (payload: { product_id?: string; mode: string; item_id?: string }) => {
    console.log("cartService: Calling apiService.addToCart with payload:", payload);
    const response = await apiService.addToCart(payload);
    console.log("cartService: apiService.addToCart response:", response);
    return response;
  },
};