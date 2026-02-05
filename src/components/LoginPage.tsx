import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Shield, Eye, EyeOff, Sparkles } from 'lucide-react';
import { formatId, isAdmin, verifyAdminPassword } from '@/utils/storage';

interface LoginPageProps {
  onLogin: (userId: string, isAdmin: boolean) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [inputId, setInputId] = useState('');
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [pendingUserId, setPendingUserId] = useState('');

  const handleInputChange = (value: string) => {
    setInputId(value);
    setError('');
    const formatted = formatId(value.trim());
    if (formatted) {
      setPreview(`✓ Will login as: ${formatted}`);
    } else {
      setPreview('');
    }
  };

  const handleLogin = () => {
    if (!inputId.trim()) {
      setError('Enter your MindA ID');
      return;
    }

    const fullId = formatId(inputId.trim());
    if (!fullId) {
      setError('Invalid format. Use: minda001 or 001');
      return;
    }

    if (isAdmin(fullId)) {
      setPendingUserId(fullId);
      setShowAdminModal(true);
      return;
    }

    onLogin(fullId, false);
  };

  const handleAdminVerify = () => {
    if (!verifyAdminPassword(adminPassword)) {
      setAdminError('Incorrect password');
      return;
    }
    setShowAdminModal(false);
    onLogin(pendingUserId, true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-blue-400/20 rounded-full"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight,
              scale: Math.random() * 0.5 + 0.5
            }}
            animate={{ 
              y: [null, Math.random() * -200 - 100],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: Math.random() * 3 + 2, 
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative bg-white/10 backdrop-blur-xl p-8 rounded-2xl border border-white/20 w-[380px] shadow-2xl"
      >
        <motion.div 
          className="absolute -top-12 left-1/2 -translate-x-1/2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
         
        </motion.div>

        <div className="text-center mt-6 mb-8">
          <motion.h3 
            className="text-2xl font-bold text-white mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Progression Analytics
          </motion.h3>
          <motion.p 
            className="text-blue-200/80 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Enter MindA ID to continue
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <input
            type="text"
            value={inputId}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Write Your MindA ID"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-center font-mono placeholder-white/40 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 transition-all"
          />

          {preview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 p-3 bg-emerald-500/20 border-l-2 border-emerald-400 rounded-lg text-emerald-300 text-sm"
            >
              {preview}
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 p-3 bg-red-500/20 border-l-2 border-red-400 rounded-lg text-red-300 text-sm"
            >
              {error}
            </motion.div>
          )}

          <motion.button
            onClick={handleLogin}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full mt-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-shadow"
          >
            <LogIn className="w-5 h-5" />
            Enter
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Admin Modal */}
      {showAdminModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-800 p-8 rounded-2xl border border-slate-700 w-[380px] shadow-2xl"
          >
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-amber-400" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white text-center mb-6">Admin Verification</h2>
            
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={adminPassword}
                onChange={(e) => { setAdminPassword(e.target.value); setAdminError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleAdminVerify()}
                placeholder="Enter password"
                className="w-full px-4 py-3 pr-12 bg-slate-700/50 border border-slate-600 rounded-xl text-white text-center placeholder-slate-400 focus:outline-none focus:border-amber-400 transition-all"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {adminError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 p-3 bg-red-500/20 border-l-2 border-red-400 rounded-lg text-red-300 text-sm"
              >
                {adminError}
              </motion.div>
            )}

            <div className="flex gap-3 mt-6">
              <motion.button
                onClick={handleAdminVerify}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 bg-amber-500 text-slate-900 font-bold rounded-xl"
              >
                Verify
              </motion.button>
              <motion.button
                onClick={() => { setShowAdminModal(false); setAdminPassword(''); setAdminError(''); }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 bg-slate-700 text-white font-bold rounded-xl border border-slate-600"
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
