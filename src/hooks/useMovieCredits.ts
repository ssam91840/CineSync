import { useState, useEffect } from 'react';
import { debug } from '../utils/debug';

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

interface MovieCredits {
  id: number;
  cast: CastMember[];
}

const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes
const cache = new Map<number, { data: MovieCredits; timestamp: number; }>();

export function useMovieCredits(movieId: number) {
  const [data, setData] = useState<MovieCredits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMovieCredits = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check cache first
        const cached = cache.get(movieId);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          debug('Using cached movie credits for:', movieId);
          setData(cached.data);
          setIsLoading(false);
          return;
        }

        const response = await fetch(
          `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${import.meta.env.TMDB_API_KEY}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch movie credits');
        }

        const creditsData = await response.json();
        
        // Cache the results
        cache.set(movieId, {
          data: creditsData,
          timestamp: Date.now()
        });

        setData(creditsData);
      } catch (err) {
        debug('Error fetching movie credits:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch movie credits'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovieCredits();
  }, [movieId]);

  return { data, isLoading, error };
}