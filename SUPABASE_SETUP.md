# Supabase setup

The frontend now uses Supabase Auth OTP and Supabase Postgres with row-level security. Internet Identity is no longer used by the frontend.

1. Create a Supabase project and run `supabase/schema.sql` in its SQL Editor.
2. In Authentication → Providers, enable **Email** and **Phone**. Configure an email SMTP provider and an SMS provider; Supabase cannot deliver production OTP messages until these providers are configured. Set the OTP expiry/rate limits in Supabase Auth.
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the frontend build environment (for Vercel, add both as public build variables, then redeploy). The anon/publishable key is intended for browser use. Never put a service-role key in the frontend.
4. Configure the site's allowed URLs/redirect URLs and your production domain in Supabase Auth settings.
5. Test signup/sign-in by requesting and verifying email and SMS OTPs. RLS binds profile and daily-log rows to `auth.uid()`; subscriptions are read-only to clients.

The OTP experience uses the same code flow for new and existing accounts. Database RLS is the authorization boundary. Supabase account users can access only rows with their own `user_id`.

**Migration note:** Existing profiles, daily logs, and subscriptions in the Internet Computer canister are not copied automatically. Export/migrate those records before disabling the old deployment if you need to preserve current users' data. The old canister backend remains in the repository as an unused artifact; the frontend no longer invokes it. Stripe checkout and subscription activation require trusted Supabase Edge Functions and webhook verification before they can be enabled; the browser must not write subscription entitlements.
