import React, { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TradingPanelProps {
  selectedPair: string;
  currentPrice: number;
  onTrade: (type: 'buy' | 'sell', amount: number) => Promise<void>;
  userBalance: number;
  isLoading?: boolean;
}

export const TradingPanel: React.FC<TradingPanelProps> = ({ 
  selectedPair, 
  currentPrice, 
  onTrade, 
  userBalance,
  isLoading = false 
}) => {
  const [amount, setAmount] = useState(100);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTrade = async (type: 'buy' | 'sell') => {
    if (amount > userBalance) {
      alert('Insufficient balance');
      return;
    }
    
    setIsProcessing(true);
    try {
      await onTrade(type, amount);
    } finally {
      setIsProcessing(false);
    }
  };

  const quickAmounts = [50, 100, 250, 500, 1000];

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4">Trade {selectedPair}</h3>
      
      <div className="space-y-4">
        <div className="bg-gray-700 rounded-lg p-3">
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-gray-400">Available Balance:</span>
            <span className="text-white font-semibold">${userBalance.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Current Price:</span>
            <span className="text-white font-mono">{currentPrice.toFixed(4)}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Investment Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="1"
            max={userBalance}
            placeholder="Enter amount"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Quick Amounts</label>
          <div className="grid grid-cols-5 gap-2">
            {quickAmounts.map(quickAmount => (
              <button
                key={quickAmount}
                onClick={() => setAmount(quickAmount)}
                disabled={quickAmount > userBalance}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  amount === quickAmount
                    ? 'bg-blue-600 text-white'
                    : quickAmount > userBalance
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                ${quickAmount}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-blue-600 bg-opacity-20 border border-blue-600 rounded-lg p-3">
          <div className="flex justify-between items-center text-sm mt-1">
            <span className="text-blue-400">Potential Profit (70-90%):</span>
            <span className="text-green-400 font-semibold">
              ${(amount * 0.8).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            onClick={() => handleTrade('buy')}
            disabled={isProcessing || isLoading || amount > userBalance || amount < 1}
            className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors"
          >
            <TrendingUp className="w-5 h-5" />
            <span>{isProcessing ? 'Processing...' : 'BUY'}</span>
          </button>
          
          <button
            onClick={() => handleTrade('sell')}
            disabled={isProcessing || isLoading || amount > userBalance || amount < 1}
            className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors"
          >
            <TrendingDown className="w-5 h-5" />
            <span>{isProcessing ? 'Processing...' : 'SELL'}</span>
          </button>
        </div>

        <div className="text-xs text-gray-400 text-center mt-4 space-y-2">
          <p>⚠️ Risk Warning: Trading involves risk. Only invest what you can afford to lose.</p>
          
          <div className="flex justify-center space-x-3 mt-4 pt-4 border-t border-gray-700">
            <button
              onClick={() => window.open('https://wa.me/237672631014', '_blank')}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <span>📱</span>
              <span>WhatsApp Support</span>
            </button>
            
            <button
              onClick={() => window.open('https://t.me/habbyforexacadmy237', '_blank')}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <span>✈️</span>
              <span>Telegram</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};