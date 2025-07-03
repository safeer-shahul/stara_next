'use client';
import { useState, useEffect, useCallback } from 'react';
import { X, ShoppingCart, Trash2, RefreshCw } from 'lucide-react';
import CartItem from './CartItem';
import OfferCartItem from './OfferCartItem';
import CheckoutModal from './CheckoutModal';
import { useCart, CartNormalItem, CartOfferItem } from '@/context/cartContext';
import { cartUtils } from '@/utils/cartUtils';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { 
    cartItems, 
    dispatchCart, 
    loading: contextLoading,
    authMode,
    getEffectiveProductStock,
    clearCart,
    forceRefreshCart,
    checkBackendCartEmpty
  } = useCart();
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [hasPerformedInitialSync, setHasPerformedInitialSync] = useState<boolean>(false);

  // OPTIMIZED: Only perform sync check on first open, not every open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      // Only perform sync check if authenticated AND haven't done it in this session
      if (authMode === 'authenticated' && !hasPerformedInitialSync) {
        const performLightweightSyncCheck = async () => {
          try {
            console.log('🔍 Performing one-time sync check for cart drawer...');
            
            // OPTIMIZED: Only check if backend is empty, don't force full refresh
            const backendIsEmpty = await checkBackendCartEmpty();
            
            if (backendIsEmpty && cartItems.length > 0) {
              console.log('🗑️ Backend cart empty - clearing local cart (purchased on another device)');
              dispatchCart({ type: 'CLEAR_CART' });
              
              setTimeout(() => {
                alert('Your cart was cleared because it was completed on another device.');
              }, 500);
            }
            // REMOVED: Don't force refresh if backend has items - trust current state
            
            setHasPerformedInitialSync(true);
          } catch (error) {
            console.error('❌ Error in lightweight sync check:', error);
            setHasPerformedInitialSync(true); // Still mark as done to prevent retry
          }
        };

        performLightweightSyncCheck();
      }
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, authMode, hasPerformedInitialSync, cartItems.length, checkBackendCartEmpty, dispatchCart]);

  // Reset sync flag when auth mode changes
  useEffect(() => {
    setHasPerformedInitialSync(false);
  }, [authMode]);

  const handleRemoveItem = useCallback(async (id: string): Promise<void> => {
    console.log(`🗑️ CartDrawer: Removing item with ID: ${id}`);
    
    const itemToRemove = cartItems.find(item => item.id === id);
    if (itemToRemove) {
      console.log(`🗑️ CartDrawer: Removing ${itemToRemove.type} item:`, {
        id: itemToRemove.id,
        type: itemToRemove.type,
        name: itemToRemove.type === 'normal' 
          ? (itemToRemove as CartNormalItem).product_name 
          : (itemToRemove as CartOfferItem).offer_name.offer_name
      });
    }
    
    dispatchCart({ type: 'REMOVE_ITEM', payload: id });
  }, [dispatchCart, cartItems]);

  const handleQuantityChange = useCallback(async (id: string, change: number): Promise<void> => {
    console.log('📊 CartDrawer: handleQuantityChange called for item ID:', id, 'change:', change);
    const itemToUpdate = cartItems.find(item => item.id === id);

    if (!itemToUpdate || itemToUpdate.type !== 'normal') {
      console.warn(`❌ CartDrawer: Cannot update quantity - item not found or not normal type`);
      return;
    }

    if (!itemToUpdate.productDetails) {
      console.error(`❌ CartDrawer: Cannot update quantity - missing productDetails`);
      alert('Cannot update quantity: product data incomplete. Please refresh your cart.');
      return;
    }

    const newQuantity = itemToUpdate.quantity + change;

    if (newQuantity <= 0) {
      await handleRemoveItem(id);
      return;
    }

    const currentEffectiveStock = getEffectiveProductStock(itemToUpdate.productDetails, itemToUpdate.selectedVariant?.id);

    if (newQuantity > currentEffectiveStock + itemToUpdate.quantity) {
      const maxAllowed = currentEffectiveStock + itemToUpdate.quantity;
      console.warn(`⚠️ CartDrawer: Cannot increase quantity beyond stock limit`);
      alert(`Cannot add more: Maximum available stock is ${maxAllowed} units.`);
      return;
    }

    console.log(`📊 CartDrawer: Updating quantity for item ${id} to ${newQuantity}`);
    dispatchCart({ type: 'UPDATE_ITEM_QUANTITY', payload: { id, quantity: newQuantity } });
  }, [cartItems, dispatchCart, getEffectiveProductStock, handleRemoveItem]);

  const handleProceedToCheckout = useCallback((): void => {
    setShowCheckoutModal(true);
  }, []);

  const handleCheckoutClose = useCallback((): void => {
    setShowCheckoutModal(false);
  }, []);

  const handleAddressSelected = useCallback((addressId: string): void => {
    console.log(`✅ CartDrawer: Proceeding with address ID: ${addressId}`);
    setShowCheckoutModal(false);
  }, []);

  const handleClearCart = useCallback(async (): Promise<void> => {
    try {
      console.log('🧹 CartDrawer: Clearing cart');
      await clearCart();
      
      // Reset sync flag so next open will check again
      setHasPerformedInitialSync(false);
    } catch (error) {
      console.error('❌ CartDrawer: Error clearing cart:', error);
      dispatchCart({ type: 'CLEAR_CART' });
    }
  }, [clearCart, dispatchCart]);

  // MANUAL refresh function (only called when user clicks refresh button)
  const handleManualRefresh = useCallback(async (): Promise<void> => {
    console.log('🔄 Manual cart refresh requested');
    setHasPerformedInitialSync(false); // Reset flag
    await forceRefreshCart();
    setHasPerformedInitialSync(true);
  }, [forceRefreshCart]);

  // Calculate totals using cartUtils
  const calculateTotals = useCallback(() => {
    if (!cartItems || cartItems.length === 0) {
      return {
        normalSubtotal: 0,
        offerSubtotal: 0,
        offerSavings: 0,
        totalItems: 0,
        grandTotal: 0,
      };
    }

    try {
      return cartUtils.calculateDetailedTotals(cartItems);
    } catch (error) {
      console.error('❌ Error calculating totals:', error);
      return {
        normalSubtotal: 0,
        offerSubtotal: 0,
        offerSavings: 0,
        totalItems: 0,
        grandTotal: 0,
      };
    }
  }, [cartItems]);

  const hasOutOfStockItems = useCallback((): boolean => {
    return cartUtils.hasOutOfStockItems(cartItems);
  }, [cartItems]);

  const getOutOfStockItems = useCallback((): string[] => {
    return cartUtils.getOutOfStockItems(cartItems);
  }, [cartItems]);

  const groupedNormalItems = useCallback(() => {
    const normalItems = cartItems.filter(item => item.type === 'normal') as CartNormalItem[];
    return normalItems;
  }, [cartItems]);

  if (!isOpen) return null;

  const totals = calculateTotals();
  const normalItems = groupedNormalItems();
  const offerItems = cartItems.filter(item => item.type === 'offer') as CartOfferItem[];

  console.log('🎨 CartDrawer: Rendering with items:', {
    total: cartItems.length,
    normal: normalItems.length,
    offers: offerItems.length,
    totals,
    authMode,
    hasPerformedSync: hasPerformedInitialSync
  });

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/80 to-black/70 backdrop-blur-sm" onClick={onClose}></div>

        <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform rounded-tl-3xl rounded-bl-3xl">
          <div className="flex flex-col h-full relative overflow-hidden">
            
            {/* Enhanced Header */}
            <div className="relative bg-gradient-to-r from-[var(--color-primary-950)] via-[#1a5f7a] to-[var(--color-primary-950)] text-white shadow-lg">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-2 right-4 w-12 h-12 rounded-full border border-white/30"></div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white/10"></div>
              </div>
              
              <div className="relative flex items-center justify-between py-4 px-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3 animate-pulse">
                    <ShoppingCart size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Your Cart</h3>
                    <p className="text-white/80 text-sm">
                      {totals.totalItems} {totals.totalItems === 1 ? 'item' : 'items'}
                      {authMode === 'authenticated' && (
                        <span className="ml-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                          Synced
                        </span>
                      )}
                      {totals.offerSavings > 0 && (
                        <span className="ml-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                          Save ₹{totals.offerSavings.toFixed(0)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={onClose} 
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-300 transform hover:scale-110"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Enhanced Cart Items */}
            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
              {contextLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-[var(--color-primary-950)] rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-b-yellow-400 rounded-full animate-spin animation-delay-150"></div>
                  </div>
                  <p className="ml-4 text-gray-600 font-medium">
                    {authMode === 'authenticated' ? 'Syncing cart...' : 'Loading cart items...'}
                  </p>
                </div>
              ) : (
                <>
                  {cartItems.length > 0 ? (
                    <div className="p-4 space-y-4">
                      {/* Normal Items Section */}
                      {normalItems.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 mb-3">
                            <div className="flex items-center">
                              <div className="w-6 h-6 bg-[var(--color-primary-950)] rounded-full flex items-center justify-center mr-2">
                                <span className="text-white text-xs">🛍️</span>
                              </div>
                              <h4 className="text-sm font-bold text-[var(--color-primary-950)]">Regular Items</h4>
                            </div>
                            <span className="bg-white text-[var(--color-primary-950)] text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                              {normalItems.length}
                            </span>
                          </div>
                          
                          <div className="space-y-3">
                            {normalItems.map((item) => {
                              const effectiveMaxForThisItem = item.selectedVariant?.quantity ?? item.stock_quantity;

                              return (
                                <CartItem
                                  key={`${item.id}-${item.selectedVariant?.id || 'no-variant'}`}
                                  product={item}
                                  onRemove={handleRemoveItem}
                                  onQuantityChange={handleQuantityChange}
                                  maxAllowedQuantity={effectiveMaxForThisItem}
                                />
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Offer Items Section */}
                      {offerItems.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 mb-3">
                            <div className="flex items-center">
                              <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mr-2">
                                <span className="text-white text-xs">🎁</span>
                              </div>
                              <h4 className="text-sm font-bold text-green-700">Special Offers</h4>
                            </div>
                            <span className="bg-white text-green-700 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                              {offerItems.length}
                            </span>
                          </div>
                          
                          <div className="space-y-3">
                            {offerItems.map((item) => (
                              <OfferCartItem
                                key={item.id}
                                offerSet={item}
                                onRemove={handleRemoveItem}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 px-6">
                      <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <ShoppingCart size={40} className="text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h3>
                      <p className="text-gray-500 mb-6">Start adding some beautiful jewelry to your cart!</p>
                      
                      {authMode === 'authenticated' && (
                        <button
                          onClick={handleManualRefresh}
                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[var(--color-primary-950)] to-[#1a5f7a] text-white rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                        >
                          <RefreshCw size={16} className="mr-2" />
                          Refresh Cart
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Enhanced Cart Summary & Actions */}
            {cartItems.length > 0 && (
              <div className="bg-white border-t border-gray-200 shadow-lg">
                {/* Summary Section */}
                <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50">
                  <div className="space-y-2">
                    {/* Normal Items Subtotal */}
                    {totals.normalSubtotal > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 flex items-center">
                          <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                          Regular Items
                        </span>
                        <span className="font-semibold text-gray-800">₹{totals.normalSubtotal.toFixed(2)}</span>
                      </div>
                    )}

                    {/* Offer Items Subtotal */}
                    {totals.offerSubtotal > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 flex items-center">
                          <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                          Offer Items (Paid)
                        </span>
                        <span className="font-semibold text-gray-800">₹{totals.offerSubtotal.toFixed(2)}</span>
                      </div>
                    )}

                    {/* Offer Savings */}
                    {totals.offerSavings > 0 && (
                      <div className="flex justify-between items-center bg-green-100 -mx-2 px-2 py-2 rounded-lg">
                        <span className="text-green-700 font-semibold flex items-center text-sm">
                          <span className="text-base mr-2">🎉</span>
                          You Save (Free Items)
                        </span>
                        <span className="text-lg font-bold text-green-700">₹{totals.offerSavings.toFixed(2)}</span>
                      </div>
                    )}

                    {/* Total */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-300">
                      <div>
                        <span className="text-lg font-bold text-[var(--color-primary-950)]">Total</span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[var(--color-primary-950)]">
                          ₹{totals.grandTotal.toFixed(2)}
                        </div>
                        {totals.offerSavings > 0 && (
                          <div className="text-xs text-green-600 font-semibold">
                            You saved ₹{totals.offerSavings.toFixed(2)}!
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Out of Stock Warning */}
                {hasOutOfStockItems() && (
                  <div className="mx-4 mb-4 bg-red-50 border-2 border-red-200 text-red-700 p-4 rounded-xl">
                    <div className="flex items-center mb-2">
                      <span className="text-xl mr-2">⚠️</span>
                      <h4 className="font-semibold">Out of Stock Items</h4>
                    </div>
                    <p className="text-sm mb-2">Please remove these items to continue:</p>
                    <ul className="text-sm list-disc pl-5 space-y-1">
                      {getOutOfStockItems().map((name, index) => (
                        <li key={index} className="font-medium">{name}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="p-4 space-y-3">
                  <div className="flex gap-3">
                    <button
                      className="flex items-center justify-center px-4 py-3 border-2 border-[var(--color-primary-950)] text-[var(--color-primary-950)] font-semibold rounded-xl hover:bg-[var(--color-primary-950)] hover:text-white transition-all duration-300 transform hover:scale-105"
                      onClick={handleClearCart}
                    >
                      <Trash2 size={16} className="mr-2" />
                      Clear
                    </button>
                    
                    <button
                      className={`flex-1 font-bold py-4 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center shadow-lg ${
                        hasOutOfStockItems() 
                          ? 'bg-gray-400 cursor-not-allowed text-white' 
                          : 'bg-gradient-to-r from-[var(--color-primary-950)] via-[#1a5f7a] to-[var(--color-primary-950)] hover:shadow-xl text-white'
                      }`}
                      onClick={hasOutOfStockItems() ? undefined : handleProceedToCheckout}
                      disabled={hasOutOfStockItems()}
                    >
                      {hasOutOfStockItems() ? (
                        <>
                          <span className="mr-2">⚠️</span>
                          Remove Out of Stock Items
                        </>
                      ) : (
                        <>
                          <span className="mr-2">🛒</span>
                          Proceed To Checkout
                          <span className="ml-2">→</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Checkout Modal */}
        {showCheckoutModal && (
          <CheckoutModal
            isOpen={showCheckoutModal}
            onClose={handleCheckoutClose}
            onProceed={handleAddressSelected}
            normalItemsForCheckout={normalItems}
            offerSetsForCheckout={offerItems}
            checkoutMode={'cart'}
          />
        )}
      </div>
    </>
  );
};

export default CartDrawer;