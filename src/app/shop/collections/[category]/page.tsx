'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Loader2, Filter, Heart, ShoppingBag, Home, X } from 'lucide-react';
import apiService from '@/utils/api/apiService';
import FilterDrawer from '@/components/FilterDrawer';
import Link from 'next/link';

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

export default function CategoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const categorySlug = params?.category as string;
  const subCategoryId = searchParams.get('id');
  console.log(categorySlug, subCategoryId);
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [allProductsLoaded, setAllProductsLoaded] = useState(false);
  const pageSize = 20; // Number of products per page
  
  // Filter state
  const [showFilter, setShowFilter] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 25000]);
  const [sortBy, setSortBy] = useState<string>('');
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  
  // Check if filters are active
  const isFilterActive = priceRange[0] > 0 || priceRange[1] < 25000 || sortBy !== '';

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      if (!subCategoryId) return;
      
      try {
        if (currentPage === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        
        // Fetch products with category id and filters
        const productsData = await apiService.getPaginatedProducts(
          currentPage,
          pageSize,
          undefined, // No specific product IDs
          { 
            subcategory_id: subCategoryId.replace(/-/g, ''),
            min_price: priceRange[0],
            max_price: priceRange[1],
            sort_by: sortBy
          }
        );
        
        if (currentPage === 1) {
          setProducts(productsData.products || []);
        } else {
          setProducts(prev => [...prev, ...(productsData.products || [])]);
        }
        
        setTotalProducts(productsData.total_products || 0);
        console.log(totalProducts)
        // Check if all products are loaded
        const loadedProductsCount = (currentPage - 1) * pageSize + productsData.products.length;
        setAllProductsLoaded(loadedProductsCount >= productsData.total_products);
        
        // Format category name from slug for display
        const formattedName = categorySlug
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        
        setCategoryName(formattedName);
      } catch (err) {
        console.error('Failed to fetch category products:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };

    fetchCategoryProducts();
  }, [subCategoryId, categorySlug, currentPage, priceRange, sortBy]);

  const loadMoreProducts = () => {
    setCurrentPage(prev => prev + 1);
  };

  const toggleFilter = () => {
    setShowFilter(!showFilter);
  };

  const applyFilters = () => {
    setCurrentPage(1); 
    setProducts([]); 
    setShowFilter(false); 
  };

  const resetFilters = () => {
    setPriceRange([0, 25000]);
    setSortBy('');
    setCurrentPage(1);
    setProducts([]); 
  };

  // Format price as rupee
  const formatRupee = (value: number) => {
    return `₹ ${value.toLocaleString()}`;
  };

  const handleAddToWishlist = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    console.log('Added to wishlist:', productId);
    // Implement wishlist functionality here
  };

  const handleAddToBag = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    console.log('Added to bag:', productId);
    // Implement add to bag functionality here
  };

  const handleProductClick = (productId: string) => {
    window.location.href = `/shop/products/${productId}`;
  };

  // Calculate discount percentage
  const calculateDiscount = (price: string, strikePrice: string): string => {
    if (!strikePrice || parseFloat(strikePrice) <= 0) return '';
    
    const currentPrice = parseFloat(price);
    const originalPrice = parseFloat(strikePrice);
    
    if (currentPrice >= originalPrice) return '';
    
    const discount = ((originalPrice - currentPrice) / originalPrice) * 100;
    return `${Math.round(discount)}% OFF`;
  };

  if (loading && products.length === 0) {
    return (
      <div className="container mx-auto p-6 min-h-[500px] flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!subCategoryId) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4">Invalid Category</h1>
        <p className="text-gray-500">Missing category information.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 relative">

      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 text-sm mb-3">
          <Link href="/" className="text-gray-500 hover:text-gray-700 flex items-center">
            <Home size={14} className="mr-1" />
            Home
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900">{categoryName}</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">{categoryName}</h1>
        <p className="text-gray-500">Explore our {categoryName.toLowerCase()} collection</p>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-3">
        {/* Active Filters Display */}
        <div className="flex-grow flex flex-wrap items-center gap-2">
          {isFilterActive && priceRange[0] !== 0 && priceRange[1] !== 25000 && (
            <div className="inline-flex items-center px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded-md">
              <span>{formatRupee(priceRange[0])} - {formatRupee(priceRange[1])}</span>
              <button 
                onClick={resetFilters}
                className="ml-2 text-gray-500 hover:text-black"
                aria-label="Clear price filter"
              >
                <X size={14} />
              </button>
            </div>
          )}
          {sortBy && (
            <div className="inline-flex items-center px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded-md">
              <span>
                {sortBy === 'price_asc' ? 'Price: Low to High' : 
                 sortBy === 'price_desc' ? 'Price: High to Low' : 
                 'Sorted'}
              </span>
              <button 
                onClick={() => {
                  setSortBy('');
                  setCurrentPage(1);
                  setProducts([]);
                }}
                className="ml-2 text-gray-500 hover:text-black"
                aria-label="Clear sort filter"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
        
        {/* Filter Button */}
        <button 
          onClick={toggleFilter}
          className="flex items-center gap-2 px-4 py-1 text-[15px] border border-black text-black rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
        >
          <Filter size={15} />
          <span>Filter</span>
        </button>
      </div>
      
      <FilterDrawer 
        isOpen={showFilter}
        onClose={toggleFilter}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        sortBy={sortBy}
        setSortBy={setSortBy}
        applyFilters={applyFilters}
        resetFilters={resetFilters}
      />
      
      {products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              const discount = calculateDiscount(product.product_price, product.strike_price);
              const mainImage = product.images?.[0]?.product_image || '';
              const hoverImage = product.images?.[1]?.product_image || product.images?.[0]?.product_image || '';
              
              return (
                <div 
                  key={product.id}
                  className="relative group"
                  onMouseEnter={() => setHoveredProduct(product.id)}
                  onMouseLeave={() => setHoveredProduct(null)}
                >
                  <div 
                    className="relative w-full aspect-square cursor-pointer overflow-hidden"
                    onClick={() => handleProductClick(product.id)}
                  >
                    <Image
                      src={mainImage ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${mainImage}` : '/images/placeholder.png'}
                      alt={product.product_name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      className={`object-cover object-center transition-all duration-500 ease-in-out transform ${
                        hoveredProduct === product.id ? 'scale-110 opacity-0' : 'scale-100 opacity-100'
                      }`}
                    />
                    
                    <Image
                      src={hoverImage ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${hoverImage}` : '/images/placeholder.png'}
                      alt={`${product.product_name} - alternate view`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      className={`object-cover object-center transition-all duration-500 ease-in-out transform ${
                        hoveredProduct === product.id ? 'scale-100 opacity-100' : 'scale-110 opacity-0'
                      }`}
                    />
                    
                    {!product.product_status && (
                      <div className="absolute top-2 left-2 bg-red-100 text-red-800 px-2 py-1 text-xs font-medium z-10">
                        Out of Stock
                      </div>
                    )}
                    
                    {discount && (
                      <div className="absolute top-2 left-2 bg-green-100 text-green-800 px-2 py-1 text-xs font-medium z-10">
                        {discount}
                      </div>
                    )}
                    
                    <button
                      className={`absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 shadow-sm transition-opacity ${
                        hoveredProduct === product.id ? 'opacity-100' : 'opacity-0'
                      }`}
                      onClick={(e) => handleAddToWishlist(e, product.id)}
                      aria-label="Add to wishlist"
                    >
                      <Heart size={16} className="text-gray-700 hover:text-red-500 transition-colors" />
                    </button>
                    
                    <button
                      className={`absolute bottom-3 right-3 w-10 h-10 flex items-center justify-center rounded-full bg-gray-800 text-white shadow-sm transition-opacity ${
                        hoveredProduct === product.id ? 'opacity-100' : 'opacity-0'
                      }`}
                      onClick={(e) => handleAddToBag(e, product.id)}
                      aria-label="Add to bag"
                      disabled={!product.product_status}
                    >
                      <ShoppingBag size={18} />
                    </button>
                  </div>
                  
                  <div className="mt-4">
                    <h3 
                      className="text-sm md:text-base font-medium cursor-pointer hover:text-blue-500 transition-colors"
                      onClick={() => handleProductClick(product.id)}
                    >
                      {product.product_name}
                    </h3>
                    <div className="flex items-center mt-1 gap-2">
                      <span className="text-sm font-semibold">₹{parseFloat(product.product_price).toLocaleString()}</span>
                      {parseFloat(product.strike_price) > 0 && (
                        <>
                          <span className="text-xs text-gray-500 line-through">₹{parseFloat(product.strike_price).toLocaleString()}</span>
                          {discount && <span className="text-xs text-green-600">({discount})</span>}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {!allProductsLoaded && (
            <div className="flex justify-center mt-10">
              <button
                onClick={loadMoreProducts}
                className={`px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors ${
                  loadingMore ? 'opacity-70 cursor-wait' : ''
                }`}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <span className="flex items-center">
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Loading...
                  </span>
                ) : (
                  'Load More Products'
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No products found in this collection.</p>
        </div>
      )}
    </div>
  );
}