'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import apiService from '@/utils/api/apiService';
import AddressForm from './AddressForm';
import AuthModal from './auth/AuthModal';
import ProductSummary from './ProductSummary'; // Ensure correct path
import BillSummary from './BillSummary';
import RazorpayPayment from './RazorpayPayment';
import OrderConfirmation from './OrderConfirmation';

import { CartOfferItem, CartNormalItem, CartItemType } from '@/context/cartContext';

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
    cartItems: CartItemType[];
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
    "DD": "Daman and Diu", // Corrected typo
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
    cartItems = [],
}) => {
    // Memoize these filters to ensure stable references are passed to ProductSummary
    const memoizedNormalItems = useMemo(() => {
        const filtered = cartItems.filter((item): item is CartNormalItem => item.type === 'normal');
        console.log("CheckoutModal: normalItems for display (memoized)", filtered);
        return filtered;
    }, [cartItems]);

    const memoizedOfferSets = useMemo(() => {
        const filtered = cartItems.filter((item): item is CartOfferItem => item.type === 'offer');
        console.log("CheckoutModal: offerSets for display (memoized)", filtered);
        return filtered;
    }, [cartItems]);

    const [currentStep, setCurrentStep] = useState<CheckoutStep>(CheckoutStep.ADDRESS_SELECTION);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
    const [loading, setLoading] = useState(true); // Main loading state for addresses/auth
    const [error, setError] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'Cod' | 'Razorpay'>('Razorpay');
    const [orderId, setOrderId] = useState<string | null>(null);
    const [staraOrderId, setStaraOrderId] = useState<string | null>(null);
    const [paymentId, setPaymentId] = useState<string | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'canceled'>('success');
    const [cartCleared, setCartCleared] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authModalClosed, setAuthModalClosed] = useState(false);
    const [showAddressForm, setShowAddressForm] = useState(false);

    const resetCheckoutState = useCallback(() => {
        setCurrentStep(CheckoutStep.ADDRESS_SELECTION);
        setError(null);
        setPaymentMethod('Razorpay');
        setOrderId(null);
        setStaraOrderId(null);
        setPaymentId(null);
        setPaymentStatus('success');
        setCartCleared(false);
        setSelectedAddressId(null);
        setSelectedAddress(null);
        setLoading(true); // Ensure loading is true when resetting state for new fetch
    }, []);

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

    const fetchAddresses = useCallback(async () => {
        if (!isAuthenticated) {
            setLoading(false); // If not authenticated, stop loading immediately
            return;
        }
        setLoading(true); // Start loading for addresses
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
            console.error('Error fetching addresses:', error);
            setError('Failed to load addresses');
        } finally {
            setLoading(false); // End loading for addresses
        }
    }, [isAuthenticated]);

    const clearCart = useCallback(async () => {
        try {
            await apiService.addToCart({ mode: 'delete_cart' });
            setCartCleared(true);
        }
        catch (error) {
            console.error('Error clearing cart:', error);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            resetCheckoutState();
            const isAuth = checkAuthentication();
            if (isAuth) fetchAddresses();
            else setLoading(false); // If not authenticated, ensure loading state is false after auth check
        }
    }, [isOpen, resetCheckoutState, checkAuthentication, fetchAddresses]);

    useEffect(() => {
        if (authModalClosed && !isAuthenticated) {
            onClose();
        }
    }, [authModalClosed, isAuthenticated, onClose]);

    const handleProceedToPayment = () => {
        if (selectedAddressId && selectedAddress) {
            setCurrentStep(CheckoutStep.BILL_SUMMARY);
        }
    };

    const handleOrderCreated = (
        method: 'Cod' | 'Razorpay',
        razorpayOrderId: string,
        staraOrderID: string
    ) => {
        setOrderId(razorpayOrderId);
        setStaraOrderId(staraOrderID);
        setPaymentMethod(method);
        if (method === 'Razorpay') {
            setCurrentStep(CheckoutStep.PAYMENT_PROCESSING);
        } else {
            clearCart(); // Clear cart for COD
            setPaymentStatus('success');
            setCurrentStep(CheckoutStep.ORDER_CONFIRMATION);
        }
    };

    const handlePaymentSuccess = async (id?: string) => {
        if (id) setPaymentId(id);
        setPaymentStatus('success');
        await clearCart(); // Clear cart after successful payment
        setCurrentStep(CheckoutStep.ORDER_CONFIRMATION);
    };

    const handlePaymentError = (message?: string) => {
        setError(message || 'Payment failed. Please try again.');
        setPaymentStatus('failed');
        setCurrentStep(CheckoutStep.ORDER_CONFIRMATION);
    };

    const handlePaymentCancel = () => {
        setPaymentStatus('canceled');
        setCurrentStep(CheckoutStep.ORDER_CONFIRMATION);
    };

    const handleRetryPayment = () => {
        setCurrentStep(CheckoutStep.PAYMENT_PROCESSING);
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
        setShowAddressForm(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-black/80" onClick={handleClose}></div>
            <div className="relative w-full max-w-md bg-[#e1e1e1] rounded-lg shadow-xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-4 bg-white rounded-t-lg z-10">
                    <div className="flex items-center">
                        {currentStep !== CheckoutStep.ADDRESS_SELECTION && (
                            <button
                                onClick={
                                    currentStep === CheckoutStep.BILL_SUMMARY
                                        ? handleBackToAddresses
                                        : currentStep === CheckoutStep.PAYMENT_PROCESSING
                                            ? handleBackToBillSummary
                                            : undefined
                                }
                                className={`mr-3 text-[#175E7A] hover:text-gray-200 transition-colors ${
                                    currentStep === CheckoutStep.ORDER_CONFIRMATION ? 'hidden' : ''
                                }`}
                            >
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <h3 className="text-lg text-[#175E7A] font-medium">
                            {currentStep === CheckoutStep.ADDRESS_SELECTION && 'Checkout'}
                            {currentStep === CheckoutStep.BILL_SUMMARY && 'Order Summary'}
                            {currentStep === CheckoutStep.PAYMENT_PROCESSING && 'Processing Payment'}
                            {currentStep === CheckoutStep.ORDER_CONFIRMATION && 'Order Confirmation'}
                        </h3>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-[#175E7A] hover:text-gray-200 transition-colors cursor-pointer"
                        disabled={currentStep === CheckoutStep.PAYMENT_PROCESSING && !error}
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="overflow-y-auto flex-1">
                    {showAuthModal && !isAuthenticated ? (
                        <AuthModal isOpen={true} onClose={handleAuthModalClose} />
                    ) : (
                        <div className="p-5">
                            {currentStep === CheckoutStep.ADDRESS_SELECTION && (
                                <>

                                {loading ? ( // This loading is specifically for addresses
                                        <div className="flex justify-center items-center h-40">
                                            <div className="w-8 h-8 border-4 border-gray-200 border-t-[#175e7a] rounded-full animate-spin mr-2"></div>
                                            <p>Loading addresses...</p>
                                        </div>
                                    ) : showAddressForm ? (
                                        <AddressForm
                                            onSuccess={handleAddressFormSuccess}
                                            onCancel={() => setShowAddressForm(false)}
                                        />
                                    ) : (
                                        <>
                                            <div className="mb-6 bg-white p-4 rounded-[12px]">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h4 className="font-medium text-[15px] text-[#494949]">
                                                        Select Delivery Address
                                                    </h4>
                                                    <button
                                                        onClick={() => setShowAddressForm(true)}
                                                        className="text-[13px] text-[#175e7a] cursor-pointer hover:text-blue-800 font-medium transition-colors"
                                                    >
                                                        Add New Address
                                                    </button>
                                                </div>
                                                {addresses.length === 0 ? (
                                                    <div className="text-center py-4">
                                                        <p className="text-gray-500">No addresses found. Please add a new address.</p>
                                                        <button
                                                            onClick={() => setShowAddressForm(true)}
                                                            className="mt-2 text-[13px] text-[#175e7a] cursor-pointer hover:text-blue-800 font-medium transition-colors"
                                                        >
                                                            Add New Address
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                                                        {addresses.map((address) => (
                                                            <div
                                                                key={address.id}
                                                                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                                                    selectedAddressId === address.id
                                                                        ? 'border-[#175e7a] bg-blue-50'
                                                                        : 'border-gray-200 hover:border-gray-300'
                                                                }`}
                                                                onClick={() => handleAddressSelection(address.id)}
                                                            >
                                                                <div className="flex items-start">
                                                                    <div
                                                                        className={`w-5 h-5 mt-1 mr-3 rounded-full border flex items-center justify-center ${
                                                                            selectedAddressId === address.id
                                                                                ? 'border-[#175e7a]'
                                                                                : 'border-gray-300'
                                                                        }`}
                                                                    >
                                                                        {selectedAddressId === address.id && (
                                                                            <div className="w-3 h-3 rounded-full bg-[#175e7a]"></div>
                                                                        )}
                                                                    </div>
                                                                    <div className="mt-[-5px] text-[14px]">
                                                                        <p className="text-gray-800">{address.address}</p>
                                                                        <p className="text-gray-600">
                                                                            {address.town}, {INDIAN_STATES[address.state] ?? address.state} - {address.pincode}
                                                                        </p>
                                                                        <p className="text-gray-600">Phone: {address.phone_number_1}</p>
                                                                        {address.phone_number_2 && (
                                                                            <p className="text-gray-600">Alt Phone: {address.phone_number_2}</p>
                                                                        )}
                                                                        {address.is_default && (
                                                                            <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                                                                                Default Address
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
                                    
                                    {/* ProductSummary is now ALWAYS rendered here, regardless of cart content. */}
                                    {/* Its internal loading will handle the initial calculation and display */}
                                    <div className="mb-6">
                                        <ProductSummary
                                            normalItems={memoizedNormalItems}
                                            offerSets={memoizedOfferSets}
                                            parentLoading={loading} 
                                        />
                                    </div>

                                    
                                </>
                            )}
                            {currentStep === CheckoutStep.BILL_SUMMARY && selectedAddress && (
                                <BillSummary
                                    normalItems={memoizedNormalItems}
                                    offerSets={memoizedOfferSets}
                                    // couponCode prop removed entirely, assuming BillSummary doesn't need it.
                                    destinationPincode={selectedAddress.pincode}
                                    onPlaceOrder={handleOrderCreated}
                                    onError={handleBillSummaryError}
                                    addressID={selectedAddressId}
                                />
                            )}
                            {currentStep === CheckoutStep.PAYMENT_PROCESSING && orderId && selectedAddress && (
                                <RazorpayPayment
                                    orderId={orderId}
                                    customerPhone={selectedAddress.phone_number_1}
                                    onSuccess={handlePaymentSuccess}
                                    onError={handlePaymentError}
                                    onCancel={handlePaymentCancel}
                                />
                            )}
                            {currentStep === CheckoutStep.ORDER_CONFIRMATION && (
                                <OrderConfirmation
                                    orderId={staraOrderId}
                                    paymentId={paymentId}
                                    paymentMethod={paymentMethod}
                                    paymentStatus={paymentStatus}
                                    errorMessage={error}
                                    onContinueShopping={handleContinueShopping}
                                    onRetryPayment={handleRetryPayment}
                                    cartCleared={cartCleared}
                                />
                            )}
                        </div>
                    )}
                </div>
                {currentStep === CheckoutStep.ADDRESS_SELECTION && addresses.length > 0 && !showAddressForm && (
                    <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                        <button
                            className="w-full bg-[#175e7a] text-[14px] text-white font-medium py-3 rounded-md hover:bg-[#0f4c67] cursor-pointer transition-colors shadow-sm"
                            onClick={handleProceedToPayment}
                            disabled={!selectedAddressId}
                        >
                            Proceed with Selected Address
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CheckoutModal;
