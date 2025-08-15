import { User, LoginCredentials, RegisterData } from '../types/user';

class AuthService {
  private users: Map<string, User & { password: string }> = new Map();
  private currentUser: User | null = null;

  constructor() {
    // Load users from localStorage
    const savedUsers = localStorage.getItem('forex_users');
    if (savedUsers) {
      const usersArray = JSON.parse(savedUsers);
      usersArray.forEach((user: User & { password: string }) => {
        this.users.set(user.email, user);
      });
    }

    // Load current user session
    const savedSession = localStorage.getItem('forex_session');
    if (savedSession) {
      const session = JSON.parse(savedSession);
      const user = this.users.get(session.email);
      if (user) {
        this.currentUser = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          country: user.country,
          balance: user.balance,
          totalDeposits: user.totalDeposits,
          totalWithdrawals: user.totalWithdrawals,
          totalProfit: user.totalProfit,
          createdAt: user.createdAt,
          isVerified: user.isVerified,
          kycStatus: user.kycStatus
        };
      }
    }
  }

  private saveUsers() {
    const usersArray = Array.from(this.users.values());
    localStorage.setItem('forex_users', JSON.stringify(usersArray));
  }

  private saveSession(email: string) {
    localStorage.setItem('forex_session', JSON.stringify({ email, timestamp: Date.now() }));
  }

  async register(data: RegisterData): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      if (this.users.has(data.email)) {
        return { success: false, error: 'Email already exists' };
      }

      const user: User & { password: string } = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: data.email,
        password: data.password, // In production, this should be hashed
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        balance: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalProfit: 0,
        createdAt: new Date(),
        isVerified: false,
        kycStatus: 'pending'
      };

      this.users.set(data.email, user);
      this.saveUsers();

      const userResponse = { ...user };
      delete (userResponse as any).password;

      return { success: true, user: userResponse };
    } catch (error) {
      return { success: false, error: 'Registration failed' };
    }
  }

  async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const user = this.users.get(credentials.email);
      
      if (!user || user.password !== credentials.password) {
        return { success: false, error: 'Invalid email or password' };
      }

      this.currentUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        balance: user.balance,
        totalDeposits: user.totalDeposits,
        totalWithdrawals: user.totalWithdrawals,
        totalProfit: user.totalProfit,
        createdAt: user.createdAt,
        isVerified: user.isVerified,
        kycStatus: user.kycStatus
      };

      this.saveSession(credentials.email);
      return { success: true, user: this.currentUser };
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('forex_session');
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  async updateBalance(userId: string, newBalance: number): Promise<boolean> {
    try {
      const userEntry = Array.from(this.users.entries()).find(([_, user]) => user.id === userId);
      if (userEntry) {
        const [email, user] = userEntry;
        user.balance = newBalance;
        this.users.set(email, user);
        this.saveUsers();

        if (this.currentUser && this.currentUser.id === userId) {
          this.currentUser.balance = newBalance;
        }
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  async addDeposit(userId: string, amount: number): Promise<boolean> {
    try {
      const userEntry = Array.from(this.users.entries()).find(([_, user]) => user.id === userId);
      if (userEntry) {
        const [email, user] = userEntry;
        user.balance += amount;
        user.totalDeposits += amount;
        this.users.set(email, user);
        this.saveUsers();

        if (this.currentUser && this.currentUser.id === userId) {
          this.currentUser.balance += amount;
          this.currentUser.totalDeposits += amount;
        }
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  async processWithdrawal(userId: string, amount: number): Promise<boolean> {
    try {
      const userEntry = Array.from(this.users.entries()).find(([_, user]) => user.id === userId);
      if (userEntry) {
        const [email, user] = userEntry;
        if (user.balance >= amount) {
          user.balance -= amount;
          user.totalWithdrawals += amount;
          this.users.set(email, user);
          this.saveUsers();

          if (this.currentUser && this.currentUser.id === userId) {
            this.currentUser.balance -= amount;
            this.currentUser.totalWithdrawals += amount;
          }
          return true;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }
}

export const authService = new AuthService();