import { useAuth } from './useAuth';

/**
 * Hook to get headers for edge function requests, including legacy token if needed
 */
export function useEdgeFunctionHeaders() {
  const { authMode } = useAuth();

  return {
    getHeaders: (): Record<string, string> => {
      const headers: Record<string, string> = {};

      if (authMode === 'legacy') {
        const legacySession = sessionStorage.getItem('liremagie_session');
        const legacyUserJson = sessionStorage.getItem('liremagie_user');
        
        if (legacySession && legacyUserJson) {
          headers['x-legacy-token'] = legacySession;
          try {
            const legacyUser = JSON.parse(legacyUserJson);
            if (legacyUser.id) {
              headers['x-legacy-user-id'] = legacyUser.id;
            }
          } catch (e) {
            console.error('Failed to parse legacy user:', e);
          }
        }
      }

      return headers;
    },
  };
}
