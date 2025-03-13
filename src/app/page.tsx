import HeroSlider from '@/components/HeroSlider';
import ShopLayout from './shop/layout'; // Import ShopLayout
import CategoryGrid from '@/components/CategoryGrid';
import FashionPortraitSlider from '@/components/FashionPortraitSlider';
import ProductSlider from '@/components/ProductSlider';

export default function Home() {
  return (
    <ShopLayout>
      <HeroSlider/>
      <CategoryGrid/>
      <FashionPortraitSlider/>
      <ProductSlider/>
    </ShopLayout>
  );
}