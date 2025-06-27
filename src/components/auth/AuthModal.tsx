// /src/components/auth/AuthModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Login from './Login';
import Register from './Register';


interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'register';
}

const AuthModal = ({ isOpen, onClose, initialView = 'login' }: AuthModalProps) => {
  const [view, setView] = useState<'login' | 'register'>(initialView);
  
  // Close on escape key
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscapeKey);
    return () => window.removeEventListener('keydown', handleEscapeKey);
  }, [isOpen, onClose]);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Handle login success to dispatch event for Header component
  const handleLoginSuccess = () => {
    // Dispatch a custom event that Header component listens for
    window.dispatchEvent(new Event('userLoggedIn'));
    // Close the modal
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 relative overflow-hidden">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-full hover:bg-gray-100"
        >
          <X size={20} />
        </button>
        
        <div className="p-6">
          <div className="flex border-b border-gray-200 mb-6">
            <button
              className={`py-2 px-4 ${
                view === 'login' 
                  ? 'border-b-2 border-[var(--color-primary-950)] text-[var(--color-primary-950)] font-medium' 
                  : 'text-gray-500'
              }`}
              onClick={() => setView('login')}
            >
              Log In
            </button>
            <button
              className={`py-2 px-4 ${
                view === 'register' 
                  ? 'border-b-2 border-[var(--color-primary-950)] text-[var(--color-primary-950)] font-medium' 
                  : 'text-gray-500'
              }`}
              onClick={() => setView('register')}
            >
              Create Account
            </button>
          </div>
          
          {view === 'login' ? (
            <Login 
              onClose={onClose} 
              switchToRegister={() => setView('register')} 
              onLoginSuccess={handleLoginSuccess}
            />
          ) : (
            <Register onClose={onClose} switchToLogin={() => setView('login')} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;