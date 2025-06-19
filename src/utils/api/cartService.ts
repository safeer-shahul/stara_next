// src/utils/cartService.ts
import { v4 as uuidv4 } from 'uuid';
import apiService from './apiService';

export const cartService = {
  fetchCartFromBackend: async () => {
  try {
    const response = await apiService.getUserCart();
    if (response && response.items) {
      const cartItems = response.items.map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        product: item.product,
        offer: item.offer,
        offer_products: item.offer_products,
        type: item.offer ? 'offer' : 'normal',
        isSynced: true,
      }));
      const productIds = cartItems
        .flatMap((item: any) => [item.product, ...(item.offer_products?.map((p: any) => p.product) || [])])
        .filter((id: string) => id);
      const productsResponse = await apiService.getPaginatedProducts(1, 30, productIds);
      const productsMap = new Map(
        productsResponse.products.map((p: any) => [p.id.replace(/-/g, ''), { ...p, quantity: 1 }])
      );
      const formattedItems = cartItems.map((item: any) => {
        if (item.type === 'normal') {
          const productData:any = productsMap.get(item.product.replace(/-/g, '')) || {};
          return {
            ...item,
            ...productData,
            // Preserve original fields, overwrite only if needed
            name: productData.product_name || item.name,
            price: productData.product_price ? parseFloat(productData.product_price) : item.price,
            isInStock: productData.quantity > 0 && productData.product_status,
          };
        } else {
          return {
            ...item,
            offer_products: item.offer_products.map((p: any) => {
              const productData:any = productsMap.get(p.product.replace(/-/g, '')) || {};
              return {
                ...p,
                ...productData,
                name: productData.product_name || p.name,
                price: productData.product_price ? parseFloat(productData.product_price) : p.price,
                isInStock: productData.quantity > 0 && productData.product_status,
              };
            }),
          };
        }
      });
      return formattedItems;
    }
    return [];
  } catch (error) {
    console.error('Error fetching cart:', error);
    return JSON.parse(localStorage.getItem('cartItems') || '[]');
  }
},

  syncGuestCart: async (unsyncedItems: any[]) => {
    const updatedItems = [...unsyncedItems];
    for (const item of unsyncedItems) {
      try {
        const response = await apiService.addToCartOffer({
          offer_id: item.offer_id,
          offer_products: item.offer_products,
        });
        const index = updatedItems.findIndex((i: any) => i.id === item.id);
        updatedItems[index] = { ...response, isSynced: true };
      } catch (error) {
        console.error(`Error syncing offer set ${item.id}:`, error);
      }
    }
    return updatedItems;
  },

  addToCart: async (productId: string, mode: string) => {
    await apiService.addToCart({ product_id: productId, mode });
  },
};