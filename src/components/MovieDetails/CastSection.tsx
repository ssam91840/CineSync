import React from 'react';
import { useMovieCredits } from '../../hooks/useMovieCredits';
import ImageWithFallback from './ImageWithFallback';
import LoadingSpinner from './LoadingSpinner';

interface Props {
  movieId: number;
}

export default function CastSection({ movieId }: Props) {
  const { data: credits, isLoading, error } = useMovieCredits(movieId);
  const mainCast = credits?.cast.slice(0, 10) || [];

  if (isLoading) return <LoadingSpinner />;
  if (error) return null;
  if (mainCast.length === 0) return null;

  return (
    <div className="mt-12">
      <h3 className="text-2xl font-semibold mb-6">Top Cast</h3>
      <div className="overflow-x-auto pb-6 scrollbar-hide">
        <div className="flex gap-4">
          {mainCast.map(actor => (
            <div
              key={actor.id}
              className="flex-shrink-0 w-32 group"
            >
              <div className="relative overflow-hidden rounded-lg mb-2">
                <ImageWithFallback
                  src={`https://image.tmdb.org/t/p/w200${actor.profile_path}`}
                  alt={actor.name}
                  className="w-full aspect-[2/3] object-cover transform transition-transform group-hover:scale-110"
                />
              </div>
              <h4 className="font-medium text-sm">{actor.name}</h4>
              <p className="text-sm text-gray-400">{actor.character}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}