'use client';
import { validate } from 'uuid';
import apiService from './apiService';
import { CartItemType, CartNormalItem, CartOfferItem, ProductItemDetails, ProductVariant } from '@/context/cartContext';

// --- Backend Raw Response Item Interfaces ---
interface BackendRawNormalCartItem {
  id: string;
  quantity: number;
  product: string;
  offer: null;
  variant: ProductVariant | string | null;
  created_at: string;
  updated_at: string;
  cart: string;
}

interface BackendRawOfferProductDetail {
  id: number;
  product: string;
  quantity: number;
  product_variant: string | null;
  created_at: string;
  updated_at: string;
  cart_item: string;
}

interface BackendRawOfferCartItem {
  id: string;
  offer: string;
  buy_products: BackendRawOfferProductDetail[];
  get_products: BackendRawOfferProductDetail[];
  created_at: string;
  updated_at: string;
  cart: string;
  offer_buy_products: string[];
  offer_get_products: string[];
}

type BackendCombinedRawItem = BackendRawNormalCartItem | BackendRawOfferCartItem;

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

// Helper to determine paid/free items for guest users based on price
const _assignPaidFreeForGuestOffer = (
  offerProducts: (ProductItemDetails & { quantity: number; selectedVariant?: ProductVariant })[],
  buyCount: number,
  getCount: number
): (ProductItemDetails & { quantity: number; selectedVariant?: ProductVariant; isPaid?: boolean })[] => {
  console.log('💸 cartService: Assigning paid/free for guest offer:', { buyCount, getCount, totalProducts: offerProducts.length });
  
  // Create individual product units for sorting
  const individualProducts: (ProductItemDetails & { quantity: number; selectedVariant?: ProductVariant; originalIndex: number })[] = [];
  
  offerProducts.forEach((product, originalIndex) => {
    for (let i = 0; i < product.quantity; i++) {
      individualProducts.push({
        ...product,
        quantity: 1,
        originalIndex
      });
    }
  });
  
  // Sort by price (highest to lowest)
  const sortedProducts = individualProducts.sort((a, b) => {
    const priceA = parseFloat(a.product_price || '0');
    const priceB = parseFloat(b.product_price || '0');
    return priceB - priceA; // Descending order
  });
  
  console.log('📊 cartService: Sorted products by price:', sortedProducts.map(p => ({
    name: p.product_name,
    price: p.product_price
  })));
  
  // Assign paid/free status
  const processedProducts: (ProductItemDetails & { quantity: number; selectedVariant?: ProductVariant; isPaid?: boolean })[] = [];
  
  sortedProducts.forEach((product, index) => {
    const isPaid = index < buyCount; // First buyCount items are paid
    processedProducts.push({
      ...product,
      isPaid
    });
  });
  
  // Aggregate back to original structure
  const aggregatedMap = new Map<string, (ProductItemDetails & { quantity: number; selectedVariant?: ProductVariant; isPaid?: boolean })>();
  
  processedProducts.forEach(product => {
    const productId = product.id.replace(/-/g, '');
    const variantId = product.selectedVariant?.id?.replace(/-/g, '');
    const isPaidStatus = product.isPaid ? 'paid' : 'free';
    const key = variantId ? `${productId}-${variantId}-${isPaidStatus}` : `${productId}-${isPaidStatus}`;

    if (aggregatedMap.has(key)) {
      const existingProduct = aggregatedMap.get(key)!;
      aggregatedMap.set(key, {
        ...existingProduct,
        quantity: existingProduct.quantity + 1,
      });
    } else {
      aggregatedMap.set(key, {
        ...product,
        quantity: 1,
      });
    }
  });
  
  const result = Array.from(aggregatedMap.values());
  console.log('✅ cartService: Guest offer assignment result:', result.map(p => ({
    name: p.product_name,
    quantity: p.quantity,
    isPaid: p.isPaid
  })));
  
  return result;
};

const _aggregateProductsWithinOffer = (productsToAggregate: (ProductItemDetails & { 
  quantity: number; 
  selectedVariant?: ProductVariant;
  isPaid?: boolean;
})[]): (ProductItemDetails & { 
  quantity: number; 
  selectedVariant?: ProductVariant;
  isPaid?: boolean;
})[] => {
  const aggregatedMap = new Map<string, (ProductItemDetails & { 
    quantity: number; 
    selectedVariant?: ProductVariant;
    isPaid?: boolean;
  })>();

  productsToAggregate.forEach(product => {
    const productId = product.id.replace(/-/g, '');
    const variantId = product.selectedVariant?.id?.replace(/-/g, '');
    const isPaidStatus = product.isPaid ? 'paid' : 'free';
    // Include isPaid status in key to prevent merging paid and free items
    const key = variantId ? `${productId}-${variantId}-${isPaidStatus}` : `${productId}-${isPaidStatus}`;

    if (aggregatedMap.has(key)) {
      const existingProduct = aggregatedMap.get(key)!;
      aggregatedMap.set(key, {
        ...existingProduct,
        quantity: existingProduct.quantity + (product.quantity || 1),
      });
    } else {
      aggregatedMap.set(key, {
        ...product,
        quantity: product.quantity || 1,
      });
    }
  });
  return Array.from(aggregatedMap.values());
};

export const cartService = {
  fetchCartFromBackend: async (): Promise<CartItemType[]> => {
    console.log("🔄 cartService: Entering fetchCartFromBackend");
    
    try {
      const accessToken = localStorage.getItem('accessToken');
      let rawCartDataFromSource: BackendCombinedRawItem[] = [];

      if (accessToken) {
        console.log("🔑 cartService: Fetching cart from backend for authenticated user");
        const backendCartResponse = await apiService.getUserCart();
        console.log("📦 cartService: Backend getUserCart response:", backendCartResponse);

        // Safely extract cart items
        const normalItems = backendCartResponse?.shopping_cart?.items || [];
        const offerItems = backendCartResponse?.offer_cart?.items || [];

        rawCartDataFromSource = [...normalItems, ...offerItems];
        console.log("📋 cartService: Raw cart data combined:", rawCartDataFromSource.length, "items");
        console.log("🛍️ cartService: Normal items:", normalItems.length, "🎁 Offer items:", offerItems.length);
      } else {
        console.log("👤 cartService: Loading cart from localStorage for guest user");
        const storedItems = localStorage.getItem('cartItems');
        if (storedItems) {
          try {
            const parsedItems = JSON.parse(storedItems);
            // For guest users, process offer items to assign paid/free status
            const processedItems = await Promise.all(parsedItems.filter((item: any) => 
              typeof item === 'object' && 
              item !== null && 
              item.type && 
              (item.type === 'normal' || item.type === 'offer')
            ).map(async (item: any) => {
              if (item.type === 'offer' && (!item.isSynced || item.isSynced === false)) {
                console.log('🎁 cartService: Processing guest offer item for paid/free assignment:', item.offer_name?.offer_name);
                
                try {
                  // Fetch valid offers to get buy/get counts
                  const offersResponse = await apiService.getValidOffers();
                  const validOffer = offersResponse.data.find((o: any) => 
                    o.id.replace(/-/g, '') === item.offer.replace(/-/g, '')
                  );
                  
                  if (validOffer) {
                    console.log('✅ cartService: Found valid offer:', {
                      offerName: validOffer.offer_name,
                      buyCount: validOffer.buy_count,
                      getCount: validOffer.get_count
                    });
                    
                    // Remove isPaid from existing offer_items and reassign based on price
                    const offerProductsWithoutPaidStatus = item.offer_items.map((p: any) => {
                      const cleanProduct = { ...p };
                      delete cleanProduct.isPaid; // Remove existing isPaid status
                      return cleanProduct;
                    });
                    
                    console.log('📊 cartService: Products before paid/free assignment:', 
                      offerProductsWithoutPaidStatus.map((p: any) => ({
                        name: p.product_name,
                        price: p.product_price,
                        quantity: p.quantity
                      }))
                    );
                    
                    const updatedOfferItems = _assignPaidFreeForGuestOffer(
                      offerProductsWithoutPaidStatus,
                      validOffer.buy_count,
                      validOffer.get_count
                    );
                    
                    console.log('✅ cartService: Products after paid/free assignment:', 
                      updatedOfferItems.map((p: any) => ({
                        name: p.product_name,
                        price: p.product_price,
                        quantity: p.quantity,
                        isPaid: p.isPaid
                      }))
                    );
                    
                    return {
                      ...item,
                      offer_items: updatedOfferItems,
                      buy_count: validOffer.buy_count,
                      get_count: validOffer.get_count,
                      isSynced: false // Mark as not synced since this is guest processing
                    };
                  } else {
                    console.warn('⚠️ cartService: Valid offer not found for guest offer:', item.offer);
                  }
                } catch (error) {
                  console.error('❌ cartService: Error processing guest offer:', error);
                }
              }
              return item;
            }));
            
            return processedItems;
          } catch (parseError) {
            console.error('❌ cartService: Error parsing localStorage items:', parseError);
            localStorage.removeItem('cartItems');
            return [];
          }
        }
        return [];
      }

      // --- Data Enrichment Step ---
      const allProductUUIDs = new Set<string>();
      const allVariantUUIDs = new Set<string>();
      const allOfferUUIDs = new Set<string>();

      rawCartDataFromSource.forEach((item) => {
        if ('product' in item && item.product && validate(item.product)) {
          allProductUUIDs.add(item.product.replace(/-/g, ''));
          
          if ('variant' in item && item.variant) {
            if (typeof item.variant === 'object' && item.variant.id) {
              allVariantUUIDs.add(item.variant.id.replace(/-/g, ''));
            } else if (typeof item.variant === 'string' && validate(item.variant)) {
              allVariantUUIDs.add(item.variant.replace(/-/g, ''));
            }
          }
        }
        
        if ('buy_products' in item && Array.isArray(item.buy_products)) {
          // Add offer ID to fetch offer details
          if (item.offer && validate(item.offer)) {
            allOfferUUIDs.add(item.offer.replace(/-/g, ''));
          }
          
          [...item.buy_products, ...item.get_products].forEach(op => {
            if (op.product && validate(op.product)) {
              allProductUUIDs.add(op.product.replace(/-/g, ''));
            }
            if (op.product_variant && validate(op.product_variant)) {
              allVariantUUIDs.add(op.product_variant.replace(/-/g, ''));
            }
          });
        }
      });

      console.log("🔍 cartService: Collecting product details for", allProductUUIDs.size, "products");

      // Fetch product details
      const productIdsArray = Array.from(allProductUUIDs);
      let productsMap = new Map<string, ProductItemDetails>();

      if (productIdsArray.length > 0) {
        const productsResponse = await apiService.getPaginatedProducts(1, 100, undefined, productIdsArray);
        productsResponse.products.forEach((p: any) => {
          productsMap.set(p.id.replace(/-/g, ''), {
            id: p.id,
            images: p.images || [],
            product_code: p.product_code,
            product_name: p.product_name,
            product_description: p.product_description,
            product_price: p.product_price,
            strike_price: p.strike_price,
            quantity: p.quantity,
            product_weight: p.product_weight,
            product_box_weight: p.product_box_weight,
            product_status: p.product_status,
            created_at: p.created_at,
            updated_at: p.updated_at,
            sub_category: p.sub_category,
            isInStock: p.product_status && p.quantity > 0,
            have_variants: p.have_variants || false,
            product_variant: p.product_variant || [],
          });
        });
        console.log("✅ cartService: Product details fetched for", productsMap.size, "products");
      }

      // Fetch valid offers
      const offersResponse = await apiService.getValidOffers();
      const validOffersMap = new Map<string, OfferDetailsFromBackend>(
        offersResponse.data.map((o: OfferDetailsFromBackend) => [o.id.replace(/-/g, ''), o])
      );
      console.log("🎁 cartService: Valid offers fetched:", validOffersMap.size);

      // --- Map Raw Data to Frontend CartItemType ---
      const enrichedCartItems: CartItemType[] = rawCartDataFromSource
        .filter((item: BackendCombinedRawItem) => {
          // Pre-filter out items with invalid data
          if ('buy_products' in item && item.buy_products !== undefined) {
            // For offer items, ensure offer field exists and is valid
            return item.offer && validate(item.offer);
          }
          if ('product' in item) {
            // For normal items, ensure product field exists and is valid
            return item.product && validate(item.product);
          }
          return false;
        })
        .map((item: BackendCombinedRawItem) => {
          if ('buy_products' in item && item.buy_products !== undefined) {
            // Process offer item - EACH OFFER ITEM IS SEPARATE
            const offerItem = item as BackendRawOfferCartItem;
            console.log("🎁 cartService: Processing offer item:", offerItem.id, "with offer:", offerItem.offer);
            
            const offerDetails = validOffersMap.get(offerItem.offer.replace(/-/g, ''));
            if (!offerDetails) {
              console.warn(`⚠️ cartService: Offer details not found for offer ID: ${offerItem.offer}`);
              return null;
            }

            let productsInOfferBundle: (ProductItemDetails & { 
              quantity: number; 
              selectedVariant?: ProductVariant;
              isPaid?: boolean;
            })[] = [];

            // Process buy_products (paid items)
            offerItem.buy_products.forEach((op: BackendRawOfferProductDetail) => {
              const productDetail = productsMap.get(op.product.replace(/-/g, ''));
              if (productDetail && op.quantity !== undefined) {
                let selectedVariantDetail: ProductVariant | undefined;
                if (op.product_variant && productDetail.have_variants && productDetail.product_variant) {
                  const normalizedOpVariantId = op.product_variant.replace(/-/g, '');
                  selectedVariantDetail = productDetail.product_variant.find(
                    v => v.id.replace(/-/g, '') === normalizedOpVariantId
                  );
                }

                productsInOfferBundle.push({
                  ...productDetail,
                  quantity: op.quantity,
                  isPaid: true, // Buy products are paid
                  ...(selectedVariantDetail && { selectedVariant: selectedVariantDetail }),
                });
              }
            });

            // Process get_products (free items)
            offerItem.get_products.forEach((op: BackendRawOfferProductDetail) => {
              const productDetail = productsMap.get(op.product.replace(/-/g, ''));
              if (productDetail && op.quantity !== undefined) {
                let selectedVariantDetail: ProductVariant | undefined;
                if (op.product_variant && productDetail.have_variants && productDetail.product_variant) {
                  const normalizedOpVariantId = op.product_variant.replace(/-/g, '');
                  selectedVariantDetail = productDetail.product_variant.find(
                    v => v.id.replace(/-/g, '') === normalizedOpVariantId
                  );
                }

                productsInOfferBundle.push({
                  ...productDetail,
                  quantity: op.quantity,
                  isPaid: false, // Get products are free
                  ...(selectedVariantDetail && { selectedVariant: selectedVariantDetail }),
                });
              }
            });

            // Aggregate products ONLY within this single offer item
            const aggregatedOfferItems = _aggregateProductsWithinOffer(productsInOfferBundle);
            
            if (aggregatedOfferItems.length === 0) {
              console.warn(`⚠️ cartService: No valid products found for offer item after aggregation`);
              return null;
            }

            console.log(`✅ cartService: Created offer item with ${aggregatedOfferItems.length} aggregated products`);

            return {
              id: offerItem.id,
              offer: offerItem.offer,
              offer_name: { id: offerDetails.id, offer_name: offerDetails.offer_name },
              buy_count: offerDetails.buy_count,
              get_count: offerDetails.get_count,
              isSynced: accessToken !== null && validate(offerItem.id),
              type: 'offer',
              offer_items: aggregatedOfferItems,
              created_at: offerItem.created_at,
              updated_at: offerItem.updated_at,
            } as CartOfferItem;

          } else {
            // Process normal item
            const normalItem = item as BackendRawNormalCartItem;
            console.log("🛍️ cartService: Processing normal item:", normalItem.id);
            
            const productDetail = productsMap.get(normalItem.product?.replace(/-/g, ''));

            if (productDetail && normalItem.quantity !== undefined) {
              let selectedVariantDetail: ProductVariant | undefined;
              let actualStockQuantityForCartItem = productDetail.quantity;

              if (normalItem.variant && typeof normalItem.variant === 'object' && normalItem.variant.id) {
                selectedVariantDetail = normalItem.variant;
                actualStockQuantityForCartItem = normalItem.variant.quantity;
              } else if (normalItem.variant && typeof normalItem.variant === 'string' && validate(normalItem.variant) && productDetail.have_variants) {
                const normalizedVariantId = normalItem.variant.replace(/-/g, '');
                selectedVariantDetail = productDetail.product_variant.find(
                  v => v.id.replace(/-/g, '') === normalizedVariantId
                );
                if (selectedVariantDetail) {
                  actualStockQuantityForCartItem = selectedVariantDetail.quantity;
                }
              }

              return {
                id: normalItem.id,
                product_id: normalItem.product,
                quantity: normalItem.quantity,
                type: 'normal',
                isSynced: accessToken !== null && validate(normalItem.id),
                product_name: productDetail.product_name,
                product_price: productDetail.product_price,
                strike_price: productDetail.strike_price,
                images: productDetail.images,
                isInStock: productDetail.product_status && actualStockQuantityForCartItem > 0,
                stock_quantity: actualStockQuantityForCartItem,
                ...(selectedVariantDetail && { selectedVariant: selectedVariantDetail }),
                productDetails: productDetail,
                created_at: normalItem.created_at,
                updated_at: normalItem.updated_at,
              } as CartNormalItem;
            }
            console.warn(`⚠️ cartService: Product details missing for normal item ${normalItem.product}`);
            return null;
          }
        })
        .filter((item): item is CartItemType => item !== null) as CartItemType[];

      console.log("✅ cartService: Final enriched cart items:", enrichedCartItems.length);
      console.log("🛍️ cartService: Normal items:", enrichedCartItems.filter(i => i.type === 'normal').length);
      console.log("🎁 cartService: Offer items:", enrichedCartItems.filter(i => i.type === 'offer').length);
      
      return enrichedCartItems;

    } catch (error) {
      console.error('❌ cartService: Critical error in fetchCartFromBackend:', error);
      
      // Fallback to localStorage
      const storedItems = localStorage.getItem('cartItems');
      if (storedItems) {
        try {
          const parsedFallbackItems: unknown[] = JSON.parse(storedItems);
          const validFallbackItems = parsedFallbackItems.filter(item =>
            typeof item === 'object' && item !== null &&
            ('type' in item && ((item as any).type === 'normal' || (item as any).type === 'offer'))
          ) as CartItemType[];
          console.log("📦 cartService: Fallback to localStorage successful. Items:", validFallbackItems.length);
          return validFallbackItems;
        } catch (parseError) {
          console.error('❌ cartService: Error parsing stored cart items during fallback:', parseError);
          localStorage.removeItem('cartItems');
        }
      }
      
      console.log("🏁 cartService: Returning empty cart due to errors");
      return [];
    }
  },

  // Force refresh cart from backend (call this after add/remove operations)
  refreshCartFromBackend: async (): Promise<CartItemType[]> => {
    console.log("🔄 cartService: Force refreshing cart from backend");
    return await cartService.fetchCartFromBackend();
  },

  pushLocalCartToBackend: async (localUnsyncedItems: CartItemType[]): Promise<void> => {
    console.log("📤 cartService: Pushing", localUnsyncedItems.length, "unsynced items to backend");
    
    for (const item of localUnsyncedItems) {
      try {
        if (item.type === 'normal') {
          const normalItem = item as CartNormalItem;
          console.log(`➕ cartService: Pushing normal item: ${normalItem.product_name} x${normalItem.quantity}`);
          
          // Add item quantity times to backend
          for (let q = 0; q < normalItem.quantity; q++) {
            await apiService.addToCart({
              product_id: normalItem.product_id.replace(/-/g, ''),
              mode: '+',
              ...(normalItem.selectedVariant && { 
                variant_id: normalItem.selectedVariant.id.replace(/-/g, '') 
              })
            });
          }
          console.log(`✅ cartService: Successfully pushed normal item ${normalItem.product_name}`);
          
        } else if (item.type === 'offer') {
          const offerItem = item as CartOfferItem;
          console.log(`🎁 cartService: Pushing offer item: ${offerItem.offer_name.offer_name}`);

          const productsPayloadForBackend: { product_id: string; variant_id?: string }[] = [];

          offerItem.offer_items.forEach(p => {
            const productIdClean = p.id.replace(/-/g, '');
            const variantIdClean = p.selectedVariant?.id?.replace(/-/g, '');

            for (let q = 0; q < p.quantity; q++) {
              productsPayloadForBackend.push({
                product_id: productIdClean,
                ...(variantIdClean && { variant_id: variantIdClean })
              });
            }
          });

          await apiService.addToCartOffer({
            offer_id: offerItem.offer.replace(/-/g, ''),
            products: productsPayloadForBackend,
          });
          console.log(`✅ cartService: Successfully pushed offer item ${offerItem.offer_name.offer_name}`);
        }
      } catch (error) {
        console.error(`❌ cartService: Error pushing item to backend (ID: ${item.id}, Type: ${item.type}):`, error);
      }
    }
    console.log("🏁 cartService: Finished pushing local items to backend");
  },

  // Method specifically for processing guest offers
  processGuestOffers: async (cartItems: CartItemType[]): Promise<CartItemType[]> => {
    console.log("🎁 cartService: Processing guest offers for paid/free assignment");
    
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      console.log("🔑 cartService: User is authenticated, skipping guest offer processing");
      return cartItems;
    }
    
    try {
      // Fetch valid offers once
      const offersResponse = await apiService.getValidOffers();
      
      const processedItems = await Promise.all(cartItems.map(async (item) => {
        if (item.type === 'offer' && !item.isSynced) {
          console.log('🎁 cartService: Processing guest offer for paid/free:', item.offer_name?.offer_name);
          
          const validOffer = offersResponse.data.find((o: any) => 
            o.id.replace(/-/g, '') === item.offer.replace(/-/g, '')
          );
          
          if (validOffer) {
            console.log('✅ cartService: Found valid offer with counts:', {
              buyCount: validOffer.buy_count,
              getCount: validOffer.get_count
            });
            
            // Remove isPaid from existing offer_items
            const offerProductsWithoutPaidStatus = item.offer_items.map((p: any) => {
              const cleanProduct = { ...p };
              delete cleanProduct.isPaid;
              return cleanProduct;
            });
            
            console.log('📊 cartService: Products before assignment:', 
              offerProductsWithoutPaidStatus.map((p: any) => ({
                name: p.product_name,
                price: p.product_price,
                quantity: p.quantity
              }))
            );
            
            const updatedOfferItems = _assignPaidFreeForGuestOffer(
              offerProductsWithoutPaidStatus,
              validOffer.buy_count,
              validOffer.get_count
            );
            
            console.log('✅ cartService: Products after assignment:', 
              updatedOfferItems.map((p: any) => ({
                name: p.product_name,
                isPaid: p.isPaid,
                quantity: p.quantity
              }))
            );
            
            return {
              ...item,
              offer_items: updatedOfferItems,
              buy_count: validOffer.buy_count,
              get_count: validOffer.get_count,
            } as CartOfferItem;
          }
        }
        return item;
      }));
      
      return processedItems;
    } catch (error) {
      console.error('❌ cartService: Error processing guest offers:', error);
      return cartItems;
    }
  },

  // FIXED: Enhanced addToCart method that returns the response properly
  addToCart: async (payload: { product_id?: string; mode: string; item_id?: string; variant_id?: string; is_cart?: string; is_offer?: string }) => {
    console.log("📤 cartService: Calling apiService.addToCart with payload:", payload);
    
    try {
      const response = await apiService.addToCart(payload);
      console.log("📥 cartService: apiService.addToCart response:", response);
      
      // CRITICAL: For normal items, return the response so context can extract the ID
      if (payload.mode === '+' && payload.product_id && !payload.is_offer) {
        console.log("🔍 cartService: Normal item add response - checking for backend ID");
        if (response && response.items && response.items.length > 0) {
          console.log("✅ cartService: Found backend items in response:", response.items.map((item: any) => ({
            id: item.id,
            product: item.product,
            variant: item.variant,
            quantity: item.quantity
          })));
        }
      }
      
      return response;
    } catch (error) {
      console.error("❌ cartService: Error in addToCart:", error);
      throw error;
    }
  },

  // Method specifically for removing offer items
  removeOfferItem: async (offerItemId: string): Promise<any> => {
    console.log("🗑️ cartService: Removing offer item with ID:", offerItemId);
    const payload = {
      mode: 'delete',
      item_id: offerItemId.replace(/-/g, ''),
      is_offer: 'yes'
    };
    console.log("📤 cartService: Remove offer payload:", payload);
    const response = await apiService.addToCart(payload);
    console.log("📥 cartService: Remove offer response:", response);
    return response;
  },

  // Method for removing normal items (existing logic)
  removeNormalItem: async (normalItemId: string): Promise<any> => {
    console.log("🗑️ cartService: Removing normal item with ID:", normalItemId);
    const payload = {
      mode: 'delete',
      item_id: normalItemId.replace(/-/g, '')
    };
    console.log("📤 cartService: Remove normal payload:", payload);
    const response = await apiService.addToCart(payload);
    console.log("📥 cartService: Remove normal response:", response);
    return response;
  },
};