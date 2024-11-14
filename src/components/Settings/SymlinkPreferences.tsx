import React from 'react';
import { Link, FileType } from 'lucide-react';

export default function SymlinkPreferences() {
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
        <Link className="h-5 w-5 text-indigo-400" />
        Symlink Preferences
      </h2>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <label className="font-medium text-gray-200">Create for all files</label>
            <p className="text-sm text-gray-400">Create symlinks for all files in library</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
          </label>
        </div>

        <div>
          <label className="font-medium text-gray-200 block mb-2">File Types</label>
          <div className="flex flex-wrap gap-2">
            {['mkv', 'mp4', 'avi', 'srt', 'sub'].map((type) => (
              <div 
                key={type}
                className="flex items-center gap-2 bg-gray-700 px-3 py-2 rounded-lg"
              >
                <FileType className="h-4 w-4 text-indigo-400" />
                <span className="text-sm">.{type}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="font-medium text-gray-200">Preserve folder structure</label>
            <p className="text-sm text-gray-400">Maintain original folder hierarchy</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
          </label>
        </div>
      </div>
    </div>
  );
}