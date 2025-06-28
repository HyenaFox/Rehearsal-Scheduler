# User Login Persistence Fix

## Issue

User login was not persisting - even after successful login, the ProfileScreen was showing the "Sign In/Register" button instead of the user profile.

## Root Cause

The ProfileScreen was checking `if (!user)` to determine whether to show the guest UI or the authenticated user UI, but it wasn't considering the `isLoading` state from AuthContext. This caused the following race condition:

1. App starts → AuthContext `isLoading = true`
2. ProfileScreen renders → sees `user = null` → shows guest UI immediately
3. AuthContext finishes loading → `isLoading = false`, `user = {...}`
4. ProfileScreen should re-render with user profile, but the guest UI was already shown

## Fix Applied

1. **Updated ProfileScreen.tsx**:
   - Added `isLoading: authLoading` to the destructured values from `useAuth()`
   - Added a loading state that shows "Loading..." while `authLoading` is true
   - Changed the guest UI condition from `if (!user)` to `if (!user)` (after the loading check)
   - Added loading styles (`loadingContainer`, `loadingText`)

## Code Changes

```tsx
// Before
const { user, updateProfile, forceLogout } = useAuth();
if (!user) {
  // Show guest UI immediately
}

// After  
const { user, updateProfile, forceLogout, isLoading: authLoading } = useAuth();

if (authLoading) {
  return (
    <View style={styles.container}>
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    </View>
  );
}

if (!user) {
  // Show guest UI only after loading is complete
}
```

## Expected Behavior Now

1. **App Start**: Shows loading indicator while checking stored token
2. **Valid Token**: Automatically logs user in and shows profile
3. **No Token**: Shows guest UI with login option
4. **After Login**: User remains logged in, profile shows immediately
5. **Page Refresh**: User session persists, no need to log in again

## Note

Other screens (tabs) don't have this issue because they're wrapped in `AuthWrapper` which properly handles the loading state at the app level.
