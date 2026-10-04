plugins { id("com.android.application") }

android {
    namespace = "com.atelier.memory"
    compileSdk = 35
    ndkVersion = "27.0.12077973"
    defaultConfig {
        applicationId = "com.atelier.memory"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
        ndk { abiFilters += listOf("arm64-v8a") }
    }
    signingConfigs {
        create("release") {
            storeFile = file(System.getenv("ATELIER_KEYSTORE") ?: "atelier-release.jks")
            storePassword = System.getenv("ATELIER_STORE_PASS")
            keyAlias = "atelier"
            keyPassword = System.getenv("ATELIER_KEY_PASS")
        }
    }
    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-unity.txt")
            signingConfig = signingConfigs.getByName("release")
        }
    }
    bundle { abi { enableSplit = true }; density { enableSplit = true } }
    packaging { jniLibs { useLegacyPackaging = false } }
}

dependencies { implementation(project(":unityLibrary")) }
