# GitHub Actions Secrets — Setup Guide

This document describes each secret configured in **GitHub → Settings → Secrets and variables → Actions** and how to obtain/generate them.

---

## Workflows Overview

| Workflow                          | File                            | Purpose                                                                                        |
| --------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------- |
| **CI — lint & typecheck**         | `.github/workflows/ci.yml`      | Runs ESLint and TypeScript checks on PRs to `develop`/`main`. No secrets required.             |
| **NessnaUp — Build & Distribute** | `.github/workflows/deploy.yml`  | Builds Android APK/AAB, distributes via Firebase App Distribution (dev) or Google Play (prod). |
| **Sync to GitLab (AttijariUp)**   | `.github/workflows/promote.yml` | Syncs source code from GitHub (NessnaUp) to internal GitLab (AttijariUp) via SSH.              |

---

## Secrets Reference

### 1. `ENV_PRODUCTION_FILE`

| Detail      | Value                                                                                                 |
| ----------- | ----------------------------------------------------------------------------------------------------- |
| **Used in** | `deploy.yml`                                                                                          |
| **Purpose** | Contains the full `.env.production` file (Base64-encoded) with production API URLs, keys, and config. |

**How to get it:**

1. Create your `.env.production` file locally with all production environment variables (API base URL, auth keys, EAS project ID, etc.).
2. Base64-encode it:
   ```bash
   base64 -w 0 .env.production
   ```
   On macOS:
   ```bash
   base64 -i .env.production | tr -d '\n'
   ```
3. Copy the output and paste it as the secret value in GitHub.

> **Note:** `ENV_DEVELOPMENT_FILE` is also referenced in the workflow but is not currently configured as a repository secret. Add it the same way using `.env.development` if dev builds are needed.

---

### 2. `EXPO_TOKEN`

| Detail      | Value                                                                 |
| ----------- | --------------------------------------------------------------------- |
| **Used in** | Expo CLI / EAS Build (if applicable)                                  |
| **Purpose** | Authenticates with Expo servers for EAS builds or publishing updates. |

**How to get it:**

1. Go to [https://expo.dev](https://expo.dev) and sign in to your account.
2. Navigate to **Account Settings → Access Tokens**.
3. Click **Create Token**, give it a descriptive name (e.g., `github-actions`).
4. Choose **Robot** token type for CI/CD use.
5. Copy the generated token and save it as the secret value.

---

### 3. `FIREBASE_APP_ID`

| Detail      | Value                                                                  |
| ----------- | ---------------------------------------------------------------------- |
| **Used in** | `deploy.yml` — Firebase App Distribution step                          |
| **Purpose** | Identifies the Firebase app to distribute the APK to internal testers. |

**How to get it:**

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project (NessnaUp).
3. Go to **Project Settings** (gear icon) → **General** tab.
4. Scroll down to **Your apps** → select the Android app.
5. Copy the **App ID** (format: `1:123456789:android:abcdef123456`).

---

### 4. `FIREBASE_TOKEN`

| Detail      | Value                                                                      |
| ----------- | -------------------------------------------------------------------------- |
| **Used in** | `deploy.yml` — Firebase App Distribution step                              |
| **Purpose** | Authenticates the CI runner to upload builds to Firebase App Distribution. |

**How to get it:**

1. Install Firebase CLI locally:
   ```bash
   npm install -g firebase-tools
   ```
2. Run the login command to generate a CI token:
   ```bash
   firebase login:ci
   ```
3. A browser window will open — sign in with the Google account that owns the Firebase project.
4. The CLI will print a refresh token. Copy it and use it as the secret value.

> **Alternative:** You can use a Firebase service account JSON instead, but the token approach is simpler for App Distribution.

---

### 5. `GITLAB_ACCESS_TOKEN`

| Detail      | Value                                                                                  |
| ----------- | -------------------------------------------------------------------------------------- |
| **Used in** | GitLab API access (alternative to SSH for certain operations)                          |
| **Purpose** | Personal or project access token for authenticating with the internal GitLab instance. |

**How to get it:**

1. Sign in to your internal GitLab instance (`172.28.101.4`).
2. Go to **User Settings → Access Tokens** (or **Project → Settings → Access Tokens** for a project-scoped token).
3. Create a new token with:
   - **Name:** `github-sync`
   - **Scopes:** `read_repository`, `write_repository`
   - **Expiration:** Set an appropriate date.
4. Click **Create** and copy the token immediately (it won't be shown again).

---

### 6. `GITLAB_SSH_PRIVATE_KEY`

| Detail      | Value                                                                                           |
| ----------- | ----------------------------------------------------------------------------------------------- |
| **Used in** | `promote.yml` — SSH setup for pushing to GitLab                                                 |
| **Purpose** | SSH private key that allows the GitHub Actions runner to push code to the internal GitLab repo. |

**How to get it:**

1. Generate a dedicated SSH key pair (do **not** reuse personal keys):
   ```bash
   ssh-keygen -t ed25519 -C "github-actions-sync" -f gitlab_sync_key -N ""
   ```
2. This creates `gitlab_sync_key` (private) and `gitlab_sync_key.pub` (public).
3. Add the **public key** to GitLab:
   - Go to GitLab → **User Settings → SSH Keys** (or as a Deploy Key on the project).
   - Paste the contents of `gitlab_sync_key.pub` → **Add Key**.
4. Copy the **entire** contents of `gitlab_sync_key` (private key, including `-----BEGIN` and `-----END` lines) and paste it as the GitHub secret.
5. **Delete** the private key file from your local machine after adding it to GitHub.

---

### 7. `KEYSTORE_BASE64`

| Detail      | Value                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------- |
| **Used in** | `deploy.yml` — Decode release keystore for APK/AAB signing                                  |
| **Purpose** | The Android release keystore file (`.jks`), Base64-encoded, used to sign production builds. |

**How to get it:**

1. If you already have a keystore (`release-key.jks`), skip to step 3.
2. Generate a new keystore:
   ```bash
   keytool -genkeypair -v \
     -keystore release-key.jks \
     -keyalg RSA -keysize 2048 \
     -validity 10000 \
     -alias your-key-alias \
     -storepass your-store-password \
     -keypass your-key-password
   ```
3. Base64-encode the keystore file:
   ```bash
   base64 -w 0 release-key.jks
   ```
   On macOS:
   ```bash
   base64 -i release-key.jks | tr -d '\n'
   ```
4. Copy the output and paste it as the secret value.

> **Important:** Keep a backup of the original `.jks` file in a secure location. If you lose it, you cannot update your app on Google Play.

---

### 8. `MYAPP_UPLOAD_KEY_ALIAS`

| Detail      | Value                                             |
| ----------- | ------------------------------------------------- |
| **Used in** | `deploy.yml` — `gradle.properties` signing config |
| **Purpose** | The alias name of the key inside the keystore.    |

**How to get it:**

- This is the `-alias` value you used when generating the keystore with `keytool`.
- If you forgot it, list the keystore entries:
  ```bash
  keytool -list -v -keystore release-key.jks
  ```
- Look for the **Alias name** field in the output.

---

### 9. `MYAPP_UPLOAD_KEY_PASSWORD`

| Detail      | Value                                                        |
| ----------- | ------------------------------------------------------------ |
| **Used in** | `deploy.yml` — `gradle.properties` signing config            |
| **Purpose** | The password for the specific key entry inside the keystore. |

**How to get it:**

- This is the `-keypass` value you specified when creating the keystore with `keytool`.
- If the key password was not set separately, it may be the same as the store password.

---

### 10. `MYAPP_UPLOAD_STORE_PASSWORD`

| Detail      | Value                                             |
| ----------- | ------------------------------------------------- |
| **Used in** | `deploy.yml` — `gradle.properties` signing config |
| **Purpose** | The password to open the keystore file itself.    |

**How to get it:**

- This is the `-storepass` value you specified when creating the keystore with `keytool`.

---

### 11. `VERSIONING_TOKEN`

| Detail      | Value                                                                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Used in** | `deploy.yml` — checkout step for version bumping                                                                                                                               |
| **Purpose** | A GitHub Personal Access Token (PAT) that allows the workflow to push version bump commits back to the repository (the default `GITHUB_TOKEN` cannot trigger other workflows). |

**How to get it:**

1. Go to [GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens](https://github.com/settings/tokens?type=beta).
2. Click **Generate new token**.
3. Configure:
   - **Token name:** `versioning-bot`
   - **Repository access:** Select **Only select repositories** → choose this repo.
   - **Permissions:**
     - **Contents:** Read and write
     - **Metadata:** Read-only
4. Click **Generate token** and copy it.
5. Paste it as the secret value in GitHub.

> **Alternative:** You can use a classic PAT with `repo` scope, but fine-grained tokens are recommended for better security.

---

## Quick Checklist

| #   | Secret                        | Status        |
| --- | ----------------------------- | ------------- |
| 1   | `ENV_PRODUCTION_FILE`         | ✅ Configured |
| 2   | `EXPO_TOKEN`                  | ✅ Configured |
| 3   | `FIREBASE_APP_ID`             | ✅ Configured |
| 4   | `FIREBASE_TOKEN`              | ✅ Configured |
| 5   | `GITLAB_ACCESS_TOKEN`         | ✅ Configured |
| 6   | `GITLAB_SSH_PRIVATE_KEY`      | ✅ Configured |
| 7   | `KEYSTORE_BASE64`             | ✅ Configured |
| 8   | `MYAPP_UPLOAD_KEY_ALIAS`      | ✅ Configured |
| 9   | `MYAPP_UPLOAD_KEY_PASSWORD`   | ✅ Configured |
| 10  | `MYAPP_UPLOAD_STORE_PASSWORD` | ✅ Configured |
| 11  | `VERSIONING_TOKEN`            | ✅ Configured |

> **Missing from secrets:** `ENV_DEVELOPMENT_FILE` is referenced in `deploy.yml` but not shown in the repository secrets. Add it if you plan to run development builds via CI.
