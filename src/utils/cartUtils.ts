export const cartUtils = {
  // Calculates the subtotal for all items (normal and offer)
  // This function assumes cartItems now contain enriched product data with main_product and offer_products_extra
  calculateSubtotal: (cartItems: any[]) => {
    let total = 0;
    cartItems.forEach((item) => {
      if (item.type === 'normal') {
        // For normal items, sum up price * quantity
        total += (parseFloat(item.product_price || item.price || '0') || 0) * (item.quantity || 1);
      } else if (item.type === 'offer') {
        // For offer sets, sum only the prices of the 'buy' items from main_product and offer_products_extra
        const allOfferProducts = [];
        if (item.main_product) {
          allOfferProducts.push(item.main_product);
        }
        if (item.offer_products_extra) {
          allOfferProducts.push(...item.offer_products_extra);
        }

        if (allOfferProducts.length > 0) {
          // Sort products by price in descending order to identify the most expensive ones for 'buy_count'
          const sortedProductsDesc = [...allOfferProducts].sort(
            (a: any, b: any) => (parseFloat(b.product_price || b.price || '0') || 0) - (parseFloat(a.product_price || a.price || '0') || 0)
          );

          const itemsToBuy = item.buy_count || 0;
          for (let i = 0; i < Math.min(itemsToBuy, sortedProductsDesc.length); i++) {
            total += (parseFloat(sortedProductsDesc[i].product_price || sortedProductsDesc[i].price || '0') || 0) * (sortedProductsDesc[i].quantity || 1);
          }
        }
      }
    });
    return total;
  },

  // Calculates the total savings from all offer sets in the cart
  calculateTotalOfferSavings: (cartItems: any[]) => {
    let totalSavings = 0;
    cartItems.forEach((item) => {
      if (item.type === 'offer') {
        const allOfferProducts = [];
        if (item.main_product) {
          allOfferProducts.push(item.main_product);
        }
        if (item.offer_products_extra) {
          allOfferProducts.push(...item.offer_products_extra);
        }

        if (allOfferProducts.length > 0) {
          // Sort products by price in ascending order to identify the cheapest ones for 'get' items
          const allProductsSortedAsc = [...allOfferProducts].sort(
            (a: any, b: any) => (parseFloat(a.product_price || a.price || '0') || 0) - (parseFloat(b.product_price || b.price || '0') || 0)
          );

          const itemsToGetFree = item.get_count || 0;

          // The free items are the lowest priced ones among all products in the offer
          for (let i = 0; i < Math.min(itemsToGetFree, allProductsSortedAsc.length); i++) {
            totalSavings += (parseFloat(allProductsSortedAsc[i].product_price || allProductsSortedAsc[i].price || '0') || 0) * (allProductsSortedAsc[i].quantity || 1);
          }
        }
      }
    });
    return totalSavings;
  },

  hasOutOfStockItems: (cartItems: any[]) => {
    return cartItems.some(
      (item) =>
        (item.type === 'normal' && !item.isInStock) ||
        (item.type === 'offer' && (
          (item.main_product && !item.main_product.isInStock) ||
          (item.offer_products_extra && item.offer_products_extra.some((p: any) => !p.isInStock))
        ))
    );
  },
  getOutOfStockItems: (cartItems: any[]) => {
    const outOfStock: string[] = [];
    cartItems.forEach((item) => {
      if (item.type === 'normal' && !item.isInStock) {
        outOfStock.push(item.product_name || 'Unknown Product');
      } else if (item.type === 'offer') {
        if (item.main_product && !item.main_product.isInStock) {
          outOfStock.push(item.main_product.product_name || 'Unknown Product');
        }
        if (item.offer_products_extra) {
          item.offer_products_extra.forEach((p: any) => {
            if (!p.isInStock) {
              outOfStock.push(p.product_name || 'Unknown Product');
            }
          });
        }
      }
    });
    return outOfStock;
  },
};