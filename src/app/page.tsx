import HeroSlider from '@/components/HeroSlider';
import ShopLayout from './shop/layout';
import CategoryGrid from '@/components/CategoryGrid';
import FashionPortraitSlider from '@/components/FashionPortraitSlider';
import ProductSlider from '@/components/ProductSlider';

export default function Home() {
  return (
    <ShopLayout>
      <HeroSlider />
      <CategoryGrid />
      <FashionPortraitSlider />
      
      {/* Multiple instances of ProductSlider with different titles and types */}
      <ProductSlider title="Date Night" type="dateNight" />
      <ProductSlider title="Best Sellers" type="bestsellers" />
      <ProductSlider title="New Arrivals" type="newArrivals" />
    </ShopLayout>
  );
}