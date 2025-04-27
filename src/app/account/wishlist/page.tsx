'use client';

import { useState, useEffect } from 'react';
import { Heart, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import apiService from '@/utils/api/apiService';
import { useRouter } from 'next/navigation';
import CartDrawer from '@/components/CartDrawer';

// Define the type for wishlist items based on your API response
type WishlistItem = {
  id: string;
  products: {
    id: string;
    images: {
      id: string;
      product_image: string;
      product: string;
    }[];
    product_code: string;
    product_name: string;
    product_description: string;
    product_price: string;
    strike_price: string;
    quantity: number;
    product_weight: string;
    product_box_weight: string;
    product_status: boolean;
    created_at: string;
    updated_at: string;
    sub_category: string;
  };
  created_at: string;
  updated_at: string;
  product: string;
  user: number;
};

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        setLoading(true);
        const response = await apiService.getMyWishlist();
        console.log('Wishlist response:', response);
        setWishlistItems(response || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching wishlist:', error);
        setWishlistItems([]);
        setLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  // Handle removing item from wishlist
  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      const cleanProductId = productId.replace(/-/g, '');
      await apiService.addToWishlist({
        product: cleanProductId,
      });
      
      // Refresh wishlist after removing item
      const response = await apiService.getMyWishlist();
      setWishlistItems(response || []);
    } catch (error) {
      console.error('Error removing item from wishlist:', error);
    }
  };

  // Handle adding item to cart - Updated to match ProductDetailPage logic
  const handleAddToCart = (productId: string) => {
    // Set the selected product ID to pass to CartDrawer
    setSelectedProductId(productId);
    
    // Open the cart drawer
    setIsCartOpen(true);
    
    // For backward compatibility, also update localStorage
    // Get current cart items
    const storedCartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    
    // Check if we're dealing with the old format (array of strings)
    if (storedCartItems.length > 0 && typeof storedCartItems[0] === 'string') {
      // Convert old format items, removing hyphens
      const formattedCartIds = storedCartItems.map((id: any) => id.replace(/-/g, ''));
      
      // Add new product ID
      const productIdWithoutHyphens = productId.replace(/-/g, '');
      const updatedCart = [...formattedCartIds, productIdWithoutHyphens];
      
      // Count occurrences and convert to new format
      const productCounts: any = {};
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
      const productIdWithoutHyphens = productId.replace(/-/g, '');
      
      // Find if product already exists in cart
      const existingItemIndex = storedCartItems.findIndex(
        (item: any) => item.id === productIdWithoutHyphens
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
  };

  // Handle cart drawer close
  const handleCartClose = () => {
    setIsCartOpen(false);
    // Reset selected product ID when cart is closed
    setSelectedProductId(null);
  };

  const router = useRouter();
  
  const handleProductClick = (productId: string): void => {
    router.push(`/shop/products/${productId}`);
  };

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
      <h2 className="text-[16px] font-semibold mb-6">Your Wishlist</h2>
      
      <div className="space-y-4">
        {wishlistItems.map((item: WishlistItem) => {
          const product = item.products;
          const isOnSale = parseFloat(product.strike_price) > 0;
          const inStock = product.quantity > 0;
          
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
                      style={{objectFit: 'cover'}}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200"></div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-[16px] font-medium text-gray-900">{product.product_name}</h3>
                  </div>
                  
                  <div className="mb-2">
                    {isOnSale ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[16px] font-medium text-gray-900">
                          ₹{parseFloat(product.product_price).toFixed(2)}
                        </span>
                        <span className="text-[14px] text-gray-500 line-through">
                          ₹{parseFloat(product.strike_price).toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[16px] font-medium text-gray-900">
                        ₹{parseFloat(product.product_price).toFixed(2)}
                      </span>
                    )}
                  </div>
                  
                  {inStock ? (
                    <span className="text-[13px] text-green-600">In Stock</span>
                  ) : (
                    <span className="text-[13px] text-red-600">Out of Stock</span>
                  )}
                </div>
              </div>
              
              <div className="mt-4 pt-3 cursor-pointer border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => handleAddToCart(product.id)}
                    disabled={!inStock}
                    className={`flex cursor-pointer items-center px-3 py-1 text-[12px] border rounded transition-colors ${
                      inStock 
                        ? "border-black text-white bg-black hover:bg-gray-800" 
                        : "border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed"
                    }`}
                  >
                    <ShoppingCart className="w-3 h-3 mr-1" />
                    Add to Cart
                  </button>
                  
                  <button 
                    onClick={() => handleRemoveFromWishlist(product.id)}
                    className="flex items-center cursor-pointer px-3 py-1 text-[12px] border border-red-500 text-red-500 rounded hover:bg-red-50 transition-colors"
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
      
      {/* Cart Drawer - Same as in ProductDetailPage */}
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={handleCartClose} 
        productId={selectedProductId} 
      />
    </div>
  );
}