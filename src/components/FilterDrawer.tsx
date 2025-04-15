'use client';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface FilterDrawerProps {
  isOpen: boolean;
onClose: () => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  applyFilters: () => void;
  resetFilters: () => void;
}

export default function FilterDrawer({
  isOpen,
  onClose,
  priceRange,
  setPriceRange,
  sortBy,
  setSortBy,
  applyFilters,
  resetFilters
}: FilterDrawerProps) {
  // Using internal state to handle changes before applying
  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>(priceRange);
  
  // Update local state when props change
  useEffect(() => {
    setLocalPriceRange(priceRange);
  }, [priceRange]);

  const handleApply = () => {
    setPriceRange(localPriceRange);
    applyFilters();
  };

  const handleReset = () => {
    setLocalPriceRange([0, 25000]);
    resetFilters();
  };

  // Format price as rupee
  const formatRupee = (value: number) => {
    return `₹${value.toLocaleString()}`;
  };

  // Custom slider implementation
  const minValue = 0;
  const maxValue = 25000;
  const sliderWidth = 100; // Percentage width

  // Calculate slider thumb positions
  const getThumbPosition = (value: number) => {
    return ((value - minValue) / (maxValue - minValue)) * sliderWidth;
  };

  const minThumbPosition = getThumbPosition(localPriceRange[0]);
  const maxThumbPosition = getThumbPosition(localPriceRange[1]);

  // Handle thumb drag
  const handleMinThumbMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const slider = e.currentTarget.parentElement;
    if (!slider) return;
    
    const updateThumbPosition = (clientX: number) => {
      const rect = slider.getBoundingClientRect();
      const position = ((clientX - rect.left) / rect.width) * 100;
      const value = Math.round(((position / 100) * (maxValue - minValue)) + minValue);
      
      // Ensure min doesn't exceed max
      if (value >= 0 && value <= localPriceRange[1]) {
        setLocalPriceRange([value, localPriceRange[1]]);
      }
    };
    
    // For mouse events
    if ('clientX' in e) {
      updateThumbPosition(e.clientX);
      
      const handleMouseMove = (e: MouseEvent) => {
        updateThumbPosition(e.clientX);
      };
      
      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    // For touch events
    else if (e.touches.length > 0) {
      updateThumbPosition(e.touches[0].clientX);
      
      const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length > 0) {
          updateThumbPosition(e.touches[0].clientX);
        }
      };
      
      const handleTouchEnd = () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
      
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }
  };

  const handleMaxThumbMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const slider = e.currentTarget.parentElement;
    if (!slider) return;
    
    const updateThumbPosition = (clientX: number) => {
      const rect = slider.getBoundingClientRect();
      const position = ((clientX - rect.left) / rect.width) * 100;
      const value = Math.round(((position / 100) * (maxValue - minValue)) + minValue);
      
      // Ensure max doesn't go below min
      if (value >= localPriceRange[0] && value <= maxValue) {
        setLocalPriceRange([localPriceRange[0], value]);
      }
    };
    
    // For mouse events
    if ('clientX' in e) {
      updateThumbPosition(e.clientX);
      
      const handleMouseMove = (e: MouseEvent) => {
        updateThumbPosition(e.clientX);
      };
      
      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    // For touch events
    else if (e.touches.length > 0) {
      updateThumbPosition(e.touches[0].clientX);
      
      const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length > 0) {
          updateThumbPosition(e.touches[0].clientX);
        }
      };
      
      const handleTouchEnd = () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
      
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }
  };

  return (
    <>
      <div 
        className={`fixed inset-y-0 left-0 w-90 bg-white shadow-lg transform transition-transform duration-300 z-55 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-[16px] text-[#7F7F7F] font-semibold">Filter</h2>
          <button onClick={onClose} className="p-1">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 border-b  border-gray-200">
          <h3 className="text-[14px] text-[#7F7F7F] font-medium mb-4">Price Range</h3>
          
          <div className="px-2 py-6 relative">
            <div className="w-full h-1 bg-gray-300 rounded-full relative">
              <div 
                className="absolute h-full bg-[#175e7a] rounded-full" 
                style={{
                  left: `${minThumbPosition}%`,
                  width: `${maxThumbPosition - minThumbPosition}%`
                }}
              ></div>
              
              <div 
                className="absolute w-5 h-5 bg-white border-2 border-[#175e7a] rounded-full -top-2 -ml-2.5 cursor-pointer"
                style={{ left: `${minThumbPosition}%` }}
                onMouseDown={handleMinThumbMove}
                onTouchStart={handleMinThumbMove}
                role="slider"
                aria-valuemin={minValue}
                aria-valuemax={maxValue}
                aria-valuenow={localPriceRange[0]}
                tabIndex={0}
              ></div>
              
              <div 
                className="absolute w-5 h-5 bg-white border-2 border-[#175e7a] rounded-full -top-2 -ml-2.5 cursor-pointer" 
                style={{ left: `${maxThumbPosition}%` }}
                onMouseDown={handleMaxThumbMove}
                onTouchStart={handleMaxThumbMove}
                role="slider"
                aria-valuemin={minValue}
                aria-valuemax={maxValue}
                aria-valuenow={localPriceRange[1]}
                tabIndex={0}
              ></div>
            </div>
          </div>
          
          <div className="flex justify-between mt-4">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 mb-1">Min Price</span>
              <div className="flex items-center border border-gray-300 rounded px-2 py-1">
                <span className="text-gray-600 text-sm">₹</span>
                <input 
                  type="number" 
                  value={localPriceRange[0]} 
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value >= 0 && value <= localPriceRange[1]) {
                      setLocalPriceRange([value, localPriceRange[1]]);
                    }
                  }}
                  className="w-20 outline-none text-sm ml-1"
                />
              </div>
            </div>
            
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 mb-1">Max Price</span>
              <div className="flex items-center border border-gray-300 rounded px-2 py-1">
                <span className="text-gray-600 text-sm">₹</span>
                <input 
                  type="number" 
                  value={localPriceRange[1]} 
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value >= localPriceRange[0]) {
                      setLocalPriceRange([localPriceRange[0], value]);
                    }
                  }}
                  className="w-20 outline-none text-sm ml-1"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-500 flex justify-between">
            <span>Range: {formatRupee(localPriceRange[0])} - {formatRupee(localPriceRange[1])}</span>
          </div>
        </div>
        
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-[14px] text-[#7F7F7F] font-medium mb-4">Sort By</h3>
          <div className="space-y-2">
            <label className="flex text-[14px] items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="sort" 
                checked={sortBy === 'price_asc'} 
                onChange={() => setSortBy('price_asc')}
                className="accent-black"
              />
              <span>Price: Low to High</span>
            </label>
            <label className="flex text-[14px] items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="sort" 
                checked={sortBy === 'price_desc'} 
                onChange={() => setSortBy('price_desc')}
                className="accent-black"
              />
              <span>Price: High to Low</span>
            </label>
            <label className="flex text-[14px] items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="sort" 
                checked={sortBy === ''} 
                onChange={() => setSortBy('')}
                className="accent-black"
              />
              <span>Default</span>
            </label>
          </div>
        </div>
        
        <div className="p-4 flex gap-3">
          <button 
            onClick={handleApply}
            className="flex-1 py-2 bg-[#175e7a] text-[14px] cursor-pointer text-white rounded hover:bg-gray-800 transition-colors"
          >
            Apply
          </button>
          <button 
            onClick={handleReset}
            className="flex-1 py-2 border border-gray-300 text-[14px] cursor-pointer rounded hover:bg-gray-100 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
      
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-50"
          onClick={onClose}
        ></div>
      )}
    </>
  );
}