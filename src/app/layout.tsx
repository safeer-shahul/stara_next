import type { Metadata } from 'next';
import './globals.css';
import { WishlistProvider } from './context/WishlistProvider';

export const metadata: Metadata = {
  title: 'Stara | Demifine Jewellery',
  description: 'Explore our collection of Demifine Jewellery',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <WishlistProvider>
      <html lang="en">
        <body>
          {children}
        </body>
      </html>
    </WishlistProvider>
  );
}