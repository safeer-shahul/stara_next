'use client';

import { useState, useEffect, useCallback } from 'react';
import { Heart, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import CartDrawer from '@/components/CartDrawer';
import VariantSelectionModal from '@/components/VariantSelectionModal';
import { useCart, CartNormalItem, ProductItemDetails, ProductVariant } from '@/context/cartContext';
import { useWishlist } from '@/app/context/WishlistProvider';
import { wishlistService, WishlistItemFromBackend } from '@/utils/api/wishlistService';
import { v4 as uuidv4 } from 'uuid';
import { showToast } from '@/utils/toast';

// Define the type for wishlist items based on your API response
type WishlistItem = WishlistItemFromBackend;

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [productForVariantSelection, setProductForVariantSelection] = useState<ProductItemDetails | null>(null);

  const { dispatchCart, getEffectiveProductStock } = useCart();
  const { toggleWishlist, refreshWishlist } = useWishlist();
  const router = useRouter();

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        setLoading(true);
        const response = await wishlistService.getDetailedWishlist();
        console.log('Wishlist response:', response);
        setWishlistItems(response);
      } catch (error) {
        console.error('Error fetching wishlist:', error);
        setWishlistItems([]);
        showToast.error('Failed to load wishlist. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  // Handle removing item from wishlist
  const handleRemoveFromWishlist = useCallback(async (productId: string) => {
    try {
      await toggleWishlist(productId);
      
      // Remove from local state immediately
      setWishlistItems(prev => prev.filter(item => item.products.id !== productId));
      
      // Refresh the wishlist context
      await refreshWishlist();
    } catch (error) {
      console.error('Error removing item from wishlist:', error);
      showToast.error('Failed to remove item from wishlist.');
    }
  }, [toggleWishlist, refreshWishlist]);

  

  // Handle adding product to cart (with or without variants)
  const handleAddProductToCart = useCallback((productToAdd: ProductItemDetails, selectedVariantToAdd: ProductVariant | null = null): void => {
    const effectiveStock = getEffectiveProductStock(productToAdd, selectedVariantToAdd?.id);
    
    if (effectiveStock <= 0) {
      const variantText = selectedVariantToAdd ? ` (${selectedVariantToAdd.variant_name})` : '';
      showToast.warning(`${productToAdd.product_name}${variantText} is currently out of stock or you have reached the maximum quantity allowed.`);
      return;
    }

    const tempCartItemId = uuidv4();

    const cartItem: CartNormalItem = {
      id: tempCartItemId,
      product_id: productToAdd.id,
      quantity: 1,
      type: 'normal',
      isSynced: false,
      product_name: productToAdd.product_name,
      product_price: productToAdd.product_price,
      strike_price: productToAdd.strike_price,
      images: productToAdd.images,
      isInStock: selectedVariantToAdd ? selectedVariantToAdd.quantity > 0 : productToAdd.isInStock,
      stock_quantity: selectedVariantToAdd?.quantity ?? productToAdd.quantity,
      ...(selectedVariantToAdd && { selectedVariant: selectedVariantToAdd }),
      productDetails: productToAdd,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    dispatchCart({
      type: 'ADD_NORMAL_ITEM',
      payload: cartItem,
    });

    const variantText = selectedVariantToAdd ? ` (${selectedVariantToAdd.variant_name})` : '';
    showToast.success(`${productToAdd.product_name}${variantText} added to cart!`);
    
    setIsCartOpen(true);
    setIsVariantModalOpen(false);
    setProductForVariantSelection(null);
  }, [dispatchCart, getEffectiveProductStock]);


  // Handle adding item to cart
  const handleAddToCart = useCallback((product: WishlistItem['products']) => {
    // Convert to ProductItemDetails format
    const productDetails: ProductItemDetails = {
      ...product,
      isInStock: product.have_variants 
        ? product.product_variant?.some(v => v.quantity > 0) && product.product_status
        : product.product_status && product.quantity > 0
    };

    if (product.have_variants && product.product_variant && product.product_variant.length > 0) {
      // Product has variants, show variant selection modal
      setProductForVariantSelection(productDetails);
      setIsVariantModalOpen(true);
    } else {
      // Product has no variants, add directly to cart
      handleAddProductToCart(productDetails);
    }
  }, [handleAddProductToCart]);

  const handleCartClose = useCallback(() => {
    setIsCartOpen(false);
  }, []);

  const handleProductClick = useCallback((productId: string): void => {
    router.push(`/shop/products/${productId}`);
  }, [router]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4 mb-4 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-1/4 mb-3"></div>
            <div className="flex justify-between mb-2">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/5"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!wishlistItems.length) {
    return (
      <div className="bg-white mt-5 rounded-lg shadow p-6 text-center">
        <Heart size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">Your Wishlist is Empty</h3>
        <p className="text-gray-500">Products you save to your wishlist will appear here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white mt-5 rounded-lg shadow py-6 px-2">
      <h2 className="text-[16px] font-semibold mb-6">Your Wishlist ({wishlistItems.length})</h2>

      <div className="space-y-4">
        {wishlistItems.map((item: WishlistItem) => {
          const product = item.products;
          const isOnSale = parseFloat(product.strike_price) > 0;
          
          // Calculate stock status
          let inStock = false;
          let effectiveStock = 0;
          
          if (product.have_variants && product.product_variant && product.product_variant.length > 0) {
            // For variant products, check if any variant has effective stock
            const hasAvailableVariant = product.product_variant.some(variant => {
              const variantEffectiveStock = getEffectiveProductStock(product as ProductItemDetails, variant.id);
              return variant.quantity > 0 && variantEffectiveStock > 0;
            });
            inStock = product.product_status && hasAvailableVariant;
            effectiveStock = hasAvailableVariant ? 1 : 0;
          } else {
            // For non-variant products
            effectiveStock = getEffectiveProductStock(product as ProductItemDetails, undefined);
            inStock = product.product_status && product.quantity > 0 && effectiveStock > 0;
          }

          return (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex cursor-pointer" onClick={() => handleProductClick(product.id)}>
                <div className="w-20 h-20 rounded-md overflow-hidden mr-4 bg-gray-100 flex-shrink-0 relative">
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${product.images[0].product_image}`}
                      alt={product.product_name}
                      fill
                      sizes="(max-width: 80px) 100vw, 80px"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No Image</span>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-[16px] font-medium text-gray-900 line-clamp-2">{product.product_name}</h3>
                  </div>

                  <div className="mb-2">
                    {isOnSale ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[16px] font-medium text-gray-900">
                          ₹{parseFloat(product.product_price).toLocaleString()}
                        </span>
                        <span className="text-[14px] text-gray-500 line-through">
                          ₹{parseFloat(product.strike_price).toLocaleString()}
                        </span>
                        <span className="text-[12px] bg-green-100 text-green-800 px-2 py-0.5 rounded">
                          {Math.round(((parseFloat(product.strike_price) - parseFloat(product.product_price)) / parseFloat(product.strike_price)) * 100)}% OFF
                        </span>
                      </div>
                    ) : (
                      <span className="text-[16px] font-medium text-gray-900">
                        ₹{parseFloat(product.product_price).toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {inStock ? (
                      <span className="text-[13px] text-green-600 font-medium">✓ In Stock</span>
                    ) : (
                      <span className="text-[13px] text-red-600 font-medium">✗ Out of Stock</span>
                    )}
                    
                    {product.have_variants && (
                      <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        Multiple sizes available
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={!inStock}
                    className={`flex items-center px-3 py-1.5 text-[12px] border rounded transition-colors ${
                      inStock
                        ? "border-black text-white bg-black hover:bg-gray-800 cursor-pointer"
                        : "border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed"
                    }`}
                  >
                    <ShoppingCart className="w-3 h-3 mr-1" />
                    {product.have_variants ? 'Select & Add to Cart' : 'Add to Cart'}
                  </button>

                  <button
                    onClick={() => handleRemoveFromWishlist(product.id)}
                    className="flex items-center px-3 py-1.5 text-[12px] border border-red-500 text-red-500 rounded hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Heart className="w-3 h-3 mr-1 fill-current" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={handleCartClose}
      />

      <VariantSelectionModal
        isOpen={isVariantModalOpen}
        onClose={() => setIsVariantModalOpen(false)}
        product={productForVariantSelection}
        onVariantSelected={handleAddProductToCart}
      />
    </div>
  );
}