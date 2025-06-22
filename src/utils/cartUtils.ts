// src/utils/cartUtils.ts
import { CartItemType, CartNormalItem, CartOfferItem, ProductItemDetails } from '@/context/cartContext';

export const cartUtils = {
  /**
   * Helper to "explode" quantities within an offer set into individual product units for calculation.
   * This is used to correctly sort and identify paid vs. free items based on individual unit prices.
   * @param offerSet The CartOfferItem to process.
   * @returns An array of ProductItemDetails where each item represents a single unit.
   */
  _getIndividualOfferProducts: (offerSet: CartOfferItem): ProductItemDetails[] => {
    const allIndividualProducts: ProductItemDetails[] = [];
    offerSet.offer_items.forEach(product => {
      // For each product in the consolidated offer_items, add its quantity as individual units
      for (let i = 0; i < product.quantity; i++) {
        allIndividualProducts.push({ ...product, quantity: 1 }); // Each push represents one unit
      }
    });
    return allIndividualProducts;
  },

  /**
   * Calculates the subtotal for all items in the cart (normal and offer).
   * For offers, it sums only the prices of the 'buy_count' most expensive individual items.
   * This function assumes cartItems now contain enriched product data with 'offer_items'.
   * @param cartItems The array of CartItemType (CartNormalItem or CartOfferItem).
   * @returns The calculated subtotal.
   */
  calculateSubtotal: (cartItems: CartItemType[]): number => {
    let total = 0;
    cartItems.forEach((item) => {
      if (item.type === 'normal') {
        // For normal items, sum up price * quantity
        total += (parseFloat(item.product_price || '0') || 0) * (item.quantity || 1);
      } else if (item.type === 'offer') {
        // For offer sets, determine the total payable based on the 'buy_count' logic
        const allIndividualOfferProducts = cartUtils._getIndividualOfferProducts(item);

        if (allIndividualOfferProducts.length > 0) {
          // Sort individual product units by price in descending order to identify the most expensive ones
          const sortedProductsDesc = [...allIndividualOfferProducts].sort(
            (a: ProductItemDetails, b: ProductItemDetails) => (parseFloat(b.product_price || '0') || 0) - (parseFloat(a.product_price || '0') || 0)
          );

          // Sum the prices of the 'buy_count' most expensive items
          const itemsToBuy = item.buy_count || 0;
          for (let i = 0; i < Math.min(itemsToBuy, sortedProductsDesc.length); i++) {
            total += (parseFloat(sortedProductsDesc[i].product_price || '0') || 0); // Each is quantity 1 here
          }
        }
      }
    });
    return total;
  },

  /**
   * Calculates the total savings from all offer sets in the cart.
   * It determines the savings by comparing the original total price of all items in an offer
   * against the calculated payable amount for that offer.
   * @param cartItems The array of CartItemType (CartNormalItem or CartOfferItem).
   * @returns The total calculated offer savings.
   */
  calculateTotalOfferSavings: (cartItems: CartItemType[]): number => {
    let totalSavings = 0;
    cartItems.forEach((item) => {
      if (item.type === 'offer') {
        const allIndividualOfferProducts = cartUtils._getIndividualOfferProducts(item);

        if (allIndividualOfferProducts.length > 0) {
          // Calculate the total original price of all individual units in the offer
          const totalOriginalPriceOfAllUnits = allIndividualOfferProducts.reduce((sum, p) => sum + parseFloat(p.product_price || '0'), 0);

          // Calculate the payable portion for this specific offer set (same logic as in calculateSubtotal for offers)
          const sortedProductsDesc = [...allIndividualOfferProducts].sort(
            (a: ProductItemDetails, b: ProductItemDetails) => (parseFloat(b.product_price || '0') || 0) - (parseFloat(a.product_price || '0') || 0)
          );
          const itemsToCharge = item.buy_count || 0;
          let payableForThisOffer = 0;
          for (let i = 0; i < Math.min(itemsToCharge, sortedProductsDesc.length); i++) {
            payableForThisOffer += (parseFloat(sortedProductsDesc[i].product_price || '0') || 0);
          }
          
          // Savings for this offer set = (Total original price of all units) - (Payable amount for this offer)
          totalSavings += (totalOriginalPriceOfAllUnits - payableForThisOffer);
        }
      }
    });
    return totalSavings;
  },

  /**
   * Checks if any item in the cart (normal or within an offer set) is out of stock.
   * @param cartItems The array of CartItemType.
   * @returns True if any item is out of stock, false otherwise.
   */
  hasOutOfStockItems: (cartItems: CartItemType[]): boolean => {
    return cartItems.some(
      (item) =>
        (item.type === 'normal' && !item.isInStock) ||
        (item.type === 'offer' && (
          // Check if any product within the offer_items is out of stock
          item.offer_items && item.offer_items.some((p: ProductItemDetails) => !p.isInStock)
        ))
    );
  },

  /**
   * Returns a list of names of out-of-stock items in the cart.
   * @param cartItems The array of CartItemType.
   * @returns An array of strings with names of out-of-stock products.
   */
  getOutOfStockItems: (cartItems: CartItemType[]): string[] => {
    const outOfStock: string[] = [];
    cartItems.forEach((item) => {
      if (item.type === 'normal' && !item.isInStock) {
        outOfStock.push(item.product_name || 'Unknown Product');
      } else if (item.type === 'offer') {
        if (item.offer_items) {
          item.offer_items.forEach((p: ProductItemDetails) => {
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
