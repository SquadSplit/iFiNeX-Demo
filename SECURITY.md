# Security policy

## Report a vulnerability
Open a **private** security advisory on GitHub (Security tab → Report a vulnerability). Do not post exploits in public issues.

## What is secret and what is not
| Value | Secret? | Where it lives |
|---|---|---|
| Supabase project URL | no | `web/ifinex-config.json` (public file) |
| Supabase **anon / publishable** key | no — it is designed to be public; Row Level Security protects the data | `web/ifinex-config.json` |
| Supabase **service_role / secret** key | **YES — never put it in this repo, the website or the app** | nowhere in the client |
| Android signing keystore + passwords | **YES** | GitHub repository *Secrets* only |
| Push secret (`__PUSH_SECRET__`) | **YES** | database function + Edge Function secret |

## Before you go live
Follow `docs/SECURITY-CHECKLIST.md`. The most important rule: **every table must have Row Level Security enabled** (the shipped `supabase/schema.sql` does this) — without RLS the public anon key can read everything.
