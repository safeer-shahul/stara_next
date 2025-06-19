import type { Metadata } from 'next';
import './globals.css';
import { WishlistProvider } from './context/WishlistProvider';
import { CartProvider } from '@/context/cartContext';

export const metadata: Metadata = {
  title: 'Stara | Demifine Jewellery',
  description: 'Explore our collection of Demifine Jewellery',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <WishlistProvider>
      <CartProvider>
        <html lang="en">
          <body>
            {children}
          </body>
        </html>
      </CartProvider>
    </WishlistProvider>
  );
}