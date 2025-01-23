import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Calendar, FolderOpen, AlertCircle, Loader2 } from 'lucide-react';
import { searchMedia, getMoviePosterUrl } from '../../utils/tmdb';
import PosterGrid from './PosterGrid';
import MovieDetailsModal from '../MovieDetails/MovieDetailsModal';
import type { FileInfo } from '../../utils/fileSystem';
import type { MovieInfo } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  files: FileInfo[];
  isScanning: boolean;
  isRefreshing: boolean;
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

export default function RecentImports({ files, isScanning, isRefreshing }: Props) {
  const [movieInfo, setMovieInfo] = useState<MovieInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const processedFoldersRef = useRef<Map<string, MovieInfo>>(new Map());
  const [selectedMovie, setSelectedMovie] = useState<{
    id: number;
    fileInfo: {
      sourcePath: string;
      destinationPath: string;
    };
  } | null>(null);

  const processFiles = useCallback(async (filesToProcess: FileInfo[]) => {
    try {
      const mediaFiles = filesToProcess
        .filter(file => file.type === 'file' && isMediaFile(file.name))
        .sort((a, b) => {
          const dateA = a.modifiedAt ? new Date(a.modifiedAt).getTime() : 0;
          const dateB = b.modifiedAt ? new Date(b.modifiedAt).getTime() : 0;
          return dateB - dateA;
        });

      const folderGroups = new Map<string, FileInfo>();

      mediaFiles.forEach(file => {
        const parentFolder = getParentFolderName(file.path);
        if (parentFolder && !folderGroups.has(parentFolder)) {
          folderGroups.set(parentFolder, {
            ...file,
            name: parentFolder,
            type: 'directory'
          });
        }
      });

      const newMovieInfos: MovieInfo[] = [];
      for (const [folder, file] of folderGroups) {
        if (!processedFoldersRef.current.has(folder)) {
          const mediaInfo = await searchMedia(folder);
          if (mediaInfo) {
            const movieInfo: MovieInfo = {
              ...file,
              posterUrl: getMoviePosterUrl(mediaInfo.poster_path),
              rating: mediaInfo.vote_average,
              year: (mediaInfo.release_date || mediaInfo.first_air_date)?.split('-')[0],
              mediaType: mediaInfo.media_type as 'movie' | 'tv',
              addedAt: file.modifiedAt ? new Date(file.modifiedAt) : new Date(),
              tmdbId: mediaInfo.id
            };
            processedFoldersRef.current.set(folder, movieInfo);
            newMovieInfos.push(movieInfo);
          }
        }
      }

      if (newMovieInfos.length > 0) {
        setMovieInfo(prev => {
          const newMovies = [...prev];
          newMovieInfos.forEach(newMovie => {
            const existingIndex = newMovies.findIndex(m => m.path === newMovie.path);
            if (existingIndex !== -1) {
              newMovies.splice(existingIndex, 1);
            }
            newMovies.unshift(newMovie);
          });
          return newMovies;
        });
      }
    } catch (error) {
      console.error('Error processing files:', error);
      setError(error instanceof Error ? error.message : 'Failed to process files');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (files.length > 0) {
      processFiles(files);
    }
  }, []);

  useEffect(() => {
    const newFiles = files.filter(file => {
      const parentFolder = getParentFolderName(file.path);
      return !processedFoldersRef.current.has(parentFolder);
    });

    if (newFiles.length > 0) {
      processFiles(newFiles);
    }
  }, [files, processFiles]);

  useEffect(() => {
    setMovieInfo(prev => {
      const currentPaths = new Set(files.map(f => getParentFolderName(f.path)));
      return prev.filter(movie => currentPaths.has(getParentFolderName(movie.path)));
    });
  }, [files]);

  const handleMovieClick = (movie: MovieInfo) => {
    if (movie.tmdbId) {
      setSelectedMovie({
        id: movie.tmdbId,
        fileInfo: {
          sourcePath: movie.path,
          destinationPath: movie.symlinkPath || movie.path
        }
      });
    }
  };

  if (loading && !isRefreshing) {
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

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-indigo-400" />
        Media Library
        {(isScanning || isRefreshing) && (
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="ml-2 text-sm text-indigo-400 flex items-center gap-2"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            {isScanning ? 'Scanning...' : 'Refreshing...'}
          </motion.span>
        )}
      </h2>

      <AnimatePresence mode="wait">
        {error ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-2 text-red-400"
          >
            <AlertCircle className="h-5 w-5" />
            {error}
          </motion.div>
        ) : movieInfo.length > 0 ? (
          <div className="relative">
            <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory">
              <PosterGrid 
                movies={movieInfo.map(movie => ({
                  ...movie,
                  onClick: () => handleMovieClick(movie)
                }))} 
              />
            </div>
            <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-gray-800 to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-gray-800 to-transparent pointer-events-none" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 text-gray-400"
          >
            <FolderOpen className="h-16 w-16 mb-4" />
            <p className="text-lg font-medium mb-2">No Media Found</p>
            <p className="text-sm text-center">
              Start scanning your media library to see content here.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedMovie && (
        <MovieDetailsModal
          movieId={selectedMovie.id}
          isOpen={true}
          onClose={() => setSelectedMovie(null)}
          fileInfo={selectedMovie.fileInfo}
        />
      )}
    </div>
  );
}