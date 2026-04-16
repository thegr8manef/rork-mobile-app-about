import Foundation
import Security
import CommonCrypto
import React

@objc(SecureSignModule)
class SecureSignModule: NSObject {

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  // MARK: - X.509 DER header for EC P-256 uncompressed public key (65 bytes)
  private static let ecX509Header: [UInt8] = [
    0x30, 0x59,
    0x30, 0x13,
    0x06, 0x07,
    0x2A, 0x86, 0x48, 0xCE, 0x3D, 0x02, 0x01,
    0x06, 0x08,
    0x2A, 0x86, 0x48, 0xCE, 0x3D, 0x03, 0x01, 0x07,
    0x03, 0x42, 0x00
  ]

  // MARK: - SHA256 helper
  private func sha256(_ data: Data) -> Data {
    var hash = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
    data.withUnsafeBytes {
      _ = CC_SHA256($0.baseAddress, CC_LONG(data.count), &hash)
    }
    return Data(hash)
  }

  // MARK: - Generate Key Pair
  @objc
  func generateKeyPair(
    _ deviceId: String,
    resolver resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) {
    print("======== 🔑 GENERATE KEY PAIR START ========")
    print("📌 deviceId: \(deviceId)")

    let tag = deviceId.data(using: .utf8)!
    print("📌 tag bytes: \(tag.count)")

    // ✅ Delete any existing key with this tag first
    let deleteQuery: [String: Any] = [
      kSecClass as String: kSecClassKey,
      kSecAttrApplicationTag as String: tag
    ]
    let deleteStatus = SecItemDelete(deleteQuery as CFDictionary)
    print("🗑️ Delete old key status: \(deleteStatus) (0 = success, -25300 = not found)")

    #if targetEnvironment(simulator)
    print("⚠️ Running on SIMULATOR — skipping Secure Enclave")
    let attributes: [String: Any] = [
      kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
      kSecAttrKeySizeInBits as String: 256,
      kSecPrivateKeyAttrs as String: [
        kSecAttrIsPermanent as String: true,
        kSecAttrApplicationTag as String: tag,
      ]
    ]
    #else
    print("✅ Running on REAL DEVICE — using Secure Enclave")
    let attributes: [String: Any] = [
      kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
      kSecAttrKeySizeInBits as String: 256,
      kSecAttrTokenID as String: kSecAttrTokenIDSecureEnclave,
      kSecPrivateKeyAttrs as String: [
        kSecAttrIsPermanent as String: true,
        kSecAttrApplicationTag as String: tag,
      ]
    ]
    #endif

    var error: Unmanaged<CFError>?
    guard let privateKey = SecKeyCreateRandomKey(attributes as CFDictionary, &error) else {
      let errMsg = error?.takeRetainedValue().localizedDescription ?? "unknown"
      print("❌ Key generation FAILED: \(errMsg)")
      reject("GEN_KEY_FAILED", "Key generation failed: \(errMsg)", error?.takeRetainedValue())
      return
    }
    print("✅ Private key generated successfully")

    guard let publicKey = SecKeyCopyPublicKey(privateKey),
          let rawKeyData = SecKeyCopyExternalRepresentation(publicKey, &error) as Data? else {
      let errMsg = error?.takeRetainedValue().localizedDescription ?? "unknown"
      print("❌ Public key extraction FAILED: \(errMsg)")
      reject("GEN_KEY_FAILED", "Public key error: \(errMsg)", error?.takeRetainedValue())
      return
    }

    print("📏 Raw public key length: \(rawKeyData.count) bytes (expected 65)")
    print("📏 Raw public key first byte: \(rawKeyData[0]) (expected 4 = uncompressed)")
    print("🔑 Raw public key (base64): \(rawKeyData.base64EncodedString())")

    // ✅ Wrap raw EC point in X.509 DER format for Java backend
    var x509Key = Data(SecureSignModule.ecX509Header)
    x509Key.append(rawKeyData)

    let x509Base64 = x509Key.base64EncodedString()
    print("📏 X.509 public key length: \(x509Key.count) bytes (expected 91)")
    print("🔑 X.509 public key starts with: \(String(x509Base64.prefix(20)))")
    print("🔑 X.509 public key (full base64): \(x509Base64)")

    print("======== 🔑 GENERATE KEY PAIR END ========")

    resolve(x509Base64)
  }

  // MARK: - Sign
  @objc
  func sign(
    _ payloadBase64: String,
    deviceId: String,
    resolver resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) {
    print("======== ✍️ SIGN START ========")
    print("📌 deviceId: \(deviceId)")
    print("📌 payloadBase64: \(payloadBase64)")

    guard let payload = Data(base64Encoded: payloadBase64) else {
      print("❌ Invalid base64 payload")
      reject("SIGN_FAILED", "Invalid payload", nil)
      return
    }

    print("📏 Payload length: \(payload.count) bytes (expected 32 = SHA256 digest)")
    print("📌 Payload hex: \(payload.map { String(format: "%02x", $0) }.joined())")

    let tag = deviceId.data(using: .utf8)!

    let query: [String: Any] = [
      kSecClass as String: kSecClassKey,
      kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
      kSecAttrApplicationTag as String: tag,
      kSecReturnRef as String: true
    ]

    var item: CFTypeRef?
    let status = SecItemCopyMatching(query as CFDictionary, &item)

    print("🔍 Keychain lookup status: \(status) (0 = success)")

    guard status == errSecSuccess,
          let privateKey = item else {
      print("❌ Private key NOT FOUND in Keychain (status: \(status))")
      reject("SIGN_FAILED", "Private key not found", nil)
      return
    }

    print("✅ Private key found in Keychain")

    // ✅ Double hash to match backend
    let algorithm = SecKeyAlgorithm.ecdsaSignatureDigestX962SHA256
    let digestToSign = sha256(payload)

    print("📌 Algorithm: ecdsaSignatureDigestX962SHA256")
    print("📏 Digest to sign length: \(digestToSign.count) bytes (expected 32)")
    print("📌 Digest to sign hex (SHA256 of payload): \(digestToSign.map { String(format: "%02x", $0) }.joined())")

    guard SecKeyIsAlgorithmSupported(privateKey as! SecKey, .sign, algorithm) else {
      print("❌ Algorithm NOT supported by this key")
      reject("SIGN_FAILED", "Algorithm not supported", nil)
      return
    }

    print("✅ Algorithm supported")

    var error: Unmanaged<CFError>?
    guard let signature = SecKeyCreateSignature(
      privateKey as! SecKey,
      algorithm,
      digestToSign as CFData,
      &error
    ) as Data? else {
      let errMsg = error?.takeRetainedValue().localizedDescription ?? "unknown"
      print("❌ Signing FAILED: \(errMsg)")
      reject("SIGN_FAILED", "Signing failed: \(errMsg)", error?.takeRetainedValue())
      return
    }

    let signatureBase64 = signature.base64EncodedString()
    print("✅ Signature generated successfully")
    print("📏 Signature length: \(signature.count) bytes")
    print("📌 Signature (base64): \(signatureBase64)")

    // ✅ Self-verify: retrieve public key and verify locally
    if let pubKey = SecKeyCopyPublicKey(privateKey as! SecKey) {
      let verifyResult = SecKeyVerifySignature(
        pubKey,
        algorithm,
        digestToSign as CFData,
        signature as CFData,
        &error
      )
      print("🔍 LOCAL SELF-VERIFY: \(verifyResult ? "✅ PASS" : "❌ FAIL")")
      if !verifyResult {
        let errMsg = error?.takeRetainedValue().localizedDescription ?? "unknown"
        print("🔍 Self-verify error: \(errMsg)")
      }
    }

    print("======== ✍️ SIGN END ========")

    resolve(signatureBase64)
  }
}