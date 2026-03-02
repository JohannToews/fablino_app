export const FEATURES = {
  NEW_FABLINO_HOME: true,
  /** Global toggle – set to true to enable series for all users */
  SERIES_ENABLED: true,
  /** UI toggle – set to false to hide series creation UI (toggle, mode selector, episode text) */
  SERIES_UI_ENABLED: false,
};

/**
 * Check if series creation is enabled for the given user role.
 * Currently admin-only for testing; flip SERIES_ENABLED to true for everyone.
 */
export const isSeriesEnabled = (role?: string): boolean =>
  FEATURES.SERIES_ENABLED || role === 'admin';
