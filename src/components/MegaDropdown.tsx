import React from 'react';
import Link from 'next/link';

type Badge = {
  text: string;
  color: string;
};

type Item = {
  name: string;
  link: string;
  badge?: Badge;
};

type Category = {
  title: string;
  items: Item[];
};

type MegaDropdownProps = {
  isOpen: boolean;
  categories: Category[];
};

const MegaDropdown: React.FC<MegaDropdownProps> = ({ isOpen, categories }) => {
  if (!isOpen) return null;
 
  return (
    <div className="absolute top-full left-1/2 transform -translate-x-1/2 bg-white shadow-lg border-t border-gray-200 py-6 z-50 rounded-b-lg">
      <div className="container mx-auto px-4 flex justify-center">
        {categories.map((category, index) => (
          <div key={index} className="px-8 min-w-[160px]">
            <h3 className="font-medium mb-4 text-gray-900">{category.title}</h3>
            <ul className="space-y-2">
              {category.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <Link href={item.link} className="text-gray-600 hover:text-black flex items-center">
                    {item.name}
                    {item.badge && (
                      <span className={`ml-1 ${item.badge.color} text-xs px-2 py-0.5 rounded-full`}>
                        {item.badge.text}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MegaDropdown;