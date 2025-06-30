// src/utils/cartUtils.ts
import { CartItemType, CartNormalItem, CartOfferItem, ProductItemDetails, ProductVariant } from '@/context/cartContext';

export const cartUtils = {
  /**
   * Calculates the subtotal for all items in the cart with enhanced offer handling.
   * For offers, it only counts the paid items (buy_count items).
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
        // For offer sets, only count paid items
        const paidItems = item.offer_items.filter(p => p.isPaid);
        const paidTotal = paidItems.reduce((sum, p) => {
          return sum + ((parseFloat(p.product_price || '0') || 0) * p.quantity);
        }, 0);
        total += paidTotal;
      }
    });
    
    return total;
  },

  /**
   * Calculates the total savings from all offer sets in the cart.
   * It determines the savings by summing up the value of all free items.
   * @param cartItems The array of CartItemType (CartNormalItem or CartOfferItem).
   * @returns The total calculated offer savings.
   */
  calculateTotalOfferSavings: (cartItems: CartItemType[]): number => {
    let totalSavings = 0;
    
    cartItems.forEach((item) => {
      if (item.type === 'offer') {
        // Calculate savings from free items
        const freeItems = item.offer_items.filter(p => !p.isPaid);
        const freeItemsValue = freeItems.reduce((sum, p) => {
          return sum + ((parseFloat(p.product_price || '0') || 0) * p.quantity);
        }, 0);
        totalSavings += freeItemsValue;
      }
    });
    
    return totalSavings;
  },

  /**
   * Enhanced calculation that returns detailed breakdown
   * @param cartItems The array of CartItemType
   * @returns Detailed breakdown of totals
   */
  calculateDetailedTotals: (cartItems: CartItemType[]) => {
    let normalSubtotal = 0;
    let offerSubtotal = 0;
    let offerSavings = 0;
    let totalItems = 0;

    cartItems.forEach((item) => {
      if (item.type === 'normal') {
        const itemTotal = (parseFloat(item.product_price || '0') || 0) * item.quantity;
        normalSubtotal += itemTotal;
        totalItems += item.quantity;
      } else if (item.type === 'offer') {
        // Separate paid and free items
        const paidItems = item.offer_items.filter(p => p.isPaid);
        const freeItems = item.offer_items.filter(p => !p.isPaid);
        
        // Calculate paid items subtotal
        const paidTotal = paidItems.reduce((sum, p) => {
          return sum + ((parseFloat(p.product_price || '0') || 0) * p.quantity);
        }, 0);
        
        // Calculate savings from free items
        const freeTotal = freeItems.reduce((sum, p) => {
          return sum + ((parseFloat(p.product_price || '0') || 0) * p.quantity);
        }, 0);
        
        offerSubtotal += paidTotal;
        offerSavings += freeTotal;
        
        // Count all items for total count
        totalItems += item.offer_items.reduce((sum, p) => sum + p.quantity, 0);
      }
    });

    const grandTotal = normalSubtotal + offerSubtotal;

    return {
      normalSubtotal,
      offerSubtotal,
      offerSavings,
      totalItems,
      grandTotal,
    };
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
          item.offer_items && item.offer_items.some((p) => !p.isInStock)
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
        outOfStock.push(`${item.product_name}${item.selectedVariant ? ` (Size: ${item.selectedVariant.variant_name})` : ''}`);
      } else if (item.type === 'offer') {
        if (item.offer_items) {
          item.offer_items.forEach((p) => {
            if (!p.isInStock) {
              outOfStock.push(`${p.product_name}${p.selectedVariant ? ` (Size: ${p.selectedVariant.variant_name})` : ''} (from ${item.offer_name.offer_name})`);
            }
          });
        }
      }
    });
    
    return outOfStock;
  },

  /**
   * Groups normal items by product and variant combination
   * @param normalItems Array of CartNormalItem
   * @returns Grouped items (already handled in cart context, but useful for display)
   */
  groupNormalItemsByVariant: (normalItems: CartNormalItem[]): CartNormalItem[] => {
    // In our current implementation, each variant is already a separate cart item
    // This function is for potential future use or different grouping strategies
    return normalItems;
  },

  /**
   * Groups offer items products by product and variant for better display
   * @param offerItem Single CartOfferItem
   * @returns Grouped products within the offer
   */
  groupOfferItemProducts: (offerItem: CartOfferItem) => {
    const grouped = new Map<string, {
      product: ProductItemDetails & { selectedVariant?: ProductVariant };
      paidQuantity: number;
      freeQuantity: number;
      totalQuantity: number;
    }>();

    offerItem.offer_items.forEach(item => {
      const key = `${item.id}-${item.selectedVariant?.id || 'no-variant'}`;
      
      if (grouped.has(key)) {
        const existing = grouped.get(key)!;
        existing.totalQuantity += item.quantity;
        if (item.isPaid) {
          existing.paidQuantity += item.quantity;
        } else {
          existing.freeQuantity += item.quantity;
        }
      } else {
        grouped.set(key, {
          product: item,
          paidQuantity: item.isPaid ? item.quantity : 0,
          freeQuantity: item.isPaid ? 0 : item.quantity,
          totalQuantity: item.quantity,
        });
      }
    });

    return Array.from(grouped.values());
  },

  /**
   * Validates cart data structure
   * @param cartItems Array of cart items to validate
   * @returns Object with validation results
   */
  validateCartData: (cartItems: CartItemType[]) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(cartItems)) {
      errors.push('Cart items must be an array');
      return { isValid: false, errors, warnings };
    }

    cartItems.forEach((item, index) => {
      if (!item.id) {
        errors.push(`Item at index ${index} missing ID`);
      }
      
      if (!['normal', 'offer'].includes(item.type)) {
        errors.push(`Item at index ${index} has invalid type: ${item.type}`);
      }

      if (item.type === 'normal') {
        const normalItem = item as CartNormalItem;
        if (!normalItem.product_id) {
          errors.push(`Normal item at index ${index} missing product_id`);
        }
        if (normalItem.quantity <= 0) {
          warnings.push(`Normal item at index ${index} has invalid quantity: ${normalItem.quantity}`);
        }
      }

      if (item.type === 'offer') {
        const offerItem = item as CartOfferItem;
        if (!offerItem.offer) {
          errors.push(`Offer item at index ${index} missing offer ID`);
        }
        if (!Array.isArray(offerItem.offer_items) || offerItem.offer_items.length === 0) {
          errors.push(`Offer item at index ${index} has no offer_items`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  },
};