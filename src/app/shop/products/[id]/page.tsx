'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import ProductImageSlider from '@/components/ProductImageSlider';
import AddToCartButton from '@/components/AddToCartButton';
import DeliveryPincodeChecker from '@/components/DeliveryPincodeChecker';
import PolicyIcons from '@/components/PolicyIcons';
import CartDrawer from '@/components/CartDrawer';
import CheckoutModal from '@/components/CheckoutModal';
import WishlistButton from '@/components/WishlistButton';
import apiService from '@/utils/api/apiService';
import { useCart } from '@/context/cartContext';
import { v4 as uuidv4 } from 'uuid';
import { ProductItemDetails, CartNormalItem, ProductVariant } from '@/context/cartContext';
import { showToast } from '@/utils/toast';

// Import missing Lucide React icons
import { AlertCircle, CheckCircle2, Star, Heart } from 'lucide-react';
import Image from 'next/image';

// Static product data (kept as is)
const staticProductData = {
  discount: '38%',
  offer: 'Buy 1 Get 1 Free Use Code: BIG1 at checkout',
  isGift: false,
  giftSpecialPrice: '₹399.00',
  delivery: 'Typically arrives in 3-4 Days',
  returnPolicy: '2 Days Return',
  // exchangePolicy: '10 Days Exchange',
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

  const { dispatchCart, getEffectiveProductStock } = useCart();

  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutToOpen] = useState<boolean>(false);
  const [product, setProduct] = useState<ProductItemDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // NEW STATES FOR DIRECT BUY NOW
  const [isDirectBuyCheckoutMode, setIsDirectBuyCheckoutMode] = useState<boolean>(false);
  const [directBuyProductData, setDirectBuyProductData] = useState<ProductItemDetails | null>(null);

  // NEW STATES FOR VARIANTS
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [isProductAvailable, setIsProductAvailable] = useState<boolean>(false);


  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (productId) {
          setIsLoading(true);
          const fetchedProduct: ProductItemDetails = await apiService.getProductByID(productId.replace(/-/g, ''));
          if (fetchedProduct) {
            fetchedProduct.isInStock = fetchedProduct.product_status && fetchedProduct.quantity > 0;
            setProduct(fetchedProduct);

            if (fetchedProduct.have_variants && fetchedProduct.product_variant && fetchedProduct.product_variant.length > 0) {
              const firstAvailableVariant = fetchedProduct.product_variant.find(variant => variant.quantity > 0);
              if (firstAvailableVariant) {
                setSelectedVariant(firstAvailableVariant);
                setIsProductAvailable(firstAvailableVariant.quantity > 0);
              } else {
                setSelectedVariant(null);
                setIsProductAvailable(false);
              }
            } else {
              setSelectedVariant(null);
              setIsProductAvailable(fetchedProduct.quantity > 0 && fetchedProduct.product_status);
            }
          }
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


  useEffect(() => {
    if (product?.have_variants) {
        setIsProductAvailable(selectedVariant ? selectedVariant.quantity > 0 : false);
    } else if (product) {
        setIsProductAvailable(product.quantity > 0 && product.product_status);
    }
  }, [selectedVariant, product]);


  const handleAddToBag = async () => {
    if (!product || !isProductAvailable) {
      showToast.warning('This product is currently unavailable.');
      return;
    }

    const currentEffectiveStock = getEffectiveProductStock(product, selectedVariant?.id);
    if (currentEffectiveStock <= 0) {
      const variantText = selectedVariant ? ` (${selectedVariant.variant_name})` : '';
      showToast.warning(`${product.product_name}${variantText} is currently out of stock or you have reached the maximum quantity allowed.`);
      return;
    }

    // setSelectedProductId(product.id);
    const tempCartItemId = uuidv4();
    
    const cartItem: CartNormalItem = {
      id: tempCartItemId,
      product_id: product.id,
      quantity: 1,
      type: 'normal',
      isSynced: false,
      product_name: product.product_name,
      product_price: product.product_price,
      strike_price: product.strike_price,
      images: product.images,
      isInStock: selectedVariant ? selectedVariant.quantity > 0 : product.isInStock,
      stock_quantity: selectedVariant?.quantity ?? product.quantity,
      ...(selectedVariant && { selectedVariant: selectedVariant }),
      productDetails: product,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    dispatchCart({
      type: 'ADD_NORMAL_ITEM',
      payload: cartItem,
    });

    const variantText = selectedVariant ? ` (${selectedVariant.variant_name})` : '';
    showToast.success(`${product.product_name}${variantText} added to cart!`);
    
    setIsCartOpen(true);
    setIsDirectBuyCheckoutMode(false);
  };

  const handleBuyNow = async () => {
    if (!product || !isProductAvailable) {
      showToast.warning('This product is currently unavailable for purchase.');
      return;
    }

    const currentEffectiveStock = getEffectiveProductStock(product, selectedVariant?.id);
    if (currentEffectiveStock <= 0) {
      const variantText = selectedVariant ? ` (${selectedVariant.variant_name})` : '';
      showToast.warning(`${product.product_name}${variantText} is currently out of stock or you have reached the maximum quantity allowed.`);
      return;
    }

    const productForDirectBuy = {
      ...product,
      ...(selectedVariant && {
        quantity: selectedVariant.quantity,
        selectedVariant: selectedVariant,
      }),
    } as ProductItemDetails;

    setDirectBuyProductData(productForDirectBuy);
    setIsDirectBuyCheckoutMode(true);
    setIsCheckoutToOpen(true);
  };

  const handleCheckoutClose = () => {
    setIsCheckoutToOpen(false);
    setIsDirectBuyCheckoutMode(false);
    setDirectBuyProductData(null);
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
    // setSelectedProductId(null);
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

  const effectiveStock = getEffectiveProductStock(product, selectedVariant?.id);
  const isActionButtonDisabled = !isProductAvailable || fromOffer ||
                                 (product.have_variants && !selectedVariant) ||
                                 (selectedVariant && selectedVariant.quantity <= 0) ||
                                 effectiveStock <= 0;


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
              <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                {/* Wishlist Button */}
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                  <WishlistButton
                    productId={product.id}
                    size={18}
                  />
                </div>
                {/* Rating */}
                <div className="flex items-center space-x-1">
                  <div className="flex text-[#36454F]">
                    {[...Array(staticProductData.rating)].map((_, i) => (
                      <Star key={i} className="w-3 h-3" fill="currentColor" />
                    ))}
                  </div>
                  <span className="text-[12px] text-gray-500">({staticProductData.reviewCount})</span>
                </div>
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

            {/* Variant Selection Section */}
            {product.have_variants && product.product_variant && product.product_variant.length > 0 && (
              <div className="pt-4">
                <h3 className="text-base font-medium mb-2">Select Size:</h3>
                <div className="flex flex-wrap gap-2">
                  {product.product_variant.map((variant) => {
                    const variantEffectiveStock = getEffectiveProductStock(product, variant.id);
                    const isVariantDisabled = variant.quantity === 0 || variantEffectiveStock <= 0;
                    
                    return (
                      <button
                        key={variant.id}
                        className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                          selectedVariant?.id === variant.id
                            ? 'border-black bg-black text-white'
                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                        } ${isVariantDisabled ? 'opacity-50 cursor-not-allowed hover:border-gray-300' : ''}`}
                        onClick={() => {
                          if (!isVariantDisabled) {
                            setSelectedVariant(variant);
                          } else {
                            showToast.warning(`${variant.variant_name} is currently out of stock or unavailable.`);
                          }
                        }}
                        disabled={isVariantDisabled}
                      >
                        {variant.variant_name} {isVariantDisabled && '(Out of Stock)'}
                      </button>
                    );
                  })}
                </div>
                {!selectedVariant && product.product_variant.length > 0 && (
                  <p className="text-sm text-red-500 mt-2">Please select a size.</p>
                )}
                {selectedVariant && (selectedVariant.quantity === 0 || getEffectiveProductStock(product, selectedVariant.id) <= 0) && (
                  <p className="text-sm text-red-500 mt-2">Selected size is out of stock.</p>
                )}
              </div>
            )}


            {isProductAvailable && effectiveStock > 0 ? (
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

            <div className="py-2">
                <AddToCartButton
                  productId={product.id}
                  onAddToBag={handleAddToBag}
                  onBuyNow={handleBuyNow}
                  disabled={isActionButtonDisabled}
                />
            </div>

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
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={handleCheckoutClose}
        onProceed={handleAddressSelected}
        buyNowProduct={isDirectBuyCheckoutMode ? directBuyProductData : undefined}
        checkoutMode={isDirectBuyCheckoutMode ? 'buy_now' : 'cart'}
      />
    </div>
  );
}