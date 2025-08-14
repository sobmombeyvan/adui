import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from './components/LoadingSpinner';
import { AuthModal } from './components/AuthModal';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { CurrencyList } from './components/CurrencyList';
import { TradingChart } from './components/TradingChart';
import { TradingPanel } from './components/TradingPanel';
import { PortfolioView } from './components/PortfolioView';
import { HistoryView } from './components/HistoryView';
import { TransactionModal } from './components/TransactionModal';
import { AdminDashboard } from './components/AdminDashboard';
import { supabaseAuthService } from './services/supabase-auth';
import { supabaseTradingService } from './services/supabase-trading';
import { currencyPairs, generateCandleData } from './utils/mockData';
import { Trade, CandleData } from './types/trading';
import { User, LoginCredentials, RegisterData, AuthState } from './types/user';

function App() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });
  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    mode: 'login' | 'register';
  }>({ isOpen: false, mode: 'login' });
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('trading');
  const [selectedPair, setSelectedPair] = useState('EUR/USD');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [transactionModal, setTransactionModal] = useState<{
    isOpen: boolean;
    type: 'deposit' | 'withdraw';
  }>({ isOpen: false, type: 'deposit' });

  // Check for existing session on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Set a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          console.log('Auth initialization timeout, showing login');
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
          setAuthModal({ isOpen: true, mode: 'login' });
        }, 5000);

        try {
          const user = await supabaseAuthService.getCurrentUser();
          clearTimeout(timeoutId);
          
          if (user) {
            setAuthState({
              user,
              isAuthenticated: true,
              isLoading: false
            });
            // Load user data in background for faster initial load
            setTimeout(() => loadUserTrades(user.id), 100);
          } else {
            setAuthState({
              user: null,
              isAuthenticated: false,
              isLoading: false
            });
            setAuthModal({ isOpen: true, mode: 'login' });
          }
        } catch (authError) {
          clearTimeout(timeoutId);
          console.error('Auth error:', authError);
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
          setAuthModal({ isOpen: true, mode: 'login' });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
        setAuthModal({ isOpen: true, mode: 'login' });
      }
    };

    initializeAuth();

    // Listen to auth state changes with error handling
    let subscription: any = null;
    try {
      const authListener = supabaseAuthService.onAuthStateChange((user) => {
        if (user) {
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false
          });
          setTimeout(() => loadUserTrades(user.id), 100);
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
          setTrades([]);
          setAuthModal({ isOpen: true, mode: 'login' });
        }
      });
      subscription = authListener.data?.subscription;
    } catch (error) {
      console.error('Auth listener error:', error);
    }

    return () => {
      try {
        subscription?.unsubscribe();
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    };
  }, []);

  const loadUserTrades = async (userId: string) => {
    try {
      const userTrades = await supabaseTradingService.getUserTrades(userId);
      setTrades(userTrades);
    } catch (error) {
      console.error('Load trades error:', error);
      setTrades([]);
    }
  };

  // Generate initial candle data
  useEffect(() => {
    setCandleData(generateCandleData(selectedPair));
  }, [selectedPair]);

  // Simulate real-time price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCandleData(current => {
        if (current.length === 0) return current;
        
        const newData = [...current];
        const lastCandle = newData[newData.length - 1];
        const volatility = 0.001;
        const change = (Math.random() - 0.5) * volatility;
        
        // Update the last candle
        newData[newData.length - 1] = {
          ...lastCandle,
          close: lastCandle.close + change,
          high: Math.max(lastCandle.high, lastCandle.close + change),
          low: Math.min(lastCandle.low, lastCandle.close + change)
        };

        return newData;
      });

      // Update open trades
      if (authState.user) {
        const openTrades = trades.filter(t => t.status === 'open');
        openTrades.forEach(trade => {
          const currentPrice = candleData[candleData.length - 1]?.close || trade.currentPrice;
          supabaseTradingService.updateTradePrice(authState.user!.id, trade.id, currentPrice);
        });
        // Reduce frequency of trade updates for better performance
        if (openTrades.length > 0) {
          setTimeout(() => loadUserTrades(authState.user!.id), 500);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [candleData, authState.user, trades]);

  const handleLogin = async (credentials: LoginCredentials) => {
    setAuthLoading(true);
    setAuthError(null);
    
    try {
      const result = await supabaseAuthService.login(credentials);
      if (result.success && result.user) {
        setAuthState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false
        });
        setAuthModal({ isOpen: false, mode: 'login' });
        setTimeout(() => loadUserTrades(result.user.id), 100);
      } else {
        setAuthError(result.error || 'Login failed');
      }
    } catch (error) {
      setAuthError('Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (data: RegisterData) => {
    setAuthLoading(true);
    setAuthError(null);
    
    try {
      const result = await supabaseAuthService.register(data);
      if (result.success && result.user) {
        setAuthState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false
        });
        setAuthModal({ isOpen: false, mode: 'register' });
        setTimeout(() => loadUserTrades(result.user.id), 100);
      } else {
        setAuthError(result.error || 'Registration failed');
      }
    } catch (error) {
      setAuthError('Registration failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabaseAuthService.logout();
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
    setTrades([]);
    setAuthModal({ isOpen: true, mode: 'login' });
  };

  const handleTrade = async (type: 'buy' | 'sell', amount: number) => {
    if (!authState.user) return;

    const currentPrice = candleData[candleData.length - 1]?.close || 1.0000;
    const tradeType = type === 'buy' ? 'call' : 'put';
    const result = await supabaseTradingService.executeTrade(
      authState.user.id,
      selectedPair,
      tradeType,
      amount,
      currentPrice
    );

    if (result.success) {
      // Update user balance in auth state
      const updatedUser = await supabaseAuthService.getCurrentUser();
      if (updatedUser) {
        setAuthState(prev => ({ ...prev, user: updatedUser }));
      }
      loadUserTrades(authState.user.id);
    } else {
      alert(result.error || 'Trade failed');
    }
  };

  const handleCloseTrade = async (tradeId: string) => {
    if (!authState.user) return;

    const currentPrice = candleData[candleData.length - 1]?.close || 1.0000;
    const result = await supabaseTradingService.closeTrade(authState.user.id, tradeId, currentPrice);
    
    if (result.success) {
      // Update user balance in auth state
      const updatedUser = await supabaseAuthService.getCurrentUser();
      if (updatedUser) {
        setAuthState(prev => ({ ...prev, user: updatedUser }));
      }
      loadUserTrades(authState.user.id);
    } else {
      alert(result.error || 'Failed to close trade');
    }
  };

  const handleTransaction = async (amount: number, method: string) => {
    if (!authState.user) return;

    try {
      if (transactionModal.type === 'deposit') {
        const success = await supabaseAuthService.addDeposit(authState.user.id, amount);
        if (success) {
          const updatedUser = await supabaseAuthService.getCurrentUser();
          if (updatedUser) {
            setAuthState(prev => ({ ...prev, user: updatedUser }));
          }
          alert(`Successfully deposited $${amount}`);
        } else {
          alert('Deposit failed');
        }
      } else {
        const success = await supabaseAuthService.processWithdrawal(authState.user.id, amount);
        if (success) {
          const updatedUser = await supabaseAuthService.getCurrentUser();
          if (updatedUser) {
            setAuthState(prev => ({ ...prev, user: updatedUser }));
          }
          alert(`Withdrawal of $${amount} processed successfully`);
        } else {
          alert('Insufficient balance or withdrawal failed');
        }
      }
    } catch (error) {
      alert('Transaction failed');
    }
  };

  // Show loading screen while checking authentication
  if (authState.isLoading) {
    return <LoadingSpinner message="Initializing ForexPro Platform" />;
  }

  // Show auth modal if not authenticated
  if (!authState.isAuthenticated || !authState.user) {
    return (
      <div className="min-h-screen bg-gray-900">
        <AuthModal
          isOpen={authModal.isOpen}
          mode={authModal.mode}
          onClose={() => {}} // Prevent closing when not authenticated
          onLogin={handleLogin}
          onRegister={handleRegister}
          onSwitchMode={() => setAuthModal(prev => ({ 
            ...prev, 
            mode: prev.mode === 'login' ? 'register' : 'login' 
          }))}
          isLoading={authLoading}
          error={authError}
        />
      </div>
    );
  }

  const currentPrice = candleData[candleData.length - 1]?.close || currencyPairs.find(p => p.symbol === selectedPair)?.price || 1.0000;

  return (
    <div className="min-h-screen bg-gray-900">
      <Header user={authState.user} onLogout={handleLogout} />
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onWithdraw={() => setTransactionModal({ isOpen: true, type: 'withdraw' })}
        isAdmin={authState.user.isAdmin}
      />

      <div className="p-6">
        {activeTab === 'trading' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
            <div className="lg:col-span-1">
              <CurrencyList
                pairs={currencyPairs}
                selectedPair={selectedPair}
                onSelectPair={setSelectedPair}
              />
            </div>
            <div className="lg:col-span-2 order-last lg:order-none">
              <TradingChart data={candleData} pair={selectedPair} />
            </div>
            <div className="lg:col-span-1">
              <TradingPanel
                selectedPair={selectedPair}
                currentPrice={currentPrice}
                userBalance={authState.user.balance}
                onTrade={handleTrade}
              />
            </div>
          </div>
        )}

        {activeTab === 'portfolio' && (
          <PortfolioView trades={trades} onCloseTrade={handleCloseTrade} />
        )}

        {activeTab === 'history' && <HistoryView trades={trades} />}

        {activeTab === 'admin' && authState.user.isAdmin && (
          <AdminDashboard currentUser={authState.user} />
        )}
      </div>

      <TransactionModal
        isOpen={transactionModal.isOpen}
        type={transactionModal.type}
        userBalance={authState.user.balance}
        onClose={() => setTransactionModal({ ...transactionModal, isOpen: false })}
        onSubmit={handleTransaction}
      />
    </div>
  );
}

export default App;