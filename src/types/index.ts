export interface RecentImport {
  title: string;
  year: string;
  posterUrl: string;
  importedAt: string;
  type: 'movie' | 'tv';
}

export interface ScanStatus {
  isScanning: boolean;
  progress: number;
  currentFile?: string;
  startedAt?: string;
  scanPath: string;
}

export interface MonthlyStats {
  scannedFiles: number;
  totalSize: string;
  newAdditions: number;
  lastScanDate: string;
}

export interface LibraryPath {
  id: string;
  path: string;
  type: 'movies' | 'tv' | 'other';
  active: boolean;
}

export interface Settings {
  libraryPaths: LibraryPath[];
  symlinkPreferences: {
    createForAllFiles: boolean;
    fileTypes: string[];
    preserveStructure: boolean;
  };
  notifications: {
    onScanComplete: boolean;
    onError: boolean;
    onNewImport: boolean;
    desktopNotifications: boolean;
  };
  theme: 'dark' | 'light';
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details?: string;
  source: 'system' | 'scan' | 'symlink';
}