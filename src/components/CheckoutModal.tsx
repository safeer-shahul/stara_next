'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import apiService from '@/utils/api/apiService';
import AddressForm from './AddressForm';
import AuthModal from './auth/AuthModal';
import ProductSummary from './ProductSummary';
import BillSummary from './BillSummary';
import RazorpayPayment from './RazorpayPayment';
import OrderConfirmation from './OrderConfirmation';

import { CartOfferItem, CartNormalItem, ProductItemDetails } from '@/context/cartContext';
import { useCart } from '@/context/cartContext';
import { v4 as uuidv4 } from 'uuid';

enum CheckoutStep {
  ADDRESS_SELECTION,
  BILL_SUMMARY,
  PAYMENT_PROCESSING,
  ORDER_CONFIRMATION,
}

interface Address {
  id: string;
  address: string;
  town: string;
  state: string;
  pincode: string;
  phone_number_1: string;
  phone_number_2?: string;
  is_default: boolean;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: (addressId: string) => void;
  checkoutMode: 'cart' | 'buy_now';
  buyNowProduct?: ProductItemDetails | null;
  normalItemsForCheckout?: CartNormalItem[];
  offerSetsForCheckout?: CartOfferItem[];
}

const INDIAN_STATES: { [key: string]: string } = {
  "AN": "Andaman and Nicobar Islands",
  "AP": "Andhra Pradesh",
  "AR": "Arunachal Pradesh",
  "AS": "Assam",
  "BR": "Bihar",
  "CG": "Chandigarh",
  "CH": "Chhattisgarh",
  "DN": "Dadra and Nagar Haveli",
  "DD": "Daman and Diu",
  "DL": "Delhi",
  "GA": "Goa",
  "GJ": "Gujarat",
  "HR": "Haryana",
  "HP": "Himachal Pradesh",
  "JK": "Jammu and Kashmir",
  "JH": "Jharkhand",
  "KA": "Karnataka",
  "KL": "Kerala",
  "LA": "Ladakh",
  "LD": "Lakshadweep",
  "MP": "Madhya Pradesh",
  "MH": "Maharashtra",
  "MN": "Manipur",
  "ML": "Meghalaya",
  "MZ": "Mizoram",
  "NL": "Nagaland",
  "OR": "Odisha",
  "PY": "Puducherry",
  "PB": "Punjab",
  "RJ": "Rajasthan",
  "SK": "Sikkim",
  "TN": "Tamil Nadu",
  "TS": "Telangana",
  "TR": "Tripura",
  "UP": "Uttar Pradesh",
  "UK": "Uttarakhand",
  "WB": "West Bengal"
};

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onProceed,
  checkoutMode,
  buyNowProduct,
  normalItemsForCheckout = [],
  offerSetsForCheckout = [],
}) => {
  const { clearCart, authMode, checkBackendCartEmpty } = useCart();

  // Memoized normal items for checkout
  const memoizedNormalItems: CartNormalItem[] = useMemo(() => {
    if (checkoutMode === 'buy_now' && buyNowProduct) {
      return [{
        id: uuidv4(),
        product_id: buyNowProduct.id,
        quantity: 1,
        type: 'normal',
        isSynced: false,
        product_name: buyNowProduct.product_name,
        product_price: buyNowProduct.product_price,
        strike_price: buyNowProduct.strike_price,
        images: buyNowProduct.images,
        isInStock: buyNowProduct.isInStock,
        stock_quantity: buyNowProduct.selectedVariant?.quantity ?? buyNowProduct.quantity,
        ...(buyNowProduct.selectedVariant && { selectedVariant: buyNowProduct.selectedVariant }),
        productDetails: buyNowProduct,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }];
    }
    return normalItemsForCheckout;
  }, [normalItemsForCheckout, checkoutMode, buyNowProduct]);

  const memoizedOfferSets: CartOfferItem[] = useMemo(() => {
    if (checkoutMode === 'buy_now') return [];
    return offerSetsForCheckout;
  }, [offerSetsForCheckout, checkoutMode]);

  // State management
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(CheckoutStep.ADDRESS_SELECTION);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [staraOrderId, setStaraOrderId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'canceled'>('success');
  const [paymentMethod, setPaymentMethod] = useState<'Cod' | 'Razorpay'>('Razorpay');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalClosed, setAuthModalClosed] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Reset state on modal open
  const resetCheckoutState = useCallback(() => {
    setCurrentStep(CheckoutStep.ADDRESS_SELECTION);
    setError(null);
    setPaymentMethod('Razorpay');
    setOrderId(null);
    setStaraOrderId(null);
    setPaymentId(null);
    setPaymentStatus('success');
    setSelectedAddressId(null);
    setSelectedAddress(null);
    setLoading(true);
    setShowAddressForm(false);
  }, []);

  // Check authentication
  const checkAuthentication = useCallback(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      setIsAuthenticated(true);
      return true;
    }
    setShowAuthModal(true);
    setIsAuthenticated(false);
    return false;
  }, []);

  // Fetch addresses
  const fetchAddresses = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const response = await apiService.getAddresses();
      if (response && Array.isArray(response)) {
        setAddresses(response);
        const defaultAddress = response.find((addr) => addr.is_default);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          setSelectedAddress(defaultAddress);
        } else if (response.length > 0) {
          setSelectedAddressId(response[0].id);
          setSelectedAddress(response[0]);
        }
      } else {
        setAddresses([]);
      }
    } catch (error) {
      console.error('❌ Error fetching addresses:', error);
      setError('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Clear cart after successful order
  const handleCartClear = useCallback(async () => {
    if (checkoutMode === 'cart') {
      try {
        await clearCart();
        console.log('✅ Cart cleared successfully');
      } catch (error) {
        console.error('❌ Error clearing cart:', error);
      }
    }
  }, [checkoutMode, clearCart]);

  // Multi-device sync check on checkout modal open
  useEffect(() => {
    if (isOpen && authMode === 'authenticated' && checkoutMode === 'cart') {
      const checkCartBeforeCheckout = async () => {
        try {
          console.log('🔍 Checking cart before checkout...');
          const backendIsEmpty = await checkBackendCartEmpty();
          
          if (backendIsEmpty && (normalItemsForCheckout.length > 0 || offerSetsForCheckout.length > 0)) {
            // Cart was completed on another device
            console.log('⚠️ Cart was already completed on another device');
            alert('This cart was already completed on another device. Redirecting...');
            onClose();
            return;
          }
        } catch (error) {
          console.error('❌ Error checking cart before checkout:', error);
        }
      };

      checkCartBeforeCheckout();
    }
  }, [isOpen, authMode, checkoutMode, checkBackendCartEmpty, normalItemsForCheckout.length, offerSetsForCheckout.length, onClose]);

  // Initialize on modal open
  useEffect(() => {
    if (isOpen) {
      resetCheckoutState();
      const isAuth = checkAuthentication();
      if (isAuth) fetchAddresses();
      else setLoading(false);
    }
  }, [isOpen, resetCheckoutState, checkAuthentication, fetchAddresses]);

  // Handle body scroll lock
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

  // Handle auth modal close
  useEffect(() => {
    if (authModalClosed && !isAuthenticated) {
      onClose();
    }
  }, [authModalClosed, isAuthenticated, onClose]);

  // Event handlers
  const handleProceedToPayment = () => {
    if (selectedAddressId && selectedAddress) {
      setCurrentStep(CheckoutStep.BILL_SUMMARY);
    }
  };

  const handleOrderCreated = async (
    method: 'Cod' | 'Razorpay',
    razorpayOrderId: string,
    staraOrderID: string
  ) => {
    setOrderId(razorpayOrderId);
    setStaraOrderId(staraOrderID);
    setPaymentMethod(method);
    console.log("📦 Order created:", method, razorpayOrderId);

    if (method === 'Razorpay') {
      setCurrentStep(CheckoutStep.PAYMENT_PROCESSING);
    } else {
      await handleCartClear();
      setPaymentStatus('success');
      setCurrentStep(CheckoutStep.ORDER_CONFIRMATION);
    }
  };

  const handlePaymentSuccess = async (paymentId?: string) => {
    if (paymentId) {
      setPaymentId(paymentId);
    }
    setPaymentStatus('success');
    await handleCartClear();
    setCurrentStep(CheckoutStep.ORDER_CONFIRMATION);
    console.log('✅ Payment success:', orderId, paymentId);
  };

  const handlePaymentError = (errorMessage?: string) => {
    setError(errorMessage || 'Payment failed. Please try again.');
    setPaymentStatus('failed');
    setCurrentStep(CheckoutStep.ORDER_CONFIRMATION);
  };

  const handlePaymentCancel = () => {
    setPaymentStatus('canceled');
    setCurrentStep(CheckoutStep.ORDER_CONFIRMATION);
  };

  const handleRetryPayment = () => {
    setError(null);
    setCurrentStep(CheckoutStep.BILL_SUMMARY);
  };

  const handleBackToAddresses = () => {
    setCurrentStep(CheckoutStep.ADDRESS_SELECTION);
  };

  const handleBackToBillSummary = () => {
    setCurrentStep(CheckoutStep.BILL_SUMMARY);
  };

  const handleContinueShopping = () => {
    if (selectedAddressId) {
      onProceed(selectedAddressId);
    }
    onClose();
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setShowAuthModal(false);
    fetchAddresses();
  };

  const handleAuthModalClose = () => {
    setShowAuthModal(false);
    setAuthModalClosed(true);

    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      handleAuthSuccess();
    }
  };

  const handleAddressSelection = (addressId: string) => {
    setSelectedAddressId(addressId);
    const address = addresses.find((addr) => addr.id === addressId);
    if (address) {
      setSelectedAddress(address);
    }
  };

  const handleBillSummaryError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleClose = () => {
    onClose();
  };

  const handleAddressFormSuccess = async (newAddressId: string) => {
    await fetchAddresses();
    setSelectedAddressId(newAddressId);
    const newlyAddedAddress = addresses.find(addr => addr.id === newAddressId);
    if (newlyAddedAddress) {
      setSelectedAddress(newlyAddedAddress);
    }
    setShowAddressForm(false);
  };

  if (!isOpen) return null;

  // Special styling for order confirmation
  const isOrderConfirmation = currentStep === CheckoutStep.ORDER_CONFIRMATION;

  return (
    <>
      {/* Order Confirmation - Full Screen without background */}
      {isOrderConfirmation ? (
        <div className="fixed inset-0 z-50">
          <OrderConfirmation
            orderId={staraOrderId}
            paymentId={paymentId}
            paymentMethod={paymentMethod}
            paymentStatus={paymentStatus}
            errorMessage={error}
            onContinueShopping={handleContinueShopping}
            onRetryPayment={handleRetryPayment}
          />
        </div>
      ) : (
        /* Regular Checkout Modal */
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center">
          {/* Background overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/80 to-black/70 backdrop-blur-sm" onClick={handleClose}></div>

          <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col max-h-[90vh] rounded-2xl">
            {/* Enhanced Header */}
            <div className="relative bg-white border-b border-gray-200 shadow-sm rounded-t-2xl">
              <div className="flex justify-between items-center p-4 min-h-[60px]">
                <div className="flex items-center flex-1 mr-4">
                  {currentStep !== CheckoutStep.ADDRESS_SELECTION && (
                    <button
                      onClick={
                        currentStep === CheckoutStep.BILL_SUMMARY
                          ? handleBackToAddresses
                          : currentStep === CheckoutStep.PAYMENT_PROCESSING
                            ? handleBackToBillSummary
                            : undefined
                      }
                      className="mr-3 p-2 rounded-lg bg-gray-100 hover:bg-[var(--color-primary-950)] hover:text-white transition-all duration-300 flex-shrink-0"
                    >
                      <ArrowLeft size={18} />
                    </button>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-[var(--color-primary-950)] truncate">
                      {currentStep === CheckoutStep.ADDRESS_SELECTION && 'Secure Checkout'}
                      {currentStep === CheckoutStep.BILL_SUMMARY && 'Order Summary'}
                      {currentStep === CheckoutStep.PAYMENT_PROCESSING && 'Processing Payment'}
                    </h3>
                    <p className="text-gray-600 text-sm truncate">
                      {currentStep === CheckoutStep.ADDRESS_SELECTION && 'Choose your delivery address'}
                      {currentStep === CheckoutStep.BILL_SUMMARY && 'Review your order details'}
                      {currentStep === CheckoutStep.PAYMENT_PROCESSING && 'Please wait while we process your payment'}
                    </p>
                    {authMode === 'authenticated' && (
                      <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        🔄 Synced
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-red-500 hover:text-white transition-all duration-300 flex-shrink-0"
                  disabled={currentStep === CheckoutStep.PAYMENT_PROCESSING && !error}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Progress indicator */}
              <div className="h-1 bg-gray-200">
                <div 
                  className="h-full bg-gradient-to-r from-[var(--color-primary-950)] to-[#1a5f7a] transition-all duration-500 ease-out"
                  style={{ 
                    width: `${((currentStep + 1) / 4) * 100}%` 
                  }}
                ></div>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1">
              {showAuthModal && !isAuthenticated ? (
                <AuthModal isOpen={true} onClose={handleAuthModalClose} />
              ) : (
                <div className="py-6 px-1 bg-gradient-to-b from-gray-50 to-white">

                  {/* Address Selection Step */}
                  {currentStep === CheckoutStep.ADDRESS_SELECTION && (
                    <>
                      {loading ? (
                        <div className="flex justify-center items-center h-40">
                          <div className="relative">
                            <div className="w-12 h-12 border-4 border-gray-200 border-t-[var(--color-primary-950)] rounded-full animate-spin"></div>
                            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-b-yellow-400 rounded-full animate-spin animation-delay-150"></div>
                          </div>
                          <p className="ml-4 text-gray-600 font-medium">Loading addresses...</p>
                        </div>
                      ) : showAddressForm ? (
                        <AddressForm
                          onSuccess={handleAddressFormSuccess}
                          onCancel={() => setShowAddressForm(false)}
                        />
                      ) : (
                        <>
                          <div className="mb-6 bg-white p-3 rounded-xl shadow-lg border border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                              <h4 className="font-semibold text-sm text-gray-800 flex items-center">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[var(--color-primary-950)] to-[#1a5f7a] flex items-center justify-center mr-3">
                                  <span className="text-white text-xs font-bold">📍</span>
                                </div>
                                Select Delivery Address
                              </h4>
                              <button
                                onClick={() => setShowAddressForm(true)}
                                className="px-4 py-2 bg-gradient-to-r from-[var(--color-primary-950)] to-[#1a5f7a] text-white text-xs font-medium rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                              >
                                + Add New
                              </button>
                            </div>

                            {addresses.length === 0 ? (
                              <div className="text-center py-8">
                                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                  <span className="text-xs">📍</span>
                                </div>
                                <p className="text-gray-500 text-sm mb-4">No addresses found. Please add a new address.</p>
                                <button
                                  onClick={() => setShowAddressForm(true)}
                                  className="px-6 py-3 text-sm bg-gradient-to-r from-[var(--color-primary-950)] to-[#1a5f7a] text-white font-medium rounded-lg hover:shadow-lg transition-all duration-300"
                                >
                                  Add Your First Address
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                                {addresses.map(address => (
                                  <div
                                    key={address.id}
                                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                                      selectedAddressId === address.id
                                        ? 'border-[var(--color-primary-950)] bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg'
                                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
                                    }`}
                                    onClick={() => handleAddressSelection(address.id)}
                                  >
                                    <div className="flex items-start">
                                      <div className={`w-6 h-6 mt-1 mr-4 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                        selectedAddressId === address.id 
                                          ? 'border-[var(--color-primary-950)] bg-[var(--color-primary-950)]' 
                                          : 'border-gray-300'
                                      }`}>
                                        {selectedAddressId === address.id && (
                                          <div className="w-3 h-3 rounded-full bg-white animate-pulse"></div>
                                        )}
                                      </div>
                                      <div className='flex-1'>
                                        <p className="text-gray-800 text-sm font-medium leading-relaxed">{address.address}</p>
                                        <p className="text-gray-600 text-sm mt-1">{INDIAN_STATES[address.state] ?? address.state}, {address.town} - {address.pincode}</p>
                                        <p className="text-gray-600 text-sm">📞 {address.phone_number_1}</p>
                                        {address.phone_number_2 && <p className="text-gray-600">📞 {address.phone_number_2}</p>}
                                        {address.is_default && (
                                          <span className="inline-block mt-2 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs rounded-full font-medium">
                                            ⭐ Default Address
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      <div>
                        <ProductSummary
                          normalItems={memoizedNormalItems}
                          offerSets={memoizedOfferSets}
                          parentLoading={loading}
                        />
                      </div>
                    </>
                  )}

                  {/* Bill Summary Step */}
                  {currentStep === CheckoutStep.BILL_SUMMARY && selectedAddress && (
                    <BillSummary
                      normalItems={memoizedNormalItems}
                      offerSets={memoizedOfferSets}
                      destinationPincode={selectedAddress.pincode}
                      onPlaceOrder={handleOrderCreated}
                      onError={handleBillSummaryError}
                      addressID={selectedAddressId!}
                      checkoutMode={checkoutMode}
                    />
                  )}

                  {/* Payment Processing Step */}
                  {currentStep === CheckoutStep.PAYMENT_PROCESSING && orderId && selectedAddress && (
                    <RazorpayPayment
                      orderId={orderId}
                      customerPhone={selectedAddress.phone_number_1}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      onCancel={handlePaymentCancel}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Enhanced Footer Button for Address Selection */}
            {currentStep === CheckoutStep.ADDRESS_SELECTION && addresses.length > 0 && !showAddressForm && (
              <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-t border-gray-100 rounded-b-2xl">
                <button
                  className="w-full bg-gradient-to-r from-[var(--color-primary-950)] via-[#1a5f7a] to-[var(--color-primary-950)] text-white font-semibold py-4 rounded-xl hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  onClick={handleProceedToPayment}
                  disabled={!selectedAddressId}
                >
                  <span className="flex items-center justify-center">
                    Continue with Selected Address
                    <span className="ml-2">→</span>
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CheckoutModal;