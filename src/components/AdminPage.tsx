import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, TrendingUp, Search, Clock, Calendar, 
  Activity, BarChart3, Download, Zap 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DB, getToday } from '@/utils/storage';
import type { GlobalAnalytics, AllUserData } from '@/types';

export function AdminPage() {
  const [analytics, setAnalytics] = useState<GlobalAnalytics>({});
  const [users, setUsers] = useState<AllUserData[]>([]);
  const [peakHour, setPeakHour] = useState('--');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const [globalAnalytics, allUsers] = await Promise.all([
      DB.getGlobalAnalytics(),
      DB.getAllUsers()
    ]);
    setAnalytics(globalAnalytics);
    setUsers(allUsers);

    // Calculate peak hour
    let maxHour = 0, maxCount = 0;
    for (let h = 0; h < 24; h++) {
      const count = globalAnalytics[`hour_${h}`] || 0;
      if (count > maxCount) {
        maxCount = count;
        maxHour = h;
      }
    }
    setPeakHour(maxCount > 0 ? `${maxHour.toString().padStart(2, '0')}:00` : '--');
  };

  const today = getToday();

  const analyticsCards = [
    { label: 'Total Users', value: users.length, icon: Users, color: 'emerald' },
    { label: 'Active Profiles', value: users.length, icon: Activity, color: 'blue' },
    { label: 'Logins Today', value: analytics[`logins_${today}`] || 0, icon: Calendar, color: 'amber' },
    { label: 'Total Searches', value: analytics.total_searches || 0, icon: Search, color: 'purple' },
    { label: 'Total Unique IDs', value: analytics.total_ids || 0, icon: TrendingUp, color: 'blue' },
    { label: 'IDs Today', value: analytics[`ids_${today}`] || 0, icon: Zap, color: 'emerald' },
    { label: 'Peak Hour', value: peakHour, icon: Clock, color: 'red', isText: true },
    { label: 'Searches Today', value: analytics[`searches_${today}`] || 0, icon: BarChart3, color: 'amber' }
  ];

  const exportUserData = () => {
    const data = users.map(u => ({
      User: u.id,
      'Total IDs': u.total_ids,
      "Today's IDs": u.today_ids,
      Searches: u.searches,
      'Last Active': u.last_active ? new Date(u.last_active).toLocaleString() : 'Never'
    }));

    const csvContent = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin_report_${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Admin report downloaded!');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Analytics Header */}
      <div className="flex justify-between items-center">
        <motion.h1 
          className="text-xl font-bold text-slate-800 flex items-center gap-2"
          initial={{ x: -20 }}
          animate={{ x: 0 }}
        >
          <BarChart3 className="w-6 h-6 text-blue-500" />
          Admin Analytics
        </motion.h1>
        <div className="flex items-center gap-4">
          <motion.div 
            className="flex items-center gap-2 text-sm text-emerald-600 font-semibold"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
            Live Updates
          </motion.div>
          <motion.button
            onClick={exportUserData}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Report
          </motion.button>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {analyticsCards.map((card, index) => {
          const Icon = card.icon;
          const colorClasses: Record<string, string> = {
            blue: 'from-blue-500 to-indigo-600',
            emerald: 'from-emerald-500 to-teal-600',
            amber: 'from-amber-500 to-orange-600',
            purple: 'from-purple-500 to-pink-600',
            red: 'from-red-500 to-rose-600'
          };

          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white rounded-xl p-5 border border-slate-200/50 shadow-lg relative overflow-hidden"
            >
              <motion.div 
                className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colorClasses[card.color] || colorClasses.blue}`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: index * 0.05 + 0.2 }}
              />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    {card.label}
                  </p>
                  <motion.p 
                    className={`text-2xl font-extrabold bg-gradient-to-r ${colorClasses[card.color] || colorClasses.blue} bg-clip-text text-transparent`}
                    key={String(card.value)}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                  >
                    {card.isText ? card.value : (card.value as number).toLocaleString()}
                  </motion.p>
                </div>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClasses[card.color] || colorClasses.blue} shadow-lg`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Active Users Widget */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 border border-slate-200/50 shadow-lg"
      >
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          Users in Local Storage
        </h3>
        <div className="flex flex-wrap gap-2">
          {users.length === 0 ? (
            <span className="text-sm text-slate-400">No users data</span>
          ) : (
            users.map((user, i) => (
              <motion.span
                key={user.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="px-3 py-1.5 bg-emerald-500 text-white text-sm font-semibold rounded-full flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                {user.id}
              </motion.span>
            ))
          )}
        </div>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl border border-slate-200/50 shadow-lg overflow-hidden"
      >
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            All Users & Their Activity
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">User</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Total IDs</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Today&apos;s IDs</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Searches</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">No users</td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-t border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-800">{user.id}</td>
                    <td className="px-4 py-3 text-slate-600">{user.total_ids}</td>
                    <td className="px-4 py-3 text-slate-600">{user.today_ids}</td>
                    <td className="px-4 py-3 text-slate-600">{user.searches}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {user.last_active ? new Date(user.last_active).toLocaleString() : 'Never'}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
