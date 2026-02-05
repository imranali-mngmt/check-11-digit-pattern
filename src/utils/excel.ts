import * as XLSX from 'xlsx';
import type { Record } from '@/types';
import { formatTime } from './storage';

export const exportToExcel = (records: Record[], filename: string = 'report') => {
  const data = records.map(r => ({
    'ID': r.id,
    'Type': r.id.length === 11 ? '11-digit' : r.id.length === 15 ? '15-digit' : 'Other',
    'Date': r.date,
    'Time': formatTime(r.timestamp),
    'Status': 'Sequential'
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 20 },  // ID
    { wch: 12 },  // Type
    { wch: 12 },  // Date
    { wch: 12 },  // Time
    { wch: 12 }   // Status
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Records');

  // Generate file and download
  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const generateReport = (records: Record[]) => {
  const elevenDigit = records.filter(r => r.id.length === 11);
  const fifteenDigit = records.filter(r => r.id.length === 15);
  
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = records.filter(r => r.date === today);
  
  return {
    total: records.length,
    elevenDigitCount: elevenDigit.length,
    fifteenDigitCount: fifteenDigit.length,
    todayCount: todayRecords.length,
    uniqueDates: [...new Set(records.map(r => r.date))].length
  };
};
