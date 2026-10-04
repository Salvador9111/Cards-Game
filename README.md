# Atelier — Unity (URP) source package

Scripts: `Assets/Scripts/` (Card3D, MemoryBoardManager, TactileHapticsManager)
Shader:  `Assets/Shaders/LuxuryCard.shader` (URP, half precision, GPU-instanced, 6x3 face atlas)
Android: `Android/AndroidManifest.xml` -> Assets/Plugins/Android/, `build.gradle.kts` for the exported Gradle project.

## Unity setup
- Unity 6 LTS, URP Mobile renderer, SSAO renderer feature (low, half res), MSAA 2x.
- Player Settings: IL2CPP, ARM64 only, Vulkan + GLES3, Target FPS: `Application.targetFrameRate = Screen.currentResolution.refreshRateRatio` (60/120).
- Card prefab: chamfered box mesh (bevel 0.05) with Card3D + BoxCollider; tap via Physics.Raycast -> `MemoryBoardManager.OnCardTapped`.
- No allocations in flip/match loops: lists/arrays are preallocated, MaterialPropertyBlock reused.

## Keystore
    keytool -genkeypair -v -keystore atelier-release.jks -alias atelier -keyalg RSA -keysize 4096 -validity 10000

## Build (exported Gradle project)
    export ATELIER_KEYSTORE=$PWD/atelier-release.jks ATELIER_STORE_PASS=*** ATELIER_KEY_PASS=***
    ./gradlew :launcher:assembleRelease   # -> launcher/build/outputs/apk/release/launcher-release.apk
    ./gradlew :launcher:bundleRelease     # -> launcher/build/outputs/bundle/release/launcher-release.aab
    adb install -r launcher/build/outputs/apk/release/launcher-release.apk

Or headless from Unity:
    Unity -batchmode -quit -projectPath . -buildTarget Android -executeMethod BuildScript.Release
