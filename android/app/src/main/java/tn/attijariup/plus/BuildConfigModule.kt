package tn.attijariup.plus

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule

class BuildConfigModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "RNBuildConfig"

    override fun getConstants(): Map<String, Any> {
        return mapOf(
            "IS_PREVIEW_BUILD" to BuildConfig.IS_PREVIEW_BUILD
        )
    }
}