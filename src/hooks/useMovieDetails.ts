import { useState, useEffect } from 'react';
import { debug } from '../utils/debug';

interface MovieDetails {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  runtime: number;
  vote_average: number;
  vote_count: number;
  budget: number;
  revenue: number;
  original_language: string;
  genres: Array<{ id: number; name: string; }>;
  production_companies: Array<{
    id: number;
    name: string;
    logo_path: string | null;
  }>;
}

const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes
const cache = new Map<number, { data: MovieDetails; timestamp: number; }>();

export function useMovieDetails(movieId: number) {
  const [data, setData] = useState<MovieDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check cache first
        const cached = cache.get(movieId);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          debug('Using cached movie details for:', movieId);
          setData(cached.data);
          setIsLoading(false);
          return;
        }

        const response = await fetch(
          `https://api.themoviedb.org/3/movie/${movieId}?api_key=${import.meta.env.TMDB_API_KEY}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch movie details');
        }

        const movieData = await response.json();
        
        // Cache the results
        cache.set(movieId, {
          data: movieData,
          timestamp: Date.now()
        });

        setData(movieData);
      } catch (err) {
        debug('Error fetching movie details:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch movie details'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovieDetails();
  }, [movieId]);

  return { data, isLoading, error };
}