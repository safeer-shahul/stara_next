'use client';

import { CheckCircle2, Star, Tag } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from "next/image";
import { useParams } from 'next/navigation';
import ProductImageSlider from '@/components/ProductImageSlider';
import AddToCartButton from '@/components/AddToCartButton';
import DeliveryPincodeChecker from '@/components/DeliveryPincodeChecker';
import PolicyIcons from '@/components/PolicyIcons';
import CartDrawer from '@/components/CartDrawer';
import CheckoutModal from '@/components/CheckoutModal';
import apiService from '@/utils/api/apiService';

// Keep static data for features that aren't in the API
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
  const productId = params.id as string;
  
  const [isGift, setIsGift] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [checkoutData, setCheckoutData] = useState<{
    items: Array<{
      product_id: string;
      quantity: number;
    }>;
  }>({ items: [] });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (productId) {
          setIsLoading(true);
          const fetchedProduct = await apiService.getProductByID(productId);
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
    console.log('clicked view more');
  };

  const handleAddToBag = () => {
    if (product) {
      // Set the selected product ID to pass to CartDrawer
      setSelectedProductId(product.id);
      
      // Open the cart drawer
      setIsCartOpen(true);
      
      // For backward compatibility, also update localStorage
      // Get current cart items
      const storedCartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
      
      // Check if we're dealing with the old format (array of strings)
      if (storedCartItems.length > 0 && typeof storedCartItems[0] === 'string') {
        // Convert old format items, removing hyphens
        const formattedCartIds = storedCartItems.map((id:any) => id.replace(/-/g, ''));
        
        // Add new product ID
        const productIdWithoutHyphens = product.id.replace(/-/g, '');
        const updatedCart = [...formattedCartIds, productIdWithoutHyphens];
        
        // Count occurrences and convert to new format
        const productCounts:any = {};
        updatedCart.forEach(id => {
          productCounts[id] = (productCounts[id] || 0) + 1;
        });
        
        // Convert to new format with quantities
        const newFormatCart = Object.keys(productCounts).map(id => ({
          id,
          quantity: productCounts[id]
        }));
        
        localStorage.setItem('cartItems', JSON.stringify(newFormatCart));
      } else {
        // Already using new format
        const productIdWithoutHyphens = product.id.replace(/-/g, '');
        
        // Find if product already exists in cart
        const existingItemIndex = storedCartItems.findIndex(
          (item:any) => item.id === productIdWithoutHyphens
        );
        
        let updatedCartItems;
        
        if (existingItemIndex >= 0) {
          // Product already exists, increase quantity
          updatedCartItems = [...storedCartItems];
          updatedCartItems[existingItemIndex] = {
            ...updatedCartItems[existingItemIndex],
            quantity: updatedCartItems[existingItemIndex].quantity + 1
          };
        } else {
          // Product doesn't exist in cart, add it with quantity 1
          updatedCartItems = [
            ...storedCartItems, 
            { id: productIdWithoutHyphens, quantity: 1 }
          ];
        }
        
        localStorage.setItem('cartItems', JSON.stringify(updatedCartItems));
      }
    }
  };

  const handleAddToWishlist = () => {
    console.log('Add to wishlist clicked');
  };

  const handleBuyNow = () => {
    if (product) {
      // Prepare checkout data with just this product
      const productIdWithoutHyphens = product.id.replace(/-/g, '');
      setCheckoutData({
        items: [
          {
            product_id: productIdWithoutHyphens,
            quantity: 1
          }
        ]
      });
      
      // Open checkout modal directly
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
        cashOnDelivery: true
      };
    } else {
      return {
        error: "Please enter a valid 6-digit pincode"
      };
    }
  };

  const handleCartClose = () => {
    setIsCartOpen(false);
    // Reset selected product ID when cart is closed
    setSelectedProductId(null);
  };

  if (isLoading) {
    return <div className="container mx-auto p-12 text-center">Loading product details...</div>;
  }

  if (error || !product) {
    return <div className="container mx-auto p-12 text-center text-red-500">{error || 'Product not found'}</div>;
  }

  // Prepare image data for the slider with full URLs
  const productImages = product.images.map((img: any) => {
    return `${process.env.NEXT_PUBLIC_API_BASE_URL}${img.product_image}`;
  });

  // Format price with currency symbol
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
    <div className="container mx-auto p-2 md:p-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProductImageSlider 
          images={productImages} 
          productName={product.product_name}
          hasOffer={true}
          offerLabel="BUY 1 GET 1"
        />

        <div className="space-y-4 pl-0 md:pl-24">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-normal">{product.product_name}</h1>

            <div className="flex items-center space-x-1">
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
              <p className="text-[12px] line-through">MRP: {formattedStrikePrice}</p>
            )}
            <p className="text-lg font-semibold text-[15px]">{formattedPrice}</p>
            {formattedStrikePrice && (
              <div className="bg-black text-white text-xs px-2 py-1 rounded-md flex items-center">
                SAVE {calculateDiscount(product.product_price, product.strike_price)}
              </div>
            )}
          </div>

          <p className="text-sm text-gray-500">Inclusive of all taxes</p>
          
          <div className="text-xs text-gray-500">
            <span className="font-medium">Product Code:</span> {product.product_code}
          </div>

          <div className="flex items-center text-sm border-t py-5 border-b border-gray-200 gap-2">
            <Tag size={16} className="text-green-700"/>
            <div>
              <span className="text-green-700">
                Buy 1 Get 1 Free Use Code: <span className="font-bold">B1G1</span> at checkout.
              </span>
              <a href="#" className="text-green-700 underline ml-1 font-bold">See All Offers</a>
            </div>
          </div>

          {product.product_status && product.quantity > 0 && (
            <div className="flex items-center text-sm space-x-2">
              <CheckCircle2 className='text-[#2e7e52]'/>
              <span className='text-[14px]'>In stock - ready to ship</span>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="giftOption"
              checked={isGift}
              onChange={() => setIsGift(!isGift)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="giftOption" className="text-sm">
              Is it a gift? Make it Special <span className="font-semibold">{staticProductData.giftSpecialPrice}</span>
            </label>
          </div>

          <AddToCartButton 
            onAddToBag={handleAddToBag}
            onAddToWishlist={handleAddToWishlist}
            onBuyNow={handleBuyNow}
          />

          <div className="flex items-center justify-between pt-4 cursor-pointer" onClick={openModal}>
            <p className="text-sm">Details: {product.product_description}</p>
            <span className="text-[#C69A7F] text-sm underline">View More</span>
          </div>

          <div className="flex flex-row justify-center items-center gap-12 bg-[#F1EEE4] px-8 py-6 rounded-md">
            <div className="flex flex-col items-center text-center">
              <div className="w-9 h-9 mb-2 relative">
                <Image
                  src="/images/icons/warranty1.webp"
                  alt="Lifetime Warranty"
                  fill
                  className="object-contain"
                />
              </div>
              <p className="text-[12px] font-medium">Lifetime Warranty</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-9 h-9 mb-2 relative">
                <Image
                  src="/images/icons/organic1.webp"
                  alt="Skin Safe Jewellery"
                  fill
                  className="object-contain"
                />
              </div>
              <p className="text-[12px] font-medium">Skin Safe Jewellery</p>
            </div>
          </div>

          <DeliveryPincodeChecker 
            defaultDeliveryTime="3-4 Days"
            checkPincodeHandler={checkPincode}
          />

          <PolicyIcons/>
        </div>
      </div>
      
      {/* Cart Drawer */}
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={handleCartClose} 
        productId={selectedProductId} 
      />

      {/* Checkout Modal for Buy Now */}
      <CheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={handleCheckoutClose} 
        onProceed={handleAddressSelected}
        orderItems={checkoutData.items}
      />
    </div>
  );
}