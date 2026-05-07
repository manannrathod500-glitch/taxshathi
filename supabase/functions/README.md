# Supabase Edge Functions

## Deploy Function

```bash
supabase functions deploy send-welcome-email
```

## Set Resend API Secret

```bash
supabase secrets set RESEND_API_KEY=re_your_key_here
```

## Notes

- The function uses fetch() directly with the Resend API.
- Environment secret is accessed using Deno.env.get('RESEND_API_KEY').
- Welcome emails are sent from onboarding@resend.dev.
