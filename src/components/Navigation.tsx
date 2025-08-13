import React from 'react';
import { BarChart3, Wallet, History, PlusCircle, MinusCircle, Shield } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onWithdraw: () => void;
  isAdmin?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({ 
  activeTab, 
  setActiveTab, 
  onWithdraw, 
  isAdmin = false 
}) => {
  const handleDeposit = () => {
    window.open('https://futurapay.com/requestfund/fund689bf392506fc', '_blank');
  };

  const handleWhatsApp = () => {
    window.open('https://wa.me/237672631014', '_blank');
  };

  const handleTelegram = () => {
    window.open('https://t.me/habbyforexacadmy237', '_blank');
  };

  return (
    <nav className="bg-gray-800 border-b border-gray-700 px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <button
            onClick={() => setActiveTab('trading')}
            className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'trading'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Trading</span>
          </button>
          
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'portfolio'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Portfolio</span>
          </button>
          
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>History</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === 'admin'
                  ? 'border-purple-500 text-purple-500'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin</span>
            </button>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleWhatsApp}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
          >
            <span>📱</span>
            <span>WhatsApp</span>
          </button>
          
          <button
            onClick={handleTelegram}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
          >
            <span>✈️</span>
            <span>Telegram</span>
          </button>
          
          <button
            onClick={handleDeposit}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Deposit</span>
          </button>
          
          <button
            onClick={onWithdraw}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <MinusCircle className="w-4 h-4" />
            <span>Withdraw</span>
          </button>
        </div>
      </div>
    </nav>
  );
};