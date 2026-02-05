import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { LoginPage } from '@/components/LoginPage';
import { Header } from '@/components/Header';
import { ProcessorPage } from '@/components/ProcessorPage';
import { HistoryPage } from '@/components/HistoryPage';
import { AdminPage } from '@/components/AdminPage';
import { Session, DB } from '@/utils/storage';

export function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [activePage, setActivePage] = useState('processor');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await DB.init();
      const session = Session.get();
      
      if (session) {
        setCurrentUser(session.userId);
        setIsAdmin(session.isAdmin);
        setIsLoggedIn(true);
        DB.registerUser(session.userId);
      }
      
      setIsLoading(false);
    };

    init();

    // Heartbeat to update user activity
    const heartbeat = setInterval(() => {
      if (currentUser) {
        DB.setUserOnline(currentUser);
      }
    }, 30000);

    return () => clearInterval(heartbeat);
  }, [currentUser]);

  const handleLogin = async (userId: string, admin: boolean) => {
    setCurrentUser(userId);
    setIsAdmin(admin);
    setIsLoggedIn(true);
    Session.save(userId, admin);
    await DB.registerUser(userId);
    await DB.setUserOnline(userId);
  };

  const handleLogout = () => {
    Session.clear();
    setIsLoggedIn(false);
    setCurrentUser('');
    setIsAdmin(false);
    setActivePage('processor');
  };

  const handleNavigate = (page: string) => {
    setActivePage(page);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e293b',
            color: '#fff',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: 600
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' }
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' }
          }
        }}
      />
      
      <AnimatePresence mode="wait">
        {!isLoggedIn ? (
          <LoginPage key="login" onLogin={handleLogin} />
        ) : (
          <div key="app" className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
            <Header
              currentUser={currentUser}
              isAdmin={isAdmin}
              activePage={activePage}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            />
            
            <main className="container mx-auto px-4 py-6 max-w-6xl">
              <AnimatePresence mode="wait">
                {activePage === 'processor' && (
                  <ProcessorPage key="processor" userId={currentUser} />
                )}
                {activePage === 'history' && (
                  <HistoryPage key="history" userId={currentUser} />
                )}
                {activePage === 'admin' && isAdmin && (
                  <AdminPage key="admin" />
                )}
              </AnimatePresence>
            </main>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
