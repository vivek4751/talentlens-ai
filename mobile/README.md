# TalentLens AI Android Companion

This Expo application is the native Android companion for the TalentLens Next.js platform. It does not duplicate the recruiting backend. Instead, it authenticates with the existing mobile sign-in endpoint and calls the protected mobile API routes under `/api/mobile`.

## Configure the backend

Create a local `.env` file from `.env.example` and set the URL of the deployed TalentLens Next.js app. The URL must include `https://` and must not end with a slash.

```bash
EXPO_PUBLIC_TALENTLENS_API_URL=https://your-talentlens-domain.example
```

The web backend must have `NEXTAUTH_SECRET` or `MOBILE_AUTH_SECRET` configured because mobile sessions use a seven-day signed bearer token.

## Run on Android

Install dependencies and start Expo. Android users can scan the displayed QR code in Expo Go, or run an Android emulator and use the Android command.

```bash
npm ci
npx expo start
npx expo start --android
```

The native app includes recruiter overview, jobs, rankings and decision controls, candidate profile, PDF resume upload, and role-aware sign-in/registration. The app shows an explicit connection state rather than placeholder data when no backend URL is configured.

## Validate the Android bundle

Use these checks before release.

```bash
npx tsc --noEmit
npx expo export --platform android --output-dir dist-android
```

## Produce an installable Android build

For an installable APK/AAB, sign in to an Expo account and run an EAS build from this directory. EAS setup and signing are user-account operations and must be completed with your chosen Android package ownership.

```bash
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform android
```

The Android package identifier is `com.talentlens.mobile`; update it in `app.json` before publishing if that identifier is unavailable or needs to be owned by a different organization.
