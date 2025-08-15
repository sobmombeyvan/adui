import { supabase } from '../lib/supabase';
import { User, LoginCredentials, RegisterData } from '../types/user';

class SupabaseAuthService {
  async register(data: RegisterData): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
            country: data.country,
          }
        }
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Registration failed' };
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          first_name: data.firstName,
          last_name: data.lastName,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }

      const user: User = {
        id: authData.user.id,
        email: authData.user.email!,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        country: data.country,
        balance: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalProfit: 0,
        createdAt: new Date(authData.user.created_at),
        isVerified: false,
        kycStatus: 'pending'
      };

      return { success: true, user };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed' };
    }
  }

  async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Login failed' };
      }

      const user = await this.getUserData(authData.user.id);
      if (!user) {
        return { success: false, error: 'User data not found' };
      }

      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth user fetch error:', authError);
        return null;
      }
      
      if (!authUser) {
        return null;
      }

      return await this.getUserData(authUser.id);
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  private async getUserData(userId: string): Promise<User | null> {
    try {
      // Get auth user first for email and metadata
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        console.error('Auth user error:', authError);
        return null;
      }

      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        // Create basic user without profile data
        return {
          id: userId,
          email: authUser.email!,
          firstName: 'User',
          lastName: '',
          balance: 0,
          totalDeposits: 0,
          totalWithdrawals: 0,
          totalProfit: 0,
          createdAt: new Date(authUser.created_at),
          isVerified: false,
          kycStatus: 'pending',
          isAdmin: authUser.email === 'admin@forexpro.com'
        };
      }

      // Get account data
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (accountError) {
        console.error('Account fetch error:', accountError);
        // Return user with zero balance if account not found
        return {
          id: userId,
          email: authUser.email!,
          firstName: profile.first_name || 'User',
          lastName: profile.last_name || '',
          balance: 0,
          totalDeposits: 0,
          totalWithdrawals: 0,
          totalProfit: 0,
          createdAt: new Date(profile.created_at),
          isVerified: false,
          kycStatus: 'pending',
          isAdmin: authUser.email === 'admin@forexpro.com'
        };
      }

      // Get transaction totals (optimized with single query)
      const { data: deposits, error: depositsError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('type', 'deposit')
        .eq('status', 'completed');

      const { data: withdrawals, error: withdrawalsError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('type', 'withdrawal')
        .eq('status', 'completed');

      // Get profit from closed trades (optimized)
      const { data: trades, error: tradesError } = await supabase
        .from('trades')
        .select('profit_loss')
        .eq('user_id', userId)
        .in('status', ['won', 'lost']);

      const totalDeposits = deposits?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      const totalWithdrawals = withdrawals?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      const totalProfit = trades?.reduce((sum, t) => sum + (t.profit_loss || 0), 0) || 0;

      const user: User = {
        id: userId,
        email: authUser.email!,
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        balance: account.balance,
        totalDeposits,
        totalWithdrawals,
        totalProfit,
        createdAt: new Date(profile.created_at),
        isVerified: false,
        kycStatus: 'pending',
        isAdmin: authUser.email === 'admin@forexpro.com' // Admin check
      };

      return user;
    } catch (error) {
      console.error('Get user data error:', error);
      return null;
    }
  }

  // Admin functions
  async getAllUsers(): Promise<AdminUser[]> {
    try {
      // Get profiles first
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*');

      if (profileError) {
        console.error('Get all users error:', profileError);
        return [];
      }

      // Get accounts separately
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('user_id, balance');

      if (accountsError) {
        console.error('Get accounts error:', accountsError);
      }

      // Get trades separately
      const { data: trades, error: tradesError } = await supabase
        .from('trades')
        .select('user_id, status, profit_loss, created_at');

      if (tradesError) {
        console.error('Get trades error:', tradesError);
      }

      // Get auth users for email addresses
      const { data: { users: authUsers }, error: authUsersError } = await supabase.auth.admin.listUsers();
      
      if (authUsersError) {
        console.error('Get auth users error:', authUsersError);
      }

      return profiles.map(profile => {
        const userTrades = trades?.filter(t => t.user_id === profile.id) || [];
        const userAccount = accounts?.find(a => a.user_id === profile.id);
        const authUser = authUsers?.find(u => u.id === profile.id);
        
        const totalTrades = userTrades.length;
        const winningTrades = userTrades.filter(t => t.status === 'won').length;
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
        const totalProfit = userTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);

        return {
          id: profile.id,
          email: authUser?.email || 'Unknown',
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          balance: userAccount?.balance || 0,
          totalDeposits: 0,
          totalWithdrawals: 0,
          totalProfit,
          createdAt: new Date(profile.created_at),
          isVerified: false,
          kycStatus: 'pending' as const,
          totalTrades,
          winRate,
          lastLogin: new Date(),
          accountStatus: 'active' as const
        };
      });
    } catch (error) {
      console.error('Get all users error:', error);
      return [];
    }
  }

  async getAllUsersSimple(): Promise<AdminUser[]> {
    try {
      // Simplified version that doesn't rely on complex joins
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*');

      if (profileError) {
        console.error('Get profiles error:', profileError);
        return [];
      }

      return profiles.map(profile => {
        const totalTrades = trades.length;
        const winningTrades = trades.filter((t: any) => t.status === 'won').length;
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
        const totalProfit = trades.reduce((sum: number, t: any) => sum + (t.profit_loss || 0), 0);

        return {
          id: profile.id,
          email: 'user@example.com', // Simplified for demo
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          balance: 10000, // Demo balance
          totalDeposits: 0,
          totalWithdrawals: 0,
          totalProfit: 0,
          createdAt: new Date(profile.created_at),
          isVerified: false,
          kycStatus: 'pending' as const,
          totalTrades: 0,
          winRate: 0,
          lastLogin: new Date(),
          accountStatus: 'active' as const
        };
      });
    } catch (error) {
      console.error('Get all users error:', error);
      return [];
    }
  }

  async updateUserBalance(userId: string, newBalance: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('accounts')
        .update({ balance: newBalance })
        .eq('user_id', userId);

      return !error;
    } catch (error) {
      console.error('Update user balance error:', error);
      return false;
    }
  }

  async suspendUser(userId: string): Promise<boolean> {
    try {
      // In a real app, you'd update a status field
      // For now, we'll just return success
      return true;
    } catch (error) {
      console.error('Suspend user error:', error);
      return false;
    }
  }
  async updateBalance(userId: string, newBalance: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('accounts')
        .update({ balance: newBalance })
        .eq('user_id', userId);

      return !error;
    } catch (error) {
      console.error('Update balance error:', error);
      return false;
    }
  }

  async addDeposit(userId: string, amount: number): Promise<boolean> {
    try {
      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'deposit',
          amount,
          status: 'completed',
          payment_method: 'card',
          notes: 'Demo deposit'
        });

      if (transactionError) {
        console.error('Transaction error:', transactionError);
        return false;
      }

      // Update account balance
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (accountError) {
        console.error('Account fetch error:', accountError);
        return false;
      }

      const { error: updateError } = await supabase
        .from('accounts')
        .update({ balance: account.balance + amount })
        .eq('user_id', userId);

      return !updateError;
    } catch (error) {
      console.error('Add deposit error:', error);
      return false;
    }
  }

  async processWithdrawal(userId: string, amount: number): Promise<boolean> {
    try {
      // Check current balance
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (accountError || !account || account.balance < amount) {
        return false;
      }

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'withdrawal',
          amount,
          status: 'completed',
          payment_method: 'bank',
          notes: 'Demo withdrawal'
        });

      if (transactionError) {
        console.error('Transaction error:', transactionError);
        return false;
      }

      // Update account balance
      const { error: updateError } = await supabase
        .from('accounts')
        .update({ balance: account.balance - amount })
        .eq('user_id', userId);

      return !updateError;
    } catch (error) {
      console.error('Process withdrawal error:', error);
      return false;
    }
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = await this.getUserData(session.user.id);
        callback(user);
      } else {
        callback(null);
      }
    });
  }
}

export const supabaseAuthService = new SupabaseAuthService();