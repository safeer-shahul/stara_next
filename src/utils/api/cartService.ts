// src/utils/api/cartService.ts
import { v4 as uuidv4 } from 'uuid';
import apiService from './apiService';
// Ensure all necessary types are imported
import { CartItemType, CartNormalItem, CartOfferItem, ProductItemDetails, ProductImage } from '@/context/cartContext'; 

// --- Type Definitions (Refined) ---

interface BackendRawCartItem {
  id: string;
  quantity?: number; // Quantity in cart for normal items
  product?: string; // Product ID for normal items
  offer?: string; // Offer ID for offer items
  offer_products?: Array<{ product: string; quantity: number }>; // Flat list of product IDs in offer from backend
  buy_count?: number;
  get_count?: number;
  type: 'normal' | 'offer';
  isSynced: boolean;
}

interface OfferDetailsFromBackend {
  id: string;
  products: string[];
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

function isBackendRawNormalItem(item: any): item is BackendRawCartItem & { type: 'normal'; product: string; quantity: number } {
  return item && typeof item === 'object' && item.type === 'normal' &&
           typeof item.id === 'string' && typeof item.product === 'string' && typeof item.quantity === 'number';
}

function isBackendRawOfferItem(item: any): item is BackendRawCartItem & { type: 'offer'; offer: string; offer_products: Array<{ product: string; quantity: number }>; buy_count: number; get_count: number } {
  return item && typeof item === 'object' && item.type === 'offer' &&
           typeof item.id === 'string' && typeof item.offer === 'string' &&
           Array.isArray(item.offer_products) && item.offer_products.every((p: any) => typeof p.product === 'string' && typeof p.quantity === 'number') &&
           typeof item.buy_count === 'number' && typeof item.get_count === 'number';
}

function isStructuredOfferItem(item: any): item is CartOfferItem {
  return item && typeof item === 'object' && item.type === 'offer' &&
           typeof item.id === 'string' && typeof item.offer === 'string' &&
           typeof item.main_product === 'object' && item.main_product !== null && typeof item.main_product.id === 'string' &&
           Array.isArray(item.offer_products_extra) &&
           typeof item.buy_count === 'number' && typeof item.get_count === 'number';
}

export const cartService = {
  fetchCartFromBackend: async (): Promise<CartItemType[]> => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      let rawCartDataFromSource: unknown[] = [];

      if (accessToken) {
        const response = await apiService.getUserCart();
        rawCartDataFromSource = response?.items?.map((item: any) => ({
          id: item.id,
          quantity: item.quantity, // This is the quantity in cart
          product: item.product,
          offer: item.offer,
          offer_products: item.offer_products,
          buy_count: item.buy_count,
          get_count: item.get_count,
          type: item.offer ? 'offer' : 'normal',
          isSynced: true, // Items from backend are always synced
        })) || [];
      } else {
        const storedItems = localStorage.getItem('cartItems');
        if (storedItems) {
          try {
            rawCartDataFromSource = JSON.parse(storedItems);
            // Filter out any non-object or malformed items from local storage
            rawCartDataFromSource = rawCartDataFromSource.filter(item => 
                typeof item === 'object' && item !== null && (item as any).type
            );
            if (!Array.isArray(rawCartDataFromSource)) {
              console.warn('Local storage cart is not an array, resetting.');
              rawCartDataFromSource = [];
              localStorage.removeItem('cartItems');
            }
          } catch (parseError) {
            console.error('Error parsing stored cart items from local storage:', parseError);
            localStorage.removeItem('cartItems');
            rawCartDataFromSource = [];
          }
        }
      }

      const allProductIds = new Set<string>();
      rawCartDataFromSource.forEach((item: unknown) => {
        if (typeof item !== 'object' || item === null) return;

        if ((item as {type?:string}).type === 'normal') {
          if (isBackendRawNormalItem(item)) {
            allProductIds.add(item.product.replace(/-/g, ''));
          } else if ((item as CartNormalItem).product_id) { // For already structured items in local storage
            allProductIds.add((item as CartNormalItem).product_id.replace(/-/g, ''));
          }
        } else if ((item as {type?:string}).type === 'offer') {
          if (isBackendRawOfferItem(item)) {
            item.offer_products.forEach(p => p.product && allProductIds.add(p.product.replace(/-/g, '')));
          } else if (isStructuredOfferItem(item)) {
            allProductIds.add(item.main_product.id.replace(/-/g, ''));
            item.offer_products_extra.forEach(p => p.id && allProductIds.add(p.id.replace(/-/g, '')));
          }
        }
      });

      const productIdsArray = Array.from(allProductIds);
      let productsMap = new Map<string, ProductItemDetails>();

      if (productIdsArray.length > 0) {
        const productsResponse = await apiService.getPaginatedProducts(1, 100, productIdsArray);
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
      }

      const offersResponse = await apiService.getValidOffers();
      const validOffersMap = new Map<string, OfferDetailsFromBackend>(offersResponse.data.map((o: OfferDetailsFromBackend) => [o.id, o]));

      const enrichedCartItems: CartItemType[] = rawCartDataFromSource.map((item: unknown) => {
        if (typeof item !== 'object' || item === null) return null;

        if ((item as {type?:string}).type === 'normal') {
          // Handle both raw backend items and already structured local items
          const normalItemAsRaw = item as BackendRawCartItem & { type: 'normal'; product: string; quantity: number; };
          const normalItemAsStructured = item as CartNormalItem;

          const productIdToUse = isBackendRawNormalItem(item) ? normalItemAsRaw.product : normalItemAsStructured.product_id;
          const quantityInCart = isBackendRawNormalItem(item) ? normalItemAsRaw.quantity : normalItemAsStructured.quantity;
          const isSyncedStatus = isBackendRawNormalItem(item) ? normalItemAsRaw.isSynced : normalItemAsStructured.isSynced;
          const itemId = isBackendRawNormalItem(item) ? normalItemAsRaw.id : normalItemAsStructured.id;

          const productDetail = productsMap.get(productIdToUse.replace(/-/g, ''));

          if (productDetail && quantityInCart !== undefined) {
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
              stock_quantity: productDetail.quantity, // Populate with actual stock quantity
            } as CartNormalItem;
          }
          console.warn(`Product details missing or invalid for normal item ${productIdToUse}. Skipping.`, item);
          return null;
        } else if ((item as {type?:string}).type === 'offer') {
          let mainProductDetails: ProductItemDetails | undefined;
          let extraProductsDetails: ProductItemDetails[] = [];
          
          let currentOfferId: string | undefined;
          let currentBuyCount: number | undefined;
          let currentGetCount: number | undefined;
          let currentIsSynced: boolean | undefined;
          let currentItemId: string | undefined;

          const isRawOffer = isBackendRawOfferItem(item);
          const isStructured = isStructuredOfferItem(item);

          // Extract common fields regardless of raw or structured source
          if (isRawOffer) {
            const backendRawOffer = item;
            currentOfferId = backendRawOffer.offer;
            currentBuyCount = backendRawOffer.buy_count;
            currentGetCount = backendRawOffer.get_count;
            currentIsSynced = backendRawOffer.isSynced;
            currentItemId = backendRawOffer.id;

            const enrichedRawOfferProducts = (backendRawOffer.offer_products || [])
              .map(p => productsMap.get(p.product?.replace(/-/g, '')))
              .filter(Boolean) as ProductItemDetails[];

            if (enrichedRawOfferProducts.length > 0) {
              mainProductDetails = enrichedRawOfferProducts[0];
              extraProductsDetails = enrichedRawOfferProducts.slice(1);
            }
          } else if (isStructured) {
            const structuredOffer = item;
            currentOfferId = structuredOffer.offer;
            currentBuyCount = structuredOffer.buy_count;
            currentGetCount = structuredOffer.get_count;
            currentIsSynced = structuredOffer.isSynced;
            currentItemId = structuredOffer.id;

            // Try to get updated details from productsMap, fallback to stored if not found
            mainProductDetails = productsMap.get(structuredOffer.main_product.id.replace(/-/g, '')) || structuredOffer.main_product;
            extraProductsDetails = (structuredOffer.offer_products_extra || [])
              .map(p => productsMap.get(p.id.replace(/-/g, '')))
              .filter(Boolean) as ProductItemDetails[];
            // If any product details were not found in productsMap, use the existing ones
            // This is a trade-off: stale data vs. removing item. For offers, keep stale data for display.
            if (!mainProductDetails && structuredOffer.main_product) mainProductDetails = structuredOffer.main_product;
            structuredOffer.offer_products_extra.forEach(p => {
                if (!productsMap.has(p.id.replace(/-/g, ''))) {
                    // Only add if it's not already in extraProductsDetails from productsMap
                    if (!extraProductsDetails.find(ep => ep.id === p.id)) {
                        extraProductsDetails.push(p);
                    }
                }
            });

          } else {
              console.warn(`Malformed offer item skipped during enrichment:`, item);
              return null;
          }

          const offerDetails = currentOfferId ? validOffersMap.get(currentOfferId) : undefined;

          // Final validation for essential fields before constructing CartOfferItem
          if (!mainProductDetails || !currentItemId || !currentOfferId || currentBuyCount === undefined || currentGetCount === undefined || currentIsSynced === undefined) {
              console.warn(`Essential data missing for offer item:`, item);
              return null;
          }

          return {
            id: currentItemId,
            offer: currentOfferId,
            offer_name: offerDetails ? { id: offerDetails.id, offer_name: offerDetails.offer_name } : { id: currentOfferId, offer_name: 'Special Offer' },
            buy_count: offerDetails ? offerDetails.buy_count : currentBuyCount,
            get_count: offerDetails ? offerDetails.get_count : currentGetCount,
            isSynced: currentIsSynced,
            type: 'offer',
            main_product: mainProductDetails,
            offer_products_extra: extraProductsDetails,
          } as CartOfferItem;
        }
        console.warn(`Item with unknown or invalid type skipped:`, item);
        return null;
      }).filter(Boolean) as CartItemType[];

      localStorage.setItem('cartItems', JSON.stringify(enrichedCartItems));

      return enrichedCartItems;
    } catch (error) {
      console.error('Critical error in fetchCartFromBackend:', error);
      const storedItems = localStorage.getItem('cartItems');
      if (storedItems) {
        try {
          const parsedFallbackItems: unknown[] = JSON.parse(storedItems);
          return parsedFallbackItems.filter(item =>
            typeof item === 'object' && item !== null &&
            ((item as {type?:string}).type === 'normal' || (item as {type?:string}).type === 'offer')
          ) as CartItemType[];

        } catch (parseError) {
          console.error('Error parsing stored cart items during critical fallback:', parseError);
          localStorage.removeItem('cartItems');
        }
      }
      return [];
    }
  },

  syncGuestCart: async (currentCartItems: CartItemType[]): Promise<CartItemType[]> => {
    // This function will iterate through unsynced items and try to send them to the backend.
    // After attempting to sync all, it will trigger a full fetchCartFromBackend to get the latest server state.
    const itemsToSync = currentCartItems.filter(item => !item.isSynced);
    
    for (const item of itemsToSync) {
      try {
        if (item.type === 'offer') {
          const offerItem = item as CartOfferItem;

          const productIdsForBackend: string[] = [];
          if (offerItem.main_product) {
            productIdsForBackend.push(offerItem.main_product.id.replace(/-/g, ''));
          }
          if (offerItem.offer_products_extra) {
            offerItem.offer_products_extra.forEach(p => productIdsForBackend.push(p.id.replace(/-/g, '')));
          }

          const response = await apiService.addToCartOffer({
            offer_id: offerItem.offer.replace(/-/g, ''),
            product_ids: productIdsForBackend,
          });
          console.log(`Synced offer item ${offerItem.id} to backend with new ID: ${response.id}`);
          // The next fetchCartFromBackend will pick up the new ID and synced status.
        } else if (item.type === 'normal') {
          const normalItem = item as CartNormalItem;
          // For normal items, we need to add the correct quantity if it's new,
          // or rely on a simple '+' mode if it's just adding to existing quantity.
          // Since it's `isSynced: false`, it means this specific item instance
          // was added client-side. We should add it with its current quantity.
          // Your current API only supports '+' or '-' or 'delete'.
          // To ensure correct quantity on sync, you might need a 'set_quantity' mode.
          // For now, assuming addToCart with '+' is a one-off add for new items.
          // If a product already exists in the backend cart, this might increase its quantity by 1.
          // A more robust sync would handle full state reconciliation.
          await apiService.addToCart({ product_id: normalItem.product_id.replace(/-/g, ''), mode: '+' });
          console.log(`Synced normal item ${normalItem.id} to backend.`);
        }
      } catch (error) {
        console.error(`Error syncing item ${item.id}:`, error);
        // Mark as not synced or handle specific errors. For now, it remains !isSynced.
      }
    }
    // After trying to sync all unsynced items, re-fetch the entire cart state from the backend
    // to get the most accurate and server-confirmed representation.
    return await cartService.fetchCartFromBackend();
  },

  addToCart: async (productId: string, mode: string) => {
    await apiService.addToCart({ product_id: productId.replace(/-/g, ''), mode });
  },
};