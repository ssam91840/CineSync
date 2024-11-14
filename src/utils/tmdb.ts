import { debug } from './debug';

const TMDB_API_KEY = import.meta.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

interface TMDBMovie {
  id: number;
  title: string;
  name?: string; // for TV shows
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  popularity: number;
  media_type?: string;
}

interface TMDBResponse {
  results: TMDBMovie[];
}

export const searchMedia = async (query: string): Promise<TMDBMovie | null> => {
  try {
    const cleanQuery = cleanTitle(query);
    const searchQuery = encodeURIComponent(cleanQuery);

    // Search both movies and TV shows
    const response = await fetch(
      `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${searchQuery}&page=1`
    );

    if (!response.ok) {
      throw new Error('TMDB API request failed');
    }

    const data: TMDBResponse = await response.json();
    if (data.results.length === 0) return null;

    // Filter for movies and TV shows only
    const mediaResults = data.results.filter(
      result => result.media_type === 'movie' || result.media_type === 'tv'
    );

    if (mediaResults.length === 0) return null;

    // Find the best match using similarity and popularity
    const bestMatch = findBestMatch(cleanQuery, mediaResults);
    return bestMatch || null;

  } catch (error) {
    debug('TMDB API error:', error);
    return null;
  }
};

export const getMoviePosterUrl = (posterPath: string | null, size: 'w342' | 'w500' | 'original' = 'w342'): string => {
  if (!posterPath) {
    return 'https://via.placeholder.com/342x513/1a1a1a/666666?text=No+Poster';
  }
  return `https://image.tmdb.org/t/p/${size}${posterPath}`;
};

const cleanTitle = (filename: string): string => {
  return filename
    // Remove year if present
    .replace(/\s*\(\d{4}\)\s*/, '')
    // Remove file extension
    .replace(/\.(mp4|mkv|avi|mov|m4v)$/i, '')
    // Remove quality indicators
    .replace(/\b(480p|720p|1080p|2160p|HDRip|BRRip|BluRay|WEBRip|WEB-DL|x264|x265|HEVC|10bit)\b/gi, '')
    // Remove release group tags
    .replace(/\[.*?\]|\(.*?\)|\{.*?\}/g, '')
    // Remove special characters
    .replace(/[._\-]/g, ' ')
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    // Remove common terms
    .replace(/\b(extended|directors|cut|remastered|edition|dvdrip|hdrip)\b/gi, '')
    .trim();
};

const findBestMatch = (query: string, results: TMDBMovie[]): TMDBMovie | null => {
  const normalizedQuery = query.toLowerCase();
  
  // Calculate similarity scores and combine with popularity
  const scoredResults = results.map(media => {
    const title = (media.title || media.name || '').toLowerCase();
    const titleSimilarity = calculateSimilarity(normalizedQuery, title);
    const popularityScore = Math.min(media.popularity / 100, 1); // Normalize popularity to 0-1
    const combinedScore = (titleSimilarity * 0.7) + (popularityScore * 0.3); // Weight title similarity higher

    return {
      media,
      score: combinedScore
    };
  });

  // Sort by combined score
  scoredResults.sort((a, b) => b.score - a.score);

  // Return the best match if it meets minimum threshold
  return scoredResults[0]?.score > 0.5 ? scoredResults[0].media : null;
};

const calculateSimilarity = (s1: string, s2: string): number => {
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  // Check if one string contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    const longerLength = Math.max(s1.length, s2.length);
    const shorterLength = Math.min(s1.length, s2.length);
    return shorterLength / longerLength;
  }

  // Calculate Levenshtein distance
  const matrix = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));

  for (let i = 0; i <= s1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= s2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= s2.length; j++) {
    for (let i = 1; i <= s1.length; i++) {
      const substitutionCost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + substitutionCost
      );
    }
  }

  const distance = matrix[s2.length][s1.length];
  const maxLength = Math.max(s1.length, s2.length);
  return 1 - (distance / maxLength);
};