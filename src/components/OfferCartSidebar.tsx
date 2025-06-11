'use client';
import { useState } from 'react';
import Image from 'next/image';
import { X, ShoppingBag, Gift, ArrowRight, ArrowLeft, RefreshCw } from 'lucide-react';

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

interface OfferCartSidebarProps {
  offerData: OfferData;
  buyProducts: SelectedProduct[];
  getProducts: SelectedProduct[];
  onProductRemove: (productId: string) => void;
  onProductMove: (productId: string, newType: 'buy' | 'get') => void;
  onProductSwap?: (buyProductId: string, getProductId: string) => void;
}

export default function OfferCartSidebar({ 
  offerData, 
  buyProducts, 
  getProducts, 
  onProductRemove, 
  onProductMove,
  onProductSwap
}: OfferCartSidebarProps) {
  const [draggedProduct, setDraggedProduct] = useState<string | null>(null);
  const [swapMode, setSwapMode] = useState(false);
  const [selectedForSwap, setSelectedForSwap] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, productId: string) => {
    setDraggedProduct(productId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedProduct(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetType: 'buy' | 'get') => {
    e.preventDefault();
    if (draggedProduct) {
      onProductMove(draggedProduct, targetType);
    }
    setDraggedProduct(null);
  };

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

  const ProductCard = ({ item, showMoveButtons = true }: { item: SelectedProduct; showMoveButtons?: boolean }) => {
    const mainImage = item.product.images?.[0]?.product_image || '';
    const isSelectedForSwap = selectedForSwap === item.product.id;
    
    return (
      <div 
        className={`relative bg-white rounded-lg border p-3 transition-all duration-200 ${
          draggedProduct === item.product.id ? 'opacity-50 scale-95' : ''
        } ${
          swapMode ? 'cursor-pointer hover:border-blue-400' : ''
        } ${
          isSelectedForSwap ? 'border-blue-500 bg-blue-50' : ''
        }`}
        draggable={!swapMode}
        onDragStart={(e) => !swapMode && handleDragStart(e, item.product.id)}
        onDragEnd={handleDragEnd}
        onClick={() => swapMode && handleSwapClick(item.product.id)}
      >
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onProductRemove(item.product.id);
          }}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors z-10"
        >
          <X size={12} />
        </button>

        {swapMode && isSelectedForSwap && (
          <div className="absolute -top-2 -left-2 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs z-10">
            1
          </div>
        )}
        
        <div className="flex gap-3">
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
        
        {showMoveButtons && !swapMode && (
          <div className="flex justify-center gap-2 mt-3">
            {item.type === 'buy' && canMoveProduct(item.product.id, 'get') && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onProductMove(item.product.id, 'get');
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
              >
                <ArrowRight size={12} />
                Move to Get
              </button>
            )}
            {item.type === 'get' && canMoveProduct(item.product.id, 'buy') && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onProductMove(item.product.id, 'buy');
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
              >
                <ArrowLeft size={12} />
                Move to Buy
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-1/3 bg-gray-50 rounded-lg p-6 h-fit sticky top-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Your Offer Selection</h3>
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
            {swapMode ? 'Cancel Swap' : 'Swap Items'}
          </button>
        )}
      </div>

      {swapMode && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Swap Mode:</strong> Click on two products from different sections to swap their positions.
            {selectedForSwap && <span className="block mt-1">Now select a product from the other section.</span>}
          </p>
        </div>
      )}
      
      {/* Buy Section */}
      <div 
        className={`mb-6 p-4 rounded-lg border-2 border-dashed transition-colors ${
          draggedProduct && !swapMode ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
        }`}
        onDragOver={!swapMode ? handleDragOver : undefined}
        onDrop={!swapMode ? (e) => handleDrop(e, 'buy') : undefined}
      >
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
          <p className="text-gray-500 text-sm text-center py-4">
            Select {offerData.buy_count} product{offerData.buy_count > 1 ? 's' : ''} to buy
          </p>
        )}
      </div>
      
      {/* Get Section */}
      <div 
        className={`mb-6 p-4 rounded-lg border-2 border-dashed transition-colors ${
          draggedProduct && !swapMode ? 'border-green-400 bg-green-50' : 'border-gray-300'
        }`}
        onDragOver={!swapMode ? handleDragOver : undefined}
        onDrop={!swapMode ? (e) => handleDrop(e, 'get') : undefined}
      >
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
          <p className="text-gray-500 text-sm text-center py-4">
            Select {offerData.get_count} product{offerData.get_count > 1 ? 's' : ''} to get free
          </p>
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
          
          <button 
            className={`w-full mt-4 py-3 rounded-lg font-medium transition-colors ${
              isOfferComplete 
                ? 'bg-black text-white hover:bg-gray-800' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!isOfferComplete}
          >
            {isOfferComplete ? 'Buy Now' : 'Complete Your Selection'}
          </button>
        </div>
      )}
      
      {buyProducts.length === 0 && getProducts.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <ShoppingBag size={32} className="mx-auto" />
          </div>
          <p className="text-gray-500 text-sm">Start selecting products to see your offer</p>
        </div>
      )}
    </div>
  );
}