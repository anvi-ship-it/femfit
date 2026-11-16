# Supabase setup

The frontend uses Supabase Auth OTP and Supabase Postgres with row-level security. The browser does not use Internet Identity or any service-role/secret key.

1. Run `supabase/schema.sql` in the Supabase SQL Editor.
2. In Supabase Authentication → Providers, enable Email and Phone. Configure production SMTP and an SMS provider; configure the email template to include `{{ .Token }}` if you want a numeric OTP (otherwise Supabase may send a magic link). Set OTP expiry and rate limits.
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (or `VITE_SUPABASE_PUBLISHABLE_KEY`) in the hosting provider's frontend build environment. The project's publishable key may be used here. The `SUPABASE_SECRET_KEY` supplied in a chat is never used by the app and must never be exposed to a browser.
4. Add the deployed app URL to Supabase Auth's allowed site/redirect URL configuration.
5. Deploy/rebuild the frontend, then test email and SMS delivery and verification.

RLS scopes profile and daily-log writes to `auth.uid()`. The browser can only insert an active free trial of at most seven days. Subscription purchases, paid entitlement changes, and Stripe callbacks are intentionally not client-writeable; implement those through trusted Supabase Edge Functions and verified Stripe webhooks before using paid checkout.

Existing canister profiles, daily logs, subscriptions, and authentication users are not migrated automatically. Export data from the old canister and import it into the matching Supabase Auth UUIDs before disabling the old deployment if existing user data must be retained. The canister source remains as an unused artifact; the frontend no longer invokes its data/auth APIs.

This frontend uses Supabase Auth and PostgREST endpoints directly to avoid placing server-only credentials in a browser. Do not install `@supabase/server` in the frontend: server SDKs are not browser clients.
