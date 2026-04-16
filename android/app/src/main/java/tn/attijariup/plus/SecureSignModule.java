package tn.attijariup.plus;

import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.Signature;

public class SecureSignModule extends ReactContextBaseJavaModule {

    public SecureSignModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return "SecureSignModule";
    }

    /**
     * Generate key pair (stored in Android Keystore)
     * ✅ No biometric binding here (to avoid Key user not authenticated issues).
     */
    @ReactMethod
    public void generateKeyPair(String deviceId, Promise promise) {
        try {
            KeyPairGenerator kpg = KeyPairGenerator.getInstance(
                    KeyProperties.KEY_ALGORITHM_EC,
                    "AndroidKeyStore"
            );

            KeyGenParameterSpec spec = new KeyGenParameterSpec.Builder(
                    deviceId,
                    KeyProperties.PURPOSE_SIGN | KeyProperties.PURPOSE_VERIFY
            )
                    .setDigests(KeyProperties.DIGEST_SHA256)
                    .build();

            kpg.initialize(spec);
            KeyPair keyPair = kpg.generateKeyPair();

            byte[] publicKeyBytes = keyPair.getPublic().getEncoded();
            promise.resolve(Base64.encodeToString(publicKeyBytes, Base64.NO_WRAP));

        } catch (Exception e) {
            promise.reject("GEN_KEY_FAILED", e);
        }
    }

    @ReactMethod
    public void sign(String payloadBase64, String deviceId, Promise promise) {
        try {
            byte[] payload = Base64.decode(payloadBase64, Base64.NO_WRAP);

            KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
            keyStore.load(null);

            PrivateKey privateKey = (PrivateKey) keyStore.getKey(deviceId, null);
            if (privateKey == null) {
                promise.reject("SIGN_FAILED", "Private key not found for alias: " + deviceId);
                return;
            }

            Signature sig = Signature.getInstance("SHA256withECDSA");
            sig.initSign(privateKey);
            sig.update(payload);

            byte[] signatureBytes = sig.sign();
            promise.resolve(Base64.encodeToString(signatureBytes, Base64.NO_WRAP));

        } catch (Exception e) {
            promise.reject("SIGN_FAILED", e);
        }
    }
}
