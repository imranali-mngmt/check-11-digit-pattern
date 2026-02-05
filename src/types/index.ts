export interface UserData {
  user_id: string;
  total_ids: number;
  total_searches: number;
  created_at: string;
  last_login?: string;
  last_login_date?: string;
  last_active?: string;
}

export interface Record {
  id: string;
  date: string;
  hour: number;
  timestamp: string;
}

export interface UserStats {
  total: number;
  today: number;
  searches: number;
}

export interface SaveResult {
  newCount: number;
  duplicateCount: number;
  newIds: string[];
}

export interface GlobalAnalytics {
  total_ids?: number;
  total_searches?: number;
  [key: string]: number | undefined;
}

export interface AllUserData {
  id: string;
  total_ids: number;
  today_ids: number;
  searches: number;
  last_active: string;
}

export type FilterType = 'all' | '11-digit' | '15-digit';

export interface ReportData {
  id: string;
  date: string;
  time: string;
  type: '11-digit' | '15-digit';
}
