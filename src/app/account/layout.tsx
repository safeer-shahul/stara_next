import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main>
        <section className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}