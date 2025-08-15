import React, { useState, useEffect } from 'react';
import { Users, DollarSign, TrendingUp, Settings, Search, Edit, Ban, CheckCircle } from 'lucide-react';
import { AdminUser } from '../types/user';
import { supabaseAuthService } from '../services/supabase-auth';

interface AdminDashboardProps {
  currentUser: any;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [editModal, setEditModal] = useState(false);
  const [newBalance, setNewBalance] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await supabaseAuthService.getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
      // Fallback to simplified version
      const simpleUsers = await supabaseAuthService.getAllUsersSimple();
      setUsers(simpleUsers);
    }
    setLoading(false);
  };

  const filteredUsers = users.filter(user => 
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUsers = users.length;
  const totalBalance = users.reduce((sum, user) => sum + user.balance, 0);
  const totalProfit = users.reduce((sum, user) => sum + user.totalProfit, 0);
  const activeUsers = users.filter(user => user.accountStatus === 'active').length;

  const handleUpdateBalance = async () => {
    if (!selectedUser || !newBalance) return;
    
    const success = await supabaseAuthService.updateUserBalance(selectedUser.id, parseFloat(newBalance));
    if (success) {
      await loadUsers();
      setEditModal(false);
      setSelectedUser(null);
      setNewBalance('');
      alert('Balance updated successfully');
    } else {
      alert('Failed to update balance');
    }
  };

  const handleSuspendUser = async (userId: string) => {
    const success = await supabaseAuthService.suspendUser(userId);
    if (success) {
      await loadUsers();
      alert('User suspended successfully');
    } else {
      alert('Failed to suspend user');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-purple-100">Welcome back, {currentUser.firstName}</p>
          </div>
          <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
            <div className="text-white text-sm">Admin Panel</div>
            <div className="text-purple-100 text-xs">Full Access</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-400 text-sm">Total Users</div>
              <div className="text-2xl font-bold text-white">{totalUsers}</div>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-400 text-sm">Active Users</div>
              <div className="text-2xl font-bold text-green-400">{activeUsers}</div>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-400 text-sm">Total Balance</div>
              <div className="text-2xl font-bold text-white">${totalBalance.toLocaleString()}</div>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-400 text-sm">Total Profit</div>
              <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${totalProfit.toLocaleString()}
              </div>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Users Management */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">User Management</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-700 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left pb-3">User</th>
                <th className="text-left pb-3">Email</th>
                <th className="text-left pb-3">Balance</th>
                <th className="text-left pb-3">Total Profit</th>
                <th className="text-left pb-3">Trades</th>
                <th className="text-left pb-3">Win Rate</th>
                <th className="text-left pb-3">Status</th>
                <th className="text-left pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-700">
                  <td className="py-3">
                    <div className="text-white font-medium">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-gray-400 text-xs">
                      ID: {user.id.slice(0, 8)}...
                    </div>
                  </td>
                  <td className="py-3 text-gray-300">{user.email}</td>
                  <td className="py-3 text-white font-mono">
                    ${user.balance.toLocaleString()}
                  </td>
                  <td className={`py-3 font-semibold ${user.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {user.totalProfit >= 0 ? '+' : ''}${user.totalProfit.toFixed(2)}
                  </td>
                  <td className="py-3 text-white">{user.totalTrades}</td>
                  <td className="py-3 text-white">{user.winRate.toFixed(1)}%</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.accountStatus === 'active' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-red-600 text-white'
                    }`}>
                      {user.accountStatus}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setNewBalance(user.balance.toString());
                          setEditModal(true);
                        }}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        title="Edit Balance"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSuspendUser(user.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Suspend User"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Balance Modal */}
      {editModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">
                Edit User Balance
              </h3>
              <button
                onClick={() => setEditModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-gray-400 text-sm mb-2">User</div>
                <div className="text-white">
                  {selectedUser.firstName} {selectedUser.lastName}
                </div>
              </div>

              <div>
                <div className="text-gray-400 text-sm mb-2">Current Balance</div>
                <div className="text-white font-mono">
                  ${selectedUser.balance.toLocaleString()}
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  New Balance
                </label>
                <input
                  type="number"
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new balance"
                  step="0.01"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setEditModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateBalance}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
                >
                  Update Balance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};