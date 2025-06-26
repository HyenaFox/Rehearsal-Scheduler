// Simple syntax check and module verification
try {
  require('./src/app');
  console.log('✅ App syntax check passed');
  process.exit(0);
} catch (error) {
  console.error('❌ App syntax check failed:', error.message);
  process.exit(1);
}
