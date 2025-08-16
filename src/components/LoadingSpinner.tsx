import React from 'react';
import { TrendingUp } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "Loading..." 
}) => {
  // Auto-hide loading spinner after 5 seconds to prevent infinite loading
  React.useEffect(() => {
    const timer = setTimeout(() => {
      // Force app to show login if still loading after 5 seconds
      if (window.location.pathname === '/') {
        window.location.reload();
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <TrendingUp className="w-16 h-16 text-blue-500 mx-auto animate-pulse" />
          <div className="absolute inset-0 w-16 h-16 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
        <div className="mt-4 text-white text-xl font-semibold">{message}</div>
        <div className="mt-2 text-gray-400">Almost ready...</div>
        <div className="mt-4 text-xs text-gray-500">
          If this takes too long, the page will refresh automatically
        </div>
      </div>
    </div>
  );
};