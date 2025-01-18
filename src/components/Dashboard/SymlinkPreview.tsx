import React from 'react';
import { Film, Tv } from 'lucide-react';
import { motion } from 'framer-motion';
import { searchMedia, getMoviePosterUrl } from '../../utils/tmdb';

interface Props {
  symlinkPath: string;
}

export default function SymlinkPreview({ symlinkPath }: Props) {
  const [mediaInfo, setMediaInfo] = React.useState<{
    title: string;
    posterUrl: string | null;
    type: 'movie' | 'tv';
  } | null>(null);

  React.useEffect(() => {
    const fetchMediaInfo = async () => {
      // Extract title from path
      const pathParts = symlinkPath.split(/[\\/]/);
      const fileName = pathParts[pathParts.length - 1];
      const cleanTitle = fileName.replace(/\.[^/.]+$/, ''); // Remove file extension

      const mediaData = await searchMedia(cleanTitle);
      if (mediaData) {
        setMediaInfo({
          title: mediaData.title || mediaData.name || cleanTitle,
          posterUrl: mediaData.poster_path ? getMoviePosterUrl(mediaData.poster_path) : null,
          type: mediaData.media_type as 'movie' | 'tv' || 'movie'
        });
      }
    };

    fetchMediaInfo();
  }, [symlinkPath]);

  if (!mediaInfo) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50 flex items-center gap-4"
    >
      {mediaInfo.posterUrl ? (
        <img 
          src={mediaInfo.posterUrl} 
          alt={mediaInfo.title}
          className="w-16 h-24 object-cover rounded-md"
        />
      ) : (
        <div className="w-16 h-24 bg-gray-800 rounded-md flex items-center justify-center">
          {mediaInfo.type === 'movie' ? (
            <Film className="h-8 w-8 text-gray-600" />
          ) : (
            <Tv className="h-8 w-8 text-gray-600" />
          )}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`
            text-xs font-medium px-2 py-1 rounded-full
            ${mediaInfo.type === 'movie' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}
          `}>
            {mediaInfo.type === 'movie' ? 'Movie' : 'TV Show'}
          </span>
        </div>
        <h3 className="text-sm font-medium text-gray-200 truncate">
          {mediaInfo.title}
        </h3>
        <p className="text-xs text-gray-400 truncate">
          Added to library
        </p>
      </div>
    </motion.div>
  );
}