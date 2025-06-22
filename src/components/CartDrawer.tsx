// components/CartDrawer.tsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { X, ShoppingCart } from 'lucide-react';
import CartItem from './CartItem';
import OfferCartItem from './OfferCartItem';
import CheckoutModal from './CheckoutModal';
// Import getTotalProductQuantitiesInCart from useCart
import { useCart, CartItemType, CartNormalItem, CartOfferItem, ProductItemDetails } from '@/context/cartContext';
import { cartService } from '@/utils/api/cartService';
import apiService from '@/utils/api/apiService';
import { cartUtils } from '@/utils/cartUtils';
import { v4 as uuidv4 } from 'uuid';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  // Destructure getTotalProductQuantitiesInCart from useCart
  const { cartItems, dispatchCart, loading: contextLoading, getTotalProductQuantitiesInCart } = useCart();
  const [localLoading, setLocalLoading] = useState<boolean>(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);

  const getAndSetCartItems = useCallback(async () => {
    setLocalLoading(true);
    try {
      const items = await cartService.fetchCartFromBackend();
      dispatchCart({ type: 'SET_CART_ITEMS', payload: items });
    } catch (error) {
      console.error('CartDrawer: Error fetching/enriching cart:', error);
    } finally {
      setLocalLoading(false);
    }
  }, [dispatchCart]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleRemoveItem = async (id: string): Promise<void> => {
    console.log(`CartDrawer: Dispatching REMOVE_ITEM for ID: ${id}`);
    dispatchCart({ type: 'REMOVE_ITEM', payload: id });
  };

  const handleQuantityChange = async (id: string, change: number): Promise<void> => {
    console.log('CartDrawer: handleQuantityChange called for item ID:', id, 'change:', change);
    const itemToUpdate = cartItems.find(item => item.id === id);

    if (!itemToUpdate || itemToUpdate.type !== 'normal') {
      console.warn(`CartDrawer: Attempted to change quantity of non-normal item or item not found with ID: ${id}`);
      return;
    }

    const newQuantity = itemToUpdate.quantity + change;

    if (newQuantity <= 0) {
      await handleRemoveItem(id); // If new quantity is 0 or less, remove the item
      return;
    }

    // --- NEW LOGIC FOR INVENTORY CHECK ---
    // Get the map of all product quantities currently in the cart
    const totalProductQuantitiesMap = getTotalProductQuantitiesInCart();
    const productIdBeingUpdated = (itemToUpdate as CartNormalItem).product_id.replace(/-/g, '');

    // Get the total quantity of this specific product_id that is already IN THE ENTIRE CART
    const currentTotalQuantityOfThisProductInCart = totalProductQuantitiesMap.get(productIdBeingUpdated) || 0;

    // The stock_quantity (`itemToUpdate.stock_quantity`) is the TOTAL available from backend for this product.
    // To find out how much *more* can be added for this *specific normal item*,
    // we need to consider the total stock MINUS all *other* instances of this product in the cart.
    // So, we subtract `currentTotalQuantityOfThisProductInCart` but then add back `itemToUpdate.quantity`
    // because we are calculating the effective limit *for this particular cart item's increase*, not the overall product limit for new adds.
    const effectiveAvailableStockForThisNormalItem = itemToUpdate.stock_quantity - (currentTotalQuantityOfThisProductInCart - itemToUpdate.quantity);

    // Validate if the new quantity for THIS item exceeds the effective stock available for it
    if (newQuantity > effectiveAvailableStockForThisNormalItem) {
      console.warn(`CartDrawer: Cannot increase quantity for item ${id} beyond effective available stock (${effectiveAvailableStockForThisNormalItem}).`);
      // Optionally show a toast notification here to inform the user
      // Example: alert(`Cannot add more. Only ${effectiveAvailableStockForThisNormalItem} available.`);
      return;
    }
    // --- END NEW LOGIC ---

    console.log(`CartDrawer: Dispatching UPDATE_ITEM_QUANTITY for item ${id} to new quantity: ${newQuantity}.`);
    dispatchCart({ type: 'UPDATE_ITEM_QUANTITY', payload: { id, quantity: newQuantity } });
  };

  const handleProceedToCheckout = (): void => {
    const items = cartItems.filter(item => item.type === 'normal').map(item => ({
      product_id: (item as CartNormalItem).product_id.replace(/-/g, ''),
      quantity: item.quantity
    }));

    const offer_sets = cartItems.filter(item => item.type === 'offer').map(item => ({
      id: item.id.replace(/-/g, ''),
      offer: (item as CartOfferItem).offer.replace(/-/g, ''),
      buy_count: (item as CartOfferItem).buy_count,
      get_count: (item as CartOfferItem).get_count,
      offer_products: (item as CartOfferItem).offer_items.map(p => ({
        product: p.id.replace(/-/g, ''),
        quantity: p.quantity
      }))
    }));

    dispatchCart({
      type: 'SET_CHECKOUT_DATA',
      payload: {
        items,
        offer_sets
      }
    });

    setShowCheckoutModal(true);
  };

  const handleCheckoutClose = (): void => {
    setShowCheckoutModal(false);
    dispatchCart({ type: 'TRIGGER_SYNC' });
  };

  const handleAddressSelected = (addressId: string): void => {
    console.log(`CartDrawer: Proceeding with address ID: ${addressId}`);
    setShowCheckoutModal(false);
    dispatchCart({ type: 'TRIGGER_SYNC' });
  };

  const clearCart = async (): Promise<void> => {
    try {
      dispatchCart({ type: 'SET_CART_ITEMS', payload: [] });
      console.log('CartDrawer: Cart cleared locally.');

      if (localStorage.getItem('accessToken')) {
        console.log(`CartDrawer: Attempting to clear cart on backend for authenticated user.`);
        await apiService.addToCart({ mode: 'delete_cart' });
        dispatchCart({ type: 'TRIGGER_SYNC' });
      } else {
        console.log(`CartDrawer: Cart cleared locally for guest user.`);
      }
    } catch (error) {
      console.error('CartDrawer: Error clearing cart:', error);
      dispatchCart({ type: 'TRIGGER_SYNC' });
    }
  };

  const hasOutOfStockItems = (): boolean => {
    // This function still relies on item.isInStock and item.stock_quantity.
    // You might want to update cartUtils.hasOutOfStockItems
    // to use the effective available stock if you consider items in cart as "unavailable" for re-adding.
    // For now, it will mark an item as out of stock if its initial API stock is zero or less.
    return cartUtils.hasOutOfStockItems(cartItems);
  };

  const getOutOfStockItems = (): string[] => {
    return cartUtils.getOutOfStockItems(cartItems);
  };

  if (!isOpen) return null;

  const totalCartUnits = cartItems.reduce((total: number, item: CartItemType) => {
    if (item.type === 'normal') {
      return total + item.quantity;
    } else {
      return total + item.offer_items.reduce((offerTotal, p) => offerTotal + p.quantity, 0);
    }
  }, 0);

  const subtotal = cartUtils.calculateSubtotal(cartItems);
  const offerSavings = cartUtils.calculateTotalOfferSavings(cartItems);

  const finalTotal = subtotal;

  return (
    <>
      <div className="fixed inset-0 z-51 overflow-hidden">
        <div className="absolute inset-0 bg-black/80" onClick={onClose}></div>

        <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-[#f2f4f7] shadow-xl transform transition-transform rounded-tl-[16px] rounded-bl-[16px]">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between py-3 pl-6 pr-2 border-b">
              <div className="flex items-center">
                <ShoppingCart className="mr-2 text-[#7F7F7F]" size={18} />
                <h3 className="text-[16px] font-medium text-[#7F7F7F]">
                  Your Cart ({totalCartUnits} items)
                </h3>
              </div>
              <button onClick={onClose} className="text-black hover:text-gray-700">
                <X size={22} />
              </button>
            </div>
            <div className="bg-[#175e7a] py-1 text-center">
              <p className="text-white text-[12px]">BUY 1 GET 1 FREE | USE CODE : B1G1</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {(localLoading || contextLoading) ? (
                <div className="flex justify-center items-center h-40">
                  <div className="w-8 h-8 border-4 border-gray-200 border-t-[#175e7a] rounded-full animate-spin mr-2"></div>
                  <p>Loading cart items...</p>
                </div>
              ) : (
                <>
                  {cartItems.length > 0 ? (
                    <>
                      {cartItems.map((item) => {
                        if (item.type === 'normal') {
                          // Calculate maxAllowedQuantity for THIS specific normal item
                          const totalProductQuantitiesMap = getTotalProductQuantitiesInCart();
                          const productIdForThisItem = item.product_id.replace(/-/g, '');
                          const currentTotalQuantityOfThisProductInCart = totalProductQuantitiesMap.get(productIdForThisItem) || 0;

                          // The effective limit for this *specific* normal item is:
                          // its product's total stock (from API)
                          // MINUS the quantity of this product already in other cart items (including other normal items, if any, and offer items).
                          // We then add back this specific item's current quantity, because we are determining the
                          // maximum *this item itself* can be incremented to, considering the overall stock.
                          const effectiveMaxForThisNormalItem = item.stock_quantity - (currentTotalQuantityOfThisProductInCart - item.quantity);

                          return (
                            <CartItem
                              key={item.id ?? uuidv4()}
                              product={item}
                              onRemove={handleRemoveItem}
                              onQuantityChange={handleQuantityChange}
                              maxAllowedQuantity={effectiveMaxForThisNormalItem} // Pass the calculated max
                            />
                          );
                        } else {
                          // Offer items typically don't have individual quantity controls directly in CartItem,
                          // so maxAllowedQuantity might not be needed unless you add that functionality to OfferCartItem.
                          return (
                            <OfferCartItem
                              key={item.id ?? uuidv4()}
                              offerSet={item}
                              onRemove={handleRemoveItem}
                            />
                          );
                        }
                      })}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <ShoppingCart size={40} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500">Your cart is empty</p>
                    </div>
                  )}
                </>
              )}
            </div>
            {cartItems.length > 0 && (
              <div className="px-4 pb-6">
                <div className="mb-4">
                  {offerSavings > 0 && (
                    <div className="flex justify-between text-green-600 mb-1">
                      <span className="text-sm">Offer Savings</span>
                      <span className="text-base font-bold">₹{offerSavings.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[#7F7F7F]">
                    <span className="text-sm">Estimated Total</span>
                    <span className="text-base font-bold">₹{finalTotal.toFixed(2)}</span>
                  </div>
                </div>
                {hasOutOfStockItems() && (
                  <div className="bg-red-50 border border-red-200 text-red-600 p-3 mb-4 rounded text-sm">
                    Please remove out of stock item(s) to continue:
                    <ul className="mt-1 list-disc pl-5">
                      {getOutOfStockItems().map((name, index) => (
                        <li key={index}>{name}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex gap-2">
                  {cartItems.length > 0 && (
                    <button
                      className="px-3 py-3 border border-[#175e7a] text-[14px] text-[#175e7a] font-medium hover:bg-gray-100 cursor-pointer transition-colors rounded"
                      onClick={clearCart}
                    >
                      Clear Cart
                    </button>
                  )}
                  <button
                    className={`flex-1 text-[14px] text-white font-medium py-3 cursor-pointer transition-colors shadow-sm rounded flex items-center justify-center ${
                      hasOutOfStockItems() ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#175e7a] hover:bg-[#0f4c67]'
                    }`}
                    onClick={hasOutOfStockItems() ? undefined : handleProceedToCheckout}
                    disabled={hasOutOfStockItems()}
                  >
                    Proceed To Checkout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        {showCheckoutModal && (
          <CheckoutModal
            isOpen={showCheckoutModal}
            onClose={handleCheckoutClose}
            onProceed={handleAddressSelected}
            cartItems={cartItems}
            orderItems={cartItems.filter(item => item.type === 'normal').map(item => ({ product_id: (item as CartNormalItem).product_id.replace(/-/g, ''), quantity: item.quantity }))}
          />
        )}
      </div>
    </>
  );
};

export default CartDrawer;