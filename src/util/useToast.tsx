// useToast.jsx
import React, { useState } from 'react';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export const Toast = ({ message, type, isVisible }: { message: string, type: ToastType, isVisible: boolean }) => {
  const typeStyles = {
    info: 'bg-gray-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600'
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50" >
      <div
        className={
          `
          ${typeStyles[type]}
          text-white 
          px-4 
          py-2 
          rounded-md 
          shadow-lg
          min-w-[200px]
          text-center
          transition-opacity
          duration-300
          ${isVisible ? 'opacity-100' : 'opacity-0'}
        `}
      >
        {message}
      </div>
    </div>
  );
};

export const useToast = () => {
  const [toast, setToast] = useState({
    message: '',
    type: 'info',
    isVisible: false
  });

  const showToast = (message: string, type: ToastType, duration = 3000) => {
    setToast({
      message,
      type,
      isVisible: true
    });

    setTimeout(() => {
      setToast(prev => ({ ...prev, isVisible: false }));
    }, duration);
  };

  return {
    showToast,
    Toast: () => (
      <Toast
        message={toast.message}
        type={toast.type as ToastType}
        isVisible={toast.isVisible}
      />
    )
  };
};