'use client';

import { useState, useEffect } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import apiService from '@/utils/api/apiService';
import AddressForm from './AddressForm';
import INDIAN_STATES from './states';
import AuthModal from './auth/AuthModal';
import ProductSummary from './ProductSummary';
import BillSummary from './BillSummary';
import RazorpayPayment from './RazorpayPayment';
import OrderConfirmation from './OrderConfirmation';

enum CheckoutStep {
  ADDRESS_SELECTION,
  BILL_SUMMARY,
  PAYMENT_PROCESSING,
  ORDER_CONFIRMATION
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
  orderItems?: Array<{
    product_id: string;
    quantity: number;
  }>;
  coupon_code_id?: string;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ 
  isOpen, 
  onClose, 
  onProceed, 
  orderItems = [], 
  coupon_code_id 
}) => {
  // Common state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalClosed, setAuthModalClosed] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  
  // Current step tracking
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(CheckoutStep.ADDRESS_SELECTION);
  
  // Order state
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Cod' | 'Razorpay'>('Razorpay');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuthentication = () => {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        setIsAuthenticated(true);
        fetchAddresses();
      } else {
        setIsAuthenticated(false);
        setShowAuthModal(true);
      }
    };

    if (isOpen) {
      checkAuthentication();
      // Reset to address selection when modal is reopened
      setCurrentStep(CheckoutStep.ADDRESS_SELECTION);
      setError(null);
    }
  }, [isOpen]);

  // Check if we should close the checkout modal completely
  useEffect(() => {
    if (authModalClosed && !isAuthenticated) {
      onClose();
    }
  }, [authModalClosed, isAuthenticated, onClose]);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const response = await apiService.getAddresses();
      if (response && Array.isArray(response)) {
        setAddresses(response);
        
        // Select default address if available
        const defaultAddress = response.find(addr => addr.is_default);
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
      console.error('Error fetching addresses:', error);
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToPayment = () => {
    if (selectedAddressId && selectedAddress) {
      // Proceed to bill summary view
      setCurrentStep(CheckoutStep.BILL_SUMMARY);
    }
  };
  
  const handleOrderCreated = (paymentMethod: 'Cod' | 'Razorpay', razorpayOrderId: string) => {
    setOrderId(razorpayOrderId);
    setPaymentMethod(paymentMethod);
    console.log(paymentMethod,razorpayOrderId)
    if (paymentMethod === 'Razorpay') {
      // Proceed to payment processing
      setCurrentStep(CheckoutStep.PAYMENT_PROCESSING);
    } else {
      // For COD, just show confirmation
      setCurrentStep(CheckoutStep.ORDER_CONFIRMATION);
    }
  };
  
  const handlePaymentSuccess = () => {
    setPaymentId(paymentId);
    setCurrentStep(CheckoutStep.ORDER_CONFIRMATION);
  };
  
  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
    // Stay on the payment processing step, but show error
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
    
    // Check if user got authenticated during login
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      handleAuthSuccess();
    }
  };
  
  const handleAddressSelection = (addressId: string) => {
    setSelectedAddressId(addressId);
    const address = addresses.find(addr => addr.id === addressId);
    if (address) {
      setSelectedAddress(address);
    }
  };

  const handleBillSummaryError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/80" onClick={onClose}></div>
      
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center">
            {currentStep !== CheckoutStep.ADDRESS_SELECTION && (
              <button 
                onClick={currentStep === CheckoutStep.BILL_SUMMARY ? handleBackToAddresses : 
                         currentStep === CheckoutStep.PAYMENT_PROCESSING ? handleBackToBillSummary : 
                         undefined}
                className={`mr-3 text-gray-500 hover:text-gray-700 ${
                  currentStep === CheckoutStep.ORDER_CONFIRMATION ? 'invisible' : ''
                }`}
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h3 className="text-lg font-medium">
              {currentStep === CheckoutStep.ADDRESS_SELECTION && 'Checkout'}
              {currentStep === CheckoutStep.BILL_SUMMARY && 'Order Summary'}
              {currentStep === CheckoutStep.PAYMENT_PROCESSING && 'Processing Payment'}
              {currentStep === CheckoutStep.ORDER_CONFIRMATION && 'Order Confirmation'}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
            disabled={currentStep === CheckoutStep.PAYMENT_PROCESSING && !error}
          >
            <X size={20} />
          </button>
        </div>

        {showAuthModal && !isAuthenticated ? (
          <AuthModal 
            isOpen={true} 
            onClose={handleAuthModalClose} 
          />
        ) : (
          <div className="p-4">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
                {error}
              </div>
            )}

            {/* Address Selection Step */}
            {currentStep === CheckoutStep.ADDRESS_SELECTION && (
              <>
                {/* Product Summary Section - only shown if items exist */}
                {orderItems.length > 0 && (
                  <ProductSummary 
                    items={orderItems}
                    coupon_code_id={coupon_code_id}
                  />
                )}
                
                {loading ? (
                  <div className="flex justify-center items-center h-40">
                    <p>Loading addresses...</p>
                  </div>
                ) : showAddressForm ? (
                  <AddressForm 
                    onSuccess={(newAddressId) => {
                      fetchAddresses().then(() => {
                        setSelectedAddressId(newAddressId);
                        setShowAddressForm(false);
                      });
                    }} 
                    onCancel={() => setShowAddressForm(false)} 
                  />
                ) : (
                  <>
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">Select Delivery Address</h4>
                        <button 
                          onClick={() => setShowAddressForm(true)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Add New Address
                        </button>
                      </div>

                      {addresses.length === 0 ? (
                        <div className="text-center py-6 bg-gray-50 rounded">
                          <p className="text-gray-500 mb-4">No addresses found</p>
                          <button 
                            onClick={() => setShowAddressForm(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Add an Address
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {addresses.map(address => (
                            <div 
                              key={address.id}
                              className={`p-3 border rounded cursor-pointer ${selectedAddressId === address.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                              onClick={() => handleAddressSelection(address.id)}
                            >
                              <div className="flex items-start">
                                <input 
                                  type="radio" 
                                  checked={selectedAddressId === address.id}
                                  onChange={() => handleAddressSelection(address.id)}
                                  className="mt-1 mr-2"
                                />
                                <div>
                                  <p>{address.address}</p>
                                  <p>{address.town}, {INDIAN_STATES[address.state]} - {address.pincode}</p>
                                  <p>Phone: {address.phone_number_1}</p>
                                  {address.phone_number_2 && <p>Alt Phone: {address.phone_number_2}</p>}
                                  {address.is_default && <span className="text-xs text-green-600">Default Address</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {addresses.length > 0 && (
                      <div className="mt-6">
                        <button 
                          className="w-full bg-[#175e7a] text-white font-medium py-3 rounded"
                          onClick={handleProceedToPayment}
                          disabled={!selectedAddressId}
                        >
                          Proceed with Selected Address
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

              {currentStep === CheckoutStep.BILL_SUMMARY && selectedAddress && (
                <BillSummary
                  orderItems={orderItems}
                  couponCode={coupon_code_id}
                  destinationPincode={selectedAddress.pincode}
                  onPlaceOrder={handleOrderCreated} 
                  onError={handleBillSummaryError}
                  onBack={handleBackToAddresses}
                />
              )}

              {currentStep === CheckoutStep.PAYMENT_PROCESSING && orderId && selectedAddress && (
                <RazorpayPayment
                  orderId={orderId}
                  customerPhone={selectedAddress.phone_number_1}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              )}

              {currentStep === CheckoutStep.ORDER_CONFIRMATION && orderId && (
                <OrderConfirmation
                  orderId={orderId}
                  paymentId={paymentId}
                  paymentMethod={paymentMethod}
                  onContinueShopping={handleContinueShopping}
                />
              )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutModal;