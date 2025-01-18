import React, { useEffect, useState, useRef } from 'react';
import { Loader2, HardDrive, AlertCircle, Clock } from 'lucide-react';
import LogOutput from './LogOutput';
import ScanProgress from './ScanProgress';
import type { ScanStatus as ScanStatusType } from '../../types';

interface Props {
  onScanComplete?: () => void;
  isScanning: boolean;
  onScanStart: () => Promise<void>;
  lastScan: string | null;
}

export default function ScanStatus({ onScanComplete, isScanning, onScanStart, lastScan }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  const cleanupEventSource = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  useEffect(() => {
    return () => cleanupEventSource();
  }, []);

  const handleScanClick = async () => {
    setError(null);
    setLogs([]);
    setProgress(0);
    
    try {
      cleanupEventSource();

      const response = await fetch('http://localhost:3001/api/scan/start', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to start scan');
      }

      eventSourceRef.current = new EventSource('http://localhost:3001/api/scan/logs');
      
      eventSourceRef.current.onmessage = (event) => {
        setLogs((prevLogs) => [...prevLogs, event.data]);
      };

      eventSourceRef.current.onerror = () => {
        cleanupEventSource();
      };

      await onScanStart();
    } catch (error) {
      console.error('Scan failed:', error);
      setError('Failed to start scan');
      cleanupEventSource();
    }
  };

  const formatLastScan = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-indigo-400" />
          Scan Status
        </h2>
        {isScanning && (
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
            <span className="text-sm text-indigo-400">Scanning...</span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {isScanning ? (
          <ScanProgress 
            progress={Math.floor(progress)} 
            status="Processing media files..."
          />
        ) : (
          <button
            onClick={handleScanClick}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors
              flex items-center justify-center gap-2"
          >
            <HardDrive className="h-5 w-5" />
            Start New Scan
          </button>
        )}

        {lastScan && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="h-4 w-4" />
            <span>Last scan: {formatLastScan(lastScan)}</span>
          </div>
        )}

        {(logs.length > 0 || isScanning) && (
          <LogOutput 
            logs={logs}
            maxHeight="300px"
            className="mt-4"
          />
        )}
      </div>
    </div>
  );
}