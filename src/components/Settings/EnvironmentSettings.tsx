import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, AlertCircle } from 'lucide-react';
import {
  saveEnvironmentValues,
  getEnvironmentValues,
} from '../../utils/environment';

interface EnvSetting {
  key: string;
  value: string | number | boolean;
  type: 'text' | 'number' | 'boolean';
  description: string;
  category: 'paths' | 'general' | 'database' | 'media' | 'plex' | 'rclone';
}

const defaultSettings: EnvSetting[] = [
  // Path Settings
  {
    key: 'SOURCE_DIR',
    value: '',
    type: 'text',
    description: 'Source directory for media files',
    category: 'paths',
  },
  {
    key: 'DESTINATION_DIR',
    value: '',
    type: 'text',
    description: 'Destination directory for symlinks',
    category: 'paths',
  },
  {
    key: 'CUSTOM_SHOW_FOLDER',
    value: '',
    type: 'text',
    description: 'Custom folder path for TV shows',
    category: 'paths',
  },
  {
    key: 'CUSTOM_ANIME_SHOW_FOLDER',
    value: '',
    type: 'text',
    description: 'Custom folder path for anime shows',
    category: 'paths',
  },
  {
    key: 'CUSTOM_MOVIE_FOLDER',
    value: '',
    type: 'text',
    description: 'Custom folder path for movies',
    category: 'paths',
  },
  {
    key: 'CUSTOM_ANIME_MOVIE_FOLDER',
    value: '',
    type: 'text',
    description: 'Custom folder path for anime movies',
    category: 'paths',
  },

  // General Settings
  {
    key: 'USE_SOURCE_STRUCTURE',
    value: false,
    type: 'boolean',
    description: 'Maintain source directory structure',
    category: 'general',
  },
  {
    key: 'CINESYNC_LAYOUT',
    value: false,
    type: 'boolean',
    description: 'Use Cinesync layout',
    category: 'general',
  },
  {
    key: 'LOG_LEVEL',
    value: 'INFO',
    type: 'text',
    description: 'Logging verbosity level',
    category: 'general',
  },
  {
    key: 'MAX_PROCESSES',
    value: 2,
    type: 'number',
    description: 'Maximum number of concurrent processes',
    category: 'general',
  },
  {
    key: 'RELATIVE_SYMLINK',
    value: false,
    type: 'boolean',
    description: 'Create relative symlinks instead of absolute',
    category: 'general',
  },
  {
    key: 'SLEEP_TIME',
    value: 60,
    type: 'number',
    description: 'Monitoring interval (seconds)',
    category: 'general',
  },
  {
    key: 'SYMLINK_CLEANUP_INTERVAL',
    value: 600,
    type: 'number',
    description: 'Cleanup interval for broken symlinks (seconds)',
    category: 'general',
  },

  // Media Settings
  {
    key: 'TMDB_API_KEY',
    value: '',
    type: 'text',
    description: 'TMDB API Key for metadata',
    category: 'media',
  },
  {
    key: 'ANIME_SCAN',
    value: false,
    type: 'boolean',
    description: 'Enable anime-specific scanning',
    category: 'media',
  },
  {
    key: 'TMDB_FOLDER_ID',
    value: false,
    type: 'boolean',
    description: 'Use TMDb IDs for folder names',
    category: 'media',
  },
  {
    key: 'IMDB_FOLDER_ID',
    value: false,
    type: 'boolean',
    description: 'Use IMDb IDs for folder names',
    category: 'media',
  },
  {
    key: 'TVDB_FOLDER_ID',
    value: false,
    type: 'boolean',
    description: 'Use TVDb IDs for folder names',
    category: 'media',
  },
  {
    key: 'RENAME_ENABLED',
    value: false,
    type: 'boolean',
    description: 'Enable file renaming based on metadata',
    category: 'media',
  },
  {
    key: 'RENAME_TAGS',
    value: 'Resolution',
    type: 'text',
    description: 'Tags to include in renamed files',
    category: 'media',
  },
  {
    key: 'MOVIE_COLLECTION_ENABLED',
    value: false,
    type: 'boolean',
    description: 'Enable movie collection organization',
    category: 'media',
  },
  {
    key: 'SKIP_EXTRAS_FOLDER',
    value: true,
    type: 'boolean',
    description: 'Skip processing extras folders',
    category: 'media',
  },
  {
    key: 'EXTRAS_MAX_SIZE_MB',
    value: 250,
    type: 'number',
    description: 'Maximum size for extras (MB)',
    category: 'media',
  },
  {
    key: 'ALLOWED_EXTENSIONS',
    value: '.mp4,.mkv,.srt',
    type: 'text',
    description: 'Allowed file extensions',
    category: 'media',
  },
  {
    key: 'SKIP_ADULT_PATTERNS',
    value: true,
    type: 'boolean',
    description: 'Skip adult content patterns',
    category: 'media',
  },

  // Database Settings
  {
    key: 'DB_THROTTLE_RATE',
    value: 100,
    type: 'number',
    description: 'Database throttle rate (requests/sec)',
    category: 'database',
  },
  {
    key: 'DB_MAX_RETRIES',
    value: 10,
    type: 'number',
    description: 'Maximum database operation retries',
    category: 'database',
  },
  {
    key: 'DB_RETRY_DELAY',
    value: 1.0,
    type: 'number',
    description: 'Delay between retries (seconds)',
    category: 'database',
  },
  {
    key: 'DB_BATCH_SIZE',
    value: 1000,
    type: 'number',
    description: 'Database batch size',
    category: 'database',
  },
  {
    key: 'DB_MAX_WORKERS',
    value: 4,
    type: 'number',
    description: 'Maximum database worker threads',
    category: 'database',
  },

  // Plex Settings
  {
    key: 'ENABLE_PLEX_UPDATE',
    value: false,
    type: 'boolean',
    description: 'Enable Plex library updates',
    category: 'plex',
  },
  {
    key: 'PLEX_URL',
    value: '',
    type: 'text',
    description: 'Plex server URL',
    category: 'plex',
  },
  {
    key: 'PLEX_TOKEN',
    value: '',
    type: 'text',
    description: 'Plex authentication token',
    category: 'plex',
  },

  // Rclone Settings
  {
    key: 'RCLONE_MOUNT',
    value: false,
    type: 'boolean',
    description: 'Enable rclone mount verification',
    category: 'rclone',
  },
  {
    key: 'MOUNT_CHECK_INTERVAL',
    value: 30,
    type: 'number',
    description: 'Mount check interval (seconds)',
    category: 'rclone',
  },
];

export default function EnvironmentSettings() {
  const [settings, setSettings] = useState<EnvSetting[]>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeCategory, setActiveCategory] =
    useState<EnvSetting['category']>('paths');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEnvironmentSettings();
  }, []);

  const loadEnvironmentSettings = async () => {
    try {
      setIsLoading(true);
      const envValues = await getEnvironmentValues();
      setSettings((prevSettings) =>
        prevSettings.map((setting) => ({
          ...setting,
          value: setting.type === 'boolean' 
            ? envValues[setting.key] === 'true' || envValues[setting.key] === true
            : envValues[setting.key] ?? setting.value,
        }))
      );
    } catch (error) {
      console.error('Failed to load environment settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const result = await saveEnvironmentValues(
        settings.map(({ key, value }) => ({ key, value }))
      );

      if (result.success) {
        setSaveSuccess(true);
        await loadEnvironmentSettings();
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Save error:', error);
      setSaveError(
        error instanceof Error ? error.message : 'Failed to save settings'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const categories = {
    paths: 'Path Settings',
    general: 'General Settings',
    media: 'Media Settings',
    database: 'Database Configuration',
    plex: 'Plex Integration',
    rclone: 'Rclone Configuration',
  };

  const handleChange = (key: string, value: string | number | boolean) => {
    setSettings(
      settings.map((setting) =>
        setting.key === key ? { ...setting, value } : setting
      )
    );
    setSaveSuccess(false);
    setSaveError(null);
  };

  const filteredSettings = settings.filter(
    (setting) => setting.category === activeCategory
  );

  if (isLoading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="h-4 bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="card-title flex items-center gap-2 m-0">
          <SettingsIcon className="h-5 w-5 text-indigo-400" />
          Environment Configuration
        </h2>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`btn btn-primary flex items-center gap-2 ${
            isSaving ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Save className={`h-4 w-4 ${isSaving ? 'animate-spin' : ''}`} />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {saveError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400">
          <AlertCircle className="h-4 w-4" />
          {saveError}
        </div>
      )}

      {saveSuccess && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 text-green-400">
          <AlertCircle className="h-4 w-4" />
          Settings saved successfully!
        </div>
      )}

      <div className="flex gap-4 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {Object.entries(categories).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key as EnvSetting['category'])}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
              ${
                activeCategory === key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filteredSettings.map((setting) => (
          <div key={setting.key} className="mb-4">
            <label className="label">{setting.description}</label>
            {setting.type === 'boolean' ? (
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={setting.value === true}
                  onChange={(e) => handleChange(setting.key, e.target.checked)}
                  className="sr-only peer"
                />
                <div
                  className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 
                              peer-focus:ring-indigo-800 rounded-full peer 
                              peer-checked:after:translate-x-full peer-checked:after:border-white 
                              after:content-[''] after:absolute after:top-[2px] after:start-[2px] 
                              after:bg-white after:border-gray-300 after:border after:rounded-full 
                              after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"
                ></div>
              </label>
            ) : (
              <input
                type={setting.type}
                value={String(setting.value)}
                onChange={(e) =>
                  handleChange(
                    setting.key,
                    setting.type === 'number'
                      ? Number(e.target.value)
                      : e.target.value
                  )
                }
                className="input w-full"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}