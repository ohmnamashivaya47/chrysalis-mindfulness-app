#!/usr/bin/env node

// CHRYSALIS - Backend Testing Script
// Tests all Netlify Functions endpoints for production readiness

const BASE_URL = 'https://chrysalis-presence-app.netlify.app/.netlify/functions';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️ ${msg}${colors.reset}`)
};

// Test data
const testUser = {
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  displayName: 'Test User'
};

let authToken = null;
let userId = null;
let friendUserId = null;
let groupId = null;

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { text: await response.text() };
    }

    return {
      ok: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: { error: error.message }
    };
  }
}

// Test functions
async function testAuth() {
  log.info('Testing Authentication...');

  // Test registration
  log.info('Testing user registration...');
  const registerResult = await apiCall('/auth-register', {
    method: 'POST',
    body: JSON.stringify(testUser)
  });

  if (registerResult.ok && registerResult.data.success) {
    log.success('User registration successful');
    authToken = registerResult.data.data.token;
    userId = registerResult.data.data.user.id;
  } else {
    log.error(`Registration failed: ${registerResult.data.message || 'Unknown error'}`);
    return false;
  }

  // Test login
  log.info('Testing user login...');
  const loginResult = await apiCall('/auth-login', {
    method: 'POST',
    body: JSON.stringify({
      email: testUser.email,
      password: testUser.password
    })
  });

  if (loginResult.ok && loginResult.data.success) {
    log.success('User login successful');
    authToken = loginResult.data.data.token;
  } else {
    log.error(`Login failed: ${loginResult.data.message || 'Unknown error'}`);
    return false;
  }

  return true;
}

async function testProfile() {
  log.info('Testing Profile Management...');

  // Test get profile
  const profileResult = await apiCall('/users-profile');
  
  if (profileResult.ok && profileResult.data.success) {
    log.success('Profile retrieval successful');
  } else {
    log.error(`Profile retrieval failed: ${profileResult.data.message || 'Unknown error'}`);
    return false;
  }

  // Test update profile
  const updateResult = await apiCall('/users-profile', {
    method: 'PUT',
    body: JSON.stringify({
      displayName: 'Updated Test User'
    })
  });

  if (updateResult.ok && updateResult.data.success) {
    log.success('Profile update successful');
  } else {
    log.error(`Profile update failed: ${updateResult.data.message || 'Unknown error'}`);
    return false;
  }

  return true;
}

async function testSessions() {
  log.info('Testing Session Management...');

  // Test complete session
  const sessionData = {
    duration: 10,
    frequency: 'alpha',
    type: 'meditation',
    actualDuration: 600,
    paused: false,
    pauseCount: 0
  };

  const completeResult = await apiCall('/sessions-complete', {
    method: 'POST',
    body: JSON.stringify(sessionData)
  });

  if (completeResult.ok && completeResult.data.success) {
    log.success('Session completion successful');
  } else {
    log.error(`Session completion failed: ${completeResult.data.message || 'Unknown error'}`);
    return false;
  }

  // Test session history
  const historyResult = await apiCall('/sessions-history');
  
  if (historyResult.ok && historyResult.data.success) {
    log.success('Session history retrieval successful');
  } else {
    log.error(`Session history failed: ${historyResult.data.message || 'Unknown error'}`);
    return false;
  }

  return true;
}

async function testLeaderboards() {
  log.info('Testing Leaderboards...');

  // Test global leaderboard
  const globalResult = await apiCall('/leaderboards-global');
  
  if (globalResult.ok && globalResult.data.success) {
    log.success('Global leaderboard retrieval successful');
  } else {
    log.error(`Global leaderboard failed: ${globalResult.data.message || 'Unknown error'}`);
    return false;
  }

  // Test friends leaderboard
  const friendsResult = await apiCall('/leaderboards-friends');
  
  if (friendsResult.ok && friendsResult.data.success) {
    log.success('Friends leaderboard retrieval successful');
  } else {
    log.error(`Friends leaderboard failed: ${friendsResult.data.message || 'Unknown error'}`);
    return false;
  }

  return true;
}

async function testGroups() {
  log.info('Testing Groups...');

  // Test create group
  const createResult = await apiCall('/groups-create', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test Group',
      description: 'A test meditation group',
      isPublic: true
    })
  });

  if (createResult.ok && createResult.data.success) {
    log.success('Group creation successful');
    groupId = createResult.data.data.group.id;
  } else {
    log.error(`Group creation failed: ${createResult.data.message || 'Unknown error'}`);
    return false;
  }

  // Test list groups
  const listResult = await apiCall('/groups-list');
  
  if (listResult.ok && listResult.data.success) {
    log.success('Groups list retrieval successful');
  } else {
    log.error(`Groups list failed: ${listResult.data.message || 'Unknown error'}`);
    return false;
  }

  return true;
}

async function testWisdomQuotes() {
  log.info('Testing Wisdom Quotes...');

  const quotesResult = await apiCall('/wisdom-quotes-db');
  
  if (quotesResult.ok && quotesResult.data.success) {
    log.success('Wisdom quotes retrieval successful');
  } else {
    log.error(`Wisdom quotes failed: ${quotesResult.data.message || 'Unknown error'}`);
    return false;
  }

  return true;
}

// Main test runner
async function runTests() {
  console.log(`${colors.blue}
╔══════════════════════════════════════════════════════════════════╗
║                     CHRYSALIS BACKEND TESTS                     ║
║                    Testing Production Deployment                 ║
╚══════════════════════════════════════════════════════════════════╝
${colors.reset}`);

  const testResults = [];

  // Run all tests
  testResults.push({ name: 'Authentication', result: await testAuth() });
  testResults.push({ name: 'Profile Management', result: await testProfile() });
  testResults.push({ name: 'Session Management', result: await testSessions() });
  testResults.push({ name: 'Leaderboards', result: await testLeaderboards() });
  testResults.push({ name: 'Groups', result: await testGroups() });
  testResults.push({ name: 'Wisdom Quotes', result: await testWisdomQuotes() });

  // Summary
  console.log(`\n${colors.blue}═══════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}                            TEST RESULTS${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════════════════════════${colors.reset}`);

  let passed = 0;
  let failed = 0;

  testResults.forEach(test => {
    if (test.result) {
      log.success(`${test.name}: PASSED`);
      passed++;
    } else {
      log.error(`${test.name}: FAILED`);
      failed++;
    }
  });

  console.log(`\n${colors.blue}Final Score: ${passed}/${testResults.length} tests passed${colors.reset}`);
  
  if (failed === 0) {
    log.success('🎉 ALL TESTS PASSED! Backend is production ready!');
  } else {
    log.error(`❌ ${failed} tests failed. Backend needs fixes before production.`);
  }

  return failed === 0;
}

// Run the tests
runTests().catch(console.error);
