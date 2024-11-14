import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, FolderOpen, AlertCircle, Loader2 } from 'lucide-react';
import { searchMedia, getMoviePosterUrl } from '../../utils/tmdb';
import MovieCard from './MovieCard';
import type { FileInfo } from '../../utils/fileSystem';

interface MovieInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  posterUrl?: string;
  rating?: number;
  year?: string;
  addedAt?: Date;
  mediaType?: 'movie' | 'tv';
}

interface Props {
  files: FileInfo[];
  isScanning: boolean;
}

export default function RecentImports({ files, isScanning }: Props) {
  const [movieInfo, setMovieInfo] = useState<MovieInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const processFiles = useCallback(async () => {
    try {
      setLoading(true);
      const enhancedFiles = await Promise.all(
        files.map(async (file) => {
          if (file.type === 'directory') {
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
          }
          return {
            ...file,
            addedAt: file.modifiedAt ? new Date(file.modifiedAt) : new Date()
          };
        })
      );

      // Sort by date added, newest first
      const sortedFiles = enhancedFiles.sort((a, b) => {
        return (b.addedAt?.getTime() || 0) - (a.addedAt?.getTime() || 0);
      });

      setMovieInfo(sortedFiles);
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

  const directories = movieInfo.filter(file => file.type === 'directory');
  const mediaFiles = movieInfo.filter(file => file.type === 'file');

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

      {directories.length > 0 && (
        <>
          <h3 className="text-lg font-medium mb-4 text-gray-300">Media</h3>
          <div className="relative">
            <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory">
              <div className="grid grid-flow-col auto-cols-max gap-4 min-w-full pb-4">
                {directories.map((media) => (
                  <div key={media.path} className="w-48 snap-start">
                    <MovieCard
                      name={media.name}
                      posterUrl={media.posterUrl}
                      rating={media.rating}
                      year={media.year}
                      mediaType={media.mediaType}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-gray-800 to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-gray-800 to-transparent pointer-events-none" />
          </div>
        </>
      )}

      {mediaFiles.length > 0 && (
        <>
          <h3 className="text-lg font-medium mb-4 mt-8 text-gray-300">Other Files</h3>
          <div className="space-y-2">
            {mediaFiles.map((file) => (
              <div 
                key={file.path}
                className="bg-gray-700 p-4 rounded-lg flex items-center gap-4"
              >
                <FolderOpen className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-gray-200">{file.name}</p>
                  <p className="text-sm text-gray-400">File</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {directories.length === 0 && mediaFiles.length === 0 && (
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