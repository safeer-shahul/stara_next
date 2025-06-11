'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X, ShoppingBag, Gift, ArrowUpDown, RefreshCw } from 'lucide-react';

interface ProductItem {
  id: string;
  images: {
    id: string;
    product_image: string;
    product: string;
  }[];
  product_name: string;
  product_price: string;
  strike_price: string;
  product_status: boolean;
}

interface SelectedProduct {
  product: ProductItem;
  type: 'buy' | 'get';
}

interface OfferData {
  id: string;
  offer_name: string;
  buy_count: number;
  get_count: number;
  start_date: string;
  end_date: string;
  offer_image: string;
  products: ProductItem[];
}

interface OfferMobileSliderProps {
  isOpen: boolean;
  onClose: () => void;
  offerData: OfferData;
  buyProducts: SelectedProduct[];
  getProducts: SelectedProduct[];
  onProductRemove: (productId: string) => void;
  onProductMove: (productId: string, newType: 'buy' | 'get') => void;
  onProductSwap?: (buyProductId: string, getProductId: string) => void;
}

export default function OfferMobileSlider({ 
  isOpen, 
  onClose, 
  offerData, 
  buyProducts, 
  getProducts, 
  onProductRemove, 
  onProductMove,
  onProductSwap
}: OfferMobileSliderProps) {
  const [swapMode, setSwapMode] = useState(false);
  const [selectedForSwap, setSelectedForSwap] = useState<string | null>(null);
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const canMoveProduct = (productId: string, targetType: 'buy' | 'get') => {
    const currentProduct = [...buyProducts, ...getProducts].find(p => p.product.id === productId);
    if (!currentProduct || currentProduct.type === targetType) return false;
    
    const targetProducts = targetType === 'buy' ? buyProducts : getProducts;
    const maxCount = targetType === 'buy' ? offerData.buy_count : offerData.get_count;
    
    return targetProducts.length < maxCount;
  };

  const canSwapProducts = () => {
    return buyProducts.length === offerData.buy_count && 
           getProducts.length === offerData.get_count && 
           buyProducts.length > 0 && 
           getProducts.length > 0;
  };

  const handleSwapClick = (productId: string) => {
    if (!swapMode) return;
    
    if (!selectedForSwap) {
      setSelectedForSwap(productId);
    } else if (selectedForSwap === productId) {
      // Deselect if clicking the same product
      setSelectedForSwap(null);
    } else {
      // Perform swap
      const firstProduct = [...buyProducts, ...getProducts].find(p => p.product.id === selectedForSwap);
      const secondProduct = [...buyProducts, ...getProducts].find(p => p.product.id === productId);
      
      if (firstProduct && secondProduct && firstProduct.type !== secondProduct.type && onProductSwap) {
        onProductSwap(
          firstProduct.type === 'buy' ? firstProduct.product.id : secondProduct.product.id,
          firstProduct.type === 'get' ? firstProduct.product.id : secondProduct.product.id
        );
      }
      
      setSelectedForSwap(null);
      setSwapMode(false);
    }
  };

  const calculateTotal = () => {
    const buyTotal = buyProducts.reduce((sum, item) => sum + parseFloat(item.product.product_price), 0);
    const getTotal = getProducts.reduce((sum, item) => sum + parseFloat(item.product.product_price), 0);
    return { buyTotal, getTotal, savings: getTotal };
  };

  const { buyTotal, getTotal, savings } = calculateTotal();
  const isOfferComplete = buyProducts.length === offerData.buy_count && getProducts.length === offerData.get_count;

  const ProductCard = ({ item }: { item: SelectedProduct }) => {
    const mainImage = item.product.images?.[0]?.product_image || '';
    const isSelectedForSwap = selectedForSwap === item.product.id;
    
    return (
      <div 
        className={`bg-white rounded-lg border p-3 relative transition-all duration-200 ${
          swapMode ? 'cursor-pointer hover:border-blue-400' : ''
        } ${
          isSelectedForSwap ? 'border-blue-500 bg-blue-50' : ''
        }`}
        onClick={() => swapMode && handleSwapClick(item.product.id)}
      >
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onProductRemove(item.product.id);
          }}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors z-10"
        >
          <X size={14} />
        </button>

        {swapMode && isSelectedForSwap && (
          <div className="absolute -top-2 -left-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs z-10">
            1
          </div>
        )}
        
        <div className="flex gap-3 mb-3">
          <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden">
            <Image
              src={mainImage ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${mainImage}` : '/images/placeholder.png'}
              alt={item.product.product_name}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium line-clamp-2 mb-1">{item.product.product_name}</h4>
            <p className="text-sm font-semibold text-gray-900">₹{parseFloat(item.product.product_price).toLocaleString()}</p>
          </div>
        </div>
        
        {/* Move Button */}
        {!swapMode && (
          <div className="flex justify-center">
            {item.type === 'buy' && canMoveProduct(item.product.id, 'get') && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onProductMove(item.product.id, 'get');
                }}
                className="flex items-center gap-2 px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
              >
                <ArrowUpDown size={12} />
                Move to Get
              </button>
            )}
            {item.type === 'get' && canMoveProduct(item.product.id, 'buy') && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onProductMove(item.product.id, 'buy');
                }}
                className="flex items-center gap-2 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
              >
                <ArrowUpDown size={12} />
                Move to Buy
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Slider */}
      <div className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-xl z-50 transform transition-transform duration-300 ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{ maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-4 py-3 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Your Offer Selection</h3>
            <div className="flex items-center gap-2">
              {canSwapProducts() && (
                <button
                  onClick={() => {
                    setSwapMode(!swapMode);
                    setSelectedForSwap(null);
                  }}
                  className={`flex items-center gap-1 px-3 py-1 text-xs rounded-md transition-colors ${
                    swapMode 
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <RefreshCw size={12} />
                  {swapMode ? 'Cancel' : 'Swap'}
                </button>
              )}
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-4 py-4" style={{ maxHeight: 'calc(80vh - 140px)' }}>
          {swapMode && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Swap Mode:</strong> Tap on two products from different sections to swap their positions.
                {selectedForSwap && <span className="block mt-1">Now select a product from the other section.</span>}
              </p>
            </div>
          )}

          {/* Buy Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingBag size={16} className="text-blue-600" />
              <h4 className="font-medium">Buy ({buyProducts.length}/{offerData.buy_count})</h4>
            </div>
            
            {buyProducts.length > 0 ? (
              <div className="space-y-3">
                {buyProducts.map((item) => (
                  <ProductCard key={item.product.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-gray-500 text-sm">
                  Select {offerData.buy_count} product{offerData.buy_count > 1 ? 's' : ''} to buy
                </p>
              </div>
            )}
          </div>
          
          {/* Get Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Gift size={16} className="text-green-600" />
              <h4 className="font-medium">Get Free ({getProducts.length}/{offerData.get_count})</h4>
            </div>
            
            {getProducts.length > 0 ? (
              <div className="space-y-3">
                {getProducts.map((item) => (
                  <ProductCard key={item.product.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-gray-500 text-sm">
                  Select {offerData.get_count} product{offerData.get_count > 1 ? 's' : ''} to get free
                </p>
              </div>
            )}
          </div>

          {/* Summary */}
          {(buyProducts.length > 0 || getProducts.length > 0) && (
            <div className="border-t pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Buy Total:</span>
                  <span className="font-medium">₹{buyTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>You Save:</span>
                  <span className="font-medium">₹{savings.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Final Total:</span>
                  <span>₹{buyTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-4 py-3">
          <button 
            className={`w-full py-3 rounded-lg font-medium transition-colors ${
              isOfferComplete 
                ? 'bg-black text-white hover:bg-gray-800' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!isOfferComplete}
          >
            {isOfferComplete ? 'Buy Now' : 'Complete Your Selection'}
          </button>
        </div>
      </div>
    </>
  );
}