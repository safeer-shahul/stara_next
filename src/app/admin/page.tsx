// app/admin/page.tsx
"use client";

import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [adminUser, setAdminUser] = useState<any>(null);

  useEffect(() => {
    // Get admin user from localStorage
    const storedUser = localStorage.getItem('adminUser');
    if (storedUser) {
      setAdminUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Welcome to the Admin Dashboard</h2>
      
      {adminUser && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Admin User Information</h3>
          <p>Username: {adminUser.username}</p>
          <p>Role: {adminUser.role}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Products</h3>
          <p className="text-3xl font-bold">24</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Orders</h3>
          <p className="text-3xl font-bold">12</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Users</h3>
          <p className="text-3xl font-bold">156</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Revenue</h3>
          <p className="text-3xl font-bold">$3,240</p>
        </div>
      </div>
      
      <div className="mt-6 bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <ul className="divide-y">
          <li className="py-3">New order (#1234) received - $128.50</li>
          <li className="py-3">User John Smith registered</li>
          <li className="py-3">Product &quot;Premium Widget&quot; updated</li>
          <li className="py-3">Order #1233 marked as delivered</li>
          <li className="py-3">New review posted for &quot;Basic Widget&quot;</li>
        </ul>
      </div>
    </div>
  );
}