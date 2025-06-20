# 🔒 CREDENTIAL UPDATE TEMPLATE

After regenerating Supabase credentials, update your v3/.env.local file:

```bash
# REPLACE WITH NEW CREDENTIALS FROM SUPABASE DASHBOARD

# Supabase Target (UPDATED CREDENTIALS)
NEXT_PUBLIC_SUPABASE_URL="https://ergxrxtuncymyqslmoen.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_NEW_ANON_KEY_HERE"
SUPABASE_SERVICE_ROLE_KEY="YOUR_NEW_SERVICE_ROLE_KEY_HERE"
SUPABASE_PROJECT_REF="ergxrxtuncymyqslmoen"
SUPABASE_ACCESS_TOKEN="YOUR_NEW_ACCESS_TOKEN_HERE"

# Migration Settings (unchanged)
MIGRATION_BATCH_SIZE=50
MIGRATION_LOG_LEVEL="info"
MIGRATION_DRY_RUN=false

# Scanner Integration
SCANNER_API_KEY="basarometer-scanner-v5-2025"

# Admin Credentials (CHANGE PASSWORD TOO!)
ADMIN_EMAIL=admintest1@basarometer.org
ADMIN_PASSWORD=YOUR_NEW_SECURE_PASSWORD_HERE
```

## STEPS TO UPDATE:

1. Copy the new anon key from Supabase dashboard
2. Replace YOUR_NEW_ANON_KEY_HERE with the actual key

3. Copy the new service role key from Supabase dashboard  
4. Replace YOUR_NEW_SERVICE_ROLE_KEY_HERE with the actual key

5. Copy the new access token from Supabase dashboard
6. Replace YOUR_NEW_ACCESS_TOKEN_HERE with the actual token

7. Change admin password from "123123" to something secure:
   - Minimum 16 characters
   - Mix of letters, numbers, symbols
   - Example: K9$mR7@nX2!pL5#qW8&T4

## VERIFICATION:

After updating, test your application:
```bash
cd v3
npm run dev
```

If it connects successfully, your credentials are working!