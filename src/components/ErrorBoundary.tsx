import React, { Component, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error?.message || 'Unknown error' };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] App crashed:', error, errorInfo);
    this.logCrashToDb(error, errorInfo);
  }

  private async logCrashToDb(error: Error, errorInfo: React.ErrorInfo) {
    try {
      // Gather device/context info
      const ua = navigator.userAgent || '';
      const platform = navigator.platform || '';
      const url = window.location.href;

      // Try to get user/kid profile from sessionStorage
      let userId: string | null = null;
      let kidProfileId: string | null = null;
      try {
        userId = sessionStorage.getItem('user_id') || localStorage.getItem('user_id');
        kidProfileId = sessionStorage.getItem('selected_kid_profile_id');
      } catch { /* ignore */ }

      await supabase.from('crash_logs').insert({
        error_message: error?.message?.substring(0, 2000) || 'Unknown',
        error_stack: error?.stack?.substring(0, 4000) || null,
        component_stack: errorInfo?.componentStack?.substring(0, 4000) || null,
        url,
        user_agent: ua.substring(0, 1000),
        platform,
        user_id: userId,
        kid_profile_id: kidProfileId,
        extra: {
          timestamp: new Date().toISOString(),
          screenWidth: window.screen?.width,
          screenHeight: window.screen?.height,
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          online: navigator.onLine,
          language: navigator.language,
        },
      });
    } catch (logErr) {
      console.error('[ErrorBoundary] Failed to log crash:', logErr);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 px-6 text-center">
          <img
            src="/mascot/Logo.svg"
            alt="Fablino"
            className="w-32 h-32 mb-6 opacity-80"
          />
          <h1 className="text-2xl font-bold text-orange-800 mb-3">
            Ups, da ist etwas schiefgelaufen!
          </h1>
          <p className="text-orange-700 mb-8 max-w-sm text-lg">
            Keine Sorge — klicke einfach auf den Knopf und wir versuchen es nochmal.
          </p>
          <button
            onClick={this.handleRetry}
            className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-lg font-semibold shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            Nochmal versuchen
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
