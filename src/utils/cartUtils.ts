// src/utils/cartUtils.ts
export const cartUtils = {
  calculateSubtotal: (cartItems: any[], appliedCoupon: any) => {
    let total = 0;
    cartItems.forEach((item) => {
      if (item.type === 'normal') {
        total += (item.price || 0) * item.quantity;
      } else if (item.type === 'offer') {
        const sortedProducts = item.offer_products
          .sort((a: any, b: any) => (b.price || 0) * b.quantity - (a.price || 0) * a.quantity)
          .slice(0, item.buy_count);
        total += sortedProducts.reduce((sum: number, p: any) => sum + (p.price || 0) * p.quantity, 0);
      }
    });
    return appliedCoupon ? total - appliedCoupon.discount : total;
  },

  calculateOfferTotals: (offerSet: any) => {
    const sortedProducts = offerSet.offer_products.sort(
      (a: any, b: any) => (b.price || 0) * b.quantity - (a.price || 0) * a.quantity
    );
    const itemsToCharge = Math.min(offerSet.buy_count, sortedProducts.length);
    const payableTotal = sortedProducts
      .slice(0, itemsToCharge)
      .reduce((sum: number, p: any) => sum + (p.price || 0) * p.quantity, 0);
    const savings = sortedProducts
      .slice(itemsToCharge)
      .reduce((sum: number, p: any) => sum + (p.price || 0) * p.quantity, 0);
    return { payableTotal, savings, freeItems: sortedProducts.slice(itemsToCharge) };
  },

  hasOutOfStockItems: (cartItems: any[]) => {
    return cartItems.some(
      (item) =>
        (item.type === 'normal' && !item.isInStock) ||
        (item.type === 'offer' && item.offer_products.some((p: any) => !p.isInStock))
    );
  },

  getOutOfStockItems: (cartItems: any[]) => {
    const outOfStock: any[] = [];
    cartItems.forEach((item) => {
      if (item.type === 'normal' && !item.isInStock) outOfStock.push(item.name);
      else if (item.type === 'offer')
        item.offer_products.forEach((p: any) => !p.isInStock && outOfStock.push(p.name));
    });
    return outOfStock;
  },
};