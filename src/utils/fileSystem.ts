import { getEnvironmentValue } from './environment';
import { debug } from './debug';

export interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modifiedAt?: Date;
  symlinkPath?: string;
  error?: string;
}

export const VIDEO_EXTENSIONS = new Set(['.mp4', '.mkv', '.avi', '.mov', '.m4v']);

export const isVideoFile = (filename: string): boolean => {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return VIDEO_EXTENSIONS.has(ext);
};

export const scanDirectory = async (path: string, recursive: boolean = true): Promise<FileInfo[]> => {
  try {
    debug('Scanning directory:', path);
    
    if (!path) {
      throw new Error('No path provided for scanning');
    }

    const queryParams = new URLSearchParams({
      path: path,
      recursive: recursive.toString()
    });
    
    const response = await fetch(`http://localhost:3001/api/files/scan?${queryParams}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to scan directory');
    }
    
    const data = await response.json();
    
    // Filter to only include video files
    const files: FileInfo[] = data
      .filter((file: any) => {
        // Only include files with video extensions
        if (file.type === 'file') {
          const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
          return VIDEO_EXTENSIONS.has(ext);
        }
        return false;
      })
      .map((file: any) => ({
        name: file.name,
        path: file.path,
        type: 'file',
        size: file.size,
        modifiedAt: file.modifiedAt ? new Date(file.modifiedAt) : undefined,
        symlinkPath: file.symlinkPath,
        error: file.error
      }));

    debug('Processed video files:', files.length);
    return files;
  } catch (error) {
    debug('Error scanning directory:', error);
    throw error;
  }
};

export const getDestinationPath = (): string => {
  const path = getEnvironmentValue('DESTINATION_DIR');
  if (!path || typeof path !== 'string') {
    throw new Error('Destination directory not configured');
  }
  return path.replace(/["']/g, '');
};