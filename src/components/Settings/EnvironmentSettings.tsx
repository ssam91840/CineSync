import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, AlertCircle } from 'lucide-react';
import { saveEnvironmentValues, getEnvironmentValues } from '../../utils/environment';

interface EnvSetting {
  key: string;
  value: string | number | boolean;
  type: 'text' | 'number' | 'boolean';
  description: string;
  category: 'paths' | 'general' | 'database' | 'media';
}

const defaultSettings: EnvSetting[] = [
  {
    key: 'SOURCE_DIR',
    value: '',
    type: 'text',
    description: 'Source directory for media files',
    category: 'paths'
  },
  {
    key: 'DESTINATION_DIR',
    value: '',
    type: 'text',
    description: 'Destination directory for symlinks',
    category: 'paths'
  },
  {
    key: 'USE_SOURCE_STRUCTURE',
    value: false,
    type: 'boolean',
    description: 'Maintain source directory structure',
    category: 'general'
  },
  {
    key: 'LOG_LEVEL',
    value: 'INFO',
    type: 'text',
    description: 'Logging verbosity level',
    category: 'general'
  },
  {
    key: 'TMDB_API_KEY',
    value: '',
    type: 'text',
    description: 'TMDB API Key for metadata',
    category: 'media'
  },
  {
    key: 'MAX_PROCESSES',
    value: 1,
    type: 'number',
    description: 'Maximum number of concurrent processes',
    category: 'general'
  },
  {
    key: 'SKIP_EXTRAS_FOLDER',
    value: true,
    type: 'boolean',
    description: 'Skip processing extras folders',
    category: 'media'
  },
  {
    key: 'EXTRAS_MAX_SIZE_MB',
    value: 100,
    type: 'number',
    description: 'Maximum size for extras (MB)',
    category: 'media'
  },
  {
    key: 'DB_BATCH_SIZE',
    value: 1000,
    type: 'number',
    description: 'Database batch size for operations',
    category: 'database'
  },
  {
    key: 'DB_MAX_WORKERS',
    value: 4,
    type: 'number',
    description: 'Maximum database worker threads',
    category: 'database'
  }
];

export default function EnvironmentSettings() {
  const [settings, setSettings] = useState<EnvSetting[]>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeCategory, setActiveCategory] = useState<EnvSetting['category']>('general');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEnvironmentSettings();
  }, []);

  const loadEnvironmentSettings = async () => {
    try {
      setIsLoading(true);
      const envValues = await getEnvironmentValues();
      setSettings(prevSettings => 
        prevSettings.map(setting => ({
          ...setting,
          value: envValues[setting.key] ?? setting.value
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
      setSaveError(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const categories = {
    paths: 'Path Settings',
    general: 'General Settings',
    database: 'Database Configuration',
    media: 'Media Settings'
  };

  const handleChange = (key: string, value: string | number | boolean) => {
    setSettings(settings.map(setting => 
      setting.key === key ? { ...setting, value } : setting
    ));
    setSaveSuccess(false);
    setSaveError(null);
  };

  const filteredSettings = settings.filter(setting => setting.category === activeCategory);

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
          className={`btn btn-primary flex items-center gap-2 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
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

      <div className="flex gap-4 mb-6">
        {Object.entries(categories).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key as EnvSetting['category'])}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${activeCategory === key 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
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
                  checked={Boolean(setting.value)}
                  onChange={(e) => handleChange(setting.key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 
                              peer-focus:ring-indigo-800 rounded-full peer 
                              peer-checked:after:translate-x-full peer-checked:after:border-white 
                              after:content-[''] after:absolute after:top-[2px] after:start-[2px] 
                              after:bg-white after:border-gray-300 after:border after:rounded-full 
                              after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500">
                </div>
              </label>
            ) : (
              <input
                type={setting.type}
                value={String(setting.value)}
                onChange={(e) => handleChange(setting.key, 
                  setting.type === 'number' ? Number(e.target.value) : e.target.value
                )}
                className="input w-full"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}