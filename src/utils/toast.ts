// utils/toast.ts
// First install: npm install sweetalert2
import Swal from 'sweetalert2';

export const showToast = {
  success: (message: string) => {
    Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      icon: 'success',
      title: message,
      background: '#f0f9ff',
      color: '#0c4a6e',
    });
  },
  
  error: (message: string) => {
    Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 4000,
      timerProgressBar: true,
      icon: 'error',
      title: message,
      background: '#fef2f2',
      color: '#991b1b',
    });
  },
  
  warning: (message: string) => {
    Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3500,
      timerProgressBar: true,
      icon: 'warning',
      title: message,
      background: '#fffbeb',
      color: '#92400e',
    });
  },
  
  info: (message: string) => {
    Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      icon: 'info',
      title: message,
      background: '#f0f9ff',
      color: '#1e40af',
    });
  }
};