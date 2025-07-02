// /src/components/auth/AuthModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';

interface AuthUserProfile {
  id?: string;
  name?: string;
  email?: string;
  username?: string;
  is_superuser?: boolean;
  is_staff?: boolean;
  [key: string]: any;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'register' | 'forgot-password';
}

const AuthModal = ({ isOpen, onClose, initialView = 'login' }: AuthModalProps) => {
  const [view, setView] = useState<'login' | 'register' | 'forgot-password'>(initialView);
  
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

  // Prevent scrolling when modal is open and reset view on open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setView(initialView);
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, initialView]);

  const handleAuthSuccess = () => {
    window.dispatchEvent(new Event('userLoggedIn'));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 transition-opacity duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg w-full max-w-md mx-4 relative overflow-hidden shadow-xl transform transition-all duration-300 scale-100 opacity-100"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-gray-500 rounded-full hover:bg-gray-100 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-300"
          aria-label="Close authentication modal"
        >
          <X size={20} />
        </button>
        
        <div className="p-6 sm:p-8">
          {view !== 'forgot-password' && (
            <div className="flex border-b border-gray-200 mb-6">
              <button
                id="auth-modal-title"
                className={`flex-1 py-3 px-4 text-center text-lg focus:outline-none transition-colors duration-200
                  ${view === 'login' 
                    ? 'border-b-2 border-[var(--color-primary-950)] text-[var(--color-primary-950)] font-semibold' 
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
                onClick={() => setView('login')}
              >
                Log In
              </button>
              <button
                className={`flex-1 py-3 px-4 text-center text-lg focus:outline-none transition-colors duration-200
                  ${view === 'register' 
                    ? 'border-b-2 border-[var(--color-primary-950)] text-[var(--color-primary-950)] font-semibold' 
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
                onClick={() => setView('register')}
              >
                Create Account
              </button>
            </div>
          )}
          
          {view === 'login' ? (
            <Login 
              switchToRegister={() => setView('register')} 
              onLoginSuccess={handleAuthSuccess}
              switchToForgotPassword={() => setView('forgot-password')}
            />
          ) : view === 'register' ? (
            <Register 
              switchToLogin={() => setView('login')}
              onRegisterSuccess={handleAuthSuccess}
            />
          ) : (
            <ForgotPassword
              onClose={onClose}
              switchToLogin={() => setView('login')}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;