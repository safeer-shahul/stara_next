// components/Complaints.tsx
'use client';

import React from 'react';
import { MessageSquare, Info } from 'lucide-react';

export default function Complaints() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-6">
        <MessageSquare size={24} className="text-[var(--color-primary-950)] mr-3" />
        <h2 className="text-xl font-semibold text-gray-800">Your Complaints</h2>
      </div>

      <div className="text-center py-10">
        <Info size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">This section is under construction. </p>
        <p className="text-gray-500">You will soon be able to submit and track your complaints here.</p>
      </div>

      {/* You can add forms/lists for complaints here later */}
    </div>
  );
}