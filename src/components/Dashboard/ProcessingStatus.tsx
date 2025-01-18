import React from 'react';
import { File, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProcessedFile {
  filename: string;
  status: 'processing' | 'complete';
  timestamp: number;
}

interface Props {
  files: ProcessedFile[];
}

export default function ProcessingStatus({ files }: Props) {
  const recentFiles = files.slice(-5).reverse();

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <File className="h-5 w-5 text-indigo-400" />
        File Processing
      </h2>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {recentFiles.map((file) => (
            <motion.div
              key={`${file.filename}-${file.timestamp}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-3 bg-gray-700/50 rounded-lg p-3"
            >
              {file.status === 'processing' ? (
                <div className="h-2 w-2 bg-indigo-400 rounded-full animate-pulse" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-400" />
              )}
              <span className="text-sm text-gray-200 truncate">
                {file.filename}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {recentFiles.length === 0 && (
          <div className="text-center py-6 text-gray-400">
            No files processed yet
          </div>
        )}
      </div>
    </div>
  );
}