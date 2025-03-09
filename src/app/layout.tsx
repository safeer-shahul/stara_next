import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PALMONAS | Demifine Jewellery',
  description: 'Explore our collection of Demifine Jewellery',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Render children directly without wrapping in ShopLayout or AdminLayout */}
        {children}
      </body>
    </html>
  );
}