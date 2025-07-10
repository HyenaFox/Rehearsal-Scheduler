#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Rehearsal Scheduler Setup...\n');

// Check if required files exist
const requiredFiles = [
  '.env',
  'backend/.env',
  'backend/src/app.js',
  'backend/src/models/database.js',
  'app/services/directMongo.js',
  'app/services/api.ts',
  'app/contexts/AppContext.tsx',
  'render.yaml'
];

const missingFiles = [];

requiredFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.log('❌ Missing required files:');
  missingFiles.forEach(file => {
    console.log(`   - ${file}`);
  });
  console.log('\n💡 Please ensure all required files are present.');
  process.exit(1);
}

console.log('✅ All required files present');

// Check .env configuration
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  if (envContent.includes('EXPO_PUBLIC_API_URL')) {
    console.log('✅ Frontend .env configured');
  } else {
    console.log('⚠️  Frontend .env missing API URL');
  }
} catch (error) {
  console.log('❌ Error reading frontend .env');
}

// Check backend .env configuration
try {
  const backendEnvContent = fs.readFileSync('backend/.env', 'utf8');
  if (backendEnvContent.includes('MONGODB_URI')) {
    console.log('✅ Backend .env configured');
  } else {
    console.log('⚠️  Backend .env missing MongoDB URI');
  }
} catch (error) {
  console.log('❌ Error reading backend .env');
}

// Check directMongo.js for backend API usage
try {
  const directMongoContent = fs.readFileSync('app/services/directMongo.js', 'utf8');
  if (directMongoContent.includes('baseUrl') && directMongoContent.includes('fetch')) {
    console.log('✅ directMongo.js using backend API');
  } else {
    console.log('⚠️  directMongo.js may not be using backend API');
  }
} catch (error) {
  console.log('❌ Error reading directMongo.js');
}

// Check package.json for correct dependencies
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const backendPackageJson = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
  
  console.log('✅ Package.json files readable');
  
  // Check for problematic dependencies
  const problematicDeps = ['realm', 'mongodb'];
  let foundProblematic = false;
  
  problematicDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`⚠️  Found ${dep} in frontend dependencies`);
      foundProblematic = true;
    }
  });
  
  if (!foundProblematic) {
    console.log('✅ No problematic dependencies found');
  }
  
} catch (error) {
  console.log('❌ Error reading package.json files');
}

console.log('\n🎯 Setup Validation Complete!');
console.log('\n📋 Next Steps:');
console.log('1. Start backend server: start-backend.bat');
console.log('2. Start frontend app: npm start');
console.log('3. Test endpoints: node test-backend-endpoints.js');
console.log('\n💡 See FINAL_SETUP_GUIDE.md for detailed instructions.');
