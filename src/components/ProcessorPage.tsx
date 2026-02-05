import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, TrendingUp, Search, Calendar, X, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { DB } from '@/utils/storage';
import type { UserStats, SaveResult } from '@/types';

interface ProcessorPageProps {
  userId: string;
}

export function ProcessorPage({ userId }: ProcessorPageProps) {
  const [inputData, setInputData] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<UserStats>({ total: 0, today: 0, searches: 0 });
  const [showModal, setShowModal] = useState(false);
  const [result, setResult] = useState<SaveResult & { totalFound: number }>({
    newCount: 0,
    duplicateCount: 0,
    newIds: [],
    totalFound: 0
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadStats();
  }, [userId]);

  const loadStats = async () => {
    const userStats = await DB.getUserStats(userId);
    setStats(userStats);
  };

  const execute = async () => {
    if (!inputData.trim()) {
      toast.error('Input is empty');
      return;
    }

    setIsProcessing(true);

    try {
      // Find both 11-digit and 15-digit IDs
      const matches11 = inputData.match(/\b\d{11}\b/g) || [];
      const matches15 = inputData.match(/\b\d{15}\b/g) || [];
      const allMatches = [...matches11, ...matches15];

      if (allMatches.length === 0) {
        toast.error('No 11-digit or 15-digit IDs found');
        setIsProcessing(false);
        return;
      }

      // Deduplicate found matches
      void [...new Set(allMatches)];
      
      // Process sequentially for both types
      const process = (ids: string[]) => {
        const bigIntIds = ids.map(id => ({ str: id, val: BigInt(id) }))
          .sort((a, b) => a.val < b.val ? -1 : 1);

        const sequential: string[] = [];
        for (let i = 0; i < bigIntIds.length; i++) {
          const curr = bigIntIds[i].val;
          let isSeq = false;
          if (i > 0 && curr === bigIntIds[i - 1].val + 1n) isSeq = true;
          if (i < bigIntIds.length - 1 && curr === bigIntIds[i + 1].val - 1n) isSeq = true;
          if (isSeq) sequential.push(bigIntIds[i].str);
        }
        return sequential;
      };

      const sequential11 = process([...new Set(matches11)]);
      const sequential15 = process([...new Set(matches15)]);
      const allSequential = [...sequential11, ...sequential15];

      if (allSequential.length === 0) {
        toast.error('No sequential IDs found');
        setIsProcessing(false);
        return;
      }

      const saveResult = await DB.saveRecords(userId, allSequential);

      setResult({
        ...saveResult,
        totalFound: allSequential.length
      });

      setShowModal(true);
      setInputData('');
      loadStats();

      if (saveResult.newCount > 0) {
        toast.success(`Found ${saveResult.newCount} NEW sequential IDs!`);
      } else {
        toast('All IDs were already in your records', { icon: '⚠️' });
      }
    } catch (error) {
      toast.error('Processing error');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyResults = () => {
    if (result.newIds.length === 0) {
      toast.error('No new IDs to copy');
      return;
    }
    navigator.clipboard.writeText(result.newIds.join('\n'));
    setCopied(true);
    toast.success(`Copied ${result.newIds.length} new IDs!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const dashboardCards = [
    { label: "Today's Unique IDs", value: stats.today, icon: Calendar, color: 'blue' },
    { label: 'Total Unique IDs', value: stats.total, icon: TrendingUp, color: 'emerald' },
    { label: 'Total Searches', value: stats.searches, icon: Search, color: 'amber' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {dashboardCards.map((card, index) => {
          const Icon = card.icon;
          const colorClasses = {
            blue: 'from-blue-500 to-indigo-600 shadow-blue-200',
            emerald: 'from-emerald-500 to-teal-600 shadow-emerald-200',
            amber: 'from-amber-500 to-orange-600 shadow-amber-200'
          };

          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white rounded-xl p-6 border border-slate-200/50 shadow-lg hover:shadow-xl transition-all relative overflow-hidden"
            >
              <motion.div 
                className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colorClasses[card.color as keyof typeof colorClasses]}`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: index * 0.1 + 0.2 }}
              />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    {card.label}
                  </p>
                  <motion.p 
                    className={`text-3xl font-extrabold bg-gradient-to-r ${colorClasses[card.color as keyof typeof colorClasses]} bg-clip-text text-transparent`}
                    key={card.value}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    {card.value.toLocaleString()}
                  </motion.p>
                </div>
                <div className={`p-3 rounded-lg bg-gradient-to-br ${colorClasses[card.color as keyof typeof colorClasses]} shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Input Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="max-w-2xl mx-auto"
      >
        <div className="bg-white rounded-2xl p-8 border border-slate-200/50 shadow-xl hover:border-blue-300 transition-all">
          <div className="mb-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Input Stream
            </h3>
            <p className="text-sm text-slate-400">
              Paste 11-digit(comma, space, or newline separated)
            </p>
          </div>

          <motion.textarea
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            placeholder="Paste your data here..."
            className="w-full min-h-[200px] p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all"
            whileFocus={{ scale: 1.01 }}
          />

          <motion.button
            onClick={execute}
            disabled={isProcessing}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full mt-4 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : (
              <Zap className="w-5 h-5" />
            )}
            {isProcessing ? 'Processing...' : 'EXECUTE'}
          </motion.button>
        </div>
      </motion.div>

      {/* Results Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl relative max-h-[80vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold text-center mb-6">Results</h2>

              {result.duplicateCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm"
                >
                  ⚠️ {result.duplicateCount} IDs were already in your records and were skipped.
                </motion.div>
              )}

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-extrabold text-blue-600">{result.totalFound}</div>
                  <div className="text-xs font-semibold text-slate-500 uppercase mt-1">Total Found</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-extrabold text-emerald-600">{result.newCount}</div>
                  <div className="text-xs font-semibold text-slate-500 uppercase mt-1">New IDs</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-extrabold text-amber-600">{result.duplicateCount}</div>
                  <div className="text-xs font-semibold text-slate-500 uppercase mt-1">Duplicates</div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 max-h-60 overflow-y-auto mb-6 font-mono text-sm text-emerald-600">
                {result.newCount > 0 
                  ? result.newIds.join('\n') 
                  : '(All IDs were duplicates - no new IDs to show)'
                }
              </div>

              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  onClick={copyResults}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="py-3 bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy New IDs'}
                </motion.button>
                <motion.button
                  onClick={() => setShowModal(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="py-3 bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
