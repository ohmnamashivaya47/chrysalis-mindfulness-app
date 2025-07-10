const { handler } = require('./netlify/functions/admin-cleanup.js');

// Simulate a POST request event
const event = {
  httpMethod: 'POST',
  body: JSON.stringify({
    cleanupToken: 'CHRYSALIS_CLEANUP_2024'
  })
};

const context = {};

handler(event, context)
  .then(result => {
    console.log('Cleanup result:', result);
  })
  .catch(error => {
    console.error('Cleanup error:', error);
  });
