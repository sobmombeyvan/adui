import React from 'react';
import { CurrencyPair } from '../types/trading';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface CurrencyListProps {
  pairs: CurrencyPair[];
  selectedPair: string;
  onSelectPair: (symbol: string) => void;
}

export const CurrencyList: React.FC<CurrencyListProps> = ({ pairs, selectedPair, onSelectPair }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4">Currency Pairs</h3>
      <div className="space-y-2">
        {pairs.map((pair) => (
          <button
            key={pair.symbol}
            onClick={() => onSelectPair(pair.symbol)}
            className={`w-full text-left p-3 rounded-lg transition-colors ${
              selectedPair === pair.symbol
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{pair.symbol}</div>
                <div className="text-sm text-gray-400">{pair.name}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-lg">
                  {pair.price.toFixed(4)}
                </div>
                <div className={`flex items-center space-x-1 text-sm ${
                  pair.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {pair.changePercent >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{pair.changePercent >= 0 ? '+' : ''}{pair.changePercent.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};