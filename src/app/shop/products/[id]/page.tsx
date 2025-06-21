// src/app/product/[id]/page.tsx
'use client';

import { CheckCircle2, Star, Tag } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams, useSearchParams } from 'next/navigation';
import ProductImageSlider from '@/components/ProductImageSlider';
import AddToCartButton from '@/components/AddToCartButton';
import DeliveryPincodeChecker from '@/components/DeliveryPincodeChecker';
import PolicyIcons from '@/components/PolicyIcons';
import CartDrawer from '@/components/CartDrawer';
import CheckoutModal from '@/components/CheckoutModal';
import apiService from '@/utils/api/apiService';
import { useCart } from '@/context/cartContext';
import { v4 as uuidv4 } from 'uuid';
import { ProductItemDetails } from '@/context/cartContext';


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

  const { dispatchCart, cartItems } = useCart();

  const [isGift, setIsGift] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [product, setProduct] = useState<ProductItemDetails | null>(null); // Use ProductItemDetails type
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (productId) {
          setIsLoading(true);
          const fetchedProduct: ProductItemDetails = await apiService.getProductByID(productId);
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

  const openModal = () => {
    setIsModalOpen(true);
  };

  const handleAddToBag = async () => {
    if (product) {
      setSelectedProductId(product.id);
      dispatchCart({
        type: 'ADD_NORMAL_ITEM',
        payload: {
          id: uuidv4(), // Generate temporary local ID
          product_id: product.id,
          quantity: 1, // Quantity in cart is 1 for a new add
          type: 'normal',
          isSynced: false, // Mark as not synced yet
          product_name: product.product_name,
          product_price: product.product_price,
          strike_price: product.strike_price,
          images: product.images,
          isInStock: product.product_status && product.quantity > 0, // Derive from product.quantity (stock)
          stock_quantity: product.quantity, // Populate with the actual stock quantity from fetched product
        },
      });
      setIsCartOpen(true);
    }
  };

  const handleBuyNow = async () => {
    if (product) {
      dispatchCart({
        type: 'ADD_NORMAL_ITEM',
        payload: {
          id: uuidv4(),
          product_id: product.id,
          quantity: 1, // Quantity in cart is 1 for a new add
          type: 'normal',
          isSynced: false,
          product_name: product.product_name,
          product_price: product.product_price,
          strike_price: product.strike_price,
          images: product.images,
          isInStock: product.product_status && product.quantity > 0, // Derive from product.quantity (stock)
          stock_quantity: product.quantity, // Populate with the actual stock quantity from fetched product
        },
      });
      setIsCheckoutOpen(true);
    }
  };

  const handleCheckoutClose = () => {
    setIsCheckoutOpen(false);
  };

  const handleAddressSelected = (addressId: string): void => {
    console.log(`Proceeding with address ID: ${addressId}`);
    setIsCheckoutOpen(false);
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
    setSelectedProductId(null);
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

            {product.product_status && product.quantity > 0 && (
              <div className="flex items-center text-sm space-x-2">
                <CheckCircle2 className="text-[#2e7e52] flex-shrink-0" />
                <span className="text-[14px]">In stock - ready to ship</span>
              </div>
            )}

            {/* Conditionally render AddToCartButton if not from offer page */}
            {product.quantity > 0 && !fromOffer ? (
              <div className="py-2">
                <AddToCartButton
                  productId={product.id}
                  onAddToBag={handleAddToBag}
                  onBuyNow={handleBuyNow}
                />
              </div>
            ) : product.quantity > 0 && fromOffer ? (
              <div className="py-4 text-center bg-gray-100 rounded-md text-gray-500 font-medium">
                Select this product from the offer page
              </div>
            ) : (
              <div className="py-4 text-center bg-gray-100 rounded-md text-red-500 font-medium">
                Out of Stock
              </div>
            )}

            <div className="flex items-center justify-between pt-2 cursor-pointer" onClick={openModal}>
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
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={handleCheckoutClose}
        onProceed={handleAddressSelected}
        cartItems={cartItems}
      />
    </div>
  );
}