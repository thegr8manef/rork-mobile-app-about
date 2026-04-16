// import { useFreeRasp } from "freerasp-react-native"; // or "@talsec/free-rasp-react-native" depending on your install

// const config = {
//   watcherMail: "security@yourcompany.com", // must be a valid email format :contentReference[oaicite:0]{index=0}

//   // Optional but recommended: ensure prod behavior
//   // isProd: true, // defaults to true :contentReference[oaicite:1]{index=1}

//   androidConfig: {
//     packageName: "tn.attijari.android.prod",
//     certificateHashes: [
//       // Base64 hash of your signing cert (SHA-256 hash in Base64)
//       // example from docs:
//       // "mVr/qQLO8DKTwqlL+B1qigl9NoBnbiUs8b4c2Ewcz0k="
//     ],
//     supportedAlternativeStores: [
//       // Only if you distribute via other stores (Play + Huawei are handled internally)
//       // e.g. "com.sec.android.app.samsungapps"
//     ],
//   },

//   iosConfig: {
//     appBundleId: "tn.attijari.android.prod", // your iOS bundle id
//     appTeamId: "YOUR_TEAM_ID",
//   },
// };

// // reactions for detected threats
// const actions = {
//   // Android & iOS
//   privilegedAccess: () => {
//     console.log('privilegedAccess');
//   },
//   // Android & iOS
//   debug: () => {
//     console.log('debug');
//   },
//   // Android & iOS
//   simulator: () => {
//     console.log('simulator');
//   },
//   // Android & iOS
//   appIntegrity: () => {
//     console.log('appIntegrity');
//   },
//   // Android & iOS
//   unofficialStore: () => {
//     console.log('unofficialStore');
//   },
//   // Android & iOS
//   hooks: () => {
//     console.log('hooks');
//   },
//   // Android & iOS
//   deviceBinding: () => {
//     console.log('deviceBinding');
//   },
//   // Android & iOS
//   secureHardwareNotAvailable: () => {
//     console.log('secureHardwareNotAvailable');
//   },
//   // Android & iOS
//   systemVPN: () => {
//     console.log('systemVPN');
//   },
//   // Android & iOS
//   passcode: () => {
//     console.log('passcode');
//   },
//   // iOS only
//   deviceID: () => {
//     console.log('deviceID');
//   },
//   // Android only
//   obfuscationIssues: () => {
//     console.log('obfuscationIssues');
//   },
//   // Android only
//   devMode: () => {
//     console.log('devMode');
//   },
//   // Android only
//   adbEnabled: () => {
//     console.log('adbEnabled');
//   },
//   // Android & iOS
//   screenshot: () => {
//     console.log('screenshot');
//   },
//   // Android & iOS
//   screenRecording: () => {
//     console.log('screenRecording');
//   },  
//   // Android only
//   multiInstance: () => {
//     console.log('multiInstance');
//   },
// };

// // Start freeRASP + listeners
// useFreeRasp(config, actions); // React hook that starts freeRASP and sets listeners :contentReference[oaicite:2]{index=2}
