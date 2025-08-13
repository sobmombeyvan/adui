import { CurrencyPair, CandleData } from '../types/trading';

export const currencyPairs: CurrencyPair[] = [
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', price: 1.0875, change: 0.0023, changePercent: 0.21 },
  { symbol: 'GBP/USD', name: 'British Pound / US Dollar', price: 1.2634, change: -0.0045, changePercent: -0.35 },
  { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', price: 148.75, change: 0.85, changePercent: 0.57 },
  { symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', price: 0.6687, change: 0.0012, changePercent: 0.18 },
  { symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', price: 0.8934, change: -0.0021, changePercent: -0.23 },
  { symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', price: 1.3542, change: 0.0034, changePercent: 0.25 },
];

export const generateCandleData = (pair: string, count: number = 50): CandleData[] => {
  const basePair = currencyPairs.find(p => p.symbol === pair);
  const basePrice = basePair?.price || 1.0000;
  
  const candles: CandleData[] = [];
  let currentPrice = basePrice;
  
  for (let i = count; i >= 0; i--) {
    const timestamp = new Date();
    timestamp.setMinutes(timestamp.getMinutes() - i * 5);
    
    const volatility = 0.002;
    const change = (Math.random() - 0.5) * volatility;
    const open = currentPrice;
    const close = open + change;
    
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    
    candles.push({
      timestamp,
      open,
      high,
      low,
      close
    });
    
    currentPrice = close;
  }
  
  return candles;
};