import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Adjust this value in production based on volume
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Performance profiling
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Debug mode in development
  debug: process.env.NODE_ENV === 'development',

  // Environment
  environment: process.env.NODE_ENV || 'development',

  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'development',

  // Server-specific configuration
  beforeSend(event, hint) {
    // Filter out non-critical server errors in production
    if (process.env.NODE_ENV === 'production') {
      const error = hint.originalException;

      // Filter out common false positives
      if (error && typeof error === 'object' && 'message' in error) {
        const message = error.message?.toLowerCase() || '';
        if (
          message.includes('enotfound') ||
          message.includes('econnreset') ||
          message.includes('timeout') ||
          message.includes('aborted')
        ) {
          return null;
        }
      }

      // Filter out low-value errors
      if (event.exception?.values?.[0]?.value?.includes('Cannot read property')) {
        return null;
      }
    }

    return event;
  },

  // Enhanced server-side breadcrumbs
  beforeBreadcrumb(breadcrumb, hint) {
    // Add server context to breadcrumbs
    if (breadcrumb.category === 'http' || breadcrumb.category === 'db') {
      breadcrumb.level = 'info';
    }

    // Filter out noisy breadcrumbs in production
    if (process.env.NODE_ENV === 'production') {
      if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
        return null;
      }
    }

    return breadcrumb;
  },

  // Server-specific integrations
  integrations: [
    // Add database integration if using Prisma/MongoDB
    Sentry.prismaIntegration(),

    // Add Node.js specific integrations
    Sentry.nodeProfilingIntegration(),
  ],

  // Custom tags for server-side events
  initialScope: {
    tags: {
      platform: 'godot-tekko',
      component: 'backend',
      runtime: 'nodejs'
    },
    context: {
      server: {
        node_version: process.version,
        platform: process.platform,
        arch: process.arch
      }
    }
  },

  // Transport options
  transportOptions: {
    // Use Node.js http module
    headers: {
      'User-Agent': 'Godot-Tekko-Server/1.0'
    },
  },

  // Server-specific sampling
  tracesSampler: (samplingContext) => {
    // Sample differently based on operation
    const { name, parentSampled, attributes } = samplingContext;

    // High priority operations
    if (name?.includes('checkout') || name?.includes('payment')) {
      return 1.0; // 100% sampling for critical operations
    }

    // Medium priority operations
    if (name?.includes('auth') || name?.includes('user')) {
      return 0.5; // 50% sampling
    }

    // Low priority operations
    if (name?.includes('analytics') || name?.includes('tracking')) {
      return 0.1; // 10% sampling
    }

    // Default sampling rate
    return process.env.NODE_ENV === 'production' ? 0.1 : 1.0;
  },
});

export { Sentry };

// Server-specific error reporting utilities
export const reportServerError = (error: Error, context?: {
  userId?: string;
  operation?: string;
  metadata?: Record<string, any>;
}) => {
  Sentry.withScope((scope) => {
    if (context?.userId) {
      scope.setUser({ id: context.userId });
    }

    if (context?.operation) {
      scope.setTag('operation', context.operation);
    }

    if (context?.metadata) {
      scope.setContext('operation_context', context.metadata);
    }

    Sentry.captureException(error);
  });
};

export const reportServerMessage = (
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, any>
) => {
  Sentry.withScope((scope) => {
    scope.setLevel(level);
    if (context) {
      scope.setContext('server_context', context);
    }
    Sentry.captureMessage(message);
  });
};

export const addServerBreadcrumb = (
  message: string,
  category: string,
  level: 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, any>
) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
};
