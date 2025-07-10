'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, Filter, Home, X, ShoppingCart } from 'lucide-react';
import apiService from '@/utils/api/apiService';
import FilterDrawer from '@/components/FilterDrawer';
import Link from 'next/link';
import WishlistButton from '@/components/WishlistButton';
import CartDrawer from '@/components/CartDrawer';
import { useCart, CartNormalItem, ProductItemDetails, ProductVariant } from '@/context/cartContext';
import { v4 as uuidv4 } from 'uuid';
import VariantSelectionModal from '@/components/VariantSelectionModal';
import { showToast } from '@/utils/toast';

type ProductItem = ProductItemDetails;

export default function CategoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const categorySlug = params?.category as string;
  const subCategoryId = searchParams.get('id');
  // console.log(categorySlug, subCategoryId);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [allProductsLoaded, setAllProductsLoaded] = useState(false);
  const pageSize = 20;

  const [showFilter, setShowFilter] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [sortBy, setSortBy] = useState<string>('');
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);

  const [isNavigating, setIsNavigating] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  // const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // NEW STATES FOR VARIANT SELECTION POPUP
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [productForVariantSelection, setProductForVariantSelection] = useState<ProductItemDetails | null>(null);

  const { dispatchCart, getEffectiveProductStock } = useCart();

  const isFilterActive = priceRange[0] > 0 || priceRange[1] < 50000 || sortBy !== '';

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      if (!subCategoryId) return;

      try {
        if (currentPage === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const productsData = await apiService.getPaginatedProducts(
          currentPage,
          pageSize,
          undefined, // No specific product IDs
          undefined, // No specific product IDs
          {
            subcategory_id: subCategoryId.replace(/-/g, ''),
            min_price: priceRange[0],
            max_price: priceRange[1],
            sort_by: sortBy
          }
        );

        const fetchedProductsWithStock: ProductItem[] = productsData.products.map((p: any) => {
          const hasInStockVariant = p.have_variants && p.product_variant?.some((v: ProductVariant) => v.quantity > 0);
          return {
            ...p,
            isInStock: p.product_status && (p.have_variants ? hasInStockVariant : p.quantity > 0),
          };
        });


        if (currentPage === 1) {
          setProducts(fetchedProductsWithStock || []);
        } else {
          setProducts(prev => [...prev, ...(fetchedProductsWithStock || [])]);
        }

        setTotalProducts(productsData.total_products || 0);
        // console.log(totalProducts)

        const loadedProductsCount = (currentPage - 1) * pageSize + (productsData.products || []).length;
        setAllProductsLoaded(loadedProductsCount >= productsData.total_products);

        const formattedName = categorySlug
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        setCategoryName(formattedName);
      } catch (err) {
        // console.error('Failed to fetch category products:', err);
        setProducts([]);
        setTotalProducts(0);
        setAllProductsLoaded(true);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };

    fetchCategoryProducts();
  }, [subCategoryId, categorySlug, currentPage, priceRange, sortBy, totalProducts]);

  const loadMoreProducts = useCallback(() => {
    setCurrentPage(prev => prev + 1);
  }, []);

  const toggleFilter = useCallback(() => {
    setShowFilter(!showFilter);
  }, [showFilter]);

  const applyFilters = useCallback(() => {
    setCurrentPage(1);
    setProducts([]);
    setShowFilter(false);
  }, []);

  const resetFilters = useCallback(() => {
    setPriceRange([0, 50000]);
    setSortBy('');
    setCurrentPage(1);
    setProducts([]);
  }, []);

  const formatRupee = useCallback((value: number) => {
    return `₹ ${value.toLocaleString()}`;
  }, []);

  const handleProductClick = useCallback(async (productId: string) => {
    try {
      setIsNavigating(productId);
      await router.push(`/shop/products/${productId}`);
    } catch (error) {
      // console.error('Navigation error:', error);
    } finally {
      setTimeout(() => setIsNavigating(null), 100);
    }
  }, [router]);

  const handleProductHover = useCallback((productId: string) => {
    setHoveredProduct(productId);
    router.prefetch(`/shop/products/${productId}`);
  }, [router]);

  const handleAddToWishlist = useCallback((e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    // console.log('Added to wishlist:', productId);
  }, []);

  // UPDATED: handleAddProductToCart with toast notifications
  const handleAddProductToCart = useCallback((productToAdd: ProductItemDetails, selectedVariantToAdd: ProductVariant | null = null): void => {
    const effectiveStock = getEffectiveProductStock(productToAdd, selectedVariantToAdd?.id);
    
    if (effectiveStock <= 0) {
      const variantText = selectedVariantToAdd ? ` (${selectedVariantToAdd.variant_name})` : '';
      showToast.warning(`${productToAdd.product_name}${variantText} is currently out of stock or you have reached the maximum quantity allowed.`);
      return;
    }

    // setSelectedProductId(productToAdd.id);

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


  // UPDATED: handleAddToCartButtonClick to check for variants
  const handleAddToCartButtonClick = useCallback((e: React.MouseEvent, product: ProductItem): void => {
    e.stopPropagation();

    if (product.have_variants && product.product_variant && product.product_variant.length > 0) {
      setProductForVariantSelection(product);
      setIsVariantModalOpen(true);
    } else {
      handleAddProductToCart(product);
    }
  }, [handleAddProductToCart]);


  const handleCartClose = useCallback(() => {
    setIsCartOpen(false);
    // setSelectedProductId(null);
  }, []);

  const calculateDiscount = useCallback((price: string, strikePrice: string): string => {
    if (!strikePrice || parseFloat(strikePrice) <= 0) return '';

    const currentPrice = parseFloat(price);
    const originalPrice = parseFloat(strikePrice);

    if (currentPrice >= originalPrice) return '';

    const discount = ((originalPrice - currentPrice) / originalPrice) * 100;
    return `${Math.round(discount)}% OFF`;
  }, []);

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
          {isFilterActive && priceRange[0] !== 0 && priceRange[1] !== 50000 && (
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
          {/* Updated grid classes: grid-cols-2 for mobile, then responsive breakpoints */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => {
              const discount = calculateDiscount(product.product_price, product.strike_price);
              const mainImage = product.images?.[0]?.product_image || '';
              const hoverImage = product.images?.[1]?.product_image || product.images?.[0]?.product_image || '';
              const isCurrentlyNavigating = isNavigating === product.id;

              const productHasNoInStockVariants = product.have_variants && !product.product_variant.some(v => v.quantity > 0);
              const effectiveStock = getEffectiveProductStock(product, undefined);
              const isButtonDisabled = !product.product_status || (product.have_variants ? productHasNoInStockVariants : product.quantity <= 0) || effectiveStock <= 0;

              return (
                <div
                  key={product.id}
                  className="relative group"
                  onMouseEnter={() => handleProductHover(product.id)}
                  onMouseLeave={() => setHoveredProduct(null)}
                >
                  <div
                    className={`relative w-full aspect-square cursor-pointer overflow-hidden transition-opacity duration-200 ${
                      isCurrentlyNavigating ? 'opacity-75' : 'opacity-100'
                    }`}
                    onClick={() => handleProductClick(product.id)}
                  >
                    {isCurrentlyNavigating && (
                      <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-20">
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin"></div>
                      </div>
                    )}

                    <Image
                      src={mainImage ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${mainImage}` : '/images/placeholder.png'}
                      alt={product.product_name}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      className={`object-cover object-center transition-all duration-500 ease-in-out transform ${
                        hoveredProduct === product.id ? 'scale-110 opacity-0' : 'scale-100 opacity-100'
                      }`}
                      priority={false}
                      loading="lazy"
                    />

                    <Image
                      src={hoverImage ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${hoverImage}` : '/images/placeholder.png'}
                      alt={`${product.product_name} - alternate view`}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      className={`object-cover object-center transition-all duration-500 ease-in-out transform ${
                        hoveredProduct === product.id ? 'scale-100 opacity-100' : 'scale-110 opacity-0'
                      }`}
                      loading="lazy"
                    />

                    {/* Top left badge - Always show discount if available, otherwise show out of stock */}
                    {discount ? (
                      <div className="absolute top-2 left-2 bg-green-100 text-green-800 px-2 py-1 text-xs font-medium z-10">
                        {discount}
                      </div>
                    ) : (!product.isInStock || effectiveStock <= 0) && (
                      <div className="absolute top-2 left-2 bg-red-100 text-red-800 px-2 py-1 text-xs font-medium z-10">
                        Out of Stock
                      </div>
                    )}

                    <div
                      className={`absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 shadow-sm transition-opacity ${
                        hoveredProduct === product.id ? 'opacity-100' : 'opacity-0'
                      }`}
                      onClick={(e) => handleAddToWishlist(e, product.id)}
                      aria-label="Add to wishlist"
                    >
                      <WishlistButton
                        productId={product.id}
                        size={16}
                      />
                    </div>

                    {/* Shopping Cart Button or Out of Stock Text */}
                    {isButtonDisabled ? (
                      <div className={`absolute bottom-3 right-3 px-2 py-1 sm:px-3 sm:py-2 bg-red-500 text-white text-xs font-medium rounded-md transition-opacity ${
                        hoveredProduct === product.id ? 'opacity-100' : 'opacity-0'
                      }`}>
                        Out of Stock
                      </div>
                    ) : (
                      <button
                        className={`absolute bottom-3 right-3 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full shadow-sm transition-opacity bg-gray-800 text-white hover:bg-gray-700 ${
                          hoveredProduct === product.id ? 'opacity-100' : 'opacity-0'
                        }`}
                        onClick={(e) => handleAddToCartButtonClick(e, product)}
                        aria-label="Add to bag"
                      >
                        <ShoppingCart size={16} className="sm:w-[18px] sm:h-[18px]" />
                      </button>
                    )}
                  </div>

                  <div className="mt-4">
                    <h3
                      className={`text-xs sm:text-sm md:text-base font-medium cursor-pointer hover:text-blue-500 transition-colors ${
                        isCurrentlyNavigating ? 'text-gray-500' : ''
                      }`}
                      onClick={() => handleProductClick(product.id)}
                    >
                      {product.product_name}
                      {isCurrentlyNavigating && (
                        <span className="ml-2 text-xs text-gray-400">Loading...</span>
                      )}
                    </h3>
                    <div className="flex items-center mt-1 gap-1 sm:gap-2">
                      <span className="text-xs sm:text-sm font-semibold">₹{parseFloat(product.product_price).toLocaleString()}</span>
                      {parseFloat(product.strike_price) > 0 && (
                        <>
                          <span className="text-xs text-gray-500 line-through">₹{parseFloat(product.strike_price).toLocaleString()}</span>
                          {discount && <span className="text-xs text-green-600 hidden sm:inline">({discount})</span>}
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