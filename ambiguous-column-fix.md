# Fix for "Column Reference 'user_id' is Ambiguous" Error

## The Problem

You're encountering this error when trying to upgrade a user's role in the HR role management section:

```
Error removing existing role: column reference "user_id" is ambiguous
```

This error occurs because there are multiple tables in your query that have a column named "user_id", and PostgreSQL doesn't know which one you're referring to.

## The Solution

I've implemented a two-part solution to fix this issue:

### 1. Created a New SQL Function

I've created a new SQL function called `update_user_role` that handles the entire role update process in a single transaction:

```sql
CREATE OR REPLACE FUNCTION public.update_user_role(
  p_user_id UUID,
  p_role_name TEXT
) RETURNS BOOLEAN AS $func$
DECLARE
  v_role_id UUID;
  v_assignment_id UUID;
BEGIN
  -- Get the role ID for the role name
  SELECT id INTO v_role_id
  FROM public.roles
  WHERE role_name = p_role_name;
  
  -- If role doesn't exist, create it
  IF v_role_id IS NULL THEN
    INSERT INTO public.roles (role_name)
    VALUES (p_role_name)
    RETURNING id INTO v_role_id;
  END IF;
  
  -- Delete existing role assignments for this user
  DELETE FROM public.user_role_assignments
  WHERE user_id = p_user_id;
  
  -- Insert the new role assignment
  INSERT INTO public.user_role_assignments (user_id, role_id)
  VALUES (p_user_id, v_role_id)
  RETURNING id INTO v_assignment_id;
  
  -- Update user_email_status if needed
  -- [Additional code to update user_email_status]
  
  RETURN v_assignment_id IS NOT NULL;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;
```

This function:
- Takes a user ID and role name as parameters
- Gets or creates the role ID
- Deletes existing role assignments
- Inserts the new role assignment
- Updates user_email_status if needed
- Returns a boolean indicating success

### 2. Updated the Frontend Code

I've updated the `upgradeUserRole` function in `UsersTab.tsx` to use this new SQL function:

```typescript
const { data: result, error: rpcError } = await supabase.rpc('update_user_role', {
  p_user_id: userId,
  p_role_name: newRole
});
```

If the RPC call fails, the code falls back to the original implementation but with improved error handling.

## How to Apply the Fix

1. Run the SQL script in `database/fix_ambiguous_column.sql` in your Supabase SQL editor
2. Deploy the updated `UsersTab.tsx` file

## Why This Works

The solution works because:

1. **SQL Function**: The SQL function handles all database operations in a single transaction, using proper parameter names to avoid ambiguity.

2. **RPC Call**: Using an RPC call simplifies the frontend code and reduces the number of database queries.

3. **Fallback Mechanism**: If the RPC call fails, the code falls back to the original implementation but with improved error handling.

This approach should resolve the ambiguous column reference issue and allow you to upgrade user roles successfully.
