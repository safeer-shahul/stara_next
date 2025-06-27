// src/components/AddressForm.tsx
'use client';

import { useState } from 'react';
// import INDIAN_STATES from './states'; // Removed direct import
import apiService from '@/utils/api/apiService';

interface Address {
  address: string;
  state: string;
  town: string;
  pincode: string;
  phone_number_1: string;
  phone_number_2?: string;
}

interface AddressFormProps {
  initialData?: Address;
  onSubmit?: (address: Address) => void;
  onCancel: () => void;
  onSuccess?: (newAddressId: string) => void;
}

// Define INDIAN_STATES directly in this file with an index signature
const INDIAN_STATES: { [key: string]: string } = { 
    "AN":"Andaman and Nicobar Islands", 
    "AP":"Andhra Pradesh", 
    "AR":"Arunachal Pradesh", 
    "AS":"Assam", 
    "BR":"Bihar", 
    "CG":"Chandigarh", 
    "CH":"Chhattisgarh", 
    "DN":"Dadra and Nagar Haveli", 
    "DD":"Daman and Diu", 
    "DL":"Delhi", 
    "GA":"Goa", 
    "GJ":"Gujarat", 
    "HR":"Haryana", 
    "HP":"Himachal Pradesh", 
    "JK":"Jammu and Kashmir", 
    "JH":"Jharkhand", 
    "KA":"Karnataka", 
    "KL":"Kerala", 
    "LA":"Ladakh", 
    "LD":"Lakshadweep", 
    "MP":"Madhya Pradesh", 
    "MH":"Maharashtra", 
    "MN":"Manipur", 
    "ML":"Meghalaya", 
    "MZ":"Mizoram", 
    "NL":"Nagaland", 
    "OR":"Odisha", 
    "PY":"Puducherry", 
    "PB":"Punjab", 
    "RJ":"Rajasthan", 
    "SK":"Sikkim", 
    "TN":"Tamil Nadu", 
    "TS":"Telangana", 
    "TR":"Tripura", 
    "UP":"Uttar Pradesh", 
    "UK":"Uttarakhand", 
    "WB":"West Bengal"
};


const AddressForm: React.FC<AddressFormProps> = ({ 
  initialData, 
  onSubmit, 
  onCancel,
  onSuccess 
}) => {
  const [formData, setFormData] = useState<Address>({
    address: initialData?.address || '',
    state: initialData?.state || '',
    town: initialData?.town || '',
    pincode: initialData?.pincode || '',
    phone_number_1: initialData?.phone_number_1 || '',
    phone_number_2: initialData?.phone_number_2 || '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof Address, string>>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof Address, string>> = {};
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!formData.state) {
      newErrors.state = 'State is required';
    }
    
    if (!formData.town.trim()) {
      newErrors.town = 'Town/City is required';
    }
    
    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Please enter a valid 6-digit pincode';
    }
    
    if (!formData.phone_number_1.trim()) {
      newErrors.phone_number_1 = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone_number_1)) {
      newErrors.phone_number_1 = 'Please enter a valid 10-digit phone number';
    }
    
    if (formData.phone_number_2 && !/^\d{10}$/.test(formData.phone_number_2)) {
      newErrors.phone_number_2 = 'Please enter a valid 10-digit phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    
    setFormData(prev => ({
      ...prev,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value
    }));

    // Clear error when user types
    if (errors[name as keyof Address]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setLoading(true);
      setApiError(null);
      
      try {
        // Send the address as an array since the API expects it that way
        const response = await apiService.addAddress([formData]);
        
        if (response && Array.isArray(response) && response.length > 0) {
          // If parent component provided onSubmit callback, call it
          if (onSubmit) {
            onSubmit(formData);
          }
          
          // If parent provided onSuccess callback, call it with the new address ID
          if (onSuccess && response[0]?.id) {
            onSuccess(response[0].id);
          }
        }
      } catch (error) {
        console.error('Error adding address:', error);
        setApiError('Failed to save address. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded-[12px]">
      <h3 className="text-[15px] text-[#494949] font-medium mb-4">Add New Address</h3>
      
      {apiError && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{apiError}</p>
        </div>
      )}
      
      <div>
        <label className="block text-[13px] font-medium text-gray-700 mb-1">
          Address *
        </label>
        <textarea
          name="address"
          value={formData.address}
          onChange={handleChange}
          className={`w-full px-3 py-2 text-[13px] border rounded-md ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
          rows={2}
          placeholder="House No, Building, Street, Area"
        />
        {errors.address && (
          <p className="mt-1 text-[13px] text-red-600">{errors.address}</p>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1">
            Town/City *
          </label>
          <input
            type="text"
            name="town"
            value={formData.town}
            onChange={handleChange}
            className={`w-full px-3 py-2 text-[13px] border rounded-md ${errors.town ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Town or City"
          />
          {errors.town && (
            <p className="mt-1 text-[13px] text-red-600">{errors.town}</p>
          )}
        </div>
        
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1">
            State *
          </label>
          <select
            name="state"
            value={formData.state}
            onChange={handleChange}
            className={`w-full px-3 py-2 text-[13px] border rounded-md ${errors.state ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">Select State</option>
            {Object.entries(INDIAN_STATES).map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
          {errors.state && (
            <p className="mt-1 text-[13px] text-red-600">{errors.state}</p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1">
            Pincode *
          </label>
          <input
            type="text"
            name="pincode"
            value={formData.pincode}
            onChange={handleChange}
            maxLength={6}
            placeholder="6-digit pincode"
            className={`w-full px-3 py-2 text-[13px] border rounded-md ${errors.pincode ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.pincode && (
            <p className="mt-1 text-[13px] text-red-600">{errors.pincode}</p>
          )}
        </div>
        
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1">
            Primary Phone Number *
          </label>
          <input
            type="tel"
            name="phone_number_1"
            value={formData.phone_number_1}
            onChange={handleChange}
            maxLength={10}
            placeholder="10-digit mobile number"
            className={`w-full px-3 py-2 text-[13px] border rounded-md ${errors.phone_number_1 ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.phone_number_1 && (
            <p className="mt-1 text-[13px] text-red-600">{errors.phone_number_1}</p>
          )}
        </div>
      </div>
      
      <div>
        <label className="block text-[13px] font-medium text-gray-700 mb-1">
          Alternate Phone Number (Optional)
        </label>
        <input
          type="tel"
          name="phone_number_2"
          value={formData.phone_number_2}
          onChange={handleChange}
          maxLength={10}
          placeholder="Alternate 10-digit mobile number"
          className={`w-full px-3 py-2 text-[13px] border rounded-md ${errors.phone_number_2 ? 'border-red-500' : 'border-gray-300'}`}
        />
        {errors.phone_number_2 && (
          <p className="mt-1 text-[13px] text-red-600">{errors.phone_number_2}</p>
        )}
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md font-medium text-[14px] text-gray-700 hover:bg-black hover:text-white cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className={`px-4 py-2 bg-[var(--color-primary-950)] border border-transparent rounded-md text-[14px] font-medium text-white hover:bg-[#124b62] cursor-pointer ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Address'}
        </button>
      </div>
    </form>
  );
};

export default AddressForm;
