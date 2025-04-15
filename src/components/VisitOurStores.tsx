import React from 'react';
import Image from 'next/image';

const VisitOurStores: React.FC = () => {
  const store = {
    name: 'STARA Jewels',
    location: 'Calicut, India',
    address: 'Third Floor, Nalonkandy Arcade, Pushpa Junction, Calicut, India 673002',
    image: '/images/silverjewels.jpg', 
  };

  return (
    <section className="w-full py-8 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-semibold text-center mb-8">VISIT OUR STORES</h2>
        
        <div className="flex flex-col md:flex-row max-w-4xl mx-auto">
          <div className="w-full md:w-1/2 mb-4 md:mb-0">
            <div className="relative h-64 w-full overflow-hidden">
              <Image
                src={store.image}
                alt={`${store.name} store in ${store.location}`}
                layout="fill"
                objectFit="cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <h3 className="text-white text-4xl font-bold">{store.name}</h3>
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-1/2 pl-0 md:pl-6 flex flex-col justify-center items-center md:items-start">
            <h4 className="text-lg font-bold mb-2 uppercase">{store.location}</h4>
            <p className="text-gray-700 text-sm text-center md:text-left">
              {store.address}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VisitOurStores;