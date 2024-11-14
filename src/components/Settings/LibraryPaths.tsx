import React from 'react';
import { FolderOpen, Plus, Trash2 } from 'lucide-react';
import type { LibraryPath } from '../../types';

const mockPaths: LibraryPath[] = [
  { id: '1', path: '/media/movies', type: 'movies', active: true },
  { id: '2', path: '/media/tv', type: 'tv', active: true },
  { id: '3', path: '/media/other', type: 'other', active: false }
];

export default function LibraryPaths() {
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-indigo-400" />
          Library Paths
        </h2>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm">
          <Plus className="h-4 w-4" />
          Add Path
        </button>
      </div>

      <div className="space-y-4">
        {mockPaths.map((path) => (
          <div 
            key={path.id}
            className="flex items-center gap-4 bg-gray-700 p-4 rounded-lg"
          >
            <div className="flex-grow">
              <div className="flex items-center gap-2">
                <span className={`
                  px-2 py-1 rounded-full text-xs font-medium
                  ${path.type === 'movies' ? 'bg-blue-200 text-blue-800' : 
                    path.type === 'tv' ? 'bg-green-200 text-green-800' : 
                    'bg-gray-200 text-gray-800'}
                `}>
                  {path.type.toUpperCase()}
                </span>
                <span className={`text-sm ${path.active ? 'text-gray-200' : 'text-gray-400'}`}>
                  {path.path}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                className={`
                  px-3 py-1 rounded text-sm font-medium transition-colors
                  ${path.active ? 
                    'bg-green-600 hover:bg-green-700 text-white' : 
                    'bg-gray-600 hover:bg-gray-700 text-gray-200'}
                `}
              >
                {path.active ? 'Active' : 'Inactive'}
              </button>
              <button className="text-red-400 hover:text-red-300 transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}