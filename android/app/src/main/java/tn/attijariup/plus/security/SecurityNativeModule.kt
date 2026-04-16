package tn.attijariup.plus.security

import tn.attijariup.plus.BuildConfig
import android.content.Context
import android.os.Build
import android.os.Debug
import android.util.Base64
import com.facebook.react.bridge.*
import java.io.BufferedReader
import java.io.File
import java.io.FileReader
import java.net.InetSocketAddress
import java.net.Socket
import java.security.MessageDigest

class SecurityNativeModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "SecurityNative"

  @ReactMethod
  fun getSecuritySignals(promise: Promise) {
    try {
      val map = Arguments.createMap()

      val debugger = isDebuggerDetected()
      val frida = isFridaDetected()
      val xposed = isXposedDetected()
      val tamper = isSignatureMismatch()
      val emulator = isEmulatorDetected()

      map.putBoolean("debugger", debugger)
      map.putBoolean("instrumentation", frida)   // Frida/Objection-like
      map.putBoolean("hookFramework", xposed)     // Xposed/LSPosed-like
      map.putBoolean("integrityCompromised", tamper)
      map.putBoolean("emulator", emulator)

      promise.resolve(map)
    } catch (e: Exception) {
      promise.reject("SECURITY_NATIVE_ERROR", e)
    }
  }

  // ---------- Emulator ----------
  private fun isEmulatorDetected(): Boolean {
    // Build field checks (covers AOSP, Google APIs, Genymotion, BlueStacks)
    val fingerprint = Build.FINGERPRINT
    if (fingerprint.startsWith("generic") || fingerprint.startsWith("unknown")) return true
    if (fingerprint.contains(":userdebug/") || fingerprint.contains(":eng/")) return true
    if (Build.MODEL.contains("google_sdk", ignoreCase = true)) return true
    if (Build.MODEL.contains("Emulator", ignoreCase = true)) return true
    if (Build.MODEL.contains("Android SDK built for x86", ignoreCase = true)) return true
    if (Build.MODEL.contains("sdk_gphone", ignoreCase = true)) return true
    if (Build.MANUFACTURER.contains("Genymotion", ignoreCase = true)) return true
    if (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic")) return true
    if (Build.PRODUCT.contains("sdk", ignoreCase = true) && Build.PRODUCT.contains("x86", ignoreCase = true)) return true
    if (Build.PRODUCT.contains("sdk_gphone", ignoreCase = true)) return true
    if (Build.PRODUCT == "google_sdk") return true
    if (Build.HARDWARE.contains("goldfish", ignoreCase = true)) return true
    if (Build.HARDWARE.contains("ranchu", ignoreCase = true)) return true
    if (Build.DEVICE.contains("emulator", ignoreCase = true)) return true
    if (Build.DEVICE.contains("generic", ignoreCase = true)) return true

    // QEMU/emulator special files
    val qemuFiles = listOf(
      "/dev/socket/qemud",
      "/dev/qemu_pipe",
      "/system/lib/libc_malloc_debug_qemu.so",
      "/sys/qemu_trace",
      "/system/bin/qemu-props"
    )
    if (qemuFiles.any { File(it).exists() }) return true

    return false
  }

  // ---------- Debugger ----------
  private fun isDebuggerDetected(): Boolean {
    if (Debug.isDebuggerConnected() || Debug.waitingForDebugger()) return true
    return readTracerPid() > 0
  }

  private fun readTracerPid(): Int {
    return try {
      BufferedReader(FileReader("/proc/self/status")).use { br ->
        var line: String?
        while (br.readLine().also { line = it } != null) {
          if (line!!.startsWith("TracerPid:")) {
            return line!!.substringAfter("TracerPid:").trim().toIntOrNull() ?: 0
          }
        }
        0
      }
    } catch (_: Exception) { 0 }
  }

  // ---------- Frida / Objection ----------
  private fun isFridaDetected(): Boolean {
    // 1) Port checks (weak alone but useful as a signal)
    if (isLocalPortOpen(27042) || isLocalPortOpen(27043)) return true

    // 2) Process maps scan (stronger signal)
    val maps = readProcSelfMaps()
    val suspects = listOf("frida", "gum-js-loop", "gadget", "libfrida", "linjector")
    if (suspects.any { maps.contains(it, ignoreCase = true) }) return true

    return false
  }

  private fun isLocalPortOpen(port: Int): Boolean {
    return try {
      Socket().use { s ->
        s.connect(InetSocketAddress("127.0.0.1", port), 120)
        true
      }
    } catch (_: Exception) {
      false
    }
  }

  private fun readProcSelfMaps(): String {
    return try {
      File("/proc/self/maps").readText()
    } catch (_: Exception) {
      ""
    }
  }

  // ---------- Xposed / LSPosed ----------
  private fun isXposedDetected(): Boolean {
    // 1) Known classes
    val classNames = listOf(
      "de.robv.android.xposed.XposedBridge",
      "de.robv.android.xposed.XC_MethodHook",
      "org.lsposed.lspd.core.Main"
    )
    if (classNames.any { classExists(it) }) return true

    // 2) Known manager packages (best-effort)
    val pkgs = listOf(
      "de.robv.android.xposed.installer",
      "org.lsposed.manager",
      "com.topjohnwu.magisk" // often paired, not always
    )
    if (pkgs.any { isPackageInstalled(it) }) return true

    return false
  }

  private fun classExists(name: String): Boolean {
    return try {
      Class.forName(name)
      true
    } catch (_: Throwable) {
      false
    }
  }

  private fun isPackageInstalled(pkg: String): Boolean {
    return try {
      reactContext.packageManager.getPackageInfo(pkg, 0)
      true
    } catch (_: Exception) {
      false
    }
  }

  // ---------- Integrity (signature pin) ----------
  // IMPORTANT: set EXPECTED_CERT_SHA256 in BuildConfig (next section)
  private fun isSignatureMismatch(): Boolean {
    val expected = BuildConfig.EXPECTED_CERT_SHA256.trim()
    if (expected.isBlank()) return false

    val actual = getAppCertSha256() ?: return true
    return !actual.equals(expected, ignoreCase = true)
  }

  private fun getAppCertSha256(): String? {
    return try {
      val pm = reactContext.packageManager
      val pkg = reactContext.packageName

      val certBytes: ByteArray? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        val info = pm.getPackageInfo(pkg, android.content.pm.PackageManager.GET_SIGNING_CERTIFICATES)
        val signatures = info.signingInfo?.apkContentsSigners
        if (signatures.isNullOrEmpty()) return null
        signatures[0].toByteArray()
      } else {
        @Suppress("DEPRECATION")
        val info = pm.getPackageInfo(pkg, android.content.pm.PackageManager.GET_SIGNATURES)
        @Suppress("DEPRECATION")
        val signatures = info.signatures
        if (signatures.isNullOrEmpty()) return null
        signatures[0].toByteArray()
      }

      if (certBytes == null) return null
      val digest = MessageDigest.getInstance("SHA-256").digest(certBytes)
      digest.joinToString("") { "%02x".format(it) }
    } catch (_: Exception) {
      null
    }
  }
}