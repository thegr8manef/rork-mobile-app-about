import "dotenv/config";
import fs from "fs";
import path from "path";

export default ({ config }) => {
  // Determine environment (default = development)
  const ENV = process.env.APP_ENV || "development";

  // Load correct .env file
  const envFile = ENV === "production" ? ".env.production" : ".env.development";

  const envPath = path.resolve(process.cwd(), envFile);
  if (fs.existsSync(envPath)) {
    require("dotenv").config({ path: envPath });
  } else {
    console.warn(`⚠ ENV file not found: ${envPath}`);
  }

  return {
    ...config,

    plugins: [
      ...(config.plugins ?? []),
      //"./plugins/withMyNativeModule",
      //"./plugins/withFirebaseNonModularHeadersFix",
    ],

    extra: {
      APP_ENV: ENV,

      // ✅ keep OLD names in extra, read ENV_* from .env
      AUTH_STORAGE_KEY: process.env.ENV_AUTH_STORAGE_KEY,
      BIOMETRIC_ENABLED_KEY: process.env.ENV_BIOMETRIC_ENABLED_KEY,

      SECURE_USERNAME_KEY: process.env.ENV_SECURE_USERNAME_KEY,
      SECURE_PASSWORD_KEY: process.env.ENV_SECURE_PASSWORD_KEY,

      SECURE_PASSCODE_KEY: process.env.ENV_SECURE_PASSCODE_KEY,
      SECURE_PENDING_USERNAME_KEY: process.env.ENV_SECURE_PENDING_USERNAME_KEY,
      SECURE_PENDING_PASSWORD_KEY: process.env.ENV_SECURE_PENDING_PASSWORD_KEY,

      PASSCODE_SALT_KEY: process.env.ENV_PASSCODE_SALT_KEY,
      PASSCODE_HASH_KEY: process.env.ENV_PASSCODE_HASH_KEY,

      API_BASE_URL: process.env.ENV_API_BASE_URL,
      ENV_BUILD_MARKER: process.env.ENV_BUILD_MARKER,
      SECURE_ACCESS_TOKEN_KEY: process.env.ENV_SECURE_ACCESS_TOKEN_KEY,
      SECURE_REFRESH_TOKEN_KEY: process.env.ENV_SECURE_REFRESH_TOKEN_KEY,
      ENV_BACKGROUND_TIMESTAMP_KEY: process.env.ENV_BACKGROUND_TIMESTAMP_KEY,
      ENV_BACKGROUND_LOGOUT_TIMEOUT_MS:
        process.env.ENV_BACKGROUND_LOGOUT_TIMEOUT_MS,
      router: {
        origin: process.env.ENV_ROUTER_ORIGIN,
      },

      eas: {
        projectId: process.env.ENV_EAS_PROJECT_ID,
      },
    },
  };
};
