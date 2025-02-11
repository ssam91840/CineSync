import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Clock, Globe, Calendar, FolderSymlink, Loader2, Edit2 } from 'lucide-react';
import { useSeriesDetails } from '../../hooks/useSeriesDetails';
import CastSection from '../MovieDetails/CastSection';
import ImageWithFallback from '../MovieDetails/ImageWithFallback';
import LoadingSpinner from '../MovieDetails/LoadingSpinner';
import ModifyDestinationDialog from '../MovieDetails/ModifyDestinationDialog';

interface Props {
  seriesId: number;
  isOpen: boolean;
  onClose: () => void;
  fileInfo?: {
    sourcePath: string;
    destinationPath: string;
  };
}

export default function SeriesDetailsModal({ seriesId, isOpen, onClose, fileInfo }: Props) {
  const { data: series, isLoading, error } = useSeriesDetails(seriesId);
  const [resolvedSourcePath, setResolvedSourcePath] = useState<string | null>(null);
  const [isModifying, setIsModifying] = useState(false);
  const [modifyError, setModifyError] = useState<string | null>(null);
  const [showModifyDialog, setShowModifyDialog] = useState(false);

  useEffect(() => {
    const resolveSourcePath = async () => {
      if (fileInfo?.destinationPath) {
        try {
          const response = await fetch(`http://localhost:3001/api/files/readlink?path=${encodeURIComponent(fileInfo.destinationPath)}`);
          if (response.ok) {
            const data = await response.json();
            setResolvedSourcePath(data.sourcePath);
          }
        } catch (error) {
          console.error('Error resolving symlink:', error);
        }
      }
    };

    resolveSourcePath();
  }, [fileInfo?.destinationPath]);

  const handleModifyClick = () => {
    if (!fileInfo?.sourcePath) return;
    setShowModifyDialog(true);
  };

  const handleModifyComplete = (newDestination: string) => {
    setShowModifyDialog(false);
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
                <p>Failed to load series details. Please try again later.</p>
              </div>
            )}

            {series && (
              <>
                {/* Backdrop Image */}
                <div className="relative h-[400px]">
                  <ImageWithFallback
                    src={`https://image.tmdb.org/t/p/original${series.backdrop_path}`}
                    alt={series.name}
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
                        src={`https://image.tmdb.org/t/p/w500${series.poster_path}`}
                        alt={series.name}
                        className="w-full rounded-lg shadow-xl"
                      />
                    </div>

                    {/* Series Info */}
                    <div className="flex-grow">
                      <h2 className="text-4xl font-bold mb-2">
                        {series.name}
                        <span className="text-gray-400 ml-2">
                          ({new Date(series.first_air_date).getFullYear()})
                        </span>
                      </h2>

                      {/* Metadata Row */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6">
                        {series.episode_run_time && series.episode_run_time[0] && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {series.episode_run_time[0]}min per episode
                          </div>
                        )}
                        {series.vote_average > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            {series.vote_average.toFixed(1)} ({series.vote_count} votes)
                          </div>
                        )}
                        {series.first_air_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(series.first_air_date).toLocaleDateString()}
                          </div>
                        )}
                        {series.original_language && (
                          <div className="flex items-center gap-1">
                            <Globe className="h-4 w-4" />
                            {series.original_language.toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Genres */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        {series.genres.map(genre => (
                          <span
                            key={genre.id}
                            className="px-3 py-1 bg-gray-800 rounded-full text-sm"
                          >
                            {genre.name}
                          </span>
                        ))}
                      </div>

                      {/* Overview */}
                      {series.overview && (
                        <div className="mb-6">
                          <h3 className="text-xl font-semibold mb-2">Overview</h3>
                          <p className="text-gray-300 leading-relaxed">{series.overview}</p>
                        </div>
                      )}

                      {/* Series Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div>
                          <h4 className="text-sm text-gray-400 mb-1">Seasons</h4>
                          <div className="text-lg">{series.number_of_seasons}</div>
                        </div>
                        <div>
                          <h4 className="text-sm text-gray-400 mb-1">Episodes</h4>
                          <div className="text-lg">{series.number_of_episodes}</div>
                        </div>
                        <div>
                          <h4 className="text-sm text-gray-400 mb-1">Status</h4>
                          <div className="text-lg">{series.status}</div>
                        </div>
                        <div>
                          <h4 className="text-sm text-gray-400 mb-1">Type</h4>
                          <div className="text-lg">{series.type}</div>
                        </div>
                      </div>

                      {/* File Information */}
                      {fileInfo && (
                        <div className="mb-6 bg-gray-800/50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold flex items-center gap-2">
                              <FolderSymlink className="h-5 w-5 text-indigo-400" />
                              File Information
                            </h3>
                            <button
                              onClick={handleModifyClick}
                              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm transition-colors"
                              disabled={isModifying}
                            >
                              {isModifying ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Edit2 className="h-4 w-4" />
                              )}
                              Modify Destination
                            </button>
                          </div>
                          
                          {modifyError && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                              {modifyError}
                            </div>
                          )}

                          <div className="space-y-3">
                            <div>
                              <label className="text-sm text-gray-400">Source Path</label>
                              <div className="mt-1 text-sm bg-gray-900/50 p-2 rounded break-all">
                                {resolvedSourcePath || 'Resolving source path...'}
                              </div>
                            </div>
                            <div>
                              <label className="text-sm text-gray-400">Destination Path</label>
                              <div className="mt-1 text-sm bg-gray-900/50 p-2 rounded break-all">
                                {fileInfo.destinationPath}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Production Companies */}
                      {series.production_companies.length > 0 && (
                        <div>
                          <h3 className="text-xl font-semibold mb-4">Production Companies</h3>
                          <div className="flex flex-wrap gap-6">
                            {series.production_companies.map(company => (
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
                  </div>

                  {/* Cast Section */}
                  <CastSection movieId={seriesId} />
                </div>
              </>
            )}
          </motion.div>

          {showModifyDialog && fileInfo && (
            <ModifyDestinationDialog
              sourcePath={fileInfo.sourcePath}
              onComplete={handleModifyComplete}
              onClose={() => setShowModifyDialog(false)}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}