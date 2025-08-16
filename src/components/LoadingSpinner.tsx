import React from 'react';
import { TrendingUp } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "Loading..." 
}) => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <TrendingUp className="w-16 h-16 text-blue-500 mx-auto animate-pulse" />
          <div className="absolute inset-0 w-16 h-16 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
        <div className="mt-4 text-white text-xl font-semibold">{message}</div>
        <div className="mt-2 text-gray-400">Loading your trading platform...</div>
      </div>
    </div>
  );
};