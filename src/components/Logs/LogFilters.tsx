import React from 'react';
import { Filter } from 'lucide-react';
import type { LogEntry } from '../../types';

interface Props {
  onFilterChange: (filters: {
    level?: LogEntry['level'];
    source?: LogEntry['source'];
    search?: string;
  }) => void;
}

const LogFilters: React.FC<Props> = ({ onFilterChange }) => {
  const levels: LogEntry['level'][] = ['info', 'warning', 'error', 'success'];
  const sources: LogEntry['source'][] = ['system', 'scan', 'symlink'];

  const getLevelBadgeColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return 'bg-red-500/20 text-red-400 hover:bg-red-500/30';
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30';
      case 'success':
        return 'bg-green-500/20 text-green-400 hover:bg-green-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30';
    }
  };

  const getSourceBadgeColor = (source: LogEntry['source']) => {
    switch (source) {
      case 'system':
        return 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30';
      case 'scan':
        return 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30';
      case 'symlink':
        return 'bg-green-500/20 text-green-400 hover:bg-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30';
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2 text-gray-400 mb-2">
        <Filter className="h-5 w-5" />
        <span className="font-medium">Filters</span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Log Level
          </label>
          <div className="flex flex-wrap gap-2">
            {levels.map((level) => (
              <button
                key={level}
                onClick={() => onFilterChange({ level })}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                  ${getLevelBadgeColor(level)}`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Source
          </label>
          <div className="flex flex-wrap gap-2">
            {sources.map((source) => (
              <button
                key={source}
                onClick={() => onFilterChange({ source })}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                  ${getSourceBadgeColor(source)}`}
              >
                {source.charAt(0).toUpperCase() + source.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Search
          </label>
          <input
            type="text"
            placeholder="Search logs..."
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-200 
                     placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 
                     focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
};

export default LogFilters;