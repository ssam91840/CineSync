import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Clock, DollarSign, Globe, Calendar } from 'lucide-react';
import { useMovieDetails } from '../../hooks/useMovieDetails';
import CastSection from './CastSection';
import ImageWithFallback from './ImageWithFallback';
import LoadingSpinner from './LoadingSpinner';

interface Props {
  movieId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function MovieDetailsModal({ movieId, isOpen, onClose }: Props) {
  const { data: movie, isLoading, error } = useMovieDetails(movieId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 scrollbar-hide"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-gray-900 rounded-xl shadow-2xl scrollbar-hide"
            onClick={e => e.stopPropagation()}
          >
            {isLoading && <LoadingSpinner />}

            {error && (
              <div className="p-8 text-center text-red-400">
                <p>Failed to load movie details. Please try again later.</p>
              </div>
            )}

            {movie && (
              <>
                {/* Backdrop Image */}
                <div className="relative h-[400px]">
                  <ImageWithFallback
                    src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
                    alt={movie.title}
                    className="w-full h-full object-cover rounded-t-xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
                </div>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-full bg-gray-900/80 hover:bg-gray-800 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>

                <div className="p-8 -mt-32 relative">
                  <div className="flex flex-col lg:flex-row gap-8">
                    {/* Poster */}
                    <div className="flex-shrink-0 w-64">
                      <ImageWithFallback
                        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                        alt={movie.title}
                        className="w-full rounded-lg shadow-xl"
                      />
                    </div>

                    {/* Movie Info */}
                    <div className="flex-grow">
                      <h2 className="text-4xl font-bold mb-2">
                        {movie.title}
                        <span className="text-gray-400 ml-2">
                          ({new Date(movie.release_date).getFullYear()})
                        </span>
                      </h2>

                      {/* Metadata Row */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6">
                        {movie.runtime > 0 && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatRuntime(movie.runtime)}
                          </div>
                        )}
                        {movie.vote_average > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            {movie.vote_average.toFixed(1)} ({movie.vote_count} votes)
                          </div>
                        )}
                        {movie.release_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(movie.release_date).toLocaleDateString()}
                          </div>
                        )}
                        {movie.original_language && (
                          <div className="flex items-center gap-1">
                            <Globe className="h-4 w-4" />
                            {movie.original_language.toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Genres */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        {movie.genres.map(genre => (
                          <span
                            key={genre.id}
                            className="px-3 py-1 bg-gray-800 rounded-full text-sm"
                          >
                            {genre.name}
                          </span>
                        ))}
                      </div>

                      {/* Overview */}
                      {movie.overview && (
                        <div className="mb-6">
                          <h3 className="text-xl font-semibold mb-2">Overview</h3>
                          <p className="text-gray-300 leading-relaxed">{movie.overview}</p>
                        </div>
                      )}

                      {/* Financial Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {movie.budget > 0 && (
                          <div>
                            <h4 className="text-sm text-gray-400 mb-1">Budget</h4>
                            <div className="flex items-center gap-1 text-lg">
                              <DollarSign className="h-5 w-5 text-green-400" />
                              {formatCurrency(movie.budget)}
                            </div>
                          </div>
                        )}
                        {movie.revenue > 0 && (
                          <div>
                            <h4 className="text-sm text-gray-400 mb-1">Revenue</h4>
                            <div className="flex items-center gap-1 text-lg">
                              <DollarSign className="h-5 w-5 text-green-400" />
                              {formatCurrency(movie.revenue)}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Production Companies */}
                      {movie.production_companies.length > 0 && (
                        <div>
                          <h3 className="text-xl font-semibold mb-4">Production Companies</h3>
                          <div className="flex flex-wrap gap-6">
                            {movie.production_companies.map(company => (
                              <div key={company.id} className="text-center">
                                {company.logo_path ? (
                                  <ImageWithFallback
                                    src={`https://image.tmdb.org/t/p/w200${company.logo_path}`}
                                    alt={company.name}
                                    className="h-12 object-contain mb-2 bg-white/10 rounded p-1"
                                  />
                                ) : (
                                  <div className="h-12 w-24 bg-gray-800 rounded flex items-center justify-center mb-2">
                                    <span className="text-xs text-gray-400">No Logo</span>
                                  </div>
                                )}
                                <span className="text-sm text-gray-400">{company.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div >

                  {/* Cast Section */}
                  <CastSection movieId={movieId} />
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}