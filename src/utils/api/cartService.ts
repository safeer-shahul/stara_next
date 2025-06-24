'use client';
import { v4 as uuidv4, validate } from 'uuid';
import apiService from './apiService';
import { CartItemType, CartNormalItem, CartOfferItem, ProductItemDetails } from '@/context/cartContext';

interface BackendRawCartItem {
  id: string | null; // Null for unsynced local items initially
  quantity: number;
  product: string;
  offer: string | null;
  offer_products: Array<{
    id: number; // This might be an int ID from backend for offer_product relation
    product: string; // The product UUID within the offer
    quantity: number;
    cart_item: string; // The cart item UUID (parent of this offer_product entry)
  }>;
  created_at: string;
  updated_at: string;
}

interface OfferDetailsFromBackend {
  id: string;
  products: string[];
  created_at: string;
  updated_at: string;
  offer_name: string;
  buy_count: number;
  get_count: number;
  offer_image: string;
}

const _aggregateOfferProducts = (productsToAggregate: ProductItemDetails[]): ProductItemDetails[] => {
  const aggregatedMap = new Map<string, ProductItemDetails>();
  productsToAggregate.forEach(product => {
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
        quantity: product.quantity || 1, // Ensure quantity is at least 1 if not defined
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
      let rawCartDataFromSource: BackendRawCartItem[] = [];

      if (accessToken) {
        console.log("cartService: Fetching cart from backend for authenticated user.");
        const response = await apiService.getUserCart();
        console.log("cartService: Backend getUserCart response:", response);

        rawCartDataFromSource = Array.isArray(response?.items) ? response.items.map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
          product: item.product,
          offer: item.offer,
          offer_products: item.offer_products || [],
          created_at: item.created_at,
          updated_at: item.updated_at,
        })) : [];
        console.log("cartService: Raw cart data from backend for processing:", rawCartDataFromSource);
      } else {
        console.log("cartService: Loading cart from local storage for guest user for enrichment.");
        const storedItems = localStorage.getItem('cartItems');
        if (storedItems) {
          try {
            const parsedItems = JSON.parse(storedItems);
            // Filter to ensure only valid cart item types are processed
            rawCartDataFromSource = parsedItems.filter((item: any) =>
              typeof item === 'object' && item !== null && (item.type === 'normal' || item.type === 'offer')
            );
            console.log("cartService: Parsed raw cart data from local storage for enrichment:", rawCartDataFromSource);
          } catch (parseError) {
            console.error('cartService: Error parsing stored cart items from local storage:', parseError);
            localStorage.removeItem('cartItems'); // Clear corrupted data
            rawCartDataFromSource = [];
          }
        }
      }

      // Collect all unique product IDs from both normal and offer items for batch enrichment
      const allProductIds = new Set<string>();
      rawCartDataFromSource.forEach((item: any) => { // Use 'any' here as item might be raw local format
        if (item.type === 'normal' && item.product_id && validate(item.product_id)) { // For local normal items
          allProductIds.add(item.product_id.replace(/-/g, ''));
        } else if (item.product && validate(item.product)) { // For backend normal items
            allProductIds.add(item.product.replace(/-/g, ''));
        }
        if (Array.isArray(item.offer_items)) { // For local offer items
          item.offer_items.forEach((p: any) => {
            if (p.id && validate(p.id)) {
              allProductIds.add(p.id.replace(/-/g, ''));
            }
          });
        } else if (Array.isArray(item.offer_products)) { // For backend offer items
          item.offer_products.forEach((p: any) => {
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
          productsMap.set(p.id.replace(/-/g, ''), {
            id: p.id, images: p.images || [], product_code: p.product_code, product_name: p.product_name,
            product_description: p.product_description, product_price: p.product_price, strike_price: p.strike_price,
            quantity: p.quantity, product_weight: p.product_weight, product_box_weight: p.product_box_weight,
            product_status: p.product_status, created_at: p.created_at, updated_at: p.updated_at,
            sub_category: p.sub_category, isInStock: p.product_status && p.quantity > 0,
          });
        });
        console.log("cartService: Product details fetched and mapped. Map size:", productsMap.size);
      }

      console.log("cartService: Fetching valid offers.");
      const offersResponse = await apiService.getValidOffers();
      const validOffersMap = new Map<string, OfferDetailsFromBackend>(offersResponse.data.map((o: OfferDetailsFromBackend) => [o.id, o]));
      console.log("cartService: Valid offers fetched. Map size:", validOffersMap.size);

      const enrichedCartItems: CartItemType[] = rawCartDataFromSource.map((item: any) => { // Use 'any' here as item might be raw local or backend format
          const isOfferItem = item.offer !== null || item.type === 'offer'; // Check for backend offer or local offer type

          if (isOfferItem) {
              // Handle both backend offer items and local offer items
              const currentOfferId = item.offer || item.offer; // Use backend offer ID if available, else local offer ID
              const currentItemId = item.id || uuidv4(); // Use backend ID if available, else generate new UUID
              const currentIsSynced = accessToken !== null && item.id !== null && validate(item.id);

              const offerDetails = validOffersMap.get(currentOfferId);

              if (!offerDetails) {
                  console.warn(`cartService: Offer details not found for offer ID: ${currentOfferId}. Skipping offer item:`, item);
                  return null;
              }

              let productsForAggregation: ProductItemDetails[] = [];
              if (Array.isArray(item.offer_products)) { // Backend offer format
                  item.offer_products.forEach((op: any) => {
                      const offerProductDetail = productsMap.get(op.product.replace(/-/g, ''));
                      if (offerProductDetail) {
                          productsForAggregation.push({ ...offerProductDetail, quantity: op.quantity });
                      } else {
                          console.warn(`cartService: Product detail not found for nested offer_product ID: ${op.product} in backend offer item.`);
                      }
                  });
              } else if (Array.isArray(item.offer_items)) { // Local offer format
                  item.offer_items.forEach((p: ProductItemDetails) => {
                      const localOfferProductDetail = productsMap.get(p.id.replace(/-/g, ''));
                      if (localOfferProductDetail) {
                          productsForAggregation.push({ ...localOfferProductDetail, quantity: p.quantity });
                      } else {
                          console.warn(`cartService: Product detail not found for local offer_item ID: ${p.id}.`);
                      }
                  });
              }


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
              const currentItemId = item.id || uuidv4();
              const currentProductId = item.product || item.product_id; // Handle both backend 'product' and local 'product_id'
              const currentIsSynced = accessToken !== null && item.id !== null && validate(item.id);

              const productDetail = productsMap.get(currentProductId?.replace(/-/g, ''));

              if (productDetail && item.quantity !== undefined) {
                  console.log("cartService: Normal item enriched successfully, CartItemId:", currentItemId);
                  return {
                      id: currentItemId,
                      product_id: currentProductId,
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
              console.warn(`cartService: Product details missing or invalid for normal item ${currentProductId}. Skipping.`, item);
              return null;
          }
      }).filter(Boolean) as CartItemType[]; // Filter out any nulls from invalid items

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
          localStorage.removeItem('cartItems'); // Clear corrupted data
        }
      }
      console.log("cartService: Returning empty cart due to no valid data from backend or localStorage fallback.");
      return [];
    }
  },

  // This function is used by CartProvider to push local, unsynced items to backend
  pushLocalCartToBackend: async (localUnsyncedItems: CartItemType[]): Promise<CartItemType[]> => {
    console.log("cartService: Entering pushLocalCartToBackend. Items to push:", localUnsyncedItems);
    let success = true; // Track overall success of pushes

    for (const item of localUnsyncedItems) {
      // Only push if not already synced (this check might be redundant if filter already applied)
      // The CartProvider's merge logic is responsible for sending only truly local-only items.
      try {
        if (item.type === 'normal') {
          const normalItem = item as CartNormalItem;
          console.log(`cartService: Attempting to push normal item to backend: Product ID: ${normalItem.product_id}, Quantity: ${normalItem.quantity}`);
          // Send individual add calls for each quantity to match backend's increment logic
          for (let q = 0; q < normalItem.quantity; q++) {
            console.log(`cartService: Sending API call to add product ${normalItem.product_id} (unit ${q + 1}/${normalItem.quantity})`);
            await apiService.addToCart({ product_id: normalItem.product_id.replace(/-/g, ''), mode: '+' });
          }
          console.log(`cartService: Successfully pushed normal item ${normalItem.product_id} to backend.`);
        } else if (item.type === 'offer') {
          const offerItem = item as CartOfferItem;
          console.log(`cartService: Attempting to push offer item to backend: Offer ID: ${offerItem.offer}`);

          const productIdsForBackend: string[] = [];
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
        console.error(`cartService: Error pushing item to backend (ID: ${item.id}, Type: ${item.type}):`, error);
        success = false; // Mark overall push as failed if any item fails
      }
    }
    console.log("cartService: Finished iterating through local items to push to backend. Overall success:", success);

    // After attempting to push all local items, fetch the canonical state from the backend.
    // This function doesn't return the canonical cart, it's the responsibility of the calling context
    // (CartProvider) to then call fetchCartFromBackend()
    return localUnsyncedItems; // Return something, but its value isn't used by CartProvider's merge.
  },

  // Modified addToCart payload to accept item_id for deletion (used by customDispatch directly)
  addToCart: async (payload: { product_id?: string; mode: string; item_id?: string }) => {
    console.log("cartService: Calling apiService.addToCart with payload:", payload);
    const response = await apiService.addToCart(payload);
    console.log("cartService: apiService.addToCart response:", response);
    return response;
  },
};