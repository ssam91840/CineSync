import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, FolderOpen, AlertCircle, Loader2 } from 'lucide-react';
import { searchMedia, getMoviePosterUrl } from '../../utils/tmdb';
import PosterGrid from './PosterGrid';
import type { FileInfo } from '../../utils/fileSystem';
import type { MovieInfo } from '../../types';

interface Props {
  files: FileInfo[];
  isScanning: boolean;
}

const MEDIA_EXTENSIONS = new Set(['.mp4', '.mkv', '.avi', '.mov', '.m4v']);

const isMediaFile = (filename: string): boolean => {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return MEDIA_EXTENSIONS.has(ext);
};

const getParentFolderName = (path: string): string => {
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 2] || '';
};

export default function RecentImports({ files, isScanning }: Props) {
  const [movieInfo, setMovieInfo] = useState<MovieInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const processFiles = useCallback(async () => {
    try {
      setLoading(true);
      setMovieInfo([]); // Clear existing movies for smooth transition

      const mediaFiles = files.filter(file => file.type === 'file' && isMediaFile(file.name));
      const mediaParentFolders = new Map<string, FileInfo>();
      
      mediaFiles.forEach(file => {
        const parentFolder = getParentFolderName(file.path);
        if (parentFolder && !mediaParentFolders.has(parentFolder)) {
          mediaParentFolders.set(parentFolder, {
            ...file,
            name: parentFolder,
            type: 'directory'
          });
        }
      });

      const enhancedFiles = await Promise.all(
        Array.from(mediaParentFolders.values()).map(async (file) => {
          const mediaInfo = await searchMedia(file.name);
          if (mediaInfo) {
            return {
              ...file,
              posterUrl: getMoviePosterUrl(mediaInfo.poster_path),
              rating: mediaInfo.vote_average,
              year: (mediaInfo.release_date || mediaInfo.first_air_date)?.split('-')[0],
              mediaType: mediaInfo.media_type as 'movie' | 'tv',
              addedAt: file.modifiedAt ? new Date(file.modifiedAt) : new Date()
            };
          }
          return null;
        })
      );

      const validEntries = enhancedFiles
        .filter((entry): entry is MovieInfo => entry !== null)
        .sort((a, b) => (b.addedAt?.getTime() || 0) - (a.addedAt?.getTime() || 0));

      setMovieInfo(validEntries);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process files');
    } finally {
      setLoading(false);
    }
  }, [files]);

  useEffect(() => {
    processFiles();
  }, [processFiles]);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-400" />
          Media Library
        </h2>
        <div className="overflow-x-auto scrollbar-hide">
          <div className="grid grid-flow-col auto-cols-max gap-4 min-w-full pb-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse w-48">
                <div className="aspect-[2/3] bg-gray-700 rounded-lg mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-400" />
          Error Loading Library
        </h2>
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-indigo-400" />
        Media Library
        {isScanning && (
          <span className="ml-2 text-sm text-indigo-400 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Updating...
          </span>
        )}
      </h2>

      {movieInfo.length > 0 ? (
        <div className="relative">
          <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory">
            <PosterGrid movies={movieInfo} />
          </div>
          <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-gray-800 to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-gray-800 to-transparent pointer-events-none" />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <FolderOpen className="h-16 w-16 mb-4" />
          <p className="text-lg font-medium mb-2">No Media Found</p>
          <p className="text-sm text-center">
            Start scanning your media library to see content here.
          </p>
        </div>
      )}
    </div>
  );
}