'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import ProductImageSlider from '@/components/ProductImageSlider';
import AddToCartButton from '@/components/AddToCartButton';
import DeliveryPincodeChecker from '@/components/DeliveryPincodeChecker';
import PolicyIcons from '@/components/PolicyIcons';
import CartDrawer from '@/components/CartDrawer';
import CheckoutModal from '@/components/CheckoutModal';
import apiService from '@/utils/api/apiService';
import { useCart } from '@/context/cartContext';
import { v4 as uuidv4 } from 'uuid'; // Import uuidv4 for temporary IDs.
import { ProductItemDetails, CartNormalItem } from '@/context/cartContext'; // Import ProductItemDetails and CartNormalItem

// Import missing Lucide React icons
import { AlertCircle, CheckCircle2, Star } from 'lucide-react';
import Image from 'next/image'; // Import Image from next/image

// Static product data (kept as is)
const staticProductData = {
  discount: '38%',
  offer: 'Buy 1 Get 1 Free Use Code: BIG1 at checkout',
  isGift: false,
  giftSpecialPrice: '₹399.00',
  delivery: 'Typically arrives in 3-4 Days',
  returnPolicy: '2 Days Return',
  exchangePolicy: '10 Days Exchange',
  paymentOptions: 'Cash On Delivery',
  rating: 5,
  reviewCount: 236,
  features: [
    { name: 'Lifetime Warranty', icon: '/images/icons/warranty.svg' },
    { name: 'Skin Safe Jewellery', icon: '/images/icons/skin-safe.svg' },
    { name: '18k Gold Tone Plated', icon: '/images/icons/gold-plated.svg' },
  ],
};

export default function ProductDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const productId = params.id as string;
  const fromOffer = searchParams.get('from') === 'offer';

  const { dispatchCart } = useCart(); // We don't need cartItems directly here for Buy Now logic

  // Removed isGift and isModalOpen if they are not actually used in this component's logic.
  // If `openModal` implies opening a product details modal/drawer (which isn't provided),
  // this state and function would need to be re-added along with the modal component.
  // const [isGift, setIsGift] = useState(false);
  // const [isModalOpen, setIsModalOpen] = useState(false);

  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutToOpen] = useState<boolean>(false);
  const [product, setProduct] = useState<ProductItemDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null); // Keep if you still need to highlight product in cart.

  // NEW STATES FOR DIRECT BUY NOW
  const [isDirectBuyCheckoutMode, setIsDirectBuyCheckoutMode] = useState<boolean>(false);
  const [directBuyProductData, setDirectBuyProductData] = useState<ProductItemDetails | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (productId) {
          setIsLoading(true);
          const fetchedProduct: ProductItemDetails = await apiService.getProductByID(productId.replace(/-/g, ''));
          if (fetchedProduct) {
            fetchedProduct.isInStock = fetchedProduct.product_status && fetchedProduct.quantity > 0;
          }
          setProduct(fetchedProduct);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product details');
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  // If you had a separate product detail modal, `openModal` would be its trigger.
  // For now, removing the call since `openModal` is not defined here.
  // const openModal = () => {
  //   setIsModalOpen(true);
  // };

  const handleAddToBag = async () => {
    if (product) {
      setSelectedProductId(product.id);
      const tempCartItemId = uuidv4(); 
      dispatchCart({
        type: 'ADD_NORMAL_ITEM',
        payload: {
          id: tempCartItemId,
          product_id: product.id,
          quantity: 1, // Always add 1 at a time from this button
          type: 'normal',
          isSynced: false,
          product_name: product.product_name,
          product_price: product.product_price,
          strike_price: product.strike_price,
          images: product.images,
          isInStock: product.isInStock, // Use derived isInStock from product
          stock_quantity: product.quantity, // Actual stock quantity from fetched product
        } as CartNormalItem,
      });
      setIsCartOpen(true);
      setIsDirectBuyCheckoutMode(false); // Ensure this is false for cart-based checkout
    }
  };

  const handleBuyNow = async () => {
    if (product) {
      setDirectBuyProductData(product); // Store the product for direct buy
      setIsDirectBuyCheckoutMode(true); // Indicate direct buy mode
      setIsCheckoutToOpen(true); // Open the checkout modal
    }
  };

  const handleCheckoutClose = () => {
    setIsCheckoutToOpen(false);
    setIsDirectBuyCheckoutMode(false); // Reset mode when modal closes
    setDirectBuyProductData(null); // Clear direct buy product
  };

  const handleAddressSelected = (addressId: string): void => {
    console.log(`Proceeding with address ID: ${addressId}`);
    setIsCheckoutToOpen(false);
  };

  const checkPincode = async (pincode: string) => {
    console.log(`Checking pincode: ${pincode}`);
    if (pincode && pincode.length === 6 && !isNaN(Number(pincode))) {
      return {
        deliveryDate: `22nd and 25th Mar`,
        cashOnDelivery: true,
      };
    } else {
      return {
        error: 'Please enter a valid 6-digit pincode',
      };
    }
  };

  const handleCartClose = () => {
    setIsCartOpen(false);
    setSelectedProductId(null); // Reset selectedProductId after cart closes
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading product details...</div>;
  }

  if (error || !product) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error || 'Product not found'}</div>;
  }

  const productImages = product.images ? product.images.map((img) => {
    return `${process.env.NEXT_PUBLIC_API_BASE_URL}${img.product_image}`;
  }) : [];


  const formattedPrice = `₹${parseFloat(product.product_price).toLocaleString('en-IN')}`;
  const formattedStrikePrice = product.strike_price && parseFloat(product.strike_price) > 0
    ? `₹${parseFloat(product.strike_price).toLocaleString('en-IN')}`
    : null;

  const calculateDiscount = (price: string, strikePrice: string): string => {
    if (!strikePrice || parseFloat(strikePrice) <= 0) return '';
    const currentPrice = parseFloat(price);
    const originalPrice = parseFloat(strikePrice);
    if (currentPrice >= originalPrice) return '';
    const discount = ((originalPrice - currentPrice) / originalPrice) * 100;
    return `${Math.round(discount)}%`;
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-2 py-4 md:px-12 md:py-6 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Product Images */}
          <div className="w-full">
            <ProductImageSlider
              images={productImages}
              productName={product.product_name}
              hasOffer={true}
              offerLabel="BUY 1 GET 1"
            />
          </div>

          {/* Product Details */}
          <div className="space-y-2 md:space-y-2 md:pl-8">
            <div className="flex items-start justify-between">
              <h1 className="text-xl md:text-2xl font-normal leading-tight">{product.product_name}</h1>
              <div className="flex items-center space-x-1 flex-shrink-0 ml-4">
                <div className="flex text-[#36454F]">
                  {[...Array(staticProductData.rating)].map((_, i) => (
                    <Star key={i} className="w-3 h-3" fill="currentColor" />
                  ))}
                </div>
                <span className="text-[12px] text-gray-500">({staticProductData.reviewCount})</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {formattedStrikePrice && (
                <p className="text-[12px] line-through text-gray-500">MRP: {formattedStrikePrice}</p>
              )}
              <p className="text-lg font-semibold">{formattedPrice}</p>
              {formattedStrikePrice && (
                <div className="bg-black text-white text-xs px-2 py-1 rounded-md">
                  SAVE {calculateDiscount(product.product_price, product.strike_price)}
                </div>
              )}
            </div>

            <p className="text-sm text-gray-500">Inclusive of all taxes</p>

            <div className="text-xs text-gray-500">
              <span className="font-medium">Product Code:</span> {product.product_code}
            </div>

            {product.product_status && product.quantity > 0 ? (
              <div className="flex items-center text-sm space-x-2">
                <CheckCircle2 className="text-[#2e7e52] flex-shrink-0" />
                <span className="text-[14px]">In stock - ready to ship</span>
              </div>
            ) : (
                <div className="flex items-center text-sm space-x-2 text-red-500">
                    <AlertCircle className="flex-shrink-0" size={16} />
                    <span className="text-[14px]">Out of Stock</span>
                </div>
            )}

            {product.product_status && product.quantity > 0 && !fromOffer ? (
              <div className="py-2">
                <AddToCartButton
                  productId={product.id}
                  onAddToBag={handleAddToBag}
                  onBuyNow={handleBuyNow}
                />
              </div>
            ) : product.product_status && product.quantity > 0 && fromOffer ? (
              <div className="py-4 text-center bg-gray-100 rounded-md text-gray-500 font-medium">
                Select this product from the offer page
              </div>
            ) : (
              <div className="py-4 text-center bg-gray-100 rounded-md text-red-500 font-medium">
                Out of Stock
              </div>
            )}

            {/* Replaced `onClick={openModal}` with `onClick={() => null}` to prevent errors */}
            <div className="flex items-center justify-between pt-2 cursor-pointer" onClick={() => null}>
              <p className="text-sm flex-1 truncate pr-4">Details: {product.product_description}</p>
              <span className="text-[#C69A7F] text-sm underline flex-shrink-0">View More</span>
            </div>

            <div className="flex flex-row justify-center items-center gap-8 md:gap-12 bg-[#F1EEE4] px-4 md:px-8 py-4 md:py-6 rounded-md">
              <div className="flex flex-col items-center text-center">
                <div className="w-8 h-8 md:w-9 md:h-9 mb-2 relative">
                  <Image
                    src="/images/icons/warranty1.webp"
                    alt="Lifetime Warranty"
                    fill
                    className="object-contain"
                  />
                </div>
                <p className="text-[11px] md:text-[12px] font-medium">Lifetime Warranty</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-8 h-8 md:w-9 md:h-9 mb-2 relative">
                  <Image
                    src="/images/icons/organic1.webp"
                    alt="Skin Safe Jewellery"
                    fill
                    className="object-contain"
                  />
                </div>
                <p className="text-[11px] md:text-[12px] font-medium">Skin Safe Jewellery</p>
              </div>
            </div>

            <div className="space-y-4">
              <DeliveryPincodeChecker
                defaultDeliveryTime="3-4 Days"
                checkPincodeHandler={checkPincode}
              />
              <PolicyIcons />
            </div>
          </div>
        </div>
      </div>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={handleCartClose}
        // productId={selectedProductId} // Keep this if CartDrawer needs to highlight a product
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={handleCheckoutClose}
        onProceed={handleAddressSelected}
        // Only pass buyNowProduct if it's a direct buy.
        // `normalItemsForCheckout` and `offerSetsForCheckout` are explicitly NOT passed here for buy_now.
        buyNowProduct={isDirectBuyCheckoutMode ? directBuyProductData : undefined}
        checkoutMode={isDirectBuyCheckoutMode ? 'buy_now' : 'cart'}
      />
    </div>
  );
}