import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string | null;
          last_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          first_name?: string | null;
          last_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string | null;
          last_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      accounts: {
        Row: {
          id: string;
          user_id: string;
          balance: number;
          demo_balance: number;
          account_type: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          balance?: number;
          demo_balance?: number;
          account_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          balance?: number;
          demo_balance?: number;
          account_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      trades: {
        Row: {
          id: string;
          user_id: string;
          currency_pair_id: string;
          trade_type: string;
          amount: number;
          entry_price: number;
          exit_price: number | null;
          duration_minutes: number;
          status: string | null;
          payout_percentage: number | null;
          profit_loss: number | null;
          expires_at: string;
          closed_at: string | null;
          account_type: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          currency_pair_id: string;
          trade_type: string;
          amount: number;
          entry_price: number;
          exit_price?: number | null;
          duration_minutes?: number;
          status?: string | null;
          payout_percentage?: number | null;
          profit_loss?: number | null;
          expires_at: string;
          closed_at?: string | null;
          account_type?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          currency_pair_id?: string;
          trade_type?: string;
          amount?: number;
          entry_price?: number;
          exit_price?: number | null;
          duration_minutes?: number;
          status?: string | null;
          payout_percentage?: number | null;
          profit_loss?: number | null;
          expires_at?: string;
          closed_at?: string | null;
          account_type?: string | null;
          created_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          amount: number;
          status: string | null;
          payment_method: string | null;
          payment_reference: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          amount: number;
          status?: string | null;
          payment_method?: string | null;
          payment_reference?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          amount?: number;
          status?: string | null;
          payment_method?: string | null;
          payment_reference?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      currency_pairs: {
        Row: {
          id: string;
          symbol: string;
          name: string;
          base_currency: string;
          quote_currency: string;
          min_trade_amount: number | null;
          max_trade_amount: number | null;
          is_active: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          symbol: string;
          name: string;
          base_currency: string;
          quote_currency: string;
          min_trade_amount?: number | null;
          max_trade_amount?: number | null;
          is_active?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          symbol?: string;
          name?: string;
          base_currency?: string;
          quote_currency?: string;
          min_trade_amount?: number | null;
          max_trade_amount?: number | null;
          is_active?: boolean | null;
          created_at?: string;
        };
      };
    };
  };
};