import React from 'react';
import { Github, Heart, Coffee, Star } from 'lucide-react';

export default function About() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">About CineSync</h1>
      </div>

      <div className="grid gap-6">
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Overview</h2>
          <p className="text-gray-300 leading-relaxed">
            CineSync is a powerful media library management tool that helps you organize your movie and TV show collection.
            It creates symbolic links for easy access and playback, while maintaining your original file structure.
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Features</h2>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start gap-2">
              <Star className="h-5 w-5 text-indigo-400 mt-0.5" />
              Automated media library scanning and organization
            </li>
            <li className="flex items-start gap-2">
              <Star className="h-5 w-5 text-indigo-400 mt-0.5" />
              Smart symbolic link creation for optimized storage
            </li>
            <li className="flex items-start gap-2">
              <Star className="h-5 w-5 text-indigo-400 mt-0.5" />
              Real-time progress monitoring and detailed logs
            </li>
            <li className="flex items-start gap-2">
              <Star className="h-5 w-5 text-indigo-400 mt-0.5" />
              Customizable file type support and folder structure
            </li>
          </ul>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Version Information</h2>
          <div className="space-y-2 text-gray-300">
            <p><strong>Version:</strong> 1.0.0</p>
            <p><strong>Last Updated:</strong> March 2024</p>
            <p><strong>License:</strong> MIT</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Support & Contribution</h2>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <a
                href="https://github.com/sureshfizzy/cinesync"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <Github className="h-5 w-5" />
                GitHub Repository
              </a>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                <Heart className="h-5 w-5 text-red-400" />
                Support Project
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                <Coffee className="h-5 w-5 text-yellow-400" />
                Buy me a coffee
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}