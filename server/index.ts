import express from 'express';
import { writeFile, readFile, readdir, stat } from 'fs/promises';
import { join, resolve } from 'path';
import cors from 'cors';
import type { LogEntry } from '../src/types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// In-memory log storage (in production, use a proper database)
let logs: LogEntry[] = [];

// Add a log entry
const addLog = (log: Omit<LogEntry, 'id' | 'timestamp'>) => {
  const newLog: LogEntry = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    ...log
  };
  logs.unshift(newLog); // Add to beginning of array
  // Keep only last 1000 logs
  if (logs.length > 1000) {
    logs = logs.slice(0, 1000);
  }
  return newLog;
};

// Initialize with system startup log
addLog({
  level: 'info',
  message: 'Media library service started',
  source: 'system'
});

// Endpoint to get logs
app.get('/api/logs', async (req, res) => {
  try {
    res.json({ logs });
  } catch (error) {
    console.error('Error retrieving logs:', error);
    res.status(500).json({ error: 'Failed to retrieve logs' });
  }
});

// Endpoint to add a log
app.post('/api/logs', async (req, res) => {
  try {
    const { level, message, source, details } = req.body;
    const newLog = addLog({ level, message, source, details });
    res.json({ success: true, log: newLog });
  } catch (error) {
    console.error('Error adding log:', error);
    res.status(500).json({ error: 'Failed to add log' });
  }
});

// Endpoint to scan directory
app.get('/api/files/scan', async (req, res) => {
  try {
    const { path } = req.query;
    if (!path || typeof path !== 'string') {
      addLog({
        level: 'error',
        message: 'Invalid path parameter for scanning',
        source: 'scan'
      });
      return res.status(400).json({ error: 'Path parameter is required' });
    }

    const resolvedPath = resolve(path);
    const files = await readdir(resolvedPath);
    
    addLog({
      level: 'info',
      message: `Starting scan of directory: ${resolvedPath}`,
      source: 'scan'
    });
    
    const fileInfos = await Promise.all(
      files.map(async (file) => {
        const fullPath = join(resolvedPath, file);
        const stats = await stat(fullPath);
        
        return {
          name: file,
          path: fullPath,
          type: stats.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          modifiedAt: stats.mtime
        };
      })
    );

    addLog({
      level: 'success',
      message: `Completed scan of ${fileInfos.length} items in ${resolvedPath}`,
      source: 'scan'
    });

    res.json(fileInfos);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    addLog({
      level: 'error',
      message: `Error scanning directory: ${errorMessage}`,
      source: 'scan'
    });
    console.error('Error scanning directory:', error);
    res.status(500).json({ error: 'Failed to scan directory' });
  }
});

// Environment settings endpoints
app.get('/api/settings/environment', async (req, res) => {
  try {
    const envPath = join(process.cwd(), '.env');
    const envContent = await readFile(envPath, 'utf-8');
    
    const settings = envContent
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('#'))
      .reduce((acc, line) => {
        const [key, value] = line.split('=');
        if (key && value) {
          acc[key.trim()] = value.trim();
        }
        return acc;
      }, {} as Record<string, string>);
    
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error reading environment settings:', error);
    res.status(500).json({ success: false, error: 'Failed to read environment settings' });
  }
});

app.post('/api/settings/environment', async (req, res) => {
  try {
    const { settings } = req.body;
    const envPath = join(process.cwd(), '.env');
    
    let envContent = await readFile(envPath, 'utf-8');
    
    settings.forEach(({ key, value }: { key: string; value: string | number | boolean }) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      const newLine = `${key}=${value}`;
      
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, newLine);
      } else {
        envContent += `\n${newLine}`;
      }
    });
    
    await writeFile(envPath, envContent.trim() + '\n');
    
    addLog({
      level: 'success',
      message: 'Environment settings updated successfully',
      source: 'system'
    });
    
    res.json({ success: true, message: 'Environment settings updated successfully' });
  } catch (error) {
    addLog({
      level: 'error',
      message: 'Failed to update environment settings',
      source: 'system',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
    console.error('Error updating environment settings:', error);
    res.status(500).json({ success: false, error: 'Failed to update environment settings' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});