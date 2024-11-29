import React from 'react';
import { Loader2 } from 'lucide-react';

interface Props {
  progress: number;
  status: string;
}

const ScanProgress: React.FC<Props> = ({ progress, status }) => {
  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
          <span className="text-sm font-medium text-indigo-400">{status}</span>
        </div>
        <span className="text-sm text-gray-400">{progress}%</span>
      </div>
      
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-indigo-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default ScanProgress;