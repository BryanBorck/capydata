# Test Mode Setup Guide

## Overview
The Datagotchi app now supports test mode to enable development and testing without requiring MiniKit authentication. This allows you to test all functionality using hardcoded test data.

## Enabling Test Mode

### 1. Environment Variable
In your `.env.local` file, set:
```
NEXT_PUBLIC_APP_ENV="test"
```

### 2. Restart Development Server
After changing the environment variable, restart your Next.js development server:
```bash
npm run dev
# or
pnpm dev
```

## Test Mode Features

### Login Page (3 Options)
When test mode is enabled, the login page shows three buttons:

1. **Test with Existing Pet** (Green button)
   - Uses hardcoded wallet: `0x6b84bba6e67a124093933aba8f5b6beb96307d99`
   - Uses hardcoded pet ID: `82486b32-af21-403a-b1b8-b2aaec367d9c`
   - Logs in and goes directly to home page with the pet active
   - Username: `TestUserWithPet`

2. **Test as New User** (Outline button)
   - Uses test wallet: `test_wallet_new_user`
   - No existing pets - will go through onboarding flow
   - Username: `TestNewUser`

3. **Create Pet Directly** (Secondary button)
   - Bypasses login entirely
   - Goes directly to the create-pet page
   - Useful for testing pet creation UI

### What Gets Disabled in Test Mode
- MiniKit installation and initialization
- MiniKit wallet authentication
- Automatic redirects when already authenticated (allows re-testing login flows)
- MiniKit session verification

### Test Mode Indicator
When test mode is active, you'll see a yellow indicator at the bottom of the login page:
```
🧪 Test Mode Active
MiniKit authentication is disabled
```

## Environment Values

### Test Mode
```
NEXT_PUBLIC_APP_ENV="test"
```

### Development with MiniKit
```
NEXT_PUBLIC_APP_ENV="development"
```

### Production
```
NEXT_PUBLIC_APP_ENV="production"
```

## Testing Scenarios

### 1. Test Existing User Flow
1. Set environment to test mode
2. Click "Test with Existing Pet"
3. Should go to home page with the pet displayed
4. Test all home page functionality (select pet, add data, insights, etc.)

### 2. Test New User Flow
1. Set environment to test mode
2. Click "Test as New User"
3. Should go through onboarding flow
4. Create a new pet and test the full flow

### 3. Test Direct Pet Creation
1. Set environment to test mode
2. Click "Create Pet Directly"
3. Test pet creation UI without authentication

## Troubleshooting

### Can't see test buttons
- Verify `NEXT_PUBLIC_APP_ENV="test"` in .env.local
- Restart the development server
- Check browser console for test mode logs

### Pet not showing in home
- The hardcoded pet ID may not exist in your database
- Check Supabase for the pet with ID: `82486b32-af21-403a-b1b8-b2aaec367d9c`
- Or create a new pet and update the hardcoded ID in the login page

### Authentication still required
- Make sure to restart the server after changing environment variables
- Clear browser localStorage: `localStorage.clear()` 