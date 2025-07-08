// CHRYSALIS - Backend API Test Script
// Tests all major endpoints on the new Express API

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const TEST_USER = {
  email: 'test@chrysalis.app',
  password: 'testpassword123',
  username: 'testuser',
  full_name: 'Test User'
};

let authToken = '';
let userId = '';

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    
    const req = protocol.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            data: response,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: body,
            headers: res.headers
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Parse URL
function parseUrl(url) {
  const urlObj = new URL(url);
  return {
    protocol: urlObj.protocol,
    hostname: urlObj.hostname,
    port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
    path: urlObj.pathname + urlObj.search
  };
}

// Test functions
async function testHealthCheck() {
  console.log('\n🔍 Testing Health Check...');
  try {
    const urlParts = parseUrl(`${BASE_URL}/health`);
    const options = {
      ...urlParts,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      console.log('✅ Health check passed');
      console.log(`   Status: ${response.data.status}`);
      console.log(`   Service: ${response.data.service}`);
      return true;
    } else {
      console.log(`❌ Health check failed: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Health check error: ${error.message}`);
    return false;
  }
}

async function testUserRegistration() {
  console.log('\n🔍 Testing User Registration...');
  try {
    const urlParts = parseUrl(`${BASE_URL}/api/auth/register`);
    const options = {
      ...urlParts,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const response = await makeRequest(options, TEST_USER);
    
    if (response.statusCode === 201 || (response.statusCode === 409 && response.data.error === 'User already exists')) {
      console.log('✅ User registration test passed');
      if (response.data.user) {
        userId = response.data.user.id;
        authToken = response.data.token;
        console.log(`   User ID: ${userId}`);
      }
      return true;
    } else {
      console.log(`❌ User registration failed: ${response.statusCode}`);
      console.log(`   Error: ${response.data.error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ User registration error: ${error.message}`);
    return false;
  }
}

async function testUserLogin() {
  console.log('\n🔍 Testing User Login...');
  try {
    const urlParts = parseUrl(`${BASE_URL}/api/auth/login`);
    const options = {
      ...urlParts,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const loginData = {
      email: TEST_USER.email,
      password: TEST_USER.password
    };
    
    const response = await makeRequest(options, loginData);
    
    if (response.statusCode === 200) {
      console.log('✅ User login passed');
      authToken = response.data.token;
      userId = response.data.user.id;
      console.log(`   User ID: ${userId}`);
      return true;
    } else {
      console.log(`❌ User login failed: ${response.statusCode}`);
      console.log(`   Error: ${response.data.error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ User login error: ${error.message}`);
    return false;
  }
}

async function testGetProfile() {
  console.log('\n🔍 Testing Get Profile...');
  try {
    const urlParts = parseUrl(`${BASE_URL}/api/users/profile`);
    const options = {
      ...urlParts,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      console.log('✅ Get profile passed');
      console.log(`   Username: ${response.data.user.username}`);
      console.log(`   Email: ${response.data.user.email}`);
      return true;
    } else {
      console.log(`❌ Get profile failed: ${response.statusCode}`);
      console.log(`   Error: ${response.data.error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Get profile error: ${error.message}`);
    return false;
  }
}

async function testWisdomQuotes() {
  console.log('\n🔍 Testing Wisdom Quotes...');
  try {
    const urlParts = parseUrl(`${BASE_URL}/api/wisdom/quotes`);
    const options = {
      ...urlParts,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      console.log('✅ Wisdom quotes passed');
      if (response.data.quotes) {
        console.log(`   Quote: "${response.data.quotes.text ? response.data.quotes.text.substring(0, 50) + '...' : 'No text'}"`);
        console.log(`   Author: ${response.data.quotes.author || 'Unknown'}`);
      }
      return true;
    } else {
      console.log(`❌ Wisdom quotes failed: ${response.statusCode}`);
      console.log(`   Error: ${response.data.error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Wisdom quotes error: ${error.message}`);
    return false;
  }
}

async function testLeaderboards() {
  console.log('\n🔍 Testing Leaderboards...');
  try {
    const urlParts = parseUrl(`${BASE_URL}/api/leaderboards/global`);
    const options = {
      ...urlParts,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      console.log('✅ Leaderboards passed');
      console.log(`   Type: ${response.data.type}`);
      console.log(`   Period: ${response.data.period}`);
      console.log(`   Entries: ${response.data.leaderboard ? response.data.leaderboard.length : 0}`);
      return true;
    } else {
      console.log(`❌ Leaderboards failed: ${response.statusCode}`);
      console.log(`   Error: ${response.data.error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Leaderboards error: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Chrysalis Backend API Tests');
  console.log(`🔗 Base URL: ${BASE_URL}`);
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'User Registration', fn: testUserRegistration },
    { name: 'User Login', fn: testUserLogin },
    { name: 'Get Profile', fn: testGetProfile },
    { name: 'Wisdom Quotes', fn: testWisdomQuotes },
    { name: 'Leaderboards', fn: testLeaderboards }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await test.fn();
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Backend is ready for deployment.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the backend configuration.');
  }
}

// Run tests
runTests().catch(console.error);
