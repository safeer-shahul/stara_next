'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link'; // Import Link for navigation
import HeroSlider from '@/components/HeroSlider';
import ShopLayout from './shop/layout';
import CategoryGrid from '@/components/CategoryGrid';
import ProductSlider from '@/components/ProductSlider';
import OffersGrid from '@/components/OffersGrid';
import apiService from '@/utils/api/apiService';
import VisitOurStores from '@/components/VisitOurStores';

interface HomeCategory {
  id: string;
  name: string;
  products: any[];
}

export default function Home() {
  const [homeCategories, setHomeCategories] = useState<HomeCategory[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  // const [userProfile, setUserProfile] = useState<any>(null); // Kept as in your original code
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);

    fetchHomeCategories();
    fetchOffers();
    // checkAndFetchUserProfile(); // Kept as in your original code
  }, []);

  // Alternative: Use this if you want to scroll to top after data loads
  useEffect(() => {
    if (!loading && !error) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 100);
    }
  }, [loading, error]);

  const fetchHomeCategories = async () => {
    setLoading(true);
    try {
      const response = await apiService.getHomeCategories();
      setHomeCategories(response);
      setError(null);
    } catch (err) {
      // console.error('Failed to fetch home categories:', err); // Kept as in your original code
      setError('Failed to load home categories. Please try again.');
      setHomeCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOffers = async () => {
    try {
      const response = await apiService.getValidOffers();
      // console.log('Offers data:', response); // Kept as in your original code
      // Extract the data array from the API response
      if (response && response.data) {
        setOffers(response.data);
      } else {
        setOffers([]);
      }
    } catch (err) {
      // console.error('Failed to fetch offers:', err); // Kept as in your original code
      setOffers([]);
    }
  };

  // Helper function to create a slug from a category name
  const createSlug = (name: string): string => {
    // Basic slugification: convert to lowercase, replace non-alphanumeric with hyphens,
    // and remove duplicate/trailing hyphens.
    return name.toLowerCase()
               .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric characters except spaces and hyphens
               .replace(/\s+/g, '-')       // Replace spaces with single hyphens
               .replace(/-+/g, '-')        // Replace multiple hyphens with single hyphen
               .replace(/^-+|-+$/g, '');   // Remove leading/trailing hyphens
  };

  return (
    <ShopLayout>
      <HeroSlider />
      <CategoryGrid />

      {/* Offers Grid - Only shows if offers exist */}
      <OffersGrid offers={offers} />

      {loading && (
        <div className="py-16 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading collections...</p>
        </div>
      )}

      {error && (
        <div className="py-8 px-4 max-w-7xl mx-auto">
          <div className="bg-red-50 p-4 rounded-lg text-red-700 text-center">
            {error}
          </div>
        </div>
      )}

      {!loading && !error && homeCategories.map((category) => (
        // The ProductSlider component itself has the section and padding classes
        // We'll insert our title and "View All" link right before it,
        // using a similar container for consistent width and horizontal padding.
        <div key={category.id}>
          {/* This div aligns the category name and the "View All" button */}
          <div className="px-4 md:px-16 flex justify-between items-center mt-16">
            <h2 className="text-2xl md:text-3xl font-medium">{category.name}</h2>
            <Link
              href={`/shop/homecategory/${createSlug(category.name)}`}
              className="text-[#C69A7F] hover:text-[#a07d67] font-semibold text-sm"
            >
              View All
            </Link>
          </div>
          {/* The original ProductSlider component */}
          <ProductSlider
            title={''}
            categoryId={category.id}
            products={category.products}
          />
        </div>
      ))}
      <VisitOurStores/>
    </ShopLayout>
  );
}