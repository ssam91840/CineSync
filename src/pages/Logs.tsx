import React, { useState, useEffect, useCallback, useRef } from 'react';
import LogFilters from '../components/Logs/LogFilters';
import LogEntry from '../components/Logs/LogEntry';
import { FolderOpen, Loader2, AlertCircle, Download, Trash2 } from 'lucide-react';
import type { LogEntry as LogEntryType } from '../types';

export default function Logs() {
  const [logs, setLogs] = useState<LogEntryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    level?: LogEntryType['level'];
    source?: LogEntryType['source'];
    search?: string;
  }>({});

  // Keep track of processed log IDs to prevent duplicates
  const processedLogsRef = useRef<Set<string>>(new Set());
  const uniqueIdCounterRef = useRef(0);

  const generateUniqueId = (baseId: string): string => {
    const uniqueId = `${baseId}-${uniqueIdCounterRef.current}`;
    uniqueIdCounterRef.current += 1;
    return uniqueId;
  };

  const fetchLogs = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/logs');
      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }

      const data = await response.json();
      if (!data.logs) {
        throw new Error('Invalid response format');
      }

      setLogs(prevLogs => {
        const newLogs = data.logs.map((log: LogEntryType) => {
          // Generate a truly unique ID for each log entry
          const uniqueId = generateUniqueId(log.id);
          
          // If we've already processed this log, keep its existing ID
          if (processedLogsRef.current.has(log.id)) {
            return log;
          }
          
          // Mark this log as processed
          processedLogsRef.current.add(log.id);
          
          return {
            ...log,
            id: uniqueId
          };
        });

        // Only update if the logs have actually changed
        if (JSON.stringify(prevLogs) !== JSON.stringify(newLogs)) {
          return newLogs;
        }
        return prevLogs;
      });
    } catch (error) {
      console.error('Error fetching logs:', error);
      setError('Failed to load logs. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    
    // Poll for new logs every 5 seconds
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const filteredLogs = logs.filter(log => {
    if (filters.level && log.level !== filters.level) return false;
    if (filters.source && log.source !== filters.source) return false;
    if (filters.search && !log.message.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const handleExport = () => {
    const exportData = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cinesync-logs-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = async () => {
    if (window.confirm('Are you sure you want to clear all logs?')) {
      setLogs([]);
      processedLogsRef.current.clear();
      uniqueIdCounterRef.current = 0;
      // In a real implementation, you would also clear logs on the server
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">System Logs</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            <p className="text-gray-400">Loading logs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">System Logs</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Logs
          </button>
          <button
            onClick={handleClear}
            className="btn bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clear Logs
          </button>
        </div>
      </div>

      <LogFilters onFilterChange={setFilters} />

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {filteredLogs.length > 0 ? (
        <div className="space-y-4">
          {filteredLogs.map(log => (
            <LogEntry key={log.id} log={log} />
          ))}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <FolderOpen className="h-16 w-16 mb-4" />
            <p className="text-lg font-medium mb-2">No Logs Available</p>
            <p className="text-sm text-center">
              {filters.level || filters.source || filters.search
                ? 'No logs match your current filters. Try adjusting them.'
                : 'Start scanning your media library to see logs here.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}