import React, { useState } from 'react';
import { X, CreditCard, Banknote } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  type: 'deposit' | 'withdraw';
  onClose: () => void;
  onSubmit: (amount: number, method: string) => Promise<void>;
  userBalance?: number;
  isLoading?: boolean;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ 
  isOpen, 
  type, 
  onClose, 
  onSubmit,
  userBalance = 0,
  isLoading = false
}) => {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    
    if (numAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (type === 'withdraw' && numAmount > userBalance) {
      alert('Insufficient balance');
      return;
    }

    setIsProcessing(true);
    try {
      await onSubmit(numAmount, method);
      setAmount('');
      onClose();
    } catch (error) {
      console.error('Transaction failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const quickAmounts = type === 'deposit' ? [100, 250, 500, 1000, 2500] : [50, 100, 250, 500];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white capitalize">
            {type} Funds
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'withdraw' && (
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Available Balance:</span>
                <span className="text-white font-semibold">${userBalance.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Amount (USD)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter amount"
              min="1"
              max={type === 'withdraw' ? userBalance : undefined}
              step="0.01"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Quick Amounts</label>
            <div className="grid grid-cols-5 gap-2">
              {quickAmounts.map(quickAmount => (
                <button
                  key={quickAmount}
                  type="button"
                  onClick={() => setAmount(quickAmount.toString())}
                  disabled={type === 'withdraw' && quickAmount > userBalance}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    parseFloat(amount) === quickAmount
                      ? 'bg-blue-600 text-white'
                      : (type === 'withdraw' && quickAmount > userBalance)
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  ${quickAmount}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Payment Method
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg cursor-pointer">
                <input
                  type="radio"
                  value="card"
                  checked={method === 'card'}
                  onChange={(e) => setMethod(e.target.value)}
                  className="text-blue-500 focus:ring-blue-500"
                />
                <CreditCard className="w-5 h-5 text-gray-400" />
                <span className="text-white">Credit/Debit Card</span>
              </label>
              
              <label className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg cursor-pointer">
                <input
                  type="radio"
                  value="bank"
                  checked={method === 'bank'}
                  onChange={(e) => setMethod(e.target.value)}
                  className="text-blue-500 focus:ring-blue-500"
                />
                <Banknote className="w-5 h-5 text-gray-400" />
                <span className="text-white">Bank Transfer</span>
              </label>
            </div>
          </div>

          {type === 'deposit' && (
            <div className="bg-green-600 bg-opacity-20 border border-green-600 rounded-lg p-3">
              <div className="text-green-400 text-sm">
                <strong>Instant Processing:</strong> Funds will be added to your account immediately.
              </div>
            </div>
          )}

          {type === 'withdraw' && (
            <div className="bg-blue-600 bg-opacity-20 border border-blue-600 rounded-lg p-3">
              <div className="text-blue-400 text-sm">
                <strong>Processing Time:</strong> Withdrawals are processed within 24 hours.
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || isLoading}
              className={`flex-1 text-white py-2 rounded-lg transition-colors ${
                type === 'deposit' 
                  ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-800' 
                  : 'bg-red-600 hover:bg-red-700 disabled:bg-red-800'
              }`}
            >
              {isProcessing ? 'Processing...' : (type === 'deposit' ? 'Deposit' : 'Withdraw')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};