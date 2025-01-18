import { format } from 'date-fns';

export interface LogLine {
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  message: string;
}

export const parseLogLine = (line: string): LogLine | null => {
  // Remove DEBUG level logs entirely
  if (line.includes('[DEBUG]')) return null;

  const regex = /(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})\s+\[(\w+)\]\s+(.+)/;
  const match = line.match(regex);
  
  if (!match) return null;
  
  const [, timestamp, level, message] = match;
  return {
    timestamp,
    level: level as LogLine['level'],
    message: message.trim()
  };
};

export const getLogLevelColor = (level: LogLine['level']): string => {
  switch (level) {
    case 'ERROR':
      return 'text-red-400';
    case 'WARNING':
      return 'text-yellow-400';
    case 'SUCCESS':
      return 'text-green-400';
    default:
      return 'text-gray-400';
  }
};

export const getLogLevelIcon = (level: LogLine['level']): string => {
  switch (level) {
    case 'ERROR':
      return '❌';
    case 'WARNING':
      return '⚠️';
    case 'SUCCESS':
      return '✅';
    default:
      return 'ℹ️';
  }
};

export const formatLogMessage = (message: string): string => {
  // Format file paths
  message = message.replace(/((?:[A-Z]:|\/)[^:]+)/g, '<span class="text-indigo-400">$1</span>');
  
  // Highlight symlinks
  message = message.replace(
    /(Created symlink:)/g,
    '<span class="text-green-400">$1</span>'
  );

  return message;
};