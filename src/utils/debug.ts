export const DEBUG_MODE = import.meta.env.MODE === 'development' || 
                        import.meta.env.APP_LOG_LEVEL === 'DEBUG';

export const debug = (message: string, data?: any) => {
  if (DEBUG_MODE) {
    console.log(`[DEBUG] ${message}`, data || '');
  }
}; 