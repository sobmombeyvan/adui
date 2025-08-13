export interface CurrencyPair {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface Trade {
  id: string;
  userId: string;
  pair: string;
  type: 'buy' | 'sell';
  amount: number;
  openPrice: number;
  currentPrice: number;
  timestamp: Date;
  profit: number;
  status: 'open' | 'closed';
  closeTime?: Date;
  isWinningTrade?: boolean;
}

export interface CandleData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface Account {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
}

export interface TradingStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
  consecutiveTrades: number;
}