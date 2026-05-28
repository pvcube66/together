module.exports = {
  ci: {
    // Collect URLs; adjust if app runs on different port
    collect: {
      url: ['http://localhost:3000'],
      startServerCommand: 'npm start',
      numberOfRuns: 1,
    },
    // Assertions for performance metrics
    assert: {
      assertions: {
        // LCP should be less than 1.5 seconds (1500 ms)
        'performance:lcp': ['error', { maxNumericValue: 1500 }],
        // CLS should be less than 0.1
        'performance:cls': ['error', { maxNumericValue: 0.1 }],
      },
    },
    // Upload results to temporary public storage (no auth needed)
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
