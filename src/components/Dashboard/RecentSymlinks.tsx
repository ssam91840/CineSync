import React from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  symlinks: string[];
}

export default function RecentSymlinks({ symlinks }: Props) {
  const recentSymlinks = symlinks.slice(-5);

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {recentSymlinks.map((symlink, index) => (
          <motion.div
            key={symlink}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 bg-green-500/10 text-green-400 px-3 py-2 rounded-lg
              border border-green-500/20"
          >
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <div className="flex items-center gap-1 text-sm truncate">
              <span className="font-medium">Created symlink</span>
              <ArrowRight className="h-3 w-3" />
              <span className="truncate opacity-80">{symlink}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}