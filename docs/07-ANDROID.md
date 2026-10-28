# 07 · Build the Android app

**Option A — GitHub builds it for you.** Run *Build Android APK* (Actions tab). Download the APK from the run’s **Artifacts**. Without signing secrets it is a debug APK: fine to test, cannot be updated in place by a differently-signed build.

**Option B — Android Studio.** Install Android Studio, open `mobile/android`, wait for Gradle sync, *Build → Build APK(s)*.

**Own package name (do this before publishing anywhere):** the default id is `org.ifinex.selfhost`. Replace it in `mobile/capacitor.config.json`, `mobile/android/app/build.gradle` (namespace + applicationId), `res/values/strings.xml`, the Java folder name and package lines, and iOS `PRODUCT_BUNDLE_IDENTIFIER`.

**Signing key (needed for updates):** create once, keep forever, never commit it:
`keytool -genkeypair -v -keystore ifinex.jks -alias ifinex -keyalg RSA -keysize 2048 -validity 10000`
Add GitHub secrets `IFX_KEYSTORE_B64` (`base64 -w0 ifinex.jks`), `IFX_KEYSTORE_PASSWORD`, `IFX_KEY_ALIAS`. Lose the key = users must uninstall to update.

**Config:** the app reads the same `ifinex-config.json` as the website; the workflow writes it from the repository variables. Refresh the app copy with `bash tools/sync-www.sh` after website changes.
**iOS:** open `mobile/ios/App` in Xcode on a Mac; requires an Apple developer account.
