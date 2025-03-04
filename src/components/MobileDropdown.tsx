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

type MobileDropdownProps = {
  isOpen: boolean;
  categories: Category[];
};

const MobileDropdown: React.FC<MobileDropdownProps> = ({ isOpen, categories }) => {
  if (!isOpen) return null;
  
  return (
    <div className="pl-4 mt-1 border-l-2 border-gray-200 space-y-3">
      {categories.map((category, index) => (
        <div key={index} className="mb-3">
          <h4 className="font-medium text-sm mb-2">{category.title}</h4>
          <ul className="space-y-2">
            {category.items.map((item, itemIndex) => (
              <li key={itemIndex}>
                <Link 
                  href={item.link}
                  className="block py-1 text-sm text-gray-600 hover:text-gray-900"
                >
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
  );
};

export default MobileDropdown;
