import React from 'react';
import { Link2, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Symlink {
  source: string;
  destination: string;
  success: boolean;
  timestamp: number;
  group?: string;
}

interface Props {
  symlinks: Symlink[];
}

export default function SymlinkStatus({ symlinks }: Props) {
  const recentSymlinks = symlinks.slice(-5).reverse();
  
  // Group symlinks by their group property
  const groupedSymlinks = recentSymlinks.reduce((acc, symlink) => {
    const group = symlink.group || 'default';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(symlink);
    return acc;
  }, {} as Record<string, Symlink[]>);

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Link2 className="h-5 w-5 text-indigo-400" />
        Symlink Creation
      </h2>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {Object.entries(groupedSymlinks).map(([group, links]) => (
            <motion.div
              key={group}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-2"
            >
              {group !== 'default' && (
                <h3 className="text-sm font-medium text-gray-400">{group}</h3>
              )}
              
              {links.map((symlink) => (
                <div
                  key={`${symlink.source}-${symlink.timestamp}`}
                  className="flex items-start gap-3 bg-gray-700/50 rounded-lg p-3"
                >
                  {symlink.success ? (
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  )}
                  <div className="min-w-0 text-sm">
                    <div className="text-gray-200 truncate">
                      {symlink.destination}
                    </div>
                    <div className="text-gray-400 text-xs truncate">
                      from: {symlink.source}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          ))}
        </AnimatePresence>

        {recentSymlinks.length === 0 && (
          <div className="text-center py-6 text-gray-400">
            No symlinks created yet
          </div>
        )}
      </div>
    </div>
  );
}