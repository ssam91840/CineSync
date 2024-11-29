import React, { useEffect, useState } from 'react';
import { Loader2, HardDrive, AlertCircle, Clock } from 'lucide-react';
import type { ScanStatus as ScanStatusType } from '../../types';
import { getEnvironmentValue } from '../../utils/environment';
import ScanProgress from './ScanProgress';
import ScanOutput from './ScanOutput';

interface Props {
  onScanComplete?: () => void;
  isScanning: boolean;
  onScanStart: () => Promise<void>;
  lastScan: string | null;
}

export default function ScanStatus({ onScanComplete, isScanning, onScanStart, lastScan }: Props) {
  const [status, setStatus] = useState<ScanStatusType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const checkStatus = async () => {
      const destinationDir = getEnvironmentValue('DESTINATION_DIR');
      if (!destinationDir) {
        setError('Destination directory not configured');
        return;
      }

      if (isScanning) {
        // Simulate progress updates
        const interval = setInterval(() => {
          setProgress(prev => {
            const next = prev + Math.random() * 5;
            return next > 100 ? 100 : next;
          });
        }, 500);

        return () => clearInterval(interval);
      } else {
        setProgress(0);
      }
    };

    checkStatus();
  }, [isScanning]);

  const handleScanClick = async () => {
    setError(null);
    setLogs([]);
    setProgress(0);
    
    try {
      // Start the Python script
      const response = await fetch('http://localhost:3001/api/scan/start', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to start scan');
      }

      // Set up SSE connection for real-time logs
      const eventSource = new EventSource('http://localhost:3001/api/scan/logs');
      
      eventSource.onmessage = (event) => {
        const log = event.data;
        setLogs((prevLogs) => [...prevLogs, log]);
      };

      eventSource.onerror = () => {
        eventSource.close();
      };

      await onScanStart();
    } catch (error) {
      console.error('Scan failed:', error);
      setError('Failed to start scan');
    }
  };

  const formatLastScan = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  if (error) {
    return (
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-2 text-red-400 mb-4">
          <AlertCircle className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Scan Status</h2>
        </div>
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

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

        {/* Log Output Box */}
        {(logs.length > 0 || isScanning) && (
          <ScanOutput logs={logs} />
        )}
      </div>
    </div>
  );
}