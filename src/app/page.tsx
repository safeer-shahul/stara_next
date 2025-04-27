'use client';

import { useState, useEffect } from 'react';
import HeroSlider from '@/components/HeroSlider';
import ShopLayout from './shop/layout';
import CategoryGrid from '@/components/CategoryGrid';
import ProductSlider from '@/components/ProductSlider';
import apiService from '@/utils/api/apiService';
import VisitOurStores from '@/components/VisitOurStores';

interface HomeCategory {
  id: string;
  name: string;
  products: any[];
}



export default function Home() {
  const [homeCategories, setHomeCategories] = useState<HomeCategory[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHomeCategories();
    checkAndFetchUserProfile();
  }, []);

  const fetchHomeCategories = async () => {
    setLoading(true);
    try {
      const response = await apiService.getHomeCategories();
      setHomeCategories(response);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch home categories:', err);
      setError('Failed to load home categories. Please try again.');
      setHomeCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const checkAndFetchUserProfile = async () => {
    // Check if accessToken exists in localStorage
    const accessToken = localStorage.getItem('accessToken');
    
    if (accessToken) {
      try {
        // Call getUserProfile API
        const profile = await apiService.getUserProfile();
        setUserProfile(profile);
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
        // On error, remove accessToken from localStorage
        localStorage.removeItem('accessToken');
        // Refresh the page
        window.location.reload();
      }
    }
  };

  return (
    <ShopLayout>
      <HeroSlider />
      <CategoryGrid />
      
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
        <ProductSlider 
          key={category.id}
          title={category.name}
          categoryId={category.id}
          products={category.products}
        />
      ))}
      <VisitOurStores/>
    </ShopLayout>
  );
}