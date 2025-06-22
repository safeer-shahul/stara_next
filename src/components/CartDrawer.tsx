'use client';
import { useState, useEffect, useCallback } from 'react';
import { X, ShoppingCart } from 'lucide-react';
import CartItem from './CartItem';
import OfferCartItem from './OfferCartItem';
import CheckoutModal from './CheckoutModal';
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
  const { cartItems, dispatchCart, loading: contextLoading } = useCart();
  // Removed direct console.log from component body to reduce noise
  // console.log('Current cartItems in CartDrawer:', cartItems);

  const [localLoading, setLocalLoading] = useState<boolean>(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);

  // This function is now mostly for *re-fetching* the cart state from backend/local storage
  // and dispatching it to the context. It should be called after actions that modify cart.
  const getAndSetCartItems = useCallback(async () => {
    setLocalLoading(true);
    try {
      // This will now fetch the latest state, also reconciling any changes if an access token is present
      const items = await cartService.fetchCartFromBackend(); 
      dispatchCart({ type: 'SET_CART_ITEMS', payload: items });
    } catch (error) {
      console.error('Error fetching/enriching cart:', error);
    } finally {
      setLocalLoading(false);
    }
  }, [dispatchCart]);

  // Removed useEffect hooks that call getAndSetCartItems on isOpen or showCheckoutModal changes.
  // The CartProvider's main synchronization useEffect will handle initial fetching and
  // authentication state changes.
  // useEffect(() => {
  //   if (isOpen && typeof window !== 'undefined') {
  //     getAndSetCartItems(); // Fetch cart items when drawer opens
  //   }
  // }, [isOpen, getAndSetCartItems]);

  useEffect(() => {
    // Re-fetch cart items after checkout modal closes to ensure latest state
    // This is valid as closing the modal might mean an order was placed, affecting cart state.
    if (!showCheckoutModal && isOpen) {
      getAndSetCartItems();
    }
  }, [showCheckoutModal, isOpen, getAndSetCartItems]);

  // FIX: handleRemoveItem now correctly handles local-only vs. synced items
  const handleRemoveItem = async (id: string): Promise<void> => {
    const itemToRemove = cartItems.find(item => item.id === id);

    if (!itemToRemove) {
      console.warn(`Attempted to remove item with ID: ${id}, but it was not found in current cart state.`);
      return;
    }

    try {
      // Optimistically remove from UI
      dispatchCart({ type: 'REMOVE_ITEM', payload: id });

      if (itemToRemove.isSynced && itemToRemove.id !== null) {
        // If synced with backend, call API to remove
        if (itemToRemove.type === 'normal') {
          await apiService.addToCart({ product_id: itemToRemove.product_id.replace(/-/g, ''), mode: 'delete' });
          console.log(`Removed normal item with backend ID ${itemToRemove.id} from backend.`);
        } else if (itemToRemove.type === 'offer') {
          await apiService.addToCart({ item_id: itemToRemove.id.replace(/-/g, ''), mode: 'delete' });
          console.log(`Removed offer set with backend ID ${itemToRemove.id} from backend.`);
        }
        await getAndSetCartItems(); // Re-fetch only if a backend interaction happened
      } else {
        // If not synced (local only), no backend call needed, local state and storage already updated by dispatch
        console.log(`Removing unsynced item with local ID ${itemToRemove.id || 'null'} from local state.`);
      }
      
    } catch (error) {
      console.error(`Error removing item (ID: ${id}):`, error);
      // If backend removal fails, you might want to re-add the item to the UI or show an error.
      // For now, we'll let the next getAndSetCartItems attempt to resync if authenticated.
    }
  };

  // FIX: handleQuantityChange now handles both synced and unsynced normal items
  const handleQuantityChange = async (id: string, change: number): Promise<void> => {
    console.log('handleQuantityChange called for item ID:', id);
    const itemToUpdate = cartItems.find(item => item.id === id);
    console.log('itemToUpdate found:', itemToUpdate);

    if (!itemToUpdate || itemToUpdate.type !== 'normal') {
      console.warn(`Attempted to change quantity of non-normal item or item not found with ID: ${id}`);
      return;
    }
    
    const newQuantity = itemToUpdate.quantity + change;

    if (newQuantity <= 0) {
      // If quantity goes to 0 or less, remove the item
      await handleRemoveItem(id);
      return;
    }

    // Check if the new quantity exceeds available stock
    if (newQuantity > itemToUpdate.stock_quantity) {
      console.warn(`Cannot increase quantity for item ${id} beyond available stock (${itemToUpdate.stock_quantity}).`);
      // Optionally, you might want to show a user-facing message here
      return;
    }

    // Determine if the item is synced and needs backend interaction
    if (itemToUpdate.isSynced && itemToUpdate.id !== null) {
      try {
        await apiService.addToCart({ product_id: itemToUpdate.product_id.replace(/-/g, ''), mode: change > 0 ? '+' : '-' });
        console.log(`Changed quantity for synced item ${id} by ${change}.`);
        await getAndSetCartItems(); // Re-fetch to get updated state from backend
      } catch (error) {
        console.error(`Error updating synced cart quantity for item ${id}:`, error);
      }
    } else {
      // If not synced (local only), dispatch update to local state directly
      console.log(`Updating quantity for unsynced local item ${id} to ${newQuantity}.`);
      dispatchCart({ type: 'UPDATE_ITEM_QUANTITY', payload: { id, quantity: newQuantity } });
      // For unsynced items, the next syncCartWithBackend (e.g., on login) will push this change.
      // No need to call getAndSetCartItems immediately here for unsynced, as the local state is updated.
    }
  };

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

  const handleProceedToCheckout = async (): Promise<void> => {
    setShowCheckoutModal(true);
  };

  const handleCheckoutClose = (): void => {
    setShowCheckoutModal(false);
    getAndSetCartItems(); // Re-fetch cart after checkout modal closes to ensure latest state
  };

  const handleAddressSelected = (addressId: string): void => {
    console.log(`Proceeding with address ID: ${addressId}`);
    setShowCheckoutModal(false);
    getAndSetCartItems(); // Re-fetch cart after address selection (likely for order placement)
  };

  const clearCart = async (): Promise<void> => {
    try {
      await apiService.addToCart({ mode: 'delete_cart' });
      dispatchCart({ type: 'SET_CART_ITEMS', payload: [] }); // Clear local state immediately
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const hasOutOfStockItems = (): boolean => {
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
      <div className="fixed inset-0 z-50 overflow-hidden">
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
            {/* Promotional banner */}
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
                          return (
                            <CartItem
                              key={item.id ?? uuidv4()} 
                              product={item} 
                              onRemove={handleRemoveItem} 
                              onQuantityChange={handleQuantityChange}
                            />
                          );
                        } else { 
                          return (
                            <OfferCartItem
                              key={item.id ?? uuidv4()} 
                              offerSet={item} 
                              onRemove={handleRemoveItem} // Pass handleRemoveItem (which now handles offer sets)
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
                      <span className="text-[13px]">Offer Savings</span>
                      <span className="font-bold">−₹{offerSavings.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[#7F7F7F]">
                    <span className="text-[13px]">Estimated Total</span>
                    <span className="font-bold">₹{finalTotal.toFixed(2)}</span>
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
        {/* FIX: Conditionally render CheckoutModal to prevent unnecessary rendering and logging */}
        {showCheckoutModal && (
          <CheckoutModal
            isOpen={showCheckoutModal}
            onClose={handleCheckoutClose}
            onProceed={handleAddressSelected}
            cartItems={cartItems}
          />
        )}
      </div>
    </>
  );
};

export default CartDrawer;
