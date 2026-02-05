import { motion } from 'framer-motion';
import { BarChart3, History, Settings, LogOut } from 'lucide-react';

interface HeaderProps {
  currentUser: string;
  isAdmin: boolean;
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function Header({ currentUser, isAdmin, activePage, onNavigate, onLogout }: HeaderProps) {
  const navItems = [
    { id: 'processor', label: 'Processor', icon: BarChart3 },
    { id: 'history', label: 'My Records', icon: History },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin Panel', icon: Settings }] : [])
  ];

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="bg-white/80 backdrop-blur-lg h-16 flex items-center justify-between px-6 border-b border-slate-200/50 shadow-sm sticky top-0 z-50"
    >
      <motion.div 
        className="font-extrabold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
        whileHover={{ scale: 1.02 }}
      >
        Progression Analytics
      </motion.div>

      <nav className="flex items-center gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                relative px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors
                ${isActive 
                  ? 'text-white' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon className="w-4 h-4" />
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </nav>

      <div className="flex items-center gap-4">
        <motion.div 
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold
            ${isAdmin 
              ? 'bg-amber-100 text-amber-700' 
              : 'bg-emerald-100 text-emerald-700'
            }
          `}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
        >
          <motion.span 
            className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-amber-500' : 'bg-emerald-500'}`}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
          {currentUser} {isAdmin && '(Admin)'}
        </motion.div>
        
        <motion.button
          onClick={onLogout}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.header>
  );
}
