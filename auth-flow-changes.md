# Authentication Flow Changes

## Overview

I've updated the authentication flow to ensure users follow this path:
1. Sign up → Email confirmation page
2. Click link in email → Email confirmation page (with verification)
3. After verification → Welcome page
4. After welcome page → Dashboard

## Changes Made

### 1. Updated AuthContext.tsx

Changed the email redirect URL in the `signUp` function:

```typescript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: window.location.hostname === 'localhost'
      ? 'http://localhost:5173/auth/email-confirmation'
      : 'https://hrmoffice.vercel.app/auth/email-confirmation',
    data: {
      redirectTo: window.location.hostname === 'localhost'
        ? 'http://localhost:5173/auth/email-confirmation'
        : 'https://hrmoffice.vercel.app/auth/email-confirmation'
    }
  }
});
```

This ensures that when users click the verification link in their email, they are directed to the email confirmation page first.

### 2. Enhanced EmailConfirmation.tsx

Added session checking to the `useEffect` hook:

```typescript
useEffect(() => {
  // Existing code for token verification...
  
  if (token_hash && type === "email") {
    setVerifying(true);
    verifyEmail(token_hash);
  } else {
    // Check if we already have a session (user might have clicked the link in email)
    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          return;
        }
        
        if (session) {
          console.log("Session already exists, redirecting to welcome page");
          // Redirect to welcome page
          if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            navigate("/auth/welcome", { replace: true });
          } else {
            window.location.href = 'https://hrmoffice.vercel.app/auth/welcome';
          }
        }
      } catch (error) {
        console.error("Error checking session:", error);
      }
    };
    
    checkSession();
  }
}, [searchParams, navigate]);
```

This ensures that when users arrive at the email confirmation page after clicking the verification link, they are automatically redirected to the welcome page if their session is valid.

### 3. Improved WelcomePage.tsx

Updated the redirect logic:

```typescript
// First, determine the dashboard path based on role
let redirectPath = '/'; // Default to main dashboard

if (roleAssignments && roleAssignments.length > 0) {
  // Get role names
  const roleIds = roleAssignments.map(ra => ra.role_id);
  const { data: roles } = await supabase
    .from('roles')
    .select('role_name')
    .in('id', roleIds);

  const roleNames = roles?.map(r => r.role_name) || [];

  // Set redirect path based on highest role
  if (roleNames.includes('hr')) {
    redirectPath = '/hr/page-description';
  } else if (roleNames.includes('assessor')) {
    redirectPath = '/assessor/page-description';
  } else {
    redirectPath = '/page-description';
  }
}
```

Also updated the "Continue" button:

```typescript
<button
  onClick={() => {
    const redirectPath = window.redirectPath || '/';
    console.log("Button clicked, redirecting to:", redirectPath);
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      navigate(redirectPath, { replace: true });
    } else {
      window.location.href = `https://hrmoffice.vercel.app${redirectPath}`;
    }
  }}
  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
>
  Continue to Dashboard
</button>
```

This ensures that after the welcome page, users are directed to the appropriate dashboard based on their role.

## Testing Instructions

1. Sign up with a new email
2. You should be redirected to the email confirmation page
3. Check your email and click the verification link
4. You should be redirected to the email confirmation page, which will verify your email
5. After verification, you should be redirected to the welcome page
6. After 5 seconds (or clicking the button), you should be redirected to the dashboard

These changes ensure a smooth, intuitive flow for new users from signup to dashboard access.
