'use client'; // Ensure this is a client component if using hooks like useState, useEffect, etc.

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface CollectionItem {
  id: number;
  name: string;
  image: string;
  price: string;
}

const collectionsData: Record<string, CollectionItem[]> = {
  "new-arrivals": [
    { id: 1, name: "Item 1", image: "/item1.jpg", price: "$100" },
    { id: 2, name: "Item 2", image: "/item2.jpg", price: "$150" },
  ],
  "best-seller": [
    { id: 3, name: "Item 3", image: "/item3.jpg", price: "$200" },
    { id: 4, name: "Item 4", image: "/item4.jpg", price: "$250" },
  ],
  "lab-grown-silver": [ 
    { id: 5, name: "Silver Ring", image: "/diamond-ring.jpg", price: "$500" },
    { id: 6, name: "Silver Necklace", image: "/diamond-necklace.jpg", price: "$700" },
  ],
};

export default function CategoryPage() {
  const params = useParams();
  const categorySlug = params?.category as string;

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [categoryExists, setCategoryExists] = useState(true);

  useEffect(() => {
    console.log("Category Slug:", categorySlug); // Debugging
    console.log("Collections Data Keys:", Object.keys(collectionsData)); // Debugging

    setLoading(true);

    if (categorySlug) {
      if (collectionsData[categorySlug]) {
        setItems(collectionsData[categorySlug]);
        setCategoryExists(true);
      } else {
        setCategoryExists(false);
      }
    }

    setLoading(false);
  }, [categorySlug]);

  const categoryName = categorySlug
    ? categorySlug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "";

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center text-gray-500">Loading collection...</p>
      </div>
    );
  }

  if (!categoryExists) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4">Collection Not Found</h1>
        <p className="text-gray-500">The collection &quot;{categorySlug}&quot; does not exist.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">{categoryName}</h1>
      <p className="text-gray-500 mb-6">Explore our {categoryName.toLowerCase()} collection</p>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <div key={item.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="relative h-64">
                <img
                  src={item.image}
                  alt={item.name}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="p-4">
                <h2 className="font-semibold text-lg mb-1">{item.name}</h2>
                <p className="text-[#175e7a] font-medium">{item.price}</p>
                <button className="mt-3 w-full bg-[#175e7a] text-white py-2 rounded-md hover:bg-[#0e4a62] transition-colors duration-300">
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No items found in this collection.</p>
        </div>
      )}
    </div>
  );
}