import React from 'react';
import { TrendingUp, User, Settings, LogOut } from 'lucide-react';
import { User as UserType } from '../types/user';

interface HeaderProps {
  user: UserType;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="bg-gray-900 border-b border-gray-700 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <TrendingUp className="w-8 h-8 text-blue-500" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white">ForexPro</h1>
              <div className="text-xs text-gray-400 hidden sm:block">Professional Trading</div>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-2">
            <span className="bg-green-500 text-black px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
              ● LIVE
            </span>
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
              REAL ACCOUNT
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-8">
          <div className="text-right hidden lg:block">
            <div className="text-xs text-gray-400 uppercase tracking-wide">Welcome Back</div>
            <div className="text-lg font-bold text-white">
              {user.firstName} {user.lastName}
            </div>
          </div>
          <div className="text-right bg-gray-800 px-2 sm:px-4 py-2 rounded-lg border border-gray-700">
            <div className="text-xs text-gray-400 uppercase tracking-wide">Account Balance</div>
            <div className="text-sm sm:text-xl font-bold text-green-400">
              ${user.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="text-right bg-gray-800 px-2 sm:px-4 py-2 rounded-lg border border-gray-700 hidden sm:block">
            <div className="text-xs text-gray-400 uppercase tracking-wide">Total P&L</div>
            <div className="text-sm sm:text-xl font-bold">
              <span className={user.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}>
                {user.totalProfit >= 0 ? '+' : ''}${user.totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-3">
            <button className="p-2 text-gray-400 hover:text-white transition-colors hover:bg-gray-800 rounded-lg hidden sm:block">
              <Settings className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-white transition-colors hover:bg-gray-800 rounded-lg hidden sm:block">
              <User className="w-5 h-5" />
            </button>
            <button 
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-red-400 transition-colors hover:bg-gray-800 rounded-lg"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};