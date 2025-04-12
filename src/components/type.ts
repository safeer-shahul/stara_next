// types.ts
export type Product = {
    id: string;
    name: string;
    price: number;
    originalPrice: number;
    discount: string;
    image: string;
  };
  
  export type CartItem = {
    id: string;
    quantity: number;
  };
  
  export type CouponType = {
    code: string;
    description: string;
    discount: number;
  };
  
  export type CartDrawerProps = {
    isOpen: boolean;
    onClose: () => void;
    productId:any | null;
  };
  
  // Sample product data for testing
  export const SAMPLE_PRODUCTS: Record<string, Product> = {
    '1': {
      id: '1',
      name: 'Golden Crossover Kada Bracelet',
      price: 2250,
      originalPrice: 3214,
      discount: '30%',
      image: '/images/productslider/PM-EARRINGS-037_1_0040.webp', // placeholder - replace with actual image
    },
    '2': {
      id: '2',
      name: 'Chic Layered Necklace',
      price: 899,
      originalPrice: 3299,
      discount: '73%',
      image: '/images/productslider/PM-EARRINGS-037_1_0040.webp', // placeholder - replace with actual image
    },
    '3': {
      id: '3',
      name: 'Gilded Oval Bangle',
      price: 999,
      originalPrice: 2999,
      discount: '66%',
      image: '/images/productslider/PM-EARRINGS-037_1_0040.webp', // placeholder - replace with actual image
    }
  };