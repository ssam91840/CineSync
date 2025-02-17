import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, X, AlertCircle, Search } from 'lucide-react';
import ImageWithFallback from './ImageWithFallback';
import { searchMedia, getMoviePosterUrl } from '../../utils/tmdb';

const API_URL = `http://${window.location.hostname}:3001`;

interface Props {
  sourcePath: string;
  onComplete: (newDestination: string) => void;
  onClose: () => void;
}

interface SearchResult {
  id: number;
  title: string;
  year: string;
  posterPath?: string;
}

export default function ModifyDestinationDialog({ sourcePath, onComplete, onClose }: Props) {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const eventSourceRef = useRef<EventSource | null>(null);
  const [initialScanComplete, setInitialScanComplete] = useState(false);
  const currentSearchRef = useRef<string>('');

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const setupEventSource = (searchTerm: string = '') => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    currentSearchRef.current = searchTerm;
    eventSourceRef.current = new EventSource(`${API_URL}/api/scan/logs`);

    eventSourceRef.current.onmessage = async (event) => {
      try {
        const line = JSON.parse(event.data);
        
        if (line.includes('[INFO] Multiple movies found for query')) {
          setResults([]);
        } else if (line.includes('[INFO] ') && line.includes(':')) {
          const match = line.match(/(\d+):\s+(.*?)\s+\((\d{4})\)(?:\s+\[poster:(.*?)\])?/);
          if (match) {
            const [, id, title, year] = match;
            // Fetch movie details including poster
            const movieInfo = await searchMedia(title);
            const posterPath = movieInfo?.poster_path || null;
            
            const newResult = {
              id: parseInt(id),
              title,
              year,
              posterPath: posterPath ? getMoviePosterUrl(posterPath) : undefined
            };
            
            setResults(prev => {
              if (!prev.find(r => r.id === newResult.id)) {
                return [...prev, newResult];
              }
              return prev;
            });
          }
        }
      } catch (error) {
        console.error('Error processing event:', error);
      }
    };

    eventSourceRef.current.onerror = () => {
      eventSourceRef.current?.close();
    };
  };

  const handleScanOperation = async (operation: 'initial' | 'search' | 'select', params: { query?: string; selectionIndex?: number } = {}) => {
    const isInitialScan = operation === 'initial';
    const isSelection = operation === 'select';
    const isSearch = operation === 'search';

    try {
      if (isInitialScan) {
        setIsSearching(true);
        setError(null);
        setResults([]);

        const initResponse = await fetch(`${API_URL}/api/scan/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourcePath }),
        });

        if (!initResponse.ok) throw new Error('Failed to resolve path');
      }

      if (isSearch) {
        setIsSearching(true);
        setError(null);
        setResults([]);
      }

      setupEventSource(isSearch ? params.query : '');

      let selection = '';
      if (isSearch) {
        selection = params.query || '';
      } else if (isSelection) {
        selection = `${(params.selectionIndex || 0) + 1}`;
      }

      const response = await fetch(`${API_URL}/api/scan/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selection }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || `Failed to process ${operation}`);
      }

      if (isInitialScan) {
        setInitialScanComplete(true);
      } else if (isSelection) {
        const destinationPath = data.output.match(/Created symlink:.*->\s+(.+?)$/m)?.[1];
        if (destinationPath) {
          onComplete(destinationPath.trim());
        } else {
          throw new Error('Could not find destination path in output');
        }
      }
    } catch (err) {
      console.error(`${operation} error:`, err);
      setError(err instanceof Error ? err.message : `Failed to process ${operation}`);
    } finally {
      if (isInitialScan || isSearch) setIsSearching(false);
      if (isSelection) setIsProcessing(false);
    }
  };

  useEffect(() => {
    handleScanOperation('initial');
  }, [sourcePath]);

  const handleSearch = async (query: string) => {
    if (!initialScanComplete) {
      setError('Please wait for initial scan to complete');
      return;
    }
    await handleScanOperation('search', { query });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleSearch(searchQuery.trim());
      setSearchQuery('');
    }
  };

  const handleSelection = async (index: number) => {
    setIsProcessing(true);
    setError(null);
    await handleScanOperation('select', { selectionIndex: index });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-gray-900 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Modify Destination</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
            disabled={isProcessing}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSearchSubmit} className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for movies..."
              disabled={!initialScanComplete || isSearching}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-gray-200 
                       placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500
                       disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-indigo-400" />
            )}
          </div>
        </form>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {results.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {results.map((result, index) => (
                <motion.button
                  key={result.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleSelection(index)}
                  disabled={isProcessing}
                  className="group relative flex flex-col items-center"
                >
                  <div className="w-full aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 mb-2">
                    <ImageWithFallback
                      src={result.posterPath || ''}
                      alt={result.title}
                      className="w-full h-full object-cover transition-transform duration-300 
                               group-hover:scale-110"
                    />
                    {isProcessing && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                      </div>
                    )}
                  </div>
                  <h4 className="font-medium text-sm text-center truncate w-full">
                    {result.title}
                  </h4>
                  <p className="text-sm text-gray-400">{result.year}</p>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
