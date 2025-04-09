'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import apiService from '@/utils/api/apiService';
import AddressForm from './AddressForm';
import INDIAN_STATES from './states';
import AuthModal from './auth/AuthModal';
import ProductSummary from './ProductSummary';
import BillSummary from './BillSummary';

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
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalClosed, setAuthModalClosed] = useState(false);
  const [showBillSummary, setShowBillSummary] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

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
      setShowBillSummary(false); // Reset bill summary view when modal is opened
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

  const handleProceed = () => {
    if (selectedAddressId && selectedAddress) {
      // Show the bill summary instead of immediately proceeding
      setShowBillSummary(true);
    }
  };
  
  const handleBillSummaryComplete = () => {
    // This will be called when the order is placed successfully
    if (selectedAddressId) {
      onProceed(selectedAddressId);
    }
    setShowBillSummary(false);
  };
  
  const handleBillSummaryBack = () => {
    // Go back to address selection
    setShowBillSummary(false);
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

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 bg-black/80" onClick={onClose}></div>
        
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
            <h3 className="text-lg font-medium">Checkout</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
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
                        onClick={handleProceed}
                        disabled={!selectedAddressId}
                      >
                        Proceed with Selected Address
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Bill Summary Modal */}
      {selectedAddress && (
        <BillSummary
          isOpen={showBillSummary}
          onClose={onClose}
          onBack={handleBillSummaryBack}
          onComplete={handleBillSummaryComplete}
          orderItems={orderItems}
          couponCode={coupon_code_id}
          destinationPincode={selectedAddress.pincode}
          addressId={selectedAddressId || ''}
        />
      )}
    </>
  );
};

export default CheckoutModal;