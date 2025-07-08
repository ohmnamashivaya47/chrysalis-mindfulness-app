#!/usr/bin/env node

// CHRYSALIS - Express Backend Testing Script
// Tests all Express API endpoints for production readiness

// Node.js 18+ has native fetch
global.fetch = global.fetch || require('node-fetch');

const BASE_URL = 'http://localhost:3001/api';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️ ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}🔍 ${msg}${colors.reset}`)
};

// Test data
const testUser1 = {
  email: `test1-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  display_name: 'Test User One'
};

const testUser2 = {
  email: `test2-${Date.now()}@example.com`,
  password: 'TestPassword456!',
  display_name: 'Test User Two'
};

let authToken1 = null;
let authToken2 = null;
let userId1 = null;
let userId2 = null;
let sessionId = null;
let groupId = null;

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json();
    
    return {
      status: response.status,
      ok: response.ok,
      data
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

// Helper function to make authenticated API calls
async function authApiCall(endpoint, options = {}, token = authToken1) {
  return apiCall(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`
    }
  });
}

// Test functions
async function testHealthCheck() {
  log.section('Testing Health Check');
  
  const result = await apiCall('/health');
  
  if (result.ok && result.data.status === 'ok') {
    log.success('Health check passed');
    return true;
  } else {
    log.error(`Health check failed: ${JSON.stringify(result)}`);
    return false;
  }
}

async function testAuth() {
  log.section('Testing Authentication');
  
  // Test registration for user 1
  log.info('Testing user 1 registration...');
  const registerResult1 = await apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify(testUser1)
  });
  
  if (registerResult1.ok && registerResult1.data.token) {
    authToken1 = registerResult1.data.token;
    userId1 = registerResult1.data.user.id;
    log.success(`User 1 registered successfully. ID: ${userId1}`);
  } else {
    log.error(`User 1 registration failed: ${JSON.stringify(registerResult1.data)}`);
    return false;
  }
  
  // Test registration for user 2
  log.info('Testing user 2 registration...');
  const registerResult2 = await apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify(testUser2)
  });
  
  if (registerResult2.ok && registerResult2.data.token) {
    authToken2 = registerResult2.data.token;
    userId2 = registerResult2.data.user.id;
    log.success(`User 2 registered successfully. ID: ${userId2}`);
  } else {
    log.error(`User 2 registration failed: ${JSON.stringify(registerResult2.data)}`);
    return false;
  }
  
  // Test login for user 1
  log.info('Testing user 1 login...');
  const loginResult = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testUser1.email,
      password: testUser1.password
    })
  });
  
  if (loginResult.ok && loginResult.data.token) {
    log.success('User 1 login successful');
  } else {
    log.error(`User 1 login failed: ${JSON.stringify(loginResult.data)}`);
    return false;
  }
  
  return true;
}

async function testUserProfile() {
  log.section('Testing User Profile');
  
  // Test getting profile
  log.info('Testing get profile...');
  const profileResult = await authApiCall('/users/profile');
  
  if (profileResult.ok && profileResult.data.id === userId1) {
    log.success('Profile retrieved successfully');
  } else {
    log.error(`Profile retrieval failed: ${JSON.stringify(profileResult.data)}`);
    return false;
  }
  
  // Test updating profile
  log.info('Testing profile update...');
  const updateResult = await authApiCall('/users/profile', {
    method: 'PUT',
    body: JSON.stringify({
      display_name: 'Updated Test User',
      bio: 'This is a test bio'
    })
  });
  
  if (updateResult.ok) {
    log.success('Profile updated successfully');
  } else {
    log.error(`Profile update failed: ${JSON.stringify(updateResult.data)}`);
    return false;
  }
  
  return true;
}

async function testSessions() {
  log.section('Testing Meditation Sessions');
  
  // Test starting a session
  log.info('Testing session start...');
  const startResult = await authApiCall('/sessions/start', {
    method: 'POST',
    body: JSON.stringify({
      type: 'breathing',
      duration: 300
    })
  });
  
  if (startResult.ok && startResult.data.session_id) {
    sessionId = startResult.data.session_id;
    log.success(`Session started. ID: ${sessionId}`);
  } else {
    log.error(`Session start failed: ${JSON.stringify(startResult.data)}`);
    return false;
  }
  
  // Test completing a session
  log.info('Testing session completion...');
  const completeResult = await authApiCall('/sessions/complete', {
    method: 'POST',
    body: JSON.stringify({
      session_id: sessionId,
      actual_duration: 300,
      mood_before: 3,
      mood_after: 4
    })
  });
  
  if (completeResult.ok) {
    log.success('Session completed successfully');
  } else {
    log.error(`Session completion failed: ${JSON.stringify(completeResult.data)}`);
    return false;
  }
  
  // Test getting session history
  log.info('Testing session history...');
  const historyResult = await authApiCall('/sessions/history');
  
  if (historyResult.ok && Array.isArray(historyResult.data)) {
    log.success(`Session history retrieved. ${historyResult.data.length} sessions found`);
  } else {
    log.error(`Session history failed: ${JSON.stringify(historyResult.data)}`);
    return false;
  }
  
  return true;
}

async function testFriends() {
  log.section('Testing Friends System');
  
  // Test searching for users
  log.info('Testing user search...');
  const searchResult = await authApiCall(`/friends/search?query=${testUser2.display_name}`);
  
  if (searchResult.ok && Array.isArray(searchResult.data)) {
    log.success(`User search successful. Found ${searchResult.data.length} users`);
  } else {
    log.error(`User search failed: ${JSON.stringify(searchResult.data)}`);
    return false;
  }
  
  // Test sending friend request
  log.info('Testing friend request...');
  const requestResult = await authApiCall('/friends/add', {
    method: 'POST',
    body: JSON.stringify({
      friend_id: userId2
    })
  });
  
  if (requestResult.ok) {
    log.success('Friend request sent successfully');
  } else {
    log.error(`Friend request failed: ${JSON.stringify(requestResult.data)}`);
    return false;
  }
  
  // Test accepting friend request (as user 2)
  log.info('Testing friend request acceptance...');
  const acceptResult = await authApiCall('/friends/accept', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId1
    })
  }, authToken2);
  
  if (acceptResult.ok) {
    log.success('Friend request accepted successfully');
  } else {
    log.error(`Friend request acceptance failed: ${JSON.stringify(acceptResult.data)}`);
    return false;
  }
  
  // Test getting friends list
  log.info('Testing friends list...');
  const friendsResult = await authApiCall('/friends/list');
  
  if (friendsResult.ok && Array.isArray(friendsResult.data)) {
    log.success(`Friends list retrieved. ${friendsResult.data.length} friends found`);
  } else {
    log.error(`Friends list failed: ${JSON.stringify(friendsResult.data)}`);
    return false;
  }
  
  return true;
}

async function testGroups() {
  log.section('Testing Groups System');
  
  // Test creating a group
  log.info('Testing group creation...');
  const createResult = await authApiCall('/groups/create', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test Meditation Group',
      description: 'A test group for meditation',
      is_private: false
    })
  });
  
  if (createResult.ok && createResult.data.group_id) {
    groupId = createResult.data.group_id;
    log.success(`Group created successfully. ID: ${groupId}`);
  } else {
    log.error(`Group creation failed: ${JSON.stringify(createResult.data)}`);
    return false;
  }
  
  // Test joining group (as user 2)
  log.info('Testing group join...');
  const joinResult = await authApiCall('/groups/join', {
    method: 'POST',
    body: JSON.stringify({
      group_id: groupId
    })
  }, authToken2);
  
  if (joinResult.ok) {
    log.success('Group joined successfully');
  } else {
    log.error(`Group join failed: ${JSON.stringify(joinResult.data)}`);
    return false;
  }
  
  // Test getting groups list
  log.info('Testing groups list...');
  const groupsResult = await authApiCall('/groups/list');
  
  if (groupsResult.ok && Array.isArray(groupsResult.data)) {
    log.success(`Groups list retrieved. ${groupsResult.data.length} groups found`);
  } else {
    log.error(`Groups list failed: ${JSON.stringify(groupsResult.data)}`);
    return false;
  }
  
  return true;
}

async function testLeaderboards() {
  log.section('Testing Leaderboards');
  
  // Test global leaderboard
  log.info('Testing global leaderboard...');
  const globalResult = await authApiCall('/leaderboards/global');
  
  if (globalResult.ok && Array.isArray(globalResult.data)) {
    log.success(`Global leaderboard retrieved. ${globalResult.data.length} entries found`);
  } else {
    log.error(`Global leaderboard failed: ${JSON.stringify(globalResult.data)}`);
    return false;
  }
  
  // Test friends leaderboard
  log.info('Testing friends leaderboard...');
  const friendsResult = await authApiCall('/leaderboards/friends');
  
  if (friendsResult.ok && Array.isArray(friendsResult.data)) {
    log.success(`Friends leaderboard retrieved. ${friendsResult.data.length} entries found`);
  } else {
    log.error(`Friends leaderboard failed: ${JSON.stringify(friendsResult.data)}`);
    return false;
  }
  
  return true;
}

async function testWisdomQuotes() {
  log.section('Testing Wisdom Quotes');
  
  // Test getting daily quote
  log.info('Testing daily wisdom quote...');
  const quoteResult = await apiCall('/wisdom/daily');
  
  if (quoteResult.ok && quoteResult.data.text) {
    log.success(`Daily quote retrieved: "${quoteResult.data.text.substring(0, 50)}..."`);
  } else {
    log.error(`Daily quote failed: ${JSON.stringify(quoteResult.data)}`);
    return false;
  }
  
  return true;
}

async function testPresence() {
  log.section('Testing Presence System');
  
  // Test updating presence
  log.info('Testing presence update...');
  const updateResult = await authApiCall('/presence/update', {
    method: 'POST',
    body: JSON.stringify({
      is_active: true,
      current_activity: 'meditation'
    })
  });
  
  if (updateResult.ok) {
    log.success('Presence updated successfully');
  } else {
    log.error(`Presence update failed: ${JSON.stringify(updateResult.data)}`);
    return false;
  }
  
  // Test getting presence sessions
  log.info('Testing presence sessions...');
  const sessionsResult = await authApiCall('/presence/sessions');
  
  if (sessionsResult.ok && Array.isArray(sessionsResult.data)) {
    log.success(`Presence sessions retrieved. ${sessionsResult.data.length} sessions found`);
  } else {
    log.error(`Presence sessions failed: ${JSON.stringify(sessionsResult.data)}`);
    return false;
  }
  
  return true;
}

// Main test runner
async function runAllTests() {
  console.log(`${colors.cyan}🧪 CHRYSALIS EXPRESS BACKEND TESTING${colors.reset}`);
  console.log(`${colors.cyan}Base URL: ${BASE_URL}${colors.reset}\n`);
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Authentication', fn: testAuth },
    { name: 'User Profile', fn: testUserProfile },
    { name: 'Meditation Sessions', fn: testSessions },
    { name: 'Friends System', fn: testFriends },
    { name: 'Groups System', fn: testGroups },
    { name: 'Leaderboards', fn: testLeaderboards },
    { name: 'Wisdom Quotes', fn: testWisdomQuotes },
    { name: 'Presence System', fn: testPresence }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passedTests++;
      }
    } catch (error) {
      log.error(`${test.name} test threw an error: ${error.message}`);
    }
  }
  
  console.log(`\n${colors.cyan}📊 TEST RESULTS${colors.reset}`);
  console.log(`${colors.green}✅ Passed: ${passedTests}/${totalTests}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${totalTests - passedTests}/${totalTests}${colors.reset}`);
  
  if (passedTests === totalTests) {
    log.success('🎉 All tests passed! Backend is ready for production.');
  } else {
    log.error('❌ Some tests failed. Please review and fix issues before deployment.');
  }
  
  return passedTests === totalTests;
}

// Check if server is running
async function checkServer() {
  log.info('Checking if Express server is running...');
  try {
    const response = await fetch(`${BASE_URL}/health`);
    if (response.ok) {
      log.success('Express server is running!');
      return true;
    }
  } catch (error) {
    log.error('Express server is not running. Please start it with: cd backend && npm start');
    return false;
  }
}

// Run tests
(async () => {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await runAllTests();
  }
})();
