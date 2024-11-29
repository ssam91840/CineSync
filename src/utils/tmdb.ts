import { debug } from './debug';
import { getEnvironmentValue } from './environment';

const TMDB_API_KEY = import.meta.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modifiedAt?: Date;
}

export interface TMDBMovie {
  id: number;
  title: string;
  name?: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  popularity: number;
  media_type?: string;
}

export interface MediaInfo extends FileInfo {
  tmdbInfo?: TMDBMovie | null;
  parentFolder?: string;
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

export const scanMediaFiles = async (path: string, recursive: boolean = true): Promise<MediaInfo[]> => {
  try {
    debug('Starting media scan with parameters:', { path, recursive });
    
    if (!path) {
      throw new Error('No path provided for scanning');
    }

    const queryParams = new URLSearchParams({
      path: path,
      recursive: 'true',
      depth: '100'
    });
    
    debug('Sending scan request with params:', queryParams.toString());
    const response = await fetch(`http://localhost:3001/api/files/scan?${queryParams}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      debug('Scan request failed:', errorData);
      throw new Error(errorData.error || 'Failed to scan directory');
    }
    
    const data = await response.json();
    debug('Raw scan response received, entry count:', data.length);
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid response format from scan endpoint');
    }

    // Process only directories that contain media files
    const mediaFiles = data.filter(file => file.type === 'file' && isMediaFile(file.name));
    const mediaParentFolders = new Set(mediaFiles.map(file => getParentFolderName(file.path)));

    // Process media files and their parent folders
    const processedEntries = await Promise.all(
      mediaFiles.map(async (file): Promise<MediaInfo> => {
        const parentFolder = getParentFolderName(file.path);
        let tmdbInfo = null;

        if (parentFolder && mediaParentFolders.has(parentFolder)) {
          debug('Searching TMDB with parent folder:', parentFolder);
          tmdbInfo = await searchMedia(parentFolder);
        }

        return {
          name: file.name,
          path: file.path,
          type: 'file',
          size: file.size,
          modifiedAt: file.modifiedAt ? new Date(file.modifiedAt) : undefined,
          tmdbInfo,
          parentFolder
        };
      })
    );

    // Group files by parent folder and only keep unique entries
    const uniqueEntries = Array.from(
      processedEntries.reduce((map, entry) => {
        if (entry.parentFolder && entry.tmdbInfo) {
          map.set(entry.parentFolder, entry);
        }
        return map;
      }, new Map<string, MediaInfo>()).values()
    );

    debug('Final processed items:', uniqueEntries.length);
    return uniqueEntries;

  } catch (error) {
    debug('Error in scanMediaFiles:', error);
    throw error;
  }
};

export const searchMedia = async (query: string): Promise<TMDBMovie | null> => {
  try {
    const cleanQuery = cleanTitle(query);
    const searchQuery = encodeURIComponent(cleanQuery);

    const response = await fetch(
      `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${searchQuery}&page=1`
    );

    if (!response.ok) {
      throw new Error('TMDB API request failed');
    }

    const data = await response.json();
    if (data.results.length === 0) return null;

    const mediaResults = data.results.filter(
      result => result.media_type === 'movie' || result.media_type === 'tv'
    );

    if (mediaResults.length === 0) return null;

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

export const getDestinationPath = (): string => {
  const path = getEnvironmentValue('DESTINATION_DIR');
  if (!path || typeof path !== 'string') {
    throw new Error('Destination directory not configured');
  }
  return path.replace(/["']/g, '');
};

const cleanTitle = (filename: string): string => {
  return filename
    .replace(/\s*\(\d{4}\)\s*/, '')
    .replace(/\.(mp4|mkv|avi|mov|m4v)$/i, '')
    .replace(/\b(480p|720p|1080p|2160p|HDRip|BRRip|BluRay|WEBRip|WEB-DL|x264|x265|HEVC|10bit)\b/gi, '')
    .replace(/\[.*?\]|\(.*?\)|\{.*?\}/g, '')
    .replace(/[._\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b(extended|directors|cut|remastered|edition|dvdrip|hdrip)\b/gi, '')
    .trim();
};

const findBestMatch = (query: string, results: TMDBMovie[]): TMDBMovie | null => {
  const normalizedQuery = query.toLowerCase();
  
  const scoredResults = results.map(media => {
    const title = (media.title || media.name || '').toLowerCase();
    const titleSimilarity = calculateSimilarity(normalizedQuery, title);
    const popularityScore = Math.min(media.popularity / 100, 1);
    const combinedScore = (titleSimilarity * 0.7) + (popularityScore * 0.3);

    return {
      media,
      score: combinedScore
    };
  });

  scoredResults.sort((a, b) => b.score - a.score);
  return scoredResults[0]?.score > 0.5 ? scoredResults[0].media : null;
};

const calculateSimilarity = (s1: string, s2: string): number => {
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  if (s1.includes(s2) || s2.includes(s1)) {
    const longerLength = Math.max(s1.length, s2.length);
    const shorterLength = Math.min(s1.length, s2.length);
    return shorterLength / longerLength;
  }

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