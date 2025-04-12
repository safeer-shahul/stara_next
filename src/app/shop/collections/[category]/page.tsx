'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import apiService from '@/utils/api/apiService';

interface ProductItem {
  id: number;
  product_name: string;
  product_image: string;
  selling_price: number;
  // Add other fields as needed
}

export default function CategoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const categorySlug = params?.category as string;
  const subCategoryId = searchParams.get('id');
console.log(categorySlug,subCategoryId)
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 12; // Number of products per page

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      if (!subCategoryId) return;
      
      try {
        setLoading(true);
        
        // Fetch products with category id
        const productsData = await apiService.getPaginatedProducts(
          currentPage,
          pageSize,
          undefined, // No specific product IDs
          { subcategory_id: subCategoryId.replace(/-/g, '') } // Pass category ID as subcategory_id
        );
        
        setProducts(productsData.products || []);
        setTotalPages(productsData.total_pages || 1);
        
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
      }
    };

    fetchCategoryProducts();
  }, [subCategoryId, categorySlug, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo(0, 0); // Scroll to top when changing page
    }
  };

  if (loading) {
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
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">{categoryName}</h1>
      <p className="text-gray-500 mb-6">Explore our {categoryName.toLowerCase()} collection</p>
      
      {products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="relative h-64">
                  <Image
                    src={product.product_image ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${product.product_image}` : '/images/placeholder.png'}
                    alt={product.product_name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="object-cover"
                    unoptimized={process.env.NODE_ENV === 'development'} // Skip optimization during development
                  />
                </div>
                <div className="p-4">
                  <h2 className="font-semibold text-lg mb-1">{product.product_name}</h2>
                  <p className="text-[#175e7a] font-medium">${product.selling_price}</p>
                  <button className="mt-3 w-full bg-[#175e7a] text-white py-2 rounded-md hover:bg-[#0e4a62] transition-colors duration-300">
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded ${
                    currentPage === 1 
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                      : 'bg-[#175e7a] text-white hover:bg-[#0e4a62]'
                  }`}
                >
                  Previous
                </button>
                
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handlePageChange(index + 1)}
                    className={`px-4 py-2 rounded ${
                      currentPage === index + 1
                        ? 'bg-[#0e4a62] text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded ${
                    currentPage === totalPages 
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                      : 'bg-[#175e7a] text-white hover:bg-[#0e4a62]'
                  }`}
                >
                  Next
                </button>
              </div>
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