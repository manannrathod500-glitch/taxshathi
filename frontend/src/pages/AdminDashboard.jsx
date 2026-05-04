import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Shield, Users, IndianRupee, MessageSquare, LogOut, RefreshCw,
  ChevronDown, Eye, CheckCircle, XCircle, Bell, Trophy
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminDashboard() {
  const { user, logout, authHeaders } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userConvs, setUserConvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, uRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, authHeaders()),
        axios.get(`${API}/admin/users`, authHeaders())
      ]);
      setStats(sRes.data);
      setUsers(uRes.data);
    } catch (err) {
      if (err.response?.status === 403) { toast.error('Admin access required'); navigate('/dashboard'); }
      else toast.error('Failed to load admin data');
    } finally { setLoading(false); }
  }, [authHeaders, navigate]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (tab === 'referrals') loadReferrals();
  }, [tab]);

  const loadReferrals = async () => {
    try {
      const res = await axios.get(`${API}/admin/referrals`, authHeaders());
      setReferrals(res.data);
    } catch { toast.error('Could not load referrals'); }
  };

  const viewConversations = async (u) => {
    setSelectedUser(u);
    try {
      const res = await axios.get(`${API}/admin/conversations/${u.id}`, authHeaders());
      setUserConvs(res.data);
    } catch { toast.error('Could not load conversations'); }
  };

  const toggleUser = async (userId, activate) => {
    setActionLoading(userId);
    try {
      await axios.post(`${API}/admin/users/${userId}/${activate ? 'activate' : 'deactivate'}`, {}, authHeaders());
      toast.success(activate ? 'User activated!' : 'User deactivated!');
      await load();
    } catch { toast.error('Action failed'); } finally { setActionLoading(null); }
  };

  const nudgeUser = async (userId, email) => {
    setActionLoading(userId + '_nudge');
    try {
      await axios.post(`${API}/admin/users/${userId}/nudge`, {}, authHeaders());
      toast.success(`Nudge sent to ${email}`);
    } catch { toast.error('Nudge failed'); } finally { setActionLoading(null); }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-['Noto_Sans']">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <Shield size={15} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-gray-900 font-['Outfit']">TaxSaathi</span>
            <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Admin</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="text-gray-400 hover:text-green-600 transition-colors p-1.5 rounded-lg hover:bg-green-50">
            <RefreshCw size={16} />
          </button>
          <button onClick={() => navigate('/dashboard')} className="text-xs text-gray-500 hover:text-green-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-green-400 transition-all">
            My Dashboard
          </button>
          <button data-testid="admin-logout-btn" onClick={() => { logout(); navigate('/'); }} className="text-gray-400 hover:text-red-500 transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* TABS */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-0">
          {['overview', 'users', 'referrals'].map(t => (
            <button
              key={t}
              data-testid={`admin-tab-${t}`}
              onClick={() => setTab(t)}
              className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-all capitalize ${tab === t ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">

        {/* OVERVIEW TAB */}
        {tab === 'overview' && stats && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 font-['Outfit']">Business Overview</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Users', value: stats.total_users, icon: Users, color: 'blue' },
                { label: 'Paid Subscribers', value: stats.paid_users, icon: CheckCircle, color: 'green' },
                { label: 'Free Users', value: stats.free_users, icon: XCircle, color: 'orange' },
                { label: 'Revenue (Month)', value: `₹${stats.revenue_this_month?.toLocaleString()}`, icon: IndianRupee, color: 'purple' },
              ].map((s, i) => (
                <div key={i} data-testid={`stat-card-${i}`} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                  <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center bg-${s.color}-50`}>
                    <s.icon size={18} className={`text-${s.color}-600`} />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 font-['Outfit']">{s.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {stats.revenue_chart && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-base font-semibold text-gray-900 mb-5 font-['Outfit']">Revenue Trend</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.revenue_chart} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={v => [`₹${v.toLocaleString()}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="#16a34a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-4 font-['Outfit']">Free Users — Not Converted Yet</h3>
              <div className="space-y-3">
                {users.filter(u => u.plan === 'free').slice(0, 5).map(u => (
                  <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{u.name}</div>
                      <div className="text-xs text-gray-400">{u.email} • {u.free_questions_used || 0}/10 questions used</div>
                    </div>
                    <button
                      data-testid={`nudge-btn-${u.id}`}
                      onClick={() => nudgeUser(u.id, u.email)}
                      disabled={actionLoading === u.id + '_nudge'}
                      className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-all flex items-center gap-1 disabled:opacity-50"
                    >
                      <Bell size={12} /> Send Nudge
                    </button>
                  </div>
                ))}
                {users.filter(u => u.plan === 'free').length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">All users are paid subscribers!</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {tab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 font-['Outfit']">All Clients ({filtered.length})</h1>
              <input
                data-testid="admin-search-input"
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-green-400 w-64"
              />
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['Name / Email', 'Plan', 'Questions Used', 'Joined', 'Status', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u, i) => (
                      <tr key={u.id} data-testid={`user-row-${i}`} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{u.name}</div>
                          <div className="text-xs text-gray-400">{u.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            u.plan === 'free' ? 'bg-gray-100 text-gray-600' :
                            u.plan === 'pro' ? 'bg-blue-100 text-blue-700' :
                            u.plan === 'premium' ? 'bg-purple-100 text-purple-700' :
                            'bg-green-100 text-green-700'
                          }`}>{u.plan || 'free'}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{u.free_questions_used || 0}/10</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN') : '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              data-testid={`view-convs-${u.id}`}
                              onClick={() => viewConversations(u)}
                              className="text-xs text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                            >
                              <Eye size={11} /> View
                            </button>
                            <button
                              data-testid={`toggle-user-${u.id}`}
                              onClick={() => toggleUser(u.id, !u.is_active)}
                              disabled={actionLoading === u.id}
                              className={`text-xs px-2 py-1 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50 ${u.is_active ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-green-700 bg-green-50 hover:bg-green-100'}`}
                            >
                              {u.is_active ? <XCircle size={11} /> : <CheckCircle size={11} />}
                              {u.is_active ? 'Block' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <Users size={32} className="mx-auto mb-2 opacity-30" />
                    <p>No users found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* REFERRALS TAB */}
        {tab === 'referrals' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 font-['Outfit']">Referral Leaderboard</h1>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {referrals.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Trophy size={32} className="mx-auto mb-2 opacity-30" />
                  <p>No referrals yet</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Referrer</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Referral Code</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Friends Referred</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((r, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="px-4 py-3 font-bold text-amber-500">#{i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{r.name}</div>
                          <div className="text-xs text-gray-400">{r.email}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 font-mono text-xs">{r.referral_code}</td>
                        <td className="px-4 py-3">
                          <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold">{r.referral_count}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CONVERSATION MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-900 font-['Outfit']">{selectedUser.name}'s Conversations</h3>
                <p className="text-xs text-gray-400">{userConvs.length} conversations</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>
            <div className="overflow-y-auto p-5 space-y-4 max-h-[60vh]">
              {userConvs.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No conversations yet</p>
              ) : (
                userConvs.map((c, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-4">
                    <p className="text-sm font-semibold text-gray-800 mb-2">Q: {c.message}</p>
                    <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-wrap border-l-2 border-green-200 pl-3">{c.response?.slice(0, 300)}{c.response?.length > 300 ? '...' : ''}</p>
                    <p className="text-xs text-gray-300 mt-2">{new Date(c.created_at).toLocaleString('en-IN')}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
