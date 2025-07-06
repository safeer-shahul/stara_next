import React from 'react';
import ShopLayout from '../shop/layout';

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <ShopLayout>
      <main>
        <section className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </section>
      </main>
    </ShopLayout>
  );
}