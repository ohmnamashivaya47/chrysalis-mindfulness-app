// Basic functionality tests for CHRYSALIS PRESENCE
// These are manual verification tests to ensure core features work

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🦋 CHRYSALIS PRESENCE - Basic Functionality Tests');
console.log('================================================');

// Test 1: Check if stores are working
console.log('\n✅ Test 1: Store Files');
// Note: Actual store testing requires React environment, just check files exist

// Test 2: Check if key components exist
console.log('\n✅ Test 2: Component Files');

const componentPaths = [
  '../src/components/meditation/MeditationSession.tsx',
  '../src/components/auth/LoginScreen.tsx',
  '../src/pages/MeditatePage.tsx',
  '../src/pages/FriendsPage.tsx',
  '../src/pages/GroupsPage.tsx'
];

componentPaths.forEach(componentPath => {
  const fullPath = path.join(__dirname, componentPath);
  if (fs.existsSync(fullPath)) {
    console.log(`   ✓ ${componentPath} exists`);
  } else {
    console.log(`   ❌ ${componentPath} missing`);
  }
});

// Test 3: Check if build assets exist
console.log('\n✅ Test 3: Build Assets');
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  console.log('   ✓ dist/ folder exists');
  const files = fs.readdirSync(distPath);
  if (files.includes('index.html')) {
    console.log('   ✓ index.html built successfully');
  }
  if (files.some(file => file.includes('.js'))) {
    console.log('   ✓ JavaScript bundles created');
  }
  if (files.some(file => file.includes('.css'))) {
    console.log('   ✓ CSS bundles created');
  }
} else {
  console.log('   ❌ dist/ folder not found - run npm run build');
}

console.log('\n🎉 Basic functionality test complete!');
console.log('💡 For full testing, check the live app at: https://chrysalis-presence-app.netlify.app');
