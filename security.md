# Security.md — Mobile App (Expo / React Native)
####  #### #### ####  #### ####
####  #### #### ####  #### ####


### important Remove from app.json###

     [
    "expo-chucker",
    {
      "enabled":true
    }

],

android:usesCleartextTraffic="true"


this array when build release for prod
####  #### #### ####  #### ########  #### ########  #### ####
 
 uncomment 
   // if (!isConnected) {
  //   return <Redirect href="/(system)/no-internet" />;
  // }
  when prod for check internet security


This file is a **pre-build security checklist** for APK sharing (QA / Security Team) and the **rules we follow for secrets**.

---

## Goals (what we want)

1. **Stop storing secrets in cleartext** (local DB + storage)
2. **Reduce sensitive data in memory** (short-lived; wipe on logout/background)
3. **Strengthen crypto usage** (use OS-backed secure storage; avoid weak/custom crypto)

> Current status: ✅ tokens are stored in **SecureStore** (OS Keychain/Keystore) and **NOT** persisted in Zustand/MMKV.  
> Still missing: ⚠️ **SSL pinning** (planned).

---

## What MUST be true before sending an APK to Security Team

### A) AndroidManifest.xml (Release/Test APK)

✅ Keep the app secure by default.

**MainActivity**

- Ensure the activity that handles deep links is exported:
  - `android:exported="true"` ✅

**Application**

- Ensure release is not debuggable:
  - `android:debuggable="false"` ✅ (release only)

**Cleartext HTTP**

- For security testing APK, you should **NOT** allow HTTP:
  - `android:usesCleartextTraffic="false"` ✅ recommended

> Only enable HTTP if Security/QA explicitly needs it (example: local debug server).  
> Best practice: enable HTTP **only in debug** (see next section).

---

### B) Debug-only HTTP (dev client / Metro)

Metro runs over HTTP (example: `http://IP:8081`), so dev builds often need HTTP.

✅ Do this **only in debug manifest**:

File: `android/app/src/debug/AndroidManifest.xml`

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
  xmlns:tools="http://schemas.android.com/tools">

  <application
    android:usesCleartextTraffic="true"
    tools:replace="android:usesCleartextTraffic" />
</manifest>
```

Release stays secure with:

- `android:usesCleartextTraffic="false"`

---

## auth-store.ts — What to remove/disable before test APK

### 1) Remove \***\*DEV\*\*** logic that restores/persists access token

**DO NOT** load token back into Zustand state during init just because it is dev.

Remove any block like: **DEV**

```ts
if (__DEV__) {
  const token = await getAccessToken();
  set({ authState: { ...authState, accessToken: token } });
}
```

Reason:

- Security requirement: **Reduce sensitive data in memory**
- Token should not automatically appear in memory after app refresh.

---

### 2) Always wipe token from memory when app goes background/inactive

In `AuthProvider`, AppState listener should clear the in-memory token **without dev exceptions**:

```ts
const sub = AppState.addEventListener("change", (st) => {
  if (st === "background" || st === "inactive") {
    clearTokenCache(); // clears any in-process token cache
    useAuthStore.setState((s) => ({
      authState: { ...s.authState, accessToken: null },
    }));
  }
});
```

✅ This satisfies:

- **Reduce sensitive data in memory** (short-lived)

---

### 3) Pending credentials (username/password) — current temporary approach

For now:

- Username + password can be stored in **SecureStore** (encrypted by OS).
- Password must be **deleted immediately** after successful login.
- Username can remain (until backend supports transactionId-only).

Rules:

- `savePendingCredentials()` stores username+password in SecureStore.
- `clearPendingCredentials()` must delete **only password**.
- `completeLogin()` must call `clearPendingCredentials()` after login success.

---

## useEmulatorGuard.ts — What to change

Before security APK:

- Remove any `__DEV__` bypass (example: “skip emulator detection in dev”).
- Emulator checks must run normally in the test build.

---

## Axios / token handling (expected behavior)

### Where tokens live

- **At rest:** SecureStore (encrypted by OS Keychain/Keystore) ✅
- **In memory:** only when needed; wiped on background/logout ✅
- **In MMKV/Zustand persisted state:** never store access/refresh tokens ✅

### Refresh flow

- Axios reads access token (SecureStore or in-memory cache), sets `Authorization`.
- On `401`, Axios uses refresh token to get a new access token, then retries.
- On refresh failure, app logs out and clears tokens.

---

## SSL Pinning (still missing)

⚠️ Not implemented yet.

What Security team may expect:

- Pin public key (SPKI) or certificate for API domain
- Fail closed if pin mismatch
- Provide pin rotation strategy (backup pins)

When ready to implement:

- Android: OkHttp `CertificatePinner`
- iOS: `URLSession` pinning (or a vetted library)
- Requires **native changes / EAS build**

---

## Prevent Screen Capture or Screen Recorder

> ✅ **How to use usePreventScreenCaptureByRouteName**

- Put this hook **inside the screen you want to protect** (or its layout).
- If the **current route matches** your rules, it **blocks screenshots/recording**.
- When you **leave the screen** (unmount) or route no longer matches, it **re-enables capture**.

**Example**

````ts
usePreventScreenCaptureByRoute({
  blockPrefixes: ["/transactions"],
  key: "transactions-screen",
});


## Build commands

### EAS (recommended)

Login first:

```bash
eas login
````

Build dev client:

```bash
eas build -p android --profile development
```

Build release/test APK:

```bash
eas build -p android --profile production
```

### Local (Gradle)

From `android/`:

```bash
./gradlew assembleRelease
```

---

## Final “Before Sharing APK” Checklist

- [ ] MainActivity has `android:exported="true"`
- [ ] Release has `android:debuggable="false"`
- [ ] Release has `android:usesCleartextTraffic="false"`
- [ ] No `__DEV__` logic that restores token into memory on init
- [ ] Token cleared on background/inactive + logout
- [ ] Pending password deleted immediately after login success
- [ ] Emulator guard has no dev bypass
- [ ] SSL pinning: acknowledged as missing (planned next)

The main missing items from the PDFs are:

SSL pinning (real implementation).

Anti-debugging + anti-hooking (Frida/Objection/Xposed detection).

Obfuscation / hardening (R8/Proguard).

APK signing v2+ only (disable v1).

Exported components: only export what you must (deep link activity), everything else exported=false.
