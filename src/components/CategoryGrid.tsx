'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import { Loader2 } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/autoplay';
import apiService from '@/utils/api/apiService';

interface CategoryItem {
  image: string;
  title: string;
  link: string;
}

export default function CategoryGrid() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const categoryData = await apiService.getAllCategoriesPublic();
        
        // Map API data to the format expected by the component
        const formattedCategories = categoryData.map(category => ({
          image: category.category_image 
            ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${category.category_image}`
            : '/images/placeholder.png', // fallback image
          title: category.category_name.toUpperCase(),
          link: `/shop/categories/${category.slug}`
        }));
        
        setCategories(formattedCategories);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        setError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryClick = (link: string): void => {
    router.push(link);
  };

  if (loading) {
    return (
      <div className="w-full mx-auto py-8 flex justify-center items-center" style={{ minHeight: '300px' }}>
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full mx-auto py-8 text-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full mx-auto py-8 relative">
      <h2 className="text-2xl md:text-3xl font-medium text-center mb-8">
        Everyday Demi-fine Jewellery
      </h2>
      
      {categories.length > 0 ? (
        <Swiper
          style={{ padding: '18px 0 0 0' }}
          spaceBetween={10}
          slidesPerView={2}
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          modules={[Autoplay]}
          loop={true}
          className="category-swiper"
          breakpoints={{
            768: {
              slidesPerView: 4,
            },
          }}
        >
          {categories.map((category, index) => (
            <SwiperSlide key={`${category.title}-${index}`}>
              <div
                className="flex flex-col items-center cursor-pointer group px-2 md:px-4"
                onClick={() => handleCategoryClick(category.link)}
              >
                {/* Round Image Container */}
                <div className="relative w-40 h-40 lg:w-60 lg:h-60 xl:w-70 xl:h-70 rounded-full overflow-hidden transition-transform group-hover:scale-105">
                  <Image
                    src={category.image}
                    alt={category.title}
                    fill
                    sizes="(max-width: 768px) 160px, (max-width: 1024px) 240px, 320px"
                    className="object-cover object-center"
                    unoptimized={process.env.NODE_ENV === 'development'} // Optional: Skip optimization during development
                  />
                </div>
                <h3 className="mt-4 text-sm md:text-base font-medium">{category.title}</h3>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No categories available
        </div>
      )}
    </div>
  );
}