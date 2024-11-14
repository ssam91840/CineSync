import React, { useState, useEffect } from 'react';
import RecentImports from '../components/Dashboard/RecentImports';
import ScanStatus from '../components/Dashboard/ScanStatus';
import MonthlyStats from '../components/Dashboard/MonthlyStats';
import { scanDirectory, getDestinationPath, type FileInfo } from '../utils/fileSystem';
import { debug } from '../utils/debug';

const STORAGE_KEY = 'cinesync_scan_data';

interface ScanData {
  files: FileInfo[];
  lastScan: string;
}

export default function Dashboard() {
  const [isScanning, setIsScanning] = useState(false);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<string | null>(null);

  // Load saved scan data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const { files, lastScan } = JSON.parse(savedData) as ScanData;
        setFiles(files);
        setLastScan(lastScan);
        debug('Loaded saved scan data:', { fileCount: files.length, lastScan });
      } catch (error) {
        console.error('Error loading saved scan data:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Save scan data whenever files are updated
  useEffect(() => {
    if (files.length > 0 && lastScan) {
      const scanData: ScanData = {
        files,
        lastScan
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scanData));
      debug('Saved scan data:', { fileCount: files.length, lastScan });
    }
  }, [files, lastScan]);

  const handleStartScan = async () => {
    setIsScanning(true);
    setError(null);
    
    try {
      const path = getDestinationPath();
      debug('Scanning directory:', path);
      const scannedFiles = await scanDirectory(path);
      
      if (scannedFiles.length === 0) {
        debug('No files found in directory');
      } else {
        debug('Found files:', scannedFiles.length);
      }
      
      setFiles(scannedFiles);
      setLastScan(new Date().toISOString());
    } catch (error) {
      console.error('Scan failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to scan directory');
    } finally {
      setIsScanning(false);
    }
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all scan data?')) {
      setFiles([]);
      setLastScan(null);
      localStorage.removeItem(STORAGE_KEY);
      debug('Cleared scan data');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        {files.length > 0 && (
          <button
            onClick={handleClearData}
            className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
          >
            Clear Scan Data
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">
          {error}
        </div>
      )}

      <RecentImports files={files} isScanning={isScanning} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScanStatus 
          isScanning={isScanning}
          onScanStart={handleStartScan}
          onScanComplete={() => setIsScanning(false)}
          lastScan={lastScan}
        />
        <MonthlyStats files={files} isScanning={isScanning} />
      </div>
    </div>
  );
}