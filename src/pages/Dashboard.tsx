import React, { useState, useEffect, useCallback } from 'react';
import RecentImports from '../components/Dashboard/RecentImports';
import ScanStatus from '../components/Dashboard/ScanStatus';
import ProcessingStatus from '../components/Dashboard/ProcessingStatus';
import SymlinkStatus from '../components/Dashboard/SymlinkStatus';
import ProcessingSummary from '../components/Dashboard/ProcessingSummary';
import { scanDirectory, getDestinationPath, isVideoFile, type FileInfo } from '../utils/fileSystem';
import { debug } from '../utils/debug';
import { AnimatePresence, motion } from 'framer-motion';

const STORAGE_KEY = 'cinesync_scan_data';

interface ScanData {
  files: FileInfo[];
  lastScan: string;
  processingSummary: {
    totalProcessed: number;
    successCount: number;
    errorCount: number;
  };
}

export default function Dashboard() {
  const [isScanning, setIsScanning] = useState(false);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [processingSummary, setProcessingSummary] = useState({
    totalProcessed: 0,
    successCount: 0,
    errorCount: 0
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const updateProcessingSummary = useCallback((allFiles: FileInfo[]) => {
    // Only count actual video files
    const videoFiles = allFiles.filter(f => f.type === 'file' && isVideoFile(f.name));
    
    setProcessingSummary({
      totalProcessed: videoFiles.length,
      successCount: videoFiles.filter(f => !f.error).length,
      errorCount: videoFiles.filter(f => f.error).length
    });
  }, []);

  const updateFiles = useCallback((newFiles: FileInfo[]) => {
    setFiles(prevFiles => {
      // Create maps for faster lookups
      const prevFileMap = new Map(prevFiles.map(f => [f.path, f]));
      const newFileMap = new Map(newFiles.map(f => [f.path, f]));
  
      // Only keep files that actually exist in the new scan
      const updatedFiles = newFiles.filter(file => {
        const prevFile = prevFileMap.get(file.path);
        // Keep the file if it's new or if it has been modified
        return !prevFile || prevFile.modifiedAt !== file.modifiedAt;
      });
  
      // Update processing summary with the actual file count
      updateProcessingSummary(newFiles); // Pass newFiles instead of updatedFiles to get accurate count
  
      return newFiles; // Return the complete new file list instead of merging
    });
  
    setLastScan(new Date().toISOString());
  }, [updateProcessingSummary]);
  
  const performScan = useCallback(async (isManualScan = false) => {
    if (isManualScan) {
      setIsScanning(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const path = getDestinationPath();
      debug('Scanning directory:', path);
      const scannedFiles = await scanDirectory(path);
      updateFiles(scannedFiles);
    } catch (error) {
      console.error('Scan failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to scan directory');
    } finally {
      if (isManualScan) {
        setIsScanning(false);
      }
      setIsRefreshing(false);
    }
  }, [updateFiles]);

  // Load saved scan data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const { files, lastScan, processingSummary: savedSummary } = JSON.parse(savedData) as ScanData;
        setFiles(files);
        setLastScan(lastScan);
        setProcessingSummary(savedSummary);
        debug('Loaded saved scan data:', { fileCount: files.length, lastScan, processingSummary: savedSummary });
      } catch (error) {
        console.error('Error loading saved scan data:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Set up polling based on SLEEP_TIME
  useEffect(() => {
    const fetchSleepTime = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/settings/environment');
        const data = await response.json();
        return parseInt(data.settings.SLEEP_TIME) * 1000 || 10000;
      } catch (error) {
        console.error('Error fetching sleep time:', error);
        return 10000;
      }
    };

    const setupPolling = async () => {
      const sleepTime = await fetchSleepTime();
      const interval = setInterval(() => performScan(false), sleepTime);
      return () => clearInterval(interval);
    };

    setupPolling();
  }, [performScan]);

  // Save scan data whenever files or processing summary are updated
  useEffect(() => {
    if (files.length > 0 && lastScan) {
      const scanData: ScanData = { 
        files, 
        lastScan,
        processingSummary 
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scanData));
      debug('Saved scan data:', scanData);
    }
  }, [files, lastScan, processingSummary]);

  const handleStartScan = () => performScan(true);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <RecentImports 
        files={files} 
        isScanning={isScanning} 
        isRefreshing={isRefreshing}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProcessingSummary 
          {...processingSummary}
          isProcessing={isScanning || isRefreshing}
        />
        <ScanStatus 
          isScanning={isScanning}
          onScanStart={handleStartScan}
          onScanComplete={() => setIsScanning(false)}
          lastScan={lastScan}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProcessingStatus 
          files={files.map(f => ({
            filename: f.name,
            status: f.error ? 'processing' : 'complete',
            timestamp: f.modifiedAt ? new Date(f.modifiedAt).getTime() : Date.now()
          }))}
        />
        <SymlinkStatus 
          symlinks={files.map(f => ({
            source: f.path,
            destination: f.symlinkPath || f.path,
            success: !f.error,
            timestamp: f.modifiedAt ? new Date(f.modifiedAt).getTime() : Date.now(),
            group: f.type
          }))}
        />
      </div>
    </div>
  );
}