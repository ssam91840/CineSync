import { env } from '../config/env.config';

let currentEnv = { ...env };

export const getEnvironmentValue = (key: keyof typeof env): string | number | boolean | undefined => {
  return currentEnv[key];
};

export const getFileCount = async (_dir: string): Promise<number> => {
  // Simulated API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(Math.floor(Math.random() * 1000) + 100);
    }, 500);
  });
};

export const calculateTotalSize = async (_dir: string): Promise<string> => {
  // Simulated directory size calculation
  return new Promise((resolve) => {
    setTimeout(() => {
      const sizes = ['GB', 'TB'];
      const size = Math.floor(Math.random() * 900) + 100;
      const unit = sizes[Math.floor(Math.random() * sizes.length)];
      resolve(`${(size / 100).toFixed(1)} ${unit}`);
    }, 500);
  });
};

export const getNewAdditions = async (_dir: string): Promise<number> => {
  // Simulated new files count
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(Math.floor(Math.random() * 50) + 1);
    }, 500);
  });
};

export const getLastScanDate = async (_dir: string): Promise<string> => {
  // Simulated last scan date
  return new Promise((resolve) => {
    setTimeout(() => {
      const date = new Date();
      date.setHours(date.getHours() - Math.floor(Math.random() * 24));
      resolve(date.toISOString());
    }, 500);
  });
};

const API_URL = 'http://localhost:3001';

export const saveEnvironmentValues = async (settings: { key: string; value: string | number | boolean }[]) => {
  try {
    const response = await fetch(`${API_URL}/api/settings/environment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ settings }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save environment settings');
    }

    const result = await response.json();
    
    // Update current environment values after successful save
    settings.forEach(({ key, value }) => {
      currentEnv = {
        ...currentEnv,
        [key]: value
      };
    });

    return result;
  } catch (error) {
    console.error('Error saving environment settings:', error);
    throw error;
  }
};

export const getEnvironmentValues = async () => {
  try {
    const response = await fetch(`${API_URL}/api/settings/environment`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch environment settings');
    }

    const data = await response.json();
    
    // Update current environment values after fetch
    currentEnv = {
      ...currentEnv,
      ...data.settings
    };
    
    return data.settings;
  } catch (error) {
    console.error('Error fetching environment settings:', error);
    throw error;
  }
};