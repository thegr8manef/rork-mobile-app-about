# GitHub Actions Secrets — Setup Guide

This document describes each secret required by the CI/CD workflows and how to obtain/generate them.

---

## Workflows Overview

| Workflow                          | File                            | Purpose                                                                                            |
| --------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------- |
| **CI — lint & typecheck**         | `.github/workflows/ci.yml`      | Runs ESLint and TypeScript type-checking on PRs and pushes. No secrets required.                   |
| **NessnaUp — Build & Distribute** | `.github/workflows/deploy.yml`  | Builds Android APK/AAB, distributes via Firebase App Distribution (dev) or Google Play (prod).     |
| **Sync to GitLab (AttijariUp)**   | `.github/workflows/promote.yml` | Syncs source code from GitHub to an internal GitLab repository, excluding platform-specific files. |

---

## Secrets Reference

### 1. `ENV_PRODUCTION_FILE`

**Used in:** `deploy.yml`
**Purpose:** Base64-encoded `.env.production` file containing production environment variables (API URLs, keys, feature flags).

**How to get it:**

1. Create your `.env.production` file locally with all required production env vars.
2. Encode it to base64:
   ```bash
   base64 -w 0 .env.production
   ```
   On macOS:
   ```bash
   base64 -i .env.production
   ```
3. Copy the output and paste it as the secret value in GitHub.

---

### 2. `EXPO_TOKEN`

**Used in:** EAS builds (if configured)
**Purpose:** Authentication token for Expo services (EAS Build, EAS Submit, EAS Update).

**How to get it:**

1. Go to [https://expo.dev](https://expo.dev) and sign in.
2. Navigate to **Account Settings → Access Tokens**.
3. Click **Create Token**, give it a name (e.g., `github-actions`).
4. Copy the generated token and save it as the secret.

---

### 3. `FIREBASE_APP_ID`

**Used in:** `deploy.yml` (Firebase App Distribution step)
**Purpose:** Identifies your Firebase app for distributing dev builds to internal testers.

**How to get it:**

1. Go to the [Firebase Console](https://console.firebase.google.com).
2. Select your project.
3. Go to **Project Settings** (gear icon) → **General** tab.
4. Scroll to **Your apps** and find the Android app.
5. Copy the **App ID** (format: `1:123456789:android:abcdef123456`).

---

### 4. `FIREBASE_TOKEN`

**Used in:** `deploy.yml` (Firebase App Distribution step)
**Purpose:** CI authentication token for Firebase CLI used to upload builds to App Distribution.

**How to get it:**

1. Install the Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
2. Run:
   ```bash
   firebase login:ci
   ```
3. Complete the browser authentication flow.
4. Copy the token printed in the terminal and save it as the secret.

---

### 5. `GITLAB_ACCESS_TOKEN`

**Used in:** GitLab integration / API access
**Purpose:** Personal Access Token for authenticating with the GitLab API (used for API operations alongside SSH for git push).

**How to get it:**

1. Log in to your GitLab instance.
2. Go to **User Settings → Access Tokens** (or **Preferences → Access Tokens**).
3. Create a new token with the following scopes:
   - `read_repository`
   - `write_repository`
   - `api` (if needed for API calls)
4. Set an expiration date and click **Create personal access token**.
5. Copy the token immediately (it won't be shown again).

---

### 6. `GITLAB_SSH_PRIVATE_KEY`

**Used in:** `promote.yml` (SSH setup step)
**Purpose:** SSH private key that allows the GitHub Actions runner to push code to the GitLab repository.

**How to get it:**

1. Generate a dedicated SSH key pair:
   ```bash
   ssh-keygen -t ed25519 -C "github-actions-sync" -f gitlab_sync_key -N ""
   ```
2. Add the **public key** (`gitlab_sync_key.pub`) to GitLab:
   - Go to **GitLab → User Settings → SSH Keys**.
   - Paste the contents of `gitlab_sync_key.pub` and save.
3. Copy the **private key** content:
   ```bash
   cat gitlab_sync_key
   ```
4. Paste the entire private key (including `-----BEGIN` and `-----END` lines) as the secret value.

---

### 7. `KEYSTORE_BASE64`

**Used in:** `deploy.yml` (Decode release keystore step)
**Purpose:** Base64-encoded Android release keystore (`.jks`) file used to sign the APK/AAB.

**How to get it:**

1. If you don't have a keystore yet, generate one:
   ```bash
   keytool -genkeypair -v -storetype JKS -keyalg RSA -keysize 2048 -validity 10000 \
     -keystore release-key.jks -alias your-key-alias
   ```
2. Encode the keystore to base64:
   ```bash
   base64 -w 0 release-key.jks
   ```
   On macOS:
   ```bash
   base64 -i release-key.jks
   ```
3. Copy the output and save it as the secret.

> ⚠️ **Keep your keystore file safe!** Losing it means you cannot update your app on Google Play.

---

### 8. `MYAPP_UPLOAD_KEY_ALIAS`

**Used in:** `deploy.yml` (Configure signing step)
**Purpose:** The alias name of the key inside the keystore, used during APK/AAB signing.

**How to get it:**

- This is the alias you specified when creating the keystore (`-alias` parameter).
- To check the alias of an existing keystore:
  ```bash
  keytool -list -v -keystore release-key.jks
  ```
  Look for the **Alias name** field.

---

### 9. `MYAPP_UPLOAD_KEY_PASSWORD`

**Used in:** `deploy.yml` (Configure signing step)
**Purpose:** Password for the specific key inside the keystore.

**How to get it:**

- This is the password you set when generating the key pair inside the keystore.
- If you used the same password for both the key and the store, it will be the same as `MYAPP_UPLOAD_STORE_PASSWORD`.

---

### 10. `MYAPP_UPLOAD_STORE_PASSWORD`

**Used in:** `deploy.yml` (Configure signing step)
**Purpose:** Password for the keystore file itself.

**How to get it:**

- This is the password you set when creating the keystore file with `keytool`.
- It protects the keystore container (as opposed to the individual key password).

---

### 11. `VERSIONING_TOKEN`

**Used in:** `deploy.yml` (Version bump step)
**Purpose:** A GitHub Personal Access Token (PAT) with permission to push commits back to the repo (used for automatic version bumping).

**How to get it:**

1. Go to [GitHub → Settings → Developer Settings → Personal Access Tokens → Fine-grained tokens](https://github.com/settings/tokens?type=beta).
2. Click **Generate new token**.
3. Configure:
   - **Repository access:** Select the specific repository.
   - **Permissions:**
     - **Contents:** Read and Write (to push version bump commits)
     - **Metadata:** Read
4. Click **Generate token** and copy it.
5. Save it as the secret.

> The default `GITHUB_TOKEN` cannot trigger new workflow runs, so a PAT is needed to ensure the build workflow runs after the version bump commit.

---

## Google Play Console (Optional — for production releases)

If you plan to distribute production builds to Google Play, you'll also need:

### `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`

**Used in:** `deploy.yml` (Google Play upload step — currently commented out)
**Purpose:** Service account JSON key for authenticating with Google Play Developer API to upload AABs.

**How to get it:**

1. Go to the [Google Cloud Console](https://console.cloud.google.com).
2. Select (or create) the project linked to your Google Play Console.
3. Navigate to **IAM & Admin → Service Accounts**.
4. Click **Create Service Account**:
   - Name: `github-actions-play-upload`
   - Role: not needed at project level.
5. Click on the created service account → **Keys** tab → **Add Key → Create new key → JSON**.
6. Download the JSON file.
7. Go to [Google Play Console → Setup → API access](https://play.google.com/console/developers).
8. Link the Google Cloud project if not already linked.
9. Find the service account and click **Manage permissions**.
10. Grant **Release manager** or at minimum: **Release to production / Manage releases** permissions.
11. Copy the content of the downloaded JSON file and paste it as the secret value.

---

## Quick Setup Checklist

| Secret                             | Source                               | Required For      |
| ---------------------------------- | ------------------------------------ | ----------------- |
| `ENV_PRODUCTION_FILE`              | Your `.env.production` file (base64) | Build & Deploy    |
| `EXPO_TOKEN`                       | Expo dashboard                       | EAS builds        |
| `FIREBASE_APP_ID`                  | Firebase Console → Project Settings  | Dev distribution  |
| `FIREBASE_TOKEN`                   | `firebase login:ci`                  | Dev distribution  |
| `GITLAB_ACCESS_TOKEN`              | GitLab → Access Tokens               | GitLab API access |
| `GITLAB_SSH_PRIVATE_KEY`           | `ssh-keygen` (private key)           | GitLab sync       |
| `KEYSTORE_BASE64`                  | Your `.jks` file (base64)            | Android signing   |
| `MYAPP_UPLOAD_KEY_ALIAS`           | Keystore alias                       | Android signing   |
| `MYAPP_UPLOAD_KEY_PASSWORD`        | Keystore key password                | Android signing   |
| `MYAPP_UPLOAD_STORE_PASSWORD`      | Keystore store password              | Android signing   |
| `VERSIONING_TOKEN`                 | GitHub PAT (fine-grained)            | Auto version bump |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Google Cloud Console (JSON key)      | Play Store upload |
