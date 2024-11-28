import express from 'express';
import { writeFile, readFile, readdir, stat } from 'fs/promises';
import { join, resolve } from 'path';
import cors from 'cors';
import { spawn } from 'child_process';
import type { LogEntry } from '../src/types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// In-memory log storage
let logs: LogEntry[] = [];
let scanProcess: ReturnType<typeof spawn> | null = null;

// Add a log entry
const addLog = (log: Omit<LogEntry, 'id' | 'timestamp'>) => {
  const newLog: LogEntry = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    ...log
  };
  logs.unshift(newLog);
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

// Endpoint to start the Python scan
app.post('/api/scan/start', (req, res) => {
  if (scanProcess) {
    return res.status(400).json({ error: 'Scan already in progress' });
  }

  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // Start the Python script
  scanProcess = spawn('python', ['MediaHub/main.py', '--auto-select']);

  scanProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        res.write(`data: ${JSON.stringify(line)}\n\n`);
      }
    });
  });

  scanProcess.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        res.write(`data: ${JSON.stringify(`Error: ${line}`)}\n\n`);
      }
    });
  });

  scanProcess.on('close', (code) => {
    res.write(`data: ${JSON.stringify(`Process exited with code ${code}`)}\n\n`);
    scanProcess = null;
    res.end();
  });
});

// SSE endpoint for scan logs
app.get('/api/scan/logs', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  if (!scanProcess) {
    res.write('data: No scan in progress\n\n');
    return res.end();
  }

  scanProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        res.write(`data: ${JSON.stringify(line)}\n\n`);
      }
    });
  });

  scanProcess.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        res.write(`data: ${JSON.stringify(`Error: ${line}`)}\n\n`);
      }
    });
  });

  scanProcess.on('close', () => {
    res.write('data: Scan completed\n\n');
    res.end();
  });
});

// Rest of the existing endpoints...
app.get('/api/logs', async (req, res) => {
  try {
    res.json({ logs });
  } catch (error) {
    console.error('Error retrieving logs:', error);
    res.status(500).json({ error: 'Failed to retrieve logs' });
  }
});

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

app.get('/api/files/scan', async (req, res) => {
  try {
    const { path, recursive } = req.query;
    if (!path || typeof path !== 'string') {
      addLog({
        level: 'error',
        message: 'Invalid path parameter for scanning',
        source: 'scan'
      });
      return res.status(400).json({ error: 'Path parameter is required' });
    }

    const resolvedPath = resolve(path);
    const fileInfos: any[] = [];

    // Recursive function to scan directories
    const scanDirectory = async (dirPath: string) => {
      const entries = await readdir(dirPath);
      
      for (const entry of entries) {
        const fullPath = join(dirPath, entry);
        const stats = await stat(fullPath);
        
        fileInfos.push({
          name: entry,
          path: fullPath,
          type: stats.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          modifiedAt: stats.mtime
        });

        // If it's a directory and recursive scanning is enabled, scan it
        if (stats.isDirectory() && recursive !== 'false') {
          await scanDirectory(fullPath);
        }
      }
    };

    addLog({
      level: 'info',
      message: `Starting scan of directory: ${resolvedPath}`,
      source: 'scan'
    });

    await scanDirectory(resolvedPath);

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});