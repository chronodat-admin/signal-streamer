import { format } from 'date-fns';
import type { Currency, DateFormat } from '@/hooks/usePreferences';

const currencySymbols: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
  BTC: '₿',
  ETH: 'Ξ',
};

const currencyCodes: Record<Currency, string> = {
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  JPY: 'JPY',
  CNY: 'CNY',
  INR: 'INR',
  BTC: 'BTC',
  ETH: 'ETH',
};

const dateFormatMap: Record<DateFormat, string> = {
  'MM/DD/YYYY': 'MM/dd/yyyy',
  'DD/MM/YYYY': 'dd/MM/yyyy',
  'YYYY-MM-DD': 'yyyy-MM-dd',
  'DD MMM YYYY': 'dd MMM yyyy',
  'MMM DD, YYYY': 'MMM dd, yyyy',
};

/**
 * Format a number as currency based on user preferences
 */
export function formatCurrency(
  amount: number,
  currency: Currency = 'USD',
  options?: {
    showSymbol?: boolean;
    decimals?: number;
    useCode?: boolean;
  }
): string {
  const {
    showSymbol = true,
    decimals = 2,
    useCode = false,
  } = options || {};

  if (useCode) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCodes[currency],
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  }

  const symbol = currencySymbols[currency];
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return showSymbol ? `${symbol}${formatted}` : formatted;
}

/**
 * Format a date based on user preferences
 */
export function formatDate(
  date: Date | string,
  dateFormat: DateFormat = 'MMM DD, YYYY',
  includeTime?: boolean
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const formatString = dateFormatMap[dateFormat] || dateFormatMap['MMM DD, YYYY'];
  
  if (includeTime) {
    return format(dateObj, `${formatString} HH:mm`);
  }
  
  return format(dateObj, formatString);
}

/**
 * Format a date with time based on user preferences
 */
export function formatDateTime(
  date: Date | string,
  dateFormat: DateFormat = 'MMM DD, YYYY'
): string {
  return formatDate(date, dateFormat, true);
}

/**
 * Get source badge configuration with distinct colors for each source type
 */
export function getSourceBadgeConfig(source: string | null): { label: string; className: string } {
  const sourceLabels: Record<string, { label: string; className: string }> = {
    tradingview: { label: 'TradingView', className: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
    trendspider: { label: 'TrendSpider', className: 'bg-purple-500/10 text-purple-500 border-purple-500/30' },
    api: { label: 'API', className: 'bg-amber-500/10 text-amber-500 border-amber-500/30' },
    manual: { label: 'Manual', className: 'bg-green-500/10 text-green-500 border-green-500/30' },
    other: { label: 'Other', className: 'bg-slate-500/10 text-slate-500 border-slate-500/30' },
  };
  
  return sourceLabels[source?.toLowerCase() || ''] || { 
    label: source || 'Unknown', 
    className: 'bg-gray-500/10 text-gray-400 border-gray-500/30' 
  };
}

