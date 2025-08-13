import { supabase } from '../lib/supabase';
import { Trade, TradingStats } from '../types/trading';

class SupabaseTradingService {
  private userTradeCount: Map<string, number> = new Map();

  private shouldWinTrade(userId: string): boolean {
    const currentCount = this.userTradeCount.get(userId) || 0;
    const tradePosition = currentCount % 5;
    
    // Win on positions 0, 1, 2 (first 3 trades)
    // Lose on positions 3, 4 (last 2 trades)
    return tradePosition < 3;
  }

  async executeTrade(
    userId: string, 
    pair: string, 
    type: 'call' | 'put', 
    amount: number, 
    currentPrice: number
  ): Promise<{ success: boolean; trade?: Trade; error?: string }> {
    try {
      // Check user balance
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (accountError || !account || account.balance < amount) {
        return { success: false, error: 'Insufficient balance' };
      }

      // Get currency pair ID
      const { data: currencyPair, error: pairError } = await supabase
        .from('currency_pairs')
        .select('id')
        .eq('symbol', pair)
        .single();

      if (pairError || !currencyPair) {
        return { success: false, error: 'Currency pair not found' };
      }

      // Determine if this trade should win
      const currentCount = this.userTradeCount.get(userId) || 0;
      const isWinningTrade = this.shouldWinTrade(userId);
      
      // Update trade count
      this.userTradeCount.set(userId, currentCount + 1);

      // Calculate expiry time (30 seconds from now)
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + 30);

      // Create trade record
      const { data: tradeData, error: tradeError } = await supabase
        .from('trades')
        .insert({
          user_id: userId,
          currency_pair_id: currencyPair.id,
          trade_type: type,
          amount,
          entry_price: currentPrice,
          duration_minutes: 1,
          status: 'open',
          payout_percentage: 85,
          expires_at: expiresAt.toISOString(),
          account_type: 'live'
        })
        .select()
        .single();

      if (tradeError) {
        console.error('Trade creation error:', tradeError);
        return { success: false, error: 'Failed to create trade' };
      }

      // Deduct amount from balance
      const { error: balanceError } = await supabase
        .from('accounts')
        .update({ balance: account.balance - amount })
        .eq('user_id', userId);

      if (balanceError) {
        console.error('Balance update error:', balanceError);
        return { success: false, error: 'Failed to update balance' };
      }

      const trade: Trade = {
        id: tradeData.id,
        userId: tradeData.user_id,
        pair,
        type: type === 'call' ? 'buy' : 'sell',
        amount: tradeData.amount,
        openPrice: tradeData.entry_price,
        currentPrice,
        timestamp: new Date(tradeData.created_at),
        profit: 0,
        status: 'open',
        isWinningTrade
      };

      // Auto-close trade after 30 seconds
      setTimeout(() => {
        this.closeTrade(userId, tradeData.id, currentPrice + (Math.random() - 0.5) * 0.01);
      }, 30000);

      return { success: true, trade };
    } catch (error) {
      console.error('Execute trade error:', error);
      return { success: false, error: 'Trade execution failed' };
    }
  }

  async closeTrade(
    userId: string, 
    tradeId: string, 
    exitPrice: number
  ): Promise<{ success: boolean; profit?: number; error?: string }> {
    try {
      // Get trade data
      const { data: trade, error: tradeError } = await supabase
        .from('trades')
        .select('*')
        .eq('id', tradeId)
        .eq('user_id', userId)
        .eq('status', 'open')
        .single();

      if (tradeError || !trade) {
        return { success: false, error: 'Trade not found' };
      }

      // Determine if trade wins based on our 3/5 system
      const currentCount = this.userTradeCount.get(userId) || 0;
      const tradePosition = (currentCount - 1) % 5; // -1 because we already incremented
      const isWinningTrade = tradePosition < 3;

      let profit: number;
      let status: string;

      if (isWinningTrade) {
        // Winning trade: 70-90% profit
        const profitPercentage = 0.7 + Math.random() * 0.2;
        profit = trade.amount * profitPercentage;
        status = 'won';
      } else {
        // Losing trade: lose the entire amount
        profit = -trade.amount;
        status = 'lost';
      }

      // Update trade record
      const { error: updateError } = await supabase
        .from('trades')
        .update({
          exit_price: exitPrice,
          profit_loss: profit,
          status,
          closed_at: new Date().toISOString()
        })
        .eq('id', tradeId);

      if (updateError) {
        console.error('Trade update error:', updateError);
        return { success: false, error: 'Failed to update trade' };
      }

      // Update user balance (return original amount + profit/loss)
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (accountError || !account) {
        return { success: false, error: 'Account not found' };
      }

      const newBalance = account.balance + trade.amount + profit;
      
      const { error: balanceError } = await supabase
        .from('accounts')
        .update({ balance: newBalance })
        .eq('user_id', userId);

      if (balanceError) {
        console.error('Balance update error:', balanceError);
        return { success: false, error: 'Failed to update balance' };
      }

      return { success: true, profit };
    } catch (error) {
      console.error('Close trade error:', error);
      return { success: false, error: 'Failed to close trade' };
    }
  }

  async getUserTrades(userId: string): Promise<Trade[]> {
    try {
      const { data: trades, error } = await supabase
        .from('trades')
        .select(`
          *,
          currency_pairs (symbol, name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get trades error:', error);
        return [];
      }

      return trades.map(trade => ({
        id: trade.id,
        userId: trade.user_id,
        pair: trade.currency_pairs?.symbol || 'Unknown',
        type: trade.trade_type === 'call' ? 'buy' : 'sell',
        amount: trade.amount,
        openPrice: trade.entry_price,
        currentPrice: trade.exit_price || trade.entry_price,
        timestamp: new Date(trade.created_at),
        profit: trade.profit_loss || 0,
        status: trade.status === 'open' ? 'open' : 'closed',
        closeTime: trade.closed_at ? new Date(trade.closed_at) : undefined,
        isWinningTrade: trade.status === 'won'
      }));
    } catch (error) {
      console.error('Get user trades error:', error);
      return [];
    }
  }

  async getUserStats(userId: string): Promise<TradingStats> {
    try {
      const { data: trades, error } = await supabase
        .from('trades')
        .select('status, profit_loss')
        .eq('user_id', userId)
        .neq('status', 'open');

      if (error) {
        console.error('Get stats error:', error);
        return {
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          winRate: 0,
          totalProfit: 0,
          consecutiveTrades: 0
        };
      }

      const totalTrades = trades.length;
      const winningTrades = trades.filter(t => t.status === 'won').length;
      const losingTrades = trades.filter(t => t.status === 'lost').length;
      const totalProfit = trades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

      return {
        totalTrades,
        winningTrades,
        losingTrades,
        winRate,
        totalProfit,
        consecutiveTrades: this.userTradeCount.get(userId) || 0
      };
    } catch (error) {
      console.error('Get user stats error:', error);
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        totalProfit: 0,
        consecutiveTrades: 0
      };
    }
  }

  updateTradePrice(userId: string, tradeId: string, newPrice: number) {
    // This is for real-time price updates in the UI
    // The actual closing will be handled by the auto-close mechanism
  }
}

export const supabaseTradingService = new SupabaseTradingService();