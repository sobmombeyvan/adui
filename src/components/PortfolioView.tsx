import React from 'react';
import { Trade } from '../types/trading';
import { TrendingUp, TrendingDown, X } from 'lucide-react';

interface PortfolioViewProps {
  trades: Trade[];
  onCloseTrade: (tradeId: string) => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({ trades, onCloseTrade }) => {
  const openTrades = trades.filter(trade => trade.status === 'open');
  const totalProfit = openTrades.reduce((sum, trade) => sum + trade.profit, 0);

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Portfolio Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-400">Open Positions</div>
            <div className="text-2xl font-bold text-white">{openTrades.length}</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-400">Total P&L</div>
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
            </div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-400">Success Rate</div>
            <div className="text-2xl font-bold text-white">
              {trades.length > 0 ? ((trades.filter(t => t.profit > 0).length / trades.length) * 100).toFixed(0) : 0}%
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Open Positions</h3>
        {openTrades.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400">No open positions</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left pb-3">Symbol</th>
                  <th className="text-left pb-3">Type</th>
                  <th className="text-left pb-3">Amount</th>
                  <th className="text-left pb-3">Open Price</th>
                  <th className="text-left pb-3">Current Price</th>
                  <th className="text-left pb-3">P&L</th>
                  <th className="text-left pb-3">Time</th>
                  <th className="text-left pb-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {openTrades.map((trade) => (
                  <tr key={trade.id} className="border-b border-gray-700">
                    <td className="py-3 text-white font-medium">{trade.pair}</td>
                    <td className="py-3">
                      <div className={`flex items-center space-x-1 ${
                        trade.type === 'buy' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {trade.type === 'buy' ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span className="uppercase">{trade.type}</span>
                      </div>
                    </td>
                    <td className="py-3 text-white">${trade.amount.toLocaleString()}</td>
                    <td className="py-3 text-white font-mono">{trade.openPrice.toFixed(4)}</td>
                    <td className="py-3 text-white font-mono">{trade.currentPrice.toFixed(4)}</td>
                    <td className={`py-3 font-semibold ${trade.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}
                    </td>
                    <td className="py-3 text-gray-400">
                      {trade.timestamp.toLocaleTimeString()}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => onCloseTrade(trade.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};