import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Calendar, Filter, Download, Copy, Check, 
  FileSpreadsheet, TrendingUp, Clock, BarChart3 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DB, formatTime } from '@/utils/storage';
import { exportToExcel, generateReport } from '@/utils/excel';
import type { Record, UserStats, FilterType } from '@/types';

interface HistoryPageProps {
  userId: string;
}

export function HistoryPage({ userId }: HistoryPageProps) {
  const [records, setRecords] = useState<Record[]>([]);
  const [stats, setStats] = useState<UserStats>({ total: 0, today: 0, searches: 0 });
  const [filterDate, setFilterDate] = useState('');
  const [searchId, setSearchId] = useState('');
  const [digitFilter, setDigitFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [report, setReport] = useState({ total: 0, elevenDigitCount: 0, fifteenDigitCount: 0, todayCount: 0, uniqueDates: 0 });

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setIsLoading(true);
    const [userStats, userRecords] = await Promise.all([
      DB.getUserStats(userId),
      DB.getUserRecords(userId)
    ]);
    setStats(userStats);
    setRecords(userRecords);
    setReport(generateReport(userRecords));
    setIsLoading(false);
  };

  const handleSearch = async () => {
    setIsLoading(true);
    const filtered = await DB.getUserRecords(userId, {
      date: filterDate || undefined,
      search: searchId || undefined,
      digitFilter: digitFilter
    });
    setRecords(filtered);
    setIsLoading(false);
  };

  const clearFilters = () => {
    setFilterDate('');
    setSearchId('');
    setDigitFilter('all');
    loadData();
  };

  const handleExport = () => {
    if (records.length === 0) {
      toast.error('No records to export');
      return;
    }
    exportToExcel(records, `${userId}_records`);
    toast.success('Excel file downloaded!');
  };

  const copyAllIds = () => {
    if (records.length === 0) {
      toast.error('No records to copy');
      return;
    }
    navigator.clipboard.writeText(records.map(r => r.id).join('\n'));
    setCopied(true);
    toast.success(`Copied ${records.length} IDs!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const statCards = [
    { label: 'Total Unique IDs', value: stats.total, icon: TrendingUp, color: 'blue' },
    { label: 'Today', value: stats.today, icon: Calendar, color: 'emerald' },
    { label: 'Searches', value: stats.searches, icon: Search, color: 'amber' }
  ];

  const filterButtons: { label: string; value: FilterType; count: number }[] = [
    { label: 'All IDs', value: 'all', count: report.total },
    { label: '11-Digit', value: '11-digit', count: report.elevenDigitCount },
    { label: '15-Digit', value: '15-digit', count: report.fifteenDigitCount }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Header with Title and Report Button */}
      <div className="flex justify-between items-center">
        <motion.h1 
          className="text-xl font-bold text-slate-800 flex items-center gap-2"
          initial={{ x: -20 }}
          animate={{ x: 0 }}
        >
          <BarChart3 className="w-6 h-6 text-blue-500" />
          My Records
        </motion.h1>
        <motion.button
          onClick={() => setShowReport(!showReport)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-lg flex items-center gap-2 shadow-lg shadow-purple-200"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Generate Report
        </motion.button>
      </div>

      {/* Report Panel */}
      <AnimatePresence>
        {showReport && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200"
          >
            <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Report Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Total Records', value: report.total, color: 'purple' },
                { label: '11-Digit IDs', value: report.elevenDigitCount, color: 'blue' },
                { label: '15-Digit IDs', value: report.fifteenDigitCount, color: 'indigo' },
                { label: "Today's Records", value: report.todayCount, color: 'emerald' },
                { label: 'Unique Days', value: report.uniqueDates, color: 'amber' }
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-xl p-4 text-center shadow-sm"
                >
                  <div className={`text-2xl font-extrabold text-${item.color}-600`}>{item.value}</div>
                  <div className="text-xs font-medium text-slate-500 mt-1">{item.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-5 border border-slate-200/50 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">{card.label}</p>
                  <p className={`text-2xl font-extrabold text-${card.color}-600`}>{card.value}</p>
                </div>
                <Icon className={`w-8 h-8 text-${card.color}-400`} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {filterButtons.map((btn) => (
          <motion.button
            key={btn.value}
            onClick={() => { setDigitFilter(btn.value); handleSearch(); }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all
              ${digitFilter === btn.value 
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-200' 
                : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
              }
            `}
          >
            <Filter className="w-4 h-4" />
            {btn.label}
            <span className={`
              px-2 py-0.5 rounded-full text-xs font-bold
              ${digitFilter === btn.value ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}
            `}>
              {btn.count}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Search Tools */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-4 border border-slate-200/50 shadow-lg flex flex-wrap gap-4 items-end"
      >
        <div className="flex-1 min-w-[150px]">
          <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Filter Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400"
            />
          </div>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Search ID</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Search any ID..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400"
            />
          </div>
        </div>
        <motion.button
          onClick={handleSearch}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-6 py-2 bg-blue-500 text-white font-bold rounded-lg"
        >
          Search
        </motion.button>
        <motion.button
          onClick={clearFilters}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-6 py-2 bg-red-500 text-white font-bold rounded-lg"
        >
          Clear
        </motion.button>
      </motion.div>

      {/* Records Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl border border-slate-200/50 shadow-lg overflow-hidden"
      >
        <div className="max-h-[400px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">ID</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Type</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Time</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="w-6 h-6 border-2 border-blue-200 border-t-blue-500 rounded-full mx-auto"
                    />
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">No records found</td>
                </tr>
              ) : (
                records.map((record, index) => (
                  <motion.tr
                    key={`${record.id}-${record.timestamp}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-t border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-slate-800">{record.id}</td>
                    <td className="px-4 py-3">
                      <span className={`
                        px-2 py-1 rounded-full text-xs font-semibold
                        ${record.id.length === 11 
                          ? 'bg-blue-100 text-blue-700' 
                          : record.id.length === 15 
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-slate-100 text-slate-600'
                        }
                      `}>
                        {record.id.length}-digit
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(record.timestamp)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{record.date}</td>
                    <td className="px-4 py-3">
                      <span className="text-emerald-600 font-medium flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        Sequential
                      </span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.button
          onClick={copyAllIds}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="py-4 bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
        >
          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          {copied ? 'Copied!' : `Copy All IDs (${records.length})`}
        </motion.button>
        <motion.button
          onClick={handleExport}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
        >
          <Download className="w-5 h-5" />
          Export to Excel ({records.length} records)
        </motion.button>
      </div>
    </motion.div>
  );
}
