import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Adjust this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Debug mode in development
  debug: process.env.NODE_ENV === 'development',

  // Environment
  environment: process.env.NODE_ENV || 'development',

  // Custom tags for edge runtime
  initialScope: {
    tags: {
      platform: 'godot-tekko',
      component: 'edge',
      runtime: 'edge'
    }
  },
});

export { Sentry };
