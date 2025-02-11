import { useState, useEffect } from 'react';
import { debug } from '../utils/debug';

interface SeriesDetails {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  first_air_date: string;
  episode_run_time: number[];
  vote_average: number;
  vote_count: number;
  number_of_seasons: number;
  number_of_episodes: number;
  status: string;
  type: string;
  original_language: string;
  genres: Array<{ id: number; name: string; }>;
  production_companies: Array<{
    id: number;
    name: string;
    logo_path: string | null;
  }>;
}

const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes
const cache = new Map<number, { data: SeriesDetails; timestamp: number; }>();

export function useSeriesDetails(seriesId: number) {
  const [data, setData] = useState<SeriesDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSeriesDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check cache first
        const cached = cache.get(seriesId);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          debug('Using cached series details for:', seriesId);
          setData(cached.data);
          setIsLoading(false);
          return;
        }

        const response = await fetch(
          `https://api.themoviedb.org/3/tv/${seriesId}?api_key=${import.meta.env.TMDB_API_KEY}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch series details');
        }

        const seriesData = await response.json();
        
        // Cache the results
        cache.set(seriesId, {
          data: seriesData,
          timestamp: Date.now()
        });

        setData(seriesData);
      } catch (err) {
        debug('Error fetching series details:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch series details'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchSeriesDetails();
  }, [seriesId]);

  return { data, isLoading, error };
}