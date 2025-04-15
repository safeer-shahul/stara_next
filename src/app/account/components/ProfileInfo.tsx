'use client';

import { useEffect, useState } from 'react';
import apiService from '../../../utils/api/apiService';


export default function ProfileInfo() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await apiService.getUserProfile();
        console.log(response, 'getmecustomer');
        setProfile(response);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-red-500">Unable to load profile information</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div>
          <h2 className="text-[16px] font-semibold">{profile.first_name || 'User'}</h2>
          <p className="text-[16px] text-gray-500">{profile.email}</p>
        </div>
      </div>
      
      {profile.phone && (
        <div className="pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">Phone Number</p>
          <p className="font-medium">{profile.phone}</p>
        </div>
      )}
    </div>
  );
}