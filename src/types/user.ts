export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  balance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalProfit: number;
  createdAt: Date;
  isVerified: boolean;
  kycStatus: 'pending' | 'approved' | 'rejected';
  isAdmin?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  method: 'card' | 'bank' | 'crypto';
  timestamp: Date;
  transactionId?: string;
}

export interface AdminUser extends User {
  totalTrades: number;
  winRate: number;
  lastLogin: Date;
  accountStatus: 'active' | 'suspended' | 'pending';
}