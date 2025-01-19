import React from 'react';
import { Film, Star, Tv } from 'lucide-react';
import ImageLoader from './ImageLoader';
import { usePosterCache } from '../../hooks/usePosterCache';

interface MovieCardProps {
  name: string;
  posterUrl?: string;
  rating?: number;
  year?: string;
  mediaType?: 'movie' | 'tv';
  tmdbId?: number;
  onClick?: () => void;
}

export default function MovieCard({ 
  name, 
  posterUrl, 
  rating, 
  year, 
  mediaType = 'movie',
  onClick
}: MovieCardProps) {
  const { getCachedPoster, cachePoster } = usePosterCache();
  const cachedPosterUrl = posterUrl ? getCachedPoster(posterUrl) : null;

  const handlePosterLoad = () => {
    if (posterUrl) {
      cachePoster(posterUrl, posterUrl);
    }
  };

  return (
    <div 
      className="group relative rounded-lg overflow-hidden bg-gray-800 shadow-lg cursor-pointer transform transition-transform hover:scale-105"
      onClick={onClick}
    >
      {/* Media Type Badge */}
      <div className="absolute top-2 left-2 z-10">
        <span className={`text-white text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1
          ${mediaType === 'movie' ? 'bg-blue-500' : 'bg-green-500'}`}
        >
          {mediaType === 'movie' ? (
            <>
              <Film className="h-3 w-3" />
              MOVIE
            </>
          ) : (
            <>
              <Tv className="h-3 w-3" />
              SERIES
            </>
          )}
        </span>
      </div>

      {/* Poster Image */}
      <div className="aspect-[2/3] w-full">
        {(posterUrl || cachedPosterUrl) ? (
          <ImageLoader
            src={cachedPosterUrl || posterUrl}
            alt={name}
            className="w-full h-full"
            onLoad={handlePosterLoad}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            {mediaType === 'movie' ? (
              <Film className="h-12 w-12 text-gray-600" />
            ) : (
              <Tv className="h-12 w-12 text-gray-600" />
            )}
          </div>
        )}
      </div>

      {/* Movie Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-black/0 p-4">
        <h4 className="font-medium text-white truncate mb-1">{name}</h4>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          {year && <span>{year}</span>}
          {rating && (
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
              <span>{rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}