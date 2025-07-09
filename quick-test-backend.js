#!/usr/bin/env node

// CHRYSALIS - Simple Backend Test Script
// Quick validation of key endpoints using curl

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

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

async function curlTest(endpoint, options = {}) {
  try {
    const method = options.method || 'GET';
    const headers = options.headers || [];
    const data = options.data;
    
    let curlCmd = `curl -s -X ${method}`;
    
    // Add headers
    headers.forEach(header => {
      curlCmd += ` -H "${header}"`;
    });
    
    // Add data for POST/PUT
    if (data) {
      curlCmd += ` -d '${JSON.stringify(data)}'`;
    }
    
    curlCmd += ` "${BASE_URL}${endpoint}"`;
    
    const { stdout, stderr } = await execAsync(curlCmd);
    
    if (stderr) {
      return { error: stderr };
    }
    
    try {
      return { data: JSON.parse(stdout) };
    } catch (e) {
      return { data: stdout };
    }
  } catch (error) {
    return { error: error.message };
  }
}

async function testHealthCheck() {
  log.section('Testing Health Check');
  
  const result = await curlTest('/health');
  
  if (result.data && result.data.status === 'ok') {
    log.success('Health check passed');
    return true;
  } else {
    log.error(`Health check failed: ${JSON.stringify(result)}`);
    return false;
  }
}

async function testUserRegistration() {
  log.section('Testing User Registration');
  
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    display_name: 'Test User'
  };
  
  const result = await curlTest('/auth/register', {
    method: 'POST',
    headers: ['Content-Type: application/json'],
    data: testUser
  });
  
  if (result.data && result.data.success && result.data.token) {
    log.success(`User registration successful. Token: ${result.data.token.substring(0, 20)}...`);
    return { success: true, token: result.data.token, user: result.data.user };
  } else {
    log.error(`User registration failed: ${JSON.stringify(result)}`);
    return { success: false };
  }
}

async function testUserLogin(email, password) {
  log.section('Testing User Login');
  
  const result = await curlTest('/auth/login', {
    method: 'POST',
    headers: ['Content-Type: application/json'],
    data: { email, password }
  });
  
  if (result.data && result.data.success && result.data.token) {
    log.success(`User login successful. Token: ${result.data.token.substring(0, 20)}...`);
    return { success: true, token: result.data.token };
  } else {
    log.error(`User login failed: ${JSON.stringify(result)}`);
    return { success: false };
  }
}

async function testUserProfile(token) {
  log.section('Testing User Profile');
  
  const result = await curlTest('/users/profile', {
    headers: [`Authorization: Bearer ${token}`]
  });
  
  if (result.data && result.data.id) {
    log.success(`Profile retrieved. ID: ${result.data.id}, Name: ${result.data.display_name}`);
    return { success: true, user: result.data };
  } else {
    log.error(`Profile retrieval failed: ${JSON.stringify(result)}`);
    return { success: false };
  }
}

async function testWisdomQuote() {
  log.section('Testing Wisdom Quote');
  
  const result = await curlTest('/wisdom/daily');
  
  if (result.data && result.data.text) {
    log.success(`Wisdom quote retrieved: "${result.data.text.substring(0, 50)}..."`);
    return { success: true };
  } else {
    log.error(`Wisdom quote failed: ${JSON.stringify(result)}`);
    return { success: false };
  }
}

async function testSessionStart(token) {
  log.section('Testing Session Start');
  
  const result = await curlTest('/sessions/start', {
    method: 'POST',
    headers: ['Content-Type: application/json', `Authorization: Bearer ${token}`],
    data: {
      type: 'breathing',
      duration: 300
    }
  });
  
  if (result.data && result.data.session_id) {
    log.success(`Session started. ID: ${result.data.session_id}`);
    return { success: true, sessionId: result.data.session_id };
  } else {
    log.error(`Session start failed: ${JSON.stringify(result)}`);
    return { success: false };
  }
}

async function runQuickTests() {
  console.log(`${colors.cyan}🧪 CHRYSALIS EXPRESS BACKEND - QUICK TESTS${colors.reset}`);
  console.log(`${colors.cyan}Base URL: ${BASE_URL}${colors.reset}\n`);
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test 1: Health Check
  totalTests++;
  if (await testHealthCheck()) passedTests++;
  
  // Test 2: User Registration
  totalTests++;
  const registerResult = await testUserRegistration();
  if (registerResult.success) {
    passedTests++;
    
    const { token, user } = registerResult;
    
    // Test 3: User Login
    totalTests++;
    const loginResult = await testUserLogin(user.email, 'TestPassword123!');
    if (loginResult.success) passedTests++;
    
    // Test 4: User Profile
    totalTests++;
    const profileResult = await testUserProfile(token);
    if (profileResult.success) passedTests++;
    
    // Test 5: Session Start
    totalTests++;
    const sessionResult = await testSessionStart(token);
    if (sessionResult.success) passedTests++;
  }
  
  // Test 6: Wisdom Quote (no auth required)
  totalTests++;
  if (await testWisdomQuote()) passedTests++;
  
  console.log(`\n${colors.cyan}📊 TEST RESULTS${colors.reset}`);
  console.log(`${colors.green}✅ Passed: ${passedTests}/${totalTests}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${totalTests - passedTests}/${totalTests}${colors.reset}`);
  
  if (passedTests === totalTests) {
    log.success('🎉 All key tests passed! Backend core functionality is working.');
  } else {
    log.error('❌ Some tests failed. Please review and fix issues.');
  }
  
  return passedTests === totalTests;
}

// Run tests
runQuickTests().catch(console.error);
