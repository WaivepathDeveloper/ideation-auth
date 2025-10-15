import type { NextConfig } from "next";

/**
 * Build-Time Validation Layer (Layer 1 of 3-layer config defense)
 *
 * Validates Firebase environment variables before build starts.
 * Fails fast with clear error messages if any required variables are missing.
 */
function validateEnvVars() {
  const clientVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ] as const;

  const serverVars = [
    'FIREBASE_ADMIN_PROJECT_ID',
    'FIREBASE_ADMIN_CLIENT_EMAIL',
    'FIREBASE_ADMIN_PRIVATE_KEY',
    'AUTH_COOKIE_SIGNATURE_KEY_CURRENT',
  ] as const;

  const missingClient = clientVars.filter(varName => !process.env[varName]);
  const missingServer = serverVars.filter(varName => !process.env[varName]);
  const missing = [...missingClient, ...missingServer];

  if (missing.length > 0) {
    console.error('\n' + '='.repeat(70));
    console.error('❌ BUILD ERROR: Missing Environment Variables');
    console.error('='.repeat(70));
    console.error('\nThe following required environment variables are not set:\n');
    missing.forEach(varName => {
      console.error(`  - ${varName}`);
    });
    console.error('\n' + '─'.repeat(70));
    console.error('📋 To fix this:');
    console.error('  1. Copy .env.local.example to .env.local');
    console.error('  2. Fill in your Firebase project values');
    console.error('  3. Generate cookie signature keys:');
    console.error('     node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"');
    console.error('  4. Restart the build');
    console.error('\n💡 Get Firebase config from:');
    console.error('   Firebase Console → Project Settings');
    console.error('='.repeat(70) + '\n');
    process.exit(1);
  }

  console.log('✅ Environment variables validated');
}

// Run validation before build
validateEnvVars();

const nextConfig: NextConfig = {
  // Explicitly inline Firebase env vars for client bundle
  // This ensures Webpack can statically analyze and inline these values
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_USE_EMULATOR: process.env.NEXT_PUBLIC_USE_EMULATOR,
  },
};

export default nextConfig;
