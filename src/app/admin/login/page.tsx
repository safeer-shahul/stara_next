 // app/admin/login/page.tsx
 'use client';
  
 import { useState } from 'react';
 import { useRouter } from 'next/navigation';
 
 export default function AdminLoginPage() {
   const [username, setUsername] = useState('');
   const [password, setPassword] = useState('');
   const router = useRouter();
   
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     
     // In a real app, this would connect to your admin authentication API
     if (username === 'admin' && password === 'password') {
       // Set admin auth cookie/token
       router.push('/admin');
     }
   };
   
   return (
     <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
       <h1 className="text-2xl font-bold mb-6 text-center">STARA Admin Login</h1>
       
       <form onSubmit={handleSubmit}>
         <div className="mb-4">
           <label htmlFor="username" className="block mb-2 font-medium">
             Username
           </label>
           <input
             id="username"
             type="text"
             value={username}
             onChange={(e) => setUsername(e.target.value)}
             required
             className="w-full p-3 border rounded"
           />
         </div>
         
         <div className="mb-6">
           <label htmlFor="admin-password" className="block mb-2 font-medium">
             Password
           </label>
           <input
             id="admin-password"
             type="password"
             value={password}
             onChange={(e) => setPassword(e.target.value)}
             required
             className="w-full p-3 border rounded"
           />
         </div>
         
         <button
           type="submit"
           className="w-full bg-indigo-600 text-white py-3 rounded"
         >
           Login to Admin
         </button>
       </form>
     </div>
   );
 }