import { Trade, TradingStats } from '../types/trading';
import { authService } from './auth';

class TradingService {
  private trades: Map<string, Trade[]> = new Map();
  private tradingStats: Map<string, TradingStats> = new Map();

  constructor() {
    // Load trades from localStorage
    const savedTrades = localStorage.getItem('forex_trades');
    if (savedTrades) {
      const tradesData = JSON.parse(savedTrades);
      Object.entries(tradesData).forEach(([userId, userTrades]) => {
        this.trades.set(userId, userTrades as Trade[]);
      });
    }

    // Load trading stats
    const savedStats = localStorage.getItem('forex_trading_stats');
    if (savedStats) {
      const statsData = JSON.parse(savedStats);
      Object.entries(statsData).forEach(([userId, stats]) => {
        this.tradingStats.set(userId, stats as TradingStats);
      });
    }
  }

  private saveTrades() {
    const tradesData: { [key: string]: Trade[] } = {};
    this.trades.forEach((trades, userId) => {
      tradesData[userId] = trades;
    });
    localStorage.setItem('forex_trades', JSON.stringify(tradesData));
  }

  private saveStats() {
    const statsData: { [key: string]: TradingStats } = {};
    this.tradingStats.forEach((stats, userId) => {
      statsData[userId] = stats;
    });
    localStorage.setItem('forex_trading_stats', JSON.stringify(statsData));
  }

  private getOrCreateStats(userId: string): TradingStats {
    if (!this.tradingStats.has(userId)) {
      this.tradingStats.set(userId, {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        totalProfit: 0,
        consecutiveTrades: 0
      });
    }
    return this.tradingStats.get(userId)!;
  }

  private shouldWinTrade(userId: string): boolean {
    const stats = this.getOrCreateStats(userId);
    
    // Win 3 out of every 5 trades
    const tradePosition = stats.consecutiveTrades % 5;
    
    // Win on positions 0, 1, 2 (first 3 trades)
    // Lose on positions 3, 4 (last 2 trades)
    return tradePosition < 3;
  }

  async executeTrade(userId: string, pair: string, type: 'buy' | 'sell', amount: number, currentPrice: number): Promise<{ success: boolean; trade?: Trade; error?: string }> {
    try {
      const user = authService.getCurrentUser();
      if (!user || user.id !== userId) {
        return { success: false, error: 'User not authenticated' };
      }

      if (user.balance < amount) {
        return { success: false, error: 'Insufficient balance' };
      }

      // Deduct trade amount from balance
      await authService.updateBalance(userId, user.balance - amount);

      const trade: Trade = {
        id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        pair,
        type,
        amount,
        openPrice: currentPrice,
        currentPrice,
        timestamp: new Date(),
        profit: 0,
        status: 'open',
        isWinningTrade: this.shouldWinTrade(userId)
      };

      // Add trade to user's trades
      if (!this.trades.has(userId)) {
        this.trades.set(userId, []);
      }
      this.trades.get(userId)!.push(trade);
      this.saveTrades();

      return { success: true, trade };
    } catch (error) {
      return { success: false, error: 'Trade execution failed' };
    }
  }

  async closeTrade(userId: string, tradeId: string, currentPrice: number): Promise<{ success: boolean; profit?: number; error?: string }> {
    try {
      const userTrades = this.trades.get(userId);
      if (!userTrades) {
        return { success: false, error: 'No trades found' };
      }

      const tradeIndex = userTrades.findIndex(t => t.id === tradeId && t.status === 'open');
      if (tradeIndex === -1) {
        return { success: false, error: 'Trade not found' };
      }

      const trade = userTrades[tradeIndex];
      const stats = this.getOrCreateStats(userId);

      let profit: number;
      
      if (trade.isWinningTrade) {
        // Winning trade: 70-90% profit
        const profitPercentage = 0.7 + Math.random() * 0.2; // 70-90%
        profit = trade.amount * profitPercentage;
        stats.winningTrades++;
      } else {
        // Losing trade: lose the entire amount
        profit = -trade.amount;
        stats.losingTrades++;
      }

      // Update trade
      trade.status = 'closed';
      trade.currentPrice = currentPrice;
      trade.profit = profit;
      trade.closeTime = new Date();

      // Update user balance
      const user = authService.getCurrentUser();
      if (user) {
        const newBalance = user.balance + trade.amount + profit; // Return original amount + profit/loss
        await authService.updateBalance(userId, newBalance);
      }

      // Update stats
      stats.totalTrades++;
      stats.consecutiveTrades++;
      stats.totalProfit += profit;
      stats.winRate = (stats.winningTrades / stats.totalTrades) * 100;

      this.tradingStats.set(userId, stats);
      this.saveTrades();
      this.saveStats();

      return { success: true, profit };
    } catch (error) {
      return { success: false, error: 'Failed to close trade' };
    }
  }

  getUserTrades(userId: string): Trade[] {
    return this.trades.get(userId) || [];
  }

  getUserStats(userId: string): TradingStats {
    return this.getOrCreateStats(userId);
  }

  updateTradePrice(userId: string, tradeId: string, newPrice: number) {
    const userTrades = this.trades.get(userId);
    if (userTrades) {
      const trade = userTrades.find(t => t.id === tradeId && t.status === 'open');
      if (trade) {
        trade.currentPrice = newPrice;
        
        // Calculate unrealized profit/loss for display
        const priceDiff = newPrice - trade.openPrice;
        const multiplier = trade.type === 'buy' ? 1 : -1;
        trade.profit = (priceDiff * multiplier * trade.amount) / trade.openPrice;
      }
    }
  }
}

export const tradingService = new TradingService();