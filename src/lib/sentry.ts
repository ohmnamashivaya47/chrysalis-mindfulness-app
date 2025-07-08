import * as Sentry from "@sentry/react";

// Initialize Sentry with your DSN
Sentry.init({
  dsn: "https://8b5f2e9a4c6d3f7a1e8c9b2d5a7f3e1b@o4506384731942912.ingest.sentry.io/4506384738561024",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of the transactions
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
});

export default Sentry;
