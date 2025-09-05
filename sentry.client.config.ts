import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of the transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Set profilesSampleRate to 1.0 to profile every transaction.
  // Since profilesSampleRate is relative to tracesSampleRate,
  // the final profiling rate can be computed as tracesSampleRate * profilesSampleRate
  // For example, a tracesSampleRate of 0.5 and profilesSampleRate of 0.5 would
  // results in 25% of transactions being profiled (0.5*0.5=0.25)
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Debug mode in development
  debug: process.env.NODE_ENV === 'development',

  // Environment
  environment: process.env.NODE_ENV || 'development',

  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'development',

  // Enhanced error filtering
  beforeSend(event, hint) {
    // Filter out non-critical errors in production
    if (process.env.NODE_ENV === 'production') {
      const error = hint.originalException;

      // Filter out network errors that are often false positives
      if (error && typeof error === 'object' && 'message' in error) {
        const message = error.message?.toLowerCase() || '';
        if (
          message.includes('network error') ||
          message.includes('fetch') ||
          message.includes('load failed') ||
          message.includes('script error')
        ) {
          return null;
        }
      }

      // Filter out low-value errors
      if (event.exception?.values?.[0]?.value?.includes('Non-Error promise rejection')) {
        return null;
      }
    }

    return event;
  },

  // Enhanced breadcrumbs
  beforeBreadcrumb(breadcrumb, hint) {
    // Add custom breadcrumbs for user actions
    if (breadcrumb.category === 'ui.click' || breadcrumb.category === 'navigation') {
      breadcrumb.level = 'info';
    }

    return breadcrumb;
  },

  // Performance monitoring integrations
  integrations: [
    Sentry.replayIntegration({
      // Capture 10% of all sessions,
      // plus for 100% of sessions with an error
      sessionSampleRate: 0.1,
      errorSampleRate: 1.0,
      maskAllText: false,
      blockAllMedia: false,
    }),
    Sentry.feedbackIntegration({
      // Additional configuration goes here
      colorScheme: "dark",
      showBranding: false,
    }),
  ],

  // Custom tags for better filtering
  initialScope: {
    tags: {
      platform: 'godot-tekko',
      component: 'frontend'
    },
    user: {
      segment: 'anonymous'
    }
  },

  // Allowed URLs (prevents noise from browser extensions)
  allowUrls: [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    /godot-tekko/,
  ],

  // Transport options for better reliability
  transportOptions: {
    // Use fetch instead of XHR
    fetchOptions: {
      keepalive: true,
    },
  },
});

// Export utilities for custom usage
export { Sentry };

// Custom error reporting utilities
export const reportError = (error: Error, context?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('error_context', context);
    }
    Sentry.captureException(error);
  });
};

export const reportMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    scope.setLevel(level);
    if (context) {
      scope.setContext('message_context', context);
    }
    Sentry.captureMessage(message);
  });
};

export const setUserContext = (user: { id?: string; email?: string; username?: string; role?: string }) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
    segment: user.role || 'user'
  });
};

export const addBreadcrumb = (message: string, category: string, level: 'info' | 'warning' | 'error' = 'info', data?: Record<string, any>) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
};
