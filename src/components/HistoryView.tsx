import React from 'react';
import { Trade } from '../types/trading';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface HistoryViewProps {
  trades: Trade[];
}

export const HistoryView: React.FC<HistoryViewProps> = ({ trades }) => {
  const closedTrades = trades.filter(trade => trade.status === 'closed').reverse();

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Trading History</h2>
      
      {closedTrades.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400">No trading history yet</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left pb-3">Date/Time</th>
                <th className="text-left pb-3">Symbol</th>
                <th className="text-left pb-3">Type</th>
                <th className="text-left pb-3">Amount</th>
                <th className="text-left pb-3">Open Price</th>
                <th className="text-left pb-3">Close Price</th>
                <th className="text-left pb-3">P&L</th>
              </tr>
            </thead>
            <tbody>
              {closedTrades.map((trade) => (
                <tr key={trade.id} className="border-b border-gray-700">
                  <td className="py-3 text-gray-300">
                    {trade.timestamp.toLocaleDateString()} {trade.timestamp.toLocaleTimeString()}
                  </td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};