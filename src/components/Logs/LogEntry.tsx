import React from 'react';
import { AlertCircle, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import type { LogEntry as LogEntryType } from '../../types';

interface Props {
  log: LogEntryType;
}

const LogEntry: React.FC<Props> = ({ log }) => {
  if (!log) return null;

  const getIcon = () => {
    switch (log.level) {
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      default:
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getBgColor = () => {
    switch (log.level) {
      case 'error':
        return 'bg-red-500/10 border-red-500/20';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20';
      case 'success':
        return 'bg-green-500/10 border-green-500/20';
      default:
        return 'bg-blue-500/10 border-blue-500/20';
    }
  };

  const getSourceBadgeColor = () => {
    switch (log.source) {
      case 'system':
        return 'bg-purple-500/20 text-purple-400';
      case 'scan':
        return 'bg-blue-500/20 text-blue-400';
      case 'symlink':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className={`rounded-lg p-4 border ${getBgColor()}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getIcon()}</div>
        <div className="flex-grow">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${getSourceBadgeColor()}`}>
              {log.source}
            </span>
            <span className="text-sm text-gray-400">
              {new Date(log.timestamp).toLocaleString()}
            </span>
          </div>
          <p className="text-gray-200">{log.message}</p>
          {log.details && (
            <pre className="mt-2 text-sm bg-black/50 p-2 rounded overflow-x-auto">
              <code className="text-gray-400">{log.details}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogEntry;