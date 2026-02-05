import type { UserData, Record, UserStats, SaveResult, GlobalAnalytics, AllUserData } from '@/types';

const CONFIG = {
  ADMIN_USER: 'MINDA077',
  ADMIN_PASSWORD: 'imran077',
  SESSION_KEY: 'minda_ls_session_v1',
  STORE_USERS: 'PA_USERS',
  STORE_RECORDS: 'PA_RECORDS',
  STORE_GLOBAL: 'PA_ANALYTICS'
};

export const getToday = (): string => new Date().toISOString().split('T')[0];

export const formatId = (input: string): string | null => {
  const formatted = input.toUpperCase().replace(/\s/g, '');
  if (/^\d{1,3}$/.test(formatted)) {
    return `MINDA${formatted.padStart(3, '0')}`;
  } else if (/^MINDA\d{1,3}$/.test(formatted)) {
    const num = formatted.replace('MINDA', '').padStart(3, '0');
    return `MINDA${num}`;
  }
  return null;
};

export const formatTime = (isoString: string): string => {
  if (!isoString) return '--';
  return new Date(isoString).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
};

export const Session = {
  save: (userId: string, isAdmin: boolean): void => {
    localStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify({ userId, isAdmin, ts: Date.now() }));
  },
  get: (): { userId: string; isAdmin: boolean; ts: number } | null => {
    try {
      const data = localStorage.getItem(CONFIG.SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  clear: (): void => localStorage.removeItem(CONFIG.SESSION_KEY)
};

const getStore = <T>(key: string): T => {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}') as T;
  } catch {
    return {} as T;
  }
};

const setStore = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const DB = {
  init: async (): Promise<boolean> => {
    try {
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      console.error('LocalStorage not available');
      return false;
    }
  },

  registerUser: async (userId: string): Promise<void> => {
    const users = getStore<{ [key: string]: UserData }>(CONFIG.STORE_USERS);
    const global = getStore<GlobalAnalytics>(CONFIG.STORE_GLOBAL);
    const today = getToday();

    if (!users[userId]) {
      users[userId] = {
        user_id: userId,
        total_ids: 0,
        total_searches: 0,
        created_at: new Date().toISOString()
      };
    }

    users[userId].last_login = new Date().toISOString();
    users[userId].last_login_date = today;

    const loginKey = `logins_${today}`;
    global[loginKey] = (global[loginKey] || 0) + 1;

    setStore(CONFIG.STORE_USERS, users);
    setStore(CONFIG.STORE_GLOBAL, global);
  },

  setUserOnline: async (userId: string): Promise<void> => {
    const users = getStore<{ [key: string]: UserData }>(CONFIG.STORE_USERS);
    if (users[userId]) {
      users[userId].last_active = new Date().toISOString();
      setStore(CONFIG.STORE_USERS, users);
    }
  },

  saveRecords: async (userId: string, ids: string[]): Promise<SaveResult> => {
    if (ids.length === 0) return { newCount: 0, duplicateCount: 0, newIds: [] };

    const users = getStore<{ [key: string]: UserData }>(CONFIG.STORE_USERS);
    const allRecords = getStore<{ [key: string]: Record[] }>(CONFIG.STORE_RECORDS);
    const global = getStore<GlobalAnalytics>(CONFIG.STORE_GLOBAL);

    const today = getToday();
    const hour = new Date().getHours();
    const nowIso = new Date().toISOString();

    if (!allRecords[userId]) allRecords[userId] = [];

    const userExistingIds = new Set(allRecords[userId].map(r => r.id));
    const newIds: string[] = [];

    ids.forEach(id => {
      if (!userExistingIds.has(id)) {
        newIds.push(id);
      }
    });

    const duplicateCount = ids.length - newIds.length;

    global.total_searches = (global.total_searches || 0) + 1;
    global[`searches_${today}`] = (global[`searches_${today}`] || 0) + 1;

    if (users[userId]) {
      users[userId].total_searches = (users[userId].total_searches || 0) + 1;
    }

    if (newIds.length > 0) {
      const newRecordObjects: Record[] = newIds.map(id => ({
        id: id,
        date: today,
        hour: hour,
        timestamp: nowIso
      }));

      allRecords[userId].push(...newRecordObjects);

      if (users[userId]) {
        users[userId].total_ids = (users[userId].total_ids || 0) + newIds.length;
      }

      global.total_ids = (global.total_ids || 0) + newIds.length;
      global[`ids_${today}`] = (global[`ids_${today}`] || 0) + newIds.length;
      global[`hour_${hour}`] = (global[`hour_${hour}`] || 0) + newIds.length;
    }

    setStore(CONFIG.STORE_RECORDS, allRecords);
    setStore(CONFIG.STORE_USERS, users);
    setStore(CONFIG.STORE_GLOBAL, global);

    return { newCount: newIds.length, duplicateCount, newIds };
  },

  getUserRecords: async (
    userId: string, 
    filters: { date?: string; search?: string; digitFilter?: '11-digit' | '15-digit' | 'all' } = {}
  ): Promise<Record[]> => {
    const allRecords = getStore<{ [key: string]: Record[] }>(CONFIG.STORE_RECORDS);
    let records = allRecords[userId] || [];

    records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (filters.date) {
      records = records.filter(r => r.date === filters.date);
    }
    if (filters.search) {
      const term = filters.search.toLowerCase();
      records = records.filter(r => r.id.toLowerCase().includes(term));
    }
    if (filters.digitFilter && filters.digitFilter !== 'all') {
      const len = filters.digitFilter === '11-digit' ? 11 : 15;
      records = records.filter(r => r.id.length === len);
    }
    return records;
  },

  getUserStats: async (userId: string): Promise<UserStats> => {
    const users = getStore<{ [key: string]: UserData }>(CONFIG.STORE_USERS);
    const allRecords = getStore<{ [key: string]: Record[] }>(CONFIG.STORE_RECORDS);
    const today = getToday();

    const userData = users[userId] || {};
    const userRecs = allRecords[userId] || [];

    const todayCount = userRecs.filter(r => r.date === today).length;

    return {
      total: userData.total_ids || 0,
      today: todayCount,
      searches: userData.total_searches || 0
    };
  },

  getGlobalAnalytics: async (): Promise<GlobalAnalytics> => {
    return getStore<GlobalAnalytics>(CONFIG.STORE_GLOBAL);
  },

  getAllUsers: async (): Promise<AllUserData[]> => {
    const usersMap = getStore<{ [key: string]: UserData }>(CONFIG.STORE_USERS);
    const allRecords = getStore<{ [key: string]: Record[] }>(CONFIG.STORE_RECORDS);
    const today = getToday();

    return Object.values(usersMap).map(u => {
      const userRecs = allRecords[u.user_id] || [];
      const todayCount = userRecs.filter(r => r.date === today).length;

      return {
        id: u.user_id,
        total_ids: u.total_ids || 0,
        today_ids: todayCount,
        searches: u.total_searches || 0,
        last_active: u.last_active || u.last_login || ''
      };
    });
  }
};

export const isAdmin = (userId: string): boolean => userId === CONFIG.ADMIN_USER;
export const verifyAdminPassword = (password: string): boolean => password === CONFIG.ADMIN_PASSWORD;
export { CONFIG };
