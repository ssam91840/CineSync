import React, { useEffect, useState } from 'react';
import { Loader2, HardDrive, AlertCircle, Clock } from 'lucide-react';
import type { ScanStatus as ScanStatusType } from '../../types';
import { getEnvironmentValue } from '../../utils/environment';
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

  useEffect(() => {
    const checkStatus = async () => {
      const destinationDir = getEnvironmentValue('DESTINATION_DIR');
      if (!destinationDir) {
        setError('Destination directory not configured');
        return;
      }

      setStatus({
        isScanning,
        progress: isScanning ? Math.floor(Math.random() * 30) + 70 : 0,
        currentFile: isScanning ? "Processing media files..." : undefined,
        startedAt: isScanning ? new Date().toISOString() : undefined,
        scanPath: destinationDir as string
      });

      if (!isScanning && onScanComplete) {
        onScanComplete();
      }
    };

    checkStatus();
  }, [isScanning, onScanComplete]);

  const handleScanClick = async () => {
    setError(null);
    setLogs([]);
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

  if (!status) {
    return (
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin">
            <Loader2 className="h-8 w-8 text-indigo-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-indigo-400" />
          Scan Status
        </h2>
        {status.isScanning && (
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
            <span className="text-sm text-indigo-400">Scanning...</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full
                ${status.isScanning ? 'bg-indigo-200 text-indigo-900' : 'bg-gray-700 text-gray-300'}`}>
                {status.isScanning ? 'Scanning...' : 'Ready'}
              </span>
            </div>
            {status.isScanning && (
              <div className="text-xs text-indigo-400">
                {status.progress}%
              </div>
            )}
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-700">
            <div 
              style={{ width: `${status.progress}%` }}
              className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center
                ${status.isScanning ? 'bg-indigo-500' : 'bg-gray-600'} 
                transition-all duration-300`}
            />
          </div>
        </div>

        <div className="text-sm text-gray-300">
          <p className="font-medium">Scan Directory:</p>
          <p className="font-mono bg-gray-900 p-2 rounded mt-1 break-all">
            {status.scanPath}
          </p>
        </div>

        {lastScan && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="h-4 w-4" />
            <span>Last scan: {formatLastScan(lastScan)}</span>
          </div>
        )}

        {status.isScanning && status.currentFile && (
          <div className="text-sm text-gray-300 animate-pulse">
            <p className="font-medium">Current Operation:</p>
            <p className="font-mono bg-gray-900 p-2 rounded mt-1">
              {status.currentFile}
            </p>
          </div>
        )}

        {!status.isScanning && (
          <button
            onClick={handleScanClick}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors
              flex items-center justify-center gap-2 mt-4"
          >
            <HardDrive className="h-5 w-5" />
            Start New Scan
          </button>
        )}

        {/* Log Output Box */}
        {(logs.length > 0 || status.isScanning) && (
          <ScanOutput logs={logs} />
        )}
      </div>
    </div>
  );
}