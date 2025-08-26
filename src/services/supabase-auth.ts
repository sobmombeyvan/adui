import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authService } from './auth';
import { User, LoginCredentials, RegisterData } from '../types/user';

class SupabaseAuthService {
  async register(data: RegisterData): Promise<{ success: boolean; user?: User; error?: string }> {
    // Fallback to local auth if Supabase is not configured
    if (!isSupabaseConfigured || !supabase) {
      return authService.register(data);
    }

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
    // Fallback to local auth if Supabase is not configured
    if (!isSupabaseConfigured || !supabase) {
      return authService.login(credentials);
    }

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
    if (!isSupabaseConfigured || !supabase) {
      return authService.logout();
    }
    await supabase.auth.signOut();
  }

  async getCurrentUser(): Promise<User | null> {
    if (!isSupabaseConfigured || !supabase) {
      return authService.getCurrentUser();
    }

    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        // Silently handle auth session missing
        return null;
      }
      
      if (!authUser) {
        return null;
      }

      return await this.getUserData(authUser.id);
    } catch (error) {
      // Silently handle errors for faster loading
      return null;
    }
  }

  getCurrentUserSync(): User | null {
    // Synchronous version for immediate loading
    if (!isSupabaseConfigured || !supabase) {
      return authService.getCurrentUser();
    }

    // For Supabase, we'll return null and let async loading handle it
    // This prevents blocking the UI
    return null;
  }

  private async getUserData(userId: string): Promise<User | null> {
    if (!isSupabaseConfigured || !supabase) {
      return null;
    }

    try {
      // Get auth user with timeout to prevent hanging
      const authPromise = supabase.auth.getUser();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth timeout')), 3000)
      );
      
      const { data: { user: authUser } } = await Promise.race([authPromise, timeoutPromise]) as any;
      if (!authUser) return null;

      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
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

      // Load transaction and trade data in background for faster initial load
      const user: User = {
        id: userId,
        email: authUser.email!,
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        balance: account.balance,
        totalDeposits: 0, // Will be loaded in background
        totalWithdrawals: 0, // Will be loaded in background
        totalProfit: 0, // Will be loaded in background
        createdAt: new Date(profile.created_at),
        isVerified: false,
        kycStatus: 'pending',
        isAdmin: authUser.email === 'admin@forexpro.com'
      };

      // Load additional data in background
      setTimeout(() => this.loadUserStatsInBackground(userId, user), 1000);

      return user;
    } catch (error) {
      // Silently handle errors for faster loading
      return null;
    }
  }

  private async loadUserStatsInBackground(userId: string, user: User) {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      // Load transaction totals in background
      const [depositsResult, withdrawalsResult, tradesResult] = await Promise.all([
        supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', userId)
          .eq('type', 'deposit')
          .eq('status', 'completed'),
        supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', userId)
          .eq('type', 'withdrawal')
          .eq('status', 'completed'),
        supabase
          .from('trades')
          .select('profit_loss')
          .eq('user_id', userId)
          .in('status', ['won', 'lost'])
      ]);

      const totalDeposits = depositsResult.data?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      const totalWithdrawals = withdrawalsResult.data?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      const totalProfit = tradesResult.data?.reduce((sum, t) => sum + (t.profit_loss || 0), 0) || 0;

      // Update user object (this won't trigger re-renders but data will be available)
      user.totalDeposits = totalDeposits;
      user.totalWithdrawals = totalWithdrawals;
      user.totalProfit = totalProfit;
    } catch (error) {
      // Silently handle background loading errors
    }
  }

  // Admin functions
  async getAllUsers(): Promise<AdminUser[]> {
    if (!isSupabaseConfigured || !supabase) {
      // Return demo admin users for local auth
      return [];
    }

    try {
      // Get all auth users first
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.log('Auth admin not available, using profiles method');
        return await this.getAllUsersFromProfiles();
      }

      // Get additional data for each user
      const users: AdminUser[] = [];
      
      for (const authUser of authUsers.users) {
        const userData = await this.getUserDataForAdmin(authUser.id, authUser.email!);
        if (userData) {
          users.push(userData);
        }
      }
      
      return users;
    } catch (error) {
      console.error('Get all users error:', error);
      return await this.getAllUsersFromProfiles();
    }
  }

  async getAllUsersFromProfiles(): Promise<AdminUser[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }

    try {
      // Get all profiles with auth user data
      const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        // Fallback: get profiles and create user data
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('*');

        if (profileError) {
          console.error('Get profiles error:', profileError);
          return [];
        }

        return await this.processProfilesData(profiles);
      }

      // Process auth users
      const users: AdminUser[] = [];
      for (const authUser of authUsers) {
        const userData = await this.getUserDataForAdmin(authUser.id, authUser.email!);
        if (userData) {
          users.push(userData);
        }
      }
      
      return users;
    } catch (error) {
      console.error('Get users from profiles error:', error);
      // Final fallback - get profiles only
      return await this.getProfilesOnly();
    }
  }

  async getProfilesOnly(): Promise<AdminUser[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }

    try {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*');

      if (profileError) {
        console.error('Get profiles error:', profileError);
        return [];
      }

      return await this.processProfilesData(profiles);
    } catch (error) {
      console.error('Get profiles only error:', error);
      return [];
    }
  }

  async processProfilesData(profiles: any[]): Promise<AdminUser[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }

    try {
      // Get all accounts
      const { data: accounts } = await supabase
        .from('accounts')
        .select('user_id, balance');

      // Get all trades
      const { data: trades } = await supabase
        .from('trades')
        .select('user_id, status, profit_loss, created_at');

      return profiles.map(profile => {
        const userTrades = trades?.filter(t => t.user_id === profile.id) || [];
        const userAccount = accounts?.find(a => a.user_id === profile.id);
        
        const totalTrades = userTrades.length;
        const winningTrades = userTrades.filter(t => t.status === 'won').length;
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
        const totalProfit = userTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);

        return {
          id: profile.id,
          email: profile.email || `${profile.first_name?.toLowerCase() || 'user'}@example.com`,
          firstName: profile.first_name || 'User',
          lastName: profile.last_name || '',
          balance: userAccount?.balance || 0,
          totalDeposits: 0,
          totalWithdrawals: 0,
          totalProfit,
          createdAt: new Date(profile.created_at),
          isVerified: profile.is_verified || false,
          kycStatus: (profile.kyc_status as 'pending' | 'approved' | 'rejected') || 'pending',
          totalTrades,
          winRate,
          lastLogin: new Date(),
          accountStatus: (profile.account_status as 'active' | 'suspended' | 'pending') || 'active'
        };
      });
    } catch (error) {
      console.error('Process profiles data error:', error);
      return [];
    }
  }

  async getUserDataForAdmin(userId: string, email: string): Promise<AdminUser | null> {
    if (!isSupabaseConfigured || !supabase) {
      return null;
    }

    try {
      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Get account
      const { data: account } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Get trades
      const { data: trades } = await supabase
        .from('trades')
        .select('status, profit_loss, created_at')
        .eq('user_id', userId);

      const userTrades = trades || [];
      const totalTrades = userTrades.length;
      const winningTrades = userTrades.filter(t => t.status === 'won').length;
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
      const totalProfit = userTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);

      return {
        id: userId,
        email: email,
        firstName: profile?.first_name || 'User',
        lastName: profile?.last_name || '',
        balance: account?.balance || 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalProfit,
        createdAt: profile ? new Date(profile.created_at) : new Date(),
        isVerified: profile?.is_verified || false,
        kycStatus: (profile?.kyc_status as 'pending' | 'approved' | 'rejected') || 'pending',
        totalTrades,
        winRate,
        lastLogin: new Date(),
        accountStatus: (profile?.account_status as 'active' | 'suspended' | 'pending') || 'active'
      };
    } catch (error) {
      console.error('Get user data for admin error:', error);
      return null;
    }
  }

  async updateUserBalance(userId: string, newBalance: number): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) {
      // For demo mode, simulate successful balance update
      console.log(`Demo: Updated user ${userId} balance to ${newBalance}`);
      return true;
    }

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
    if (!isSupabaseConfigured || !supabase) {
      // For demo mode, simulate successful user suspension
      console.log(`Demo: Suspended user ${userId}`);
      return true;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ account_status: 'suspended' })
        .eq('id', userId);

      return !error;
    } catch (error) {
      console.error('Suspend user error:', error);
      return false;
    }
  }

  async activateUser(userId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) {
      // For demo mode, simulate successful user activation
      console.log(`Demo: Activated user ${userId}`);
      return true;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ account_status: 'active' })
        .eq('id', userId);

      return !error;
    } catch (error) {
      console.error('Activate user error:', error);
      return false;
    }
  }
  async updateBalance(userId: string, newBalance: number): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) {
      return authService.updateBalance(userId, newBalance);
    }

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
    if (!isSupabaseConfigured || !supabase) {
      return authService.addDeposit(userId, amount);
    }

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
    if (!isSupabaseConfigured || !supabase) {
      return authService.processWithdrawal(userId, amount);
    }

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
    if (!isSupabaseConfigured || !supabase) {
      // For local auth, we'll simulate auth state changes
      return { data: { subscription: { unsubscribe: () => {} } } };
    }

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