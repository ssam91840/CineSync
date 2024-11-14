import React from 'react';
import { BarChart3, FolderOpen } from 'lucide-react';
import type { FileInfo } from '../../utils/fileSystem';

interface Props {
  files: FileInfo[];
  isScanning: boolean;
}

export default function MonthlyStats({ files, isScanning }: Props) {
  const totalFiles = files.length;
  const totalSize = files.reduce((acc, file) => acc + (file.size || 0), 0);
  const formattedSize = formatFileSize(totalSize);
  const directories = files.filter(file => file.type === 'directory').length;
  const mediaFiles = files.filter(file => file.type === 'file').length;

  if (isScanning) {
    return (
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-indigo-400" />
          Monthly Statistics
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-700 rounded-lg p-4 animate-pulse">
              <div className="h-8 bg-gray-600 rounded mb-2"></div>
              <div className="h-4 bg-gray-600 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (totalFiles === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-indigo-400" />
          Monthly Statistics
        </h2>
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <FolderOpen className="h-16 w-16 mb-4" />
          <p className="text-lg font-medium mb-2">No Statistics Available</p>
          <p className="text-sm text-center">
            Start scanning your media library to see statistics here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-indigo-400" />
        Monthly Statistics
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-3xl font-bold text-indigo-400">
            {totalFiles}
          </div>
          <div className="text-sm text-gray-400 mt-1">Total Items</div>
        </div>

        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-3xl font-bold text-indigo-400">
            {formattedSize}
          </div>
          <div className="text-sm text-gray-400 mt-1">Total Size</div>
        </div>

        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-3xl font-bold text-indigo-400">
            {directories}
          </div>
          <div className="text-sm text-gray-400 mt-1">Directories</div>
        </div>

        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-3xl font-bold text-indigo-400">
            {mediaFiles}
          </div>
          <div className="text-sm text-gray-400 mt-1">Media Files</div>
        </div>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}