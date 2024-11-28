import { getEnvironmentValue } from './environment';
import { debug } from './debug';

export interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modifiedAt?: Date;
}

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
    debug('Scan response:', data);
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid response format from scan endpoint');
    }
    
    // Transform the data to match FileInfo interface
    const files: FileInfo[] = data.map(file => ({
      name: file.name,
      path: file.path,
      type: file.type,
      size: file.size,
      modifiedAt: file.modifiedAt ? new Date(file.modifiedAt) : undefined
    }));

    debug('Processed files:', files.length);
    return files;
  } catch (error) {
    debug('Error scanning directory:', error);
    throw error; // Re-throw to handle in component
  }
};

export const getDestinationPath = (): string => {
  const path = getEnvironmentValue('DESTINATION_DIR');
  if (!path || typeof path !== 'string') {
    throw new Error('Destination directory not configured');
  }
  return path.replace(/["']/g, '');
};