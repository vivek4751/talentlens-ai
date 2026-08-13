# Google sign-in setup

Google sign-in is optional. The application only exposes an enabled Google button when both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are configured.

## Local development

1. Open Google Cloud Console and create or select a project.
2. Configure the OAuth consent screen for the application.
3. Create an OAuth client ID for a Web application.
4. Add this authorized redirect URI:

```text
http://localhost:3000/api/auth/callback/google
```

5. Copy the client ID and secret into `.env`:

```env
GOOGLE_CLIENT_ID="your_client_id"
GOOGLE_CLIENT_SECRET="your_client_secret"
```

6. Apply the schema change that allows Google-only accounts to have no local password:

```bash
npx prisma db push
```

## Production

Add the production callback URI to the same Google OAuth client:

```text
https://your-domain.com/api/auth/callback/google
```

Set `NEXTAUTH_URL` to the deployed site URL and add the same Google credentials to the production environment. Restart the application after changing environment variables.

Google accounts are created as recruiter accounts by default. Users can choose **Profile & settings → Security** to create a local password after signing in with Google.
