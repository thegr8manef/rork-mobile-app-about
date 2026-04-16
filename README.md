<p align="center">
  <img src="assets/images/newlogo.png" alt="Logo" width="120" />
</p>

<h1 align="center">NessnaUp / AttijariUp</h1>

<p align="center">
  <strong>Mobile Banking App — React Native &bull; Expo SDK 54 &bull; TypeScript</strong>
</p>

<p align="center">
  <em>One codebase, two apps — internal QA (NessnaUp) and production (AttijariUp)</em>
</p>

---

## Architecture

|                       | NessnaUp (Internal / QA)  | AttijariUp (Production)    |
| --------------------- | ------------------------- | -------------------------- |
| **Repo**              | GitHub                    | GitLab (internal)          |
| **Package (Android)** | `tn.attijariup.plus`      | `tn.attijari.android.prod` |
| **Bundle (iOS)**      | `tn.attijariup.plus`      | `com.tn.attijariup`        |
| **Distribution**      | Firebase App Distribution | Google Play / App Store    |
| **API**               | Internal QA backend       | Production backend         |
| **CI/CD**             | GitHub Actions            | GitLab CI/CD               |

Source code syncs automatically from GitHub → GitLab via the **promote.yml** workflow. Platform-specific files (`android/`, `ios/`, `firebase/`, `app.json`) are maintained independently in each repo.

---

## Tech Stack

| Layer              | Technology                                         |
| ------------------ | -------------------------------------------------- |
| Framework          | React Native 0.81 + Expo SDK 54 (New Architecture) |
| Language           | TypeScript 5.9                                     |
| Navigation         | Expo Router (file-based)                           |
| Styling            | NativeWind 4.2 (Tailwind CSS) + GlueStack UI       |
| State              | Zustand 5                                          |
| Data Fetching      | TanStack React Query 5 + Axios                     |
| Forms              | React Hook Form + Zod validation                   |
| Local Storage      | MMKV, AsyncStorage, Expo Secure Store              |
| Auth               | Firebase Authentication + Biometrics               |
| Push Notifications | Firebase Cloud Messaging + Expo Notifications      |
| Animations         | Reanimated 4.1, Legend Motion                      |
| i18n               | i18next + react-i18next                            |
| Icons              | Lucide React Native                                |

---

## Getting Started

### Prerequisites

- **Node.js** 20+ — [install with nvm](https://github.com/nvm-sh/nvm)
- **Java** 17 (Temurin) — for Android builds
- **Android Studio** — for emulator & SDK
- **Xcode** 15+ — for iOS builds (macOS only)

### Setup

```bash
# 1. Clone the repository
git clone <REPO_URL>
cd rork-mobile-app-about

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Copy the environment file
cp .env.development .env
# Edit .env with the correct backend URL and keys

# 4. Start the development server
npm run dev
```

### Running on Devices

```bash
# Android (debug)
npm run android

# Android (development env)
npm run android:dev

# iOS
npm run ios

# Web preview (limited native features)
npm run start-web
```

---

## Build Commands

| Command                       | Description                                                    |
| ----------------------------- | -------------------------------------------------------------- |
| `npm run android:preview`     | QA APK (previewRelease) — no minification, security guards off |
| `npm run android:release`     | Production APK — minified, signed                              |
| `npm run android:release:aab` | Production AAB — for Google Play                               |
| `npm run eas:release:aab`     | EAS cloud build (production AAB)                               |
| `npm run eas:preview:release` | EAS cloud build (preview APK)                                  |

### Manual Gradle Builds

```bash
cd android

# QA build (preview)
./gradlew assemblePreviewRelease

# Production APK
./gradlew assembleRelease

# Production AAB (Google Play)
./gradlew bundleRelease
```

---

## CI/CD Pipelines

### GitHub Actions (NessnaUp)

| Workflow        | Trigger                          | Purpose                                |
| --------------- | -------------------------------- | -------------------------------------- |
| **ci.yml**      | PR to `develop`/`main`           | Lint + TypeScript check                |
| **deploy.yml**  | Push to `develop`/`main`, manual | Build APK/AAB → Firebase / Google Play |
| **promote.yml** | Push to `develop`/`main`, manual | Sync source code → GitLab (AttijariUp) |

### GitLab CI/CD (AttijariUp)

| Stage        | Job                      | Purpose                        |
| ------------ | ------------------------ | ------------------------------ |
| `version`    | `bump-version`           | Auto-increment patch version   |
| `build`      | `build-android-apk`      | Production APK                 |
| `build`      | `build-android-aab`      | Production AAB for Google Play |
| `distribute` | `distribute-firebase`    | Firebase App Distribution      |
| `distribute` | `distribute-google-play` | Google Play internal track     |

### Flow

```
GitHub (develop) ──push──▶ CI (lint/typecheck)
                  ──push──▶ deploy (dev APK → Firebase)
                  ──push──▶ promote (sync → GitLab)

GitHub (main)    ──push──▶ deploy (prod APK/AAB → Google Play)
                  ──push──▶ promote (sync → GitLab main)

GitLab (develop) ──push──▶ build APK → Firebase (AttijariUp)
GitLab (main)    ──push──▶ build AAB → Google Play (AttijariUp)
```

---

## Environment Configuration

The app uses environment-specific `.env` files loaded via `app.config.js`:

| Variable                           | Purpose                                     |
| ---------------------------------- | ------------------------------------------- |
| `APP_ENV`                          | `development` or `production`               |
| `ENV_API_BASE_URL`                 | Backend API endpoint                        |
| `ENV_EAS_PROJECT_ID`               | Expo EAS project ID                         |
| `ENV_AUTH_STORAGE_KEY`             | Auth state storage key                      |
| `ENV_SECURE_*`                     | Secure storage keys for tokens, credentials |
| `ENV_BACKGROUND_LOGOUT_TIMEOUT_MS` | Auto-logout timeout                         |

---

## Android Build Types

| Build Type       | Debuggable | Minified | Security Guards               | Use Case          |
| ---------------- | ---------- | -------- | ----------------------------- | ----------------- |
| `debug`          | Yes        | No       | Off                           | Local development |
| `previewRelease` | No         | No       | Off (`IS_PREVIEW_BUILD=true`) | QA testing        |
| `release`        | No         | Yes (R8) | On                            | Production        |

---

## Project Structure

```
app/                    # Expo Router screens & layouts
├── (auth)/             # Authentication screens
├── (root)/             # Main app screens (authenticated)
├── (system)/           # System screens (settings, etc.)
├── _layout.tsx         # Root layout
└── index.tsx           # Entry redirect
components/             # Reusable UI components
constants/              # App constants & config
features/               # Feature-specific modules
hooks/                  # Custom React hooks
queries/                # TanStack Query hooks (API calls)
services/               # API services & axios config
store/                  # Zustand state stores
types/                  # TypeScript type definitions
utils/                  # Utility functions
validation/             # Zod schemas for form validation
assets/                 # Images, fonts, animations
firebase/               # Firebase config files
scripts/                # Build & version scripts
android/                # Native Android project
ios/                    # Native iOS project
```

---

## Required Secrets

### GitHub (NessnaUp)

| Secret                             | Purpose                                 |
| ---------------------------------- | --------------------------------------- |
| `VERSIONING_TOKEN`                 | PAT for pushing version bump commits    |
| `ENV_DEVELOPMENT_FILE`             | Base64-encoded `.env.development`       |
| `ENV_PRODUCTION_FILE`              | Base64-encoded `.env.production`        |
| `KEYSTORE_BASE64`                  | Base64-encoded Android release keystore |
| `MYAPP_UPLOAD_KEY_ALIAS`           | Keystore alias                          |
| `MYAPP_UPLOAD_STORE_PASSWORD`      | Keystore password                       |
| `MYAPP_UPLOAD_KEY_PASSWORD`        | Key password                            |
| `FIREBASE_APP_ID`                  | Firebase App ID                         |
| `FIREBASE_TOKEN`                   | Firebase CLI refresh token              |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Google Play SA (for prod)               |
| `GITLAB_SSH_PRIVATE_KEY`           | SSH key for GitLab sync                 |

### GitLab (AttijariUp)

| Variable                      | Purpose                          |
| ----------------------------- | -------------------------------- |
| `ENV_PRODUCTION_FILE`         | Base64-encoded `.env.production` |
| `KEYSTORE_BASE64`             | Base64-encoded release keystore  |
| `MYAPP_UPLOAD_KEY_ALIAS`      | Keystore alias                   |
| `MYAPP_UPLOAD_STORE_PASSWORD` | Keystore password                |
| `MYAPP_UPLOAD_KEY_PASSWORD`   | Key password                     |
| `FIREBASE_APP_ID`             | Firebase App ID (AttijariUp)     |
| `FIREBASE_TOKEN`              | Firebase CLI refresh token       |
| `GOOGLE_PLAY_SA_JSON`         | Google Play service account JSON |
| `CI_PUSH_TOKEN`               | GitLab token for version commits |

---

## Versioning

Version is managed in `package.json` and synced to `app.json` and `android/app/build.gradle` via `scripts/sync-version.js`:

```bash
npm run version:patch   # 1.1.5 → 1.1.6
npm run version:minor   # 1.1.5 → 1.2.0
npm run version:major   # 1.1.5 → 2.0.0
```

Version code is computed as: `major × 10000 + minor × 100 + patch` (e.g., `1.1.5` → `10105`)

For detailed instructions, visit [Expo's App Store deployment guide](https://docs.expo.dev/submit/ios/).

### **Publish to Google Play (Android)**

1. **Build for Android**:

   ```bash
   eas build --platform android
   ```

2. **Submit to Google Play**:
   ```bash
   eas submit --platform android
   ```

For detailed instructions, visit [Expo's Google Play deployment guide](https://docs.expo.dev/submit/android/).

### **Publish as a Website**

Your React Native app can also run on the web:

1. **Build for web**:

   ```bash
   eas build --platform web
   ```

2. **Deploy with EAS Hosting**:
   ```bash
   eas hosting:configure
   eas hosting:deploy
   ```

Alternative web deployment options:

- **Vercel**: Deploy directly from your GitHub repository
- **Netlify**: Connect your GitHub repo to Netlify for automatic deployments

## App Features

This template includes:

- **Cross-platform compatibility** - Works on iOS, Android, and Web
- **File-based routing** with Expo Router
- **Tab navigation** with customizable tabs
- **Modal screens** for overlays and dialogs
- **TypeScript support** for better development experience
- **Async storage** for local data persistence
- **Vector icons** with Lucide React Native

## Project Structure

```
├── app/                    # App screens (Expo Router)
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── _layout.tsx    # Tab layout configuration
│   │   └── index.tsx      # Home tab screen
│   ├── _layout.tsx        # Root layout
│   ├── modal.tsx          # Modal screen example
│   └── +not-found.tsx     # 404 screen
├── assets/                # Static assets
│   └── images/           # App icons and images
├── constants/            # App constants and configuration
├── app.json             # Expo configuration
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

## Custom Development Builds

For advanced native features, you'll need to create a Custom Development Build instead of using Expo Go.

### **When do you need a Custom Development Build?**

- **Native Authentication**: Face ID, Touch ID, Apple Sign In, Google Sign In
- **In-App Purchases**: App Store and Google Play subscriptions
- **Advanced Native Features**: Third-party SDKs, platform-specifc features (e.g. Widgets on iOS)
- **Background Processing**: Background tasks, location tracking

### **Creating a Custom Development Build**

```bash
# Install EAS CLI
bun i -g @expo/eas-cli

# Configure your project for development builds
eas build:configure

# Create a development build for your device
eas build --profile development --platform ios
eas build --profile development --platform android

# Install the development build on your device and start developing
bun start --dev-client
```

**Learn more:**

- [Development Builds Introduction](https://docs.expo.dev/develop/development-builds/introduction/)
- [Creating Development Builds](https://docs.expo.dev/develop/development-builds/create-a-build/)
- [Installing Development Builds](https://docs.expo.dev/develop/development-builds/installation/)

## Advanced Features

### **Add a Database**

Integrate with backend services:

- **Supabase** - PostgreSQL database with real-time features
- **Firebase** - Google's mobile development platform
- **Custom API** - Connect to your own backend

### **Add Authentication**

Implement user authentication:

**Basic Authentication (works in Expo Go):**

- **Expo AuthSession** - OAuth providers (Google, Facebook, Apple) - [Guide](https://docs.expo.dev/guides/authentication/)
- **Supabase Auth** - Email/password and social login - [Integration Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)
- **Firebase Auth** - Comprehensive authentication solution - [Setup Guide](https://docs.expo.dev/guides/using-firebase/)

**Native Authentication (requires Custom Development Build):**

- **Apple Sign In** - Native Apple authentication - [Implementation Guide](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)
- **Google Sign In** - Native Google authentication - [Setup Guide](https://docs.expo.dev/guides/google-authentication/)

### **Add Push Notifications**

Send notifications to your users:

- **Expo Notifications** - Cross-platform push notifications
- **Firebase Cloud Messaging** - Advanced notification features

### **Add Payments**

Monetize your app:

**Web & Credit Card Payments (works in Expo Go):**

- **Stripe** - Credit card payments and subscriptions - [Expo + Stripe Guide](https://docs.expo.dev/guides/using-stripe/)
- **PayPal** - PayPal payments integration - [Setup Guide](https://developer.paypal.com/docs/checkout/mobile/react-native/)

**Native In-App Purchases (requires Custom Development Build):**

- **RevenueCat** - Cross-platform in-app purchases and subscriptions - [Expo Integration Guide](https://www.revenuecat.com/docs/expo)
- **Expo In-App Purchases** - Direct App Store/Google Play integration - [Implementation Guide](https://docs.expo.dev/versions/latest/sdk/in-app-purchases/)

**Paywall Optimization:**

- **Superwall** - Paywall A/B testing and optimization - [React Native SDK](https://docs.superwall.com/docs/react-native)
- **Adapty** - Mobile subscription analytics and paywalls - [Expo Integration](https://docs.adapty.io/docs/expo)

## I want to use a custom domain - is that possible?

For web deployments, you can use custom domains with:

- **EAS Hosting** - Custom domains available on paid plans
- **Netlify** - Free custom domain support
- **Vercel** - Custom domains with automatic SSL

For mobile apps, you'll configure your app's deep linking scheme in `app.json`.

## Troubleshooting

### **App not loading on device?**

1. Make sure your phone and computer are on the same WiFi network
2. Try using tunnel mode: `bun start -- --tunnel`
3. Check if your firewall is blocking the connection

### **Build failing?**

1. Clear your cache: `bunx expo start --clear`
2. Delete `node_modules` and reinstall: `rm -rf node_modules && bun install`
3. Check [Expo's troubleshooting guide](https://docs.expo.dev/troubleshooting/build-errors/)

### **Need help with native features?**

- Check [Expo's documentation](https://docs.expo.dev/) for native APIs
- Browse [React Native's documentation](https://reactnative.dev/docs/getting-started) for core components
- Visit [Rork's FAQ](https://rork.com/faq) for platform-specific questions

## About Rork

Rork builds fully native mobile apps using React Native and Expo - the same technology stack used by Discord, Shopify, Coinbase, Instagram, and nearly 30% of the top 100 apps on the App Store.

Your Rork app is production-ready and can be published to both the App Store and Google Play Store. You can also export your app to run on the web, making it truly cross-platform.
