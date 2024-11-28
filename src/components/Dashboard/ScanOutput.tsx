import React from 'react';
import { CheckCircle } from 'lucide-react';

interface Props {
  logs: string[];
}

export default function ScanOutput({ logs }: Props) {
  return (
    <div className="mt-4 bg-gray-900 rounded-lg p-4 h-48 overflow-y-auto font-mono text-sm">
      <div className="space-y-1">
        {logs.map((log, index) => {
          const isSymlinkLog = log.includes('Created symlink:');
          return (
            <div 
              key={index}
              className={`flex items-start gap-2 ${isSymlinkLog ? 'text-green-400' : 'text-gray-400'}`}
            >
              {isSymlinkLog && <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
              <span className="whitespace-pre-wrap break-all">
                {log}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}