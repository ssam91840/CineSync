import React from 'react';
import { Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  isProcessing: boolean;
}

export default function ProcessingSummary({ 
  totalProcessed, 
  successCount, 
  errorCount, 
  isProcessing 
}: Props) {
  const successRate = totalProcessed > 0 
    ? Math.round((successCount / totalProcessed) * 100) 
    : 0;

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5 text-indigo-400" />
          Processing Summary
        </h2>
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-2 text-indigo-400"
            >
              <div className="h-2 w-2 bg-indigo-400 rounded-full animate-pulse" />
              <span className="text-sm">Processing</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <motion.div 
          className="bg-gray-700/50 rounded-lg p-4"
          initial={false}
          animate={{ 
            scale: [1, 1.02, 1],
            transition: { duration: 0.3 }
          }}
          key={`total-${totalProcessed}`}
        >
          <div className="text-2xl font-bold text-gray-200">
            {totalProcessed}
          </div>
          <div className="text-sm text-gray-400">Total Processed</div>
        </motion.div>

        <motion.div 
          className="bg-green-500/10 rounded-lg p-4"
          initial={false}
          animate={{ 
            scale: [1, 1.02, 1],
            transition: { duration: 0.3, delay: 0.1 }
          }}
          key={`success-${successCount}`}
        >
          <div className="text-2xl font-bold text-green-400">
            {successCount}
          </div>
          <div className="text-sm text-gray-400">Successful</div>
        </motion.div>

        <motion.div 
          className="bg-red-500/10 rounded-lg p-4"
          initial={false}
          animate={{ 
            scale: [1, 1.02, 1],
            transition: { duration: 0.3, delay: 0.2 }
          }}
          key={`error-${errorCount}`}
        >
          <div className="text-2xl font-bold text-red-400">
            {errorCount}
          </div>
          <div className="text-sm text-gray-400">Failed</div>
        </motion.div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Success Rate</span>
          <span className="text-sm font-medium text-gray-200">{successRate}%</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-green-400"
            initial={{ width: 0 }}
            animate={{ width: `${successRate}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}