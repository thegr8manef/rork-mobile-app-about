# ──── React Native / Hermes ────
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.hermes.unicode.** { *; }

# ──── Expo ────
-keep class expo.modules.** { *; }

# ──── Your native security module ────
-keep class tn.attijari.android.** { *; }

# ──── OkHttp (needed for future SSL pinning) ────
-keep class okhttp3.** { *; }
-dontwarn okhttp3.**
-keep class okio.** { *; }
-dontwarn okio.**

# ──── Firebase ────
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# ──── Security check libs ────
-keep class com.scottyab.rootbeer.** { *; }
-keep class com.gantix.JailMonkey.** { *; }
-keep class com.learnium.RNDeviceInfo.** { *; }

# ──── Keep annotations ────
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keepattributes Signature
-keepattributes Exceptions