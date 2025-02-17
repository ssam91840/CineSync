import express from 'express';
import { writeFile, readFile, readdir, stat } from 'fs/promises';
import { join, resolve } from 'path';
import cors from 'cors';
import { spawn } from 'child_process';
import type { LogEntry } from '../src/types';
import { exec } from 'child_process';
import { promisify } from 'util';

const app = express();
const PORT = 3001;
const HOST = '0.0.0.0';
const execAsync = promisify(exec);

app.use(cors());
app.use(express.json());

// Add state for storing the final path
let currentFinalPath: string | null = null;

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

// Update the scan endpoint to only resolve paths
app.post('/api/scan/start', async (req, res) => {
  const { sourcePath } = req.body;

  try {
    // Resolve the symlink using readlink
    const command = `"C:\\Program Files\\Git\\bin\\bash.exe" -c 'readlink "${sourcePath.replace(/\\/g, '/')}"'`;
    const { stdout } = await execAsync(command);
    const resolvedPath = stdout.trim().replace(/^\/c\//, 'C:/').replace(/\//g, '\\');
    const finalPath = resolvedPath || sourcePath;

    currentFinalPath = finalPath;
    console.log("Stored Final Path:", currentFinalPath);

    // Set headers for SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    // Send the resolved path
    res.write(`data: Path resolved: ${finalPath}\n\n`);
    res.end();

  } catch (error) {
    console.error('Error resolving path:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to resolve path' 
    });
  }
});

app.post('/api/scan/select', async (req, res) => {
  const { selection } = req.body;
  
  console.log('Received selection:', selection);
  console.log('Using Final Path:', currentFinalPath);
  // First check if we have an active scan process
  if (!scanProcess || scanProcess.exitCode !== null) {
    // If no scan process or it has exited, start a new one
    try {
      // Initialize new scan process here
      scanProcess = spawn('C:\\Program Files\\Git\\bin\\bash.exe', [
        '-c',
        `python MediaHub/main.py "${currentFinalPath}" --force --disable-monitor`
      ]);
      
      // Wait a short time for the process to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addLog({
        level: 'info',
        message: 'Restarted scan process',
        source: 'scan'
      });
    } catch (error) {
      const errorMessage = 'Failed to restart scan process';
      addLog({
        level: 'error',
        message: errorMessage,
        source: 'scan'
      });
      return res.status(500).json({ 
        success: false, 
        error: errorMessage 
      });
    }
  }

  try {
    addLog({
      level: 'info',
      message: `Processing selection: ${selection}`,
      source: 'scan'
    });

    // Write the selection to stdin
    scanProcess.stdin.write(`${selection}\n`);
    
    // Create a Promise to handle the complete output
    const outputPromise = new Promise((resolve, reject) => {
      let output = '';
      let error = '';
      let timeoutId: NodeJS.Timeout;
      
      const dataHandler = (data: Buffer) => {
        const text = data.toString();
        console.log('Received output:', text);
        output += text;
        
        // Reset timeout on new data
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          cleanup();
          reject(new Error('Response timeout'));
        }, 30000); // 30 second timeout
        
        // If we see the completion indicators, resolve
        if (text.includes('Created symlink:') || 
            text.includes('Processed file:') || 
            text.includes('Updated existing symlink:')) {
          clearTimeout(timeoutId);
          cleanup();
          resolve(output);
        }
      };

      const errorHandler = (data: Buffer) => {
        const text = data.toString();
        console.error('Error output:', text);
        error += text;
        
        if (text.includes('ERROR')) {
          clearTimeout(timeoutId);
          cleanup();
          reject(new Error(text));
        }
      };

      const exitHandler = (code: number) => {
        clearTimeout(timeoutId);
        cleanup();
        if (code !== 0) {
          reject(new Error(`Process exited with code ${code}`));
        } else if (output.trim()) {
          resolve(output);
        } else {
          reject(new Error('Process exited without output'));
        }
      };

      const cleanup = () => {
        scanProcess.stdout.removeListener('data', dataHandler);
        scanProcess.stderr.removeListener('data', errorHandler);
        scanProcess.removeListener('exit', exitHandler);
      };

      // Set up event listeners
      scanProcess.stdout.on('data', dataHandler);
      scanProcess.stderr.on('data', errorHandler);
      scanProcess.once('exit', exitHandler);
      
      // Initial timeout
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('Response timeout'));
      }, 30000); // 30 second timeout
    });

    // Wait for the complete output
    const output = await outputPromise;
    
    addLog({
      level: 'success',
      message: 'Selection processed successfully',
      source: 'scan',
      details: output
    });

    console.log('Selection process completed with output:', output);
    
    res.json({ 
      success: true,
      output 
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    addLog({
      level: 'error',
      message: 'Selection processing failed',
      source: 'scan',
      details: errorMessage
    });

    console.error('Selection error:', error);
    res.status(500).json({ 
      success: false,
      error: errorMessage
    });
  }
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

app.get('/api/files/readlink', async (req, res) => {
  try {
    const { path } = req.query;

    if (!path || typeof path !== 'string') {
      return res.status(400).json({ error: 'Path parameter is required' });
    }

    const command = `"C:\\Program Files\\Git\\bin\\bash.exe" -c 'readlink "${path.replace(/\\/g, '/')}"'`;

    const { stdout } = await execAsync(command);
    const sourcePath = stdout.trim().replace(/^\/c\//, 'C:/').replace(/\//g, '\\');

    res.json({ sourcePath });
  } catch (error) {
    console.error('Error executing readlink:', error);
    res.status(500).json({ 
      error: 'Failed to resolve symlink',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
